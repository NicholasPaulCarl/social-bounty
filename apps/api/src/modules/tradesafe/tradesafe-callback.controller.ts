import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, WebhookProvider, WebhookStatus } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators';
import { PrismaService } from '../prisma/prisma.service';

/**
 * R33 — TradeSafe OAuth callback controller (ADR 0009 §5).
 *
 * Route:  GET /api/v1/auth/tradesafe/callback
 *
 * The hunter's browser is redirected here from TradeSafe at the end of the
 * beneficiary-link OAuth flow. The controller:
 *   1. Validates presence + shape of the `code` + `state` query params.
 *   2. Verifies the provider-side signature, if TradeSafe signs callbacks
 *      — VERIFY_WITH_TRADESAFE; the scaffolding here rejects obvious
 *      tampering but the concrete scheme is deferred to ADR 0010.
 *   3. Persists the raw callback payload to `webhook_events` under a
 *      distinct `eventType='tradesafe.beneficiary_link_callback'` so the
 *      existing `UNIQUE(provider, externalEventId)` replay guard covers
 *      this path too.
 *   4. Writes an AuditLog row (Hard Rule #3 + Non-Negotiable #6).
 *   5. Issues a 302 to `TRADESAFE_SUCCESS_URL` or `TRADESAFE_FAILURE_URL`.
 *
 * Design notes:
 *   - `@Public()` — NOT guarded by JwtAuthGuard. The hunter's browser is
 *     redirected here from TradeSafe, which does not carry our bearer
 *     token. The state param is the trust anchor instead.
 *   - NOT kill-switch-gated. The hunter is mid-flow; blocking the redirect
 *     would strand them with nowhere to go. Any *ledger* writes that
 *     eventually follow the beneficiary link (not in this controller —
 *     they happen later via `BeneficiaryService` once ADR 0010 wires it)
 *     still respect the kill switch through `LedgerService.postTransactionGroup`.
 *   - Idempotency: `(provider='TRADESAFE', externalEventId=state)` hits
 *     the UNIQUE constraint on replay; duplicates short-circuit to the
 *     same success redirect with no duplicate AuditLog write.
 *   - NOT routed through `WebhookRouterService`. Per ADR 0009 §5 this is
 *     an OAuth return leg, not a webhook — the webhook router is
 *     reserved for asynchronous provider-initiated events.
 *
 * VERIFY_WITH_TRADESAFE (R33):
 *   - Whether TradeSafe signs the callback (HMAC header? `state`-
 *     embedded JWT?). Scaffolded as "reject obvious garbage state" for
 *     now; the signature field + HMAC verifier land with ADR 0010.
 *   - Exact state-param scheme. We accept any opaque string (UUID / b64 /
 *     nanoid) and reject URL-shaped or script-shaped values as defence.
 *     ADR 0010 will replace with provider-specified scheme.
 *   - Whether TradeSafe embeds the hunter's user id in the state, or
 *     whether we must issue our own state at initiate-time and look it
 *     up here. Today we persist the raw payload + log it; wiring the
 *     hunter -> beneficiary happens in the ADR 0010 implementation PR.
 */
@Controller('auth/tradesafe')
export class TradeSafeCallbackController {
  private readonly logger = new Logger(TradeSafeCallbackController.name);
  private readonly successUrl: string | undefined;
  private readonly failureUrl: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Read lazily at construction so the controller boots in dev
    // (PAYOUTS_ENABLED=false) but throws InternalServerErrorException
    // at request-time if flipped on without the URLs configured.
    // env.validation.ts enforces these at boot when PAYOUTS_ENABLED=true,
    // so defence-in-depth only — should be unreachable in practice.
    this.successUrl = this.config.get<string>('TRADESAFE_SUCCESS_URL');
    this.failureUrl = this.config.get<string>('TRADESAFE_FAILURE_URL');
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') errorParam: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // R35 safety net: env.validation enforces these at boot when
    // PAYOUTS_ENABLED=true, so the only way to hit this branch is a
    // deployment that flips the flag before configuring the URLs.
    // Throw loudly rather than 302 to an empty string.
    if (!this.successUrl || !this.failureUrl) {
      this.logger.error(
        'TRADESAFE_SUCCESS_URL/TRADESAFE_FAILURE_URL missing at callback time — check env.validation gate',
      );
      throw new InternalServerErrorException(
        'TradeSafe OAuth callback URLs not configured',
      );
    }

    // Short-circuit on any explicit provider-side error param. Do NOT
    // reflect it into the redirect (prevents open-redirect / XSS via a
    // crafted error string).
    if (errorParam) {
      this.logger.warn(
        `tradesafe callback returned error=${sanitizeForLog(errorParam)} state=${sanitizeForLog(state)}`,
      );
      return this.redirect(res, this.failureUrl);
    }

    // State is the trust anchor. Reject absent / tampered values before
    // touching the DB. `code` is provider-opaque but must be present
    // (per OAuth 2.0 auth-code flow; TradeSafe-specific shape deferred
    // to ADR 0010 — VERIFY_WITH_TRADESAFE).
    if (!isValidStateParam(state)) {
      this.logger.warn(
        `tradesafe callback rejected tampered state=${sanitizeForLog(state)}`,
      );
      return this.redirect(res, this.failureUrl);
    }
    if (!code || typeof code !== 'string' || code.length === 0 || code.length > 1024) {
      this.logger.warn(
        `tradesafe callback rejected invalid code (state=${sanitizeForLog(state)})`,
      );
      return this.redirect(res, this.failureUrl);
    }

    // VERIFY_WITH_TRADESAFE: if TradeSafe signs the callback with an
    // HMAC header (Svix-style or custom), verify it here before
    // persisting. ADR 0009 §6/§8-8 flags the scheme as unknown; the
    // sibling verifier module (`tradesafe.verifier.ts`) lands with
    // ADR 0010. Until then we rely on state-param opacity + the
    // OAuth-code exchange (deferred) as the trust chain.

    // Persist + idempotency-guard via webhook_events. The UNIQUE
    // (provider, externalEventId) index collapses replays to the same
    // row; duplicates must redirect to success without re-logging.
    let isDuplicate = false;
    const payloadSnapshot: Record<string, unknown> = {
      code,
      state,
      // Capture the raw query + headers (minus auth) for forensics.
      query: sanitizeQuery(req.query),
      userAgent: firstHeader(req.headers['user-agent']),
      forwardedFor: firstHeader(req.headers['x-forwarded-for']),
    };

    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider: WebhookProvider.TRADESAFE,
          externalEventId: state,
          eventType: 'tradesafe.beneficiary_link_callback',
          status: WebhookStatus.PROCESSED,
          payload: payloadSnapshot as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Replay — already processed. Fall through to the success
        // redirect without another AuditLog write.
        isDuplicate = true;
        this.logger.log(
          `tradesafe callback replay: state=${sanitizeForLog(state)} — short-circuit to success`,
        );
      } else {
        // DB errors are logged + the user redirected to failure. We
        // deliberately do NOT leak the DB error into the redirect URL.
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`tradesafe callback persist failed: ${message}`);
        return this.redirect(res, this.failureUrl);
      }
    }

    if (!isDuplicate) {
      // AuditLog write (Hard Rule #3). Fire-and-forget — the ledger
      // side-effects that come later (ADR 0010) each carry their own
      // audit entries; this row marks the callback hand-off for
      // forensics + monitoring (readiness §9 "Beneficiary-link OAuth
      // completion rate").
      //
      // Actor: VERIFY_WITH_TRADESAFE (R33). Today we can't resolve the
      // hunter's user id from the callback alone — the mapping between
      // state param and user id is set at initiate-time (not yet
      // implemented, deferred to ADR 0010). Use the system actor as
      // the placeholder; ADR 0010 will upgrade this to the real hunter
      // once the state -> userId lookup lands.
      const actorId = this.systemActorId();
      if (actorId) {
        try {
          await this.prisma.auditLog.create({
            data: {
              actorId,
              actorRole: UserRole.SUPER_ADMIN,
              action: 'TRADESAFE_BENEFICIARY_LINK_CALLBACK',
              entityType: 'WebhookEvent',
              entityId: state,
              afterState: {
                provider: 'TRADESAFE',
                eventType: 'tradesafe.beneficiary_link_callback',
                // Code intentionally omitted — treat as a secret.
              } as Prisma.InputJsonValue,
              reason:
                'TradeSafe OAuth callback — beneficiary link handoff recorded (ADR 0009 §5)',
            },
          });
        } catch (err) {
          // Audit-log write failure is non-fatal — the WebhookEvent
          // row is the primary record of this hand-off.
          this.logger.error(
            `tradesafe callback audit log failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    return this.redirect(res, this.successUrl);
  }

  private redirect(res: Response, url: string): void {
    res.redirect(HttpStatus.FOUND, url);
  }

  private systemActorId(): string | null {
    // Same pattern as `ReconciliationService.systemActorId`: AuditLog.actorId
    // has a FK to users.id, so an unset env means "skip the audit log"
    // rather than crash the callback.
    return this.config.get<string>('SYSTEM_ACTOR_ID', '') || null;
  }
}

/**
 * State-param opacity check. ADR 0010 will replace this with the
 * provider-negotiated scheme (likely a signed token containing the
 * hunter user id). Until then we accept any opaque alphanumeric /
 * UUID / base64-ish token and reject values that look like URLs,
 * script fragments, SQL, or control chars — the common tampering
 * shapes.
 *
 * VERIFY_WITH_TRADESAFE: replace with signature verification once
 * TradeSafe publishes the callback scheme.
 */
export function isValidStateParam(state: unknown): state is string {
  if (typeof state !== 'string') return false;
  // Length bounds: reject empty + oversized tokens.
  if (state.length < 8 || state.length > 512) return false;
  // Reject obvious URL / script / control-char shapes.
  if (/[\s<>"'\\]/.test(state)) return false;
  if (/^(javascript|data|vbscript|file):/i.test(state)) return false;
  if (/^https?:\/\//i.test(state)) return false;
  // Accept: alphanum, dash, underscore, dot, colon, equals, plus, slash
  // (covers UUID, base64url, JWT-shaped, and opaque nanoid tokens).
  return /^[A-Za-z0-9._:\-=+/]+$/.test(state);
}

function sanitizeForLog(v: unknown): string {
  if (typeof v !== 'string') return '<non-string>';
  // Trim + strip control chars for log safety; cap length.
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\r\n\t\u0000-\u001f]/g, '?').slice(0, 200);
}

function firstHeader(h: unknown): string | undefined {
  if (typeof h === 'string') return h.slice(0, 512);
  if (Array.isArray(h)) return typeof h[0] === 'string' ? h[0].slice(0, 512) : undefined;
  return undefined;
}

function sanitizeQuery(q: unknown): Record<string, unknown> {
  // We only capture shallow keys; cap string lengths to avoid
  // runaway payloads if TradeSafe echoes back arbitrary query vars.
  if (!q || typeof q !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(q as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v.slice(0, 2048);
    else if (Array.isArray(v)) out[k] = v.slice(0, 5).map((x) => (typeof x === 'string' ? x.slice(0, 512) : x));
    else out[k] = v;
  }
  return out;
}
