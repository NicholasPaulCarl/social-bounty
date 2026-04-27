import { timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookProvider } from '@prisma/client';
import { Public } from '../../common/decorators';
import { TradeSafeGraphQLClient } from '../tradesafe/tradesafe-graphql.client';
import { TradeSafeTransactionCallbackHandler } from '../tradesafe/tradesafe-transaction-callback.handler';
import { TradeSafeWebhookHandler } from '../tradesafe/tradesafe-webhook.handler';
import { WebhookEventService } from './webhook-event.service';

/**
 * TradeSafe transaction-callback receiver (Plan item 1.2 / Phase 1d of
 * ADR 0011).
 *
 * Route: `POST /api/v1/webhooks/tradesafe/:secret`
 *
 * TradeSafe POSTs to the Merchant-Portal-configured callback URL on every
 * transaction state change. The body looks like:
 *
 *   { id: "3RbZ0f1PPS3yMPBIT9rqT5", reference: "TGG40H29",
 *     state: "CREATED", balance: 0 }
 *
 * TradeSafe does NOT currently document a webhook-signature scheme, so the
 * body is treated as untrusted. Trust is established two ways:
 *
 *   1. **URL-path secret** — a 32-char random token stored in
 *      `TRADESAFE_CALLBACK_SECRET` is embedded in the callback URL
 *      configured inside TradeSafe's Merchant Portal. The controller
 *      constant-time compares `:secret` against the env var and 401s on
 *      mismatch. (See also ADR 0011 — URL-secret is the interim trust
 *      anchor; a proper HMAC scheme lands if TradeSafe ships one.)
 *   2. **Authoritative re-fetch** — once the secret matches, we ignore
 *      everything except `id` and call `getTransaction(id)` via the GraphQL
 *      client. Whatever the callback body *claimed* about state / balance
 *      has no bearing on the handler; only the re-fetched state does.
 *
 * Idempotency is anchored on `UNIQUE(provider='TRADESAFE',
 * externalEventId=id)` on `webhook_events`. A replay inserts the same row,
 * the unique-constraint catches it, and the controller short-circuits with
 * 200 — the handler does NOT fire twice.
 *
 * Separate from:
 *   - `StitchWebhookController`  — Svix + Stitch payload shape.
 *   - `TradeSafeWebhookController` — Svix + TradeSafe (R34 outbound adapter,
 *     ADR 0009 / 0010). Never replaced by this controller because ADR 0011
 *     keeps the outbound webhook path intact during cutover.
 *   - `TradeSafeCallbackController` (in `modules/tradesafe/`) — the OAuth
 *     return leg of the hunter beneficiary-link flow (GET, ADR 0009 §5).
 *     That one is a browser redirect, not a provider-initiated event.
 *
 * Phase 3 extends the handler to write ledger entries on state changes;
 * Phase 1d (here) is the bare receiver + audit trail.
 */
@Controller('webhooks')
export class TradeSafeTransactionCallbackController {
  private readonly logger = new Logger(TradeSafeTransactionCallbackController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly events: WebhookEventService,
    private readonly graphql: TradeSafeGraphQLClient,
    private readonly handler: TradeSafeTransactionCallbackHandler,
    // Phase 3 (ADR 0011) — state-specific dispatch into ledger-writing
    // handlers. The audit handler above always runs (forensics on every
    // state). The funds-received handler runs only when TradeSafe reports
    // FUNDS_RECEIVED — it posts the canonical bounty-funded ledger group
    // and flips the bounty DRAFT → LIVE. Without this wiring, the live
    // route would receive callbacks but never advance the bounty: the
    // exact failure mode the Phase 3 cutover left behind before
    // 2026-04-27.
    private readonly fundsReceivedHandler: TradeSafeWebhookHandler,
  ) {}

  @Public()
  @Post('tradesafe/:secret')
  @HttpCode(200)
  async receive(
    @Param('secret') secret: string,
    @Body() body: unknown,
  ): Promise<{ received: true; duplicate: boolean }> {
    const expected = this.config.get<string>('TRADESAFE_CALLBACK_SECRET', '');
    if (!expected) {
      // If the env is unset, every request is implicitly unauthorised. We
      // do NOT reveal that detail via a distinct status / body — the
      // outside caller cannot tell this apart from a wrong secret. The
      // operator side sees the WARN in logs.
      this.logger.warn(
        'TRADESAFE_CALLBACK_SECRET unset — rejecting callback (check env)',
      );
      throw new UnauthorizedException();
    }

    if (!isSecretMatch(secret, expected)) {
      // INTENTIONALLY no INFO-level log for bad secrets (drown-out risk from
      // scanners). WARN at the level of "forensics still get something if
      // production starts seeing a pattern".
      this.logger.warn(
        `tradesafe callback rejected: bad :secret (len=${typeof secret === 'string' ? secret.length : 'n/a'})`,
      );
      throw new UnauthorizedException();
    }

    // Parse the body loosely — everything but `id` is discarded after this
    // point. TradeSafe's documented callback shape is
    // `{id, reference, state, balance}`. We require `id` and nothing else.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('callback body must be a JSON object');
    }
    const payload = body as Record<string, unknown>;
    const transactionId = this.readString(payload.id);
    if (!transactionId) {
      throw new BadRequestException('callback body missing "id"');
    }

    this.logger.log(
      `tradesafe callback received id=${transactionId} (re-fetching…)`,
    );

    // Record-or-fetch BEFORE re-fetching: if this is a replay, the unique
    // constraint short-circuits us out and we never call TradeSafe again.
    // That matters — the re-fetch is the expensive part, and TradeSafe
    // retries aggressively.
    const eventType = this.readString(payload.state)
      ? `tradesafe.transaction.${this.readString(payload.state)!.toLowerCase()}`
      : 'tradesafe.transaction.callback';
    const { event, isDuplicate } = await this.events.recordOrFetch({
      provider: WebhookProvider.TRADESAFE,
      externalEventId: transactionId,
      eventType,
      payload,
    });

    if (isDuplicate) {
      this.logger.log(
        `tradesafe callback duplicate id=${transactionId} (already processed event ${event.id})`,
      );
      return { received: true, duplicate: true };
    }

    // Not a replay — do the authoritative re-fetch. Failure here leaves the
    // WebhookEvent row in RECEIVED state so the operator can retry via the
    // standard webhook-replay tool; we mark it FAILED for observability.
    try {
      const transaction = await this.graphql.getTransaction(transactionId);
      // Audit handler always runs — forensic record of every state TradeSafe
      // reports for the transaction.
      await this.handler.handle(transaction);

      // Phase 3 dispatch (ADR 0011 §5 inbound). Branch on the AUTHORITATIVE
      // re-fetched state, not the body — the body is untrusted. Today only
      // FUNDS_RECEIVED maps to a ledger-writing handler. Other states
      // (CREATED, INITIATED, FUNDS_RELEASED, CANCELLED, REFUNDED, DISPUTE)
      // are forensic-only until Phase 4 lands.
      //
      // Idempotency on the ledger side is anchored on
      // `LedgerTransactionGroup.UNIQUE(referenceId=transactionId,
      // actionType='BOUNTY_FUNDED_VIA_TRADESAFE')` — a duplicate webhook
      // delivery that slips past the WebhookEvent guard above (e.g.
      // operator replay) still no-ops on the ledger.
      if (transaction?.state === 'FUNDS_RECEIVED') {
        await this.fundsReceivedHandler.handleFundsReceived(payload);
      }

      await this.events.markProcessed(event.id, {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.events
        .markFailed(event.id, message, event.attempts + 1)
        .catch((markErr) =>
          this.logger.warn(
            `failed to mark webhook event failed: ${markErr instanceof Error ? markErr.message : String(markErr)}`,
          ),
        );
      this.logger.error(
        `tradesafe callback dispatch failed id=${transactionId}: ${message}`,
      );
      // Re-throw: we surface 5xx so TradeSafe retries. The unique constraint
      // + `markProcessed` flip means on the next successful attempt we don't
      // double-dispatch.
      throw err;
    }

    return { received: true, duplicate: false };
  }

  private readString(v: unknown): string | undefined {
    return typeof v === 'string' && v.length > 0 ? v : undefined;
  }
}

/**
 * Constant-time secret comparison. Guards against timing-oracle leakage of
 * the expected secret.
 *
 * `timingSafeEqual` requires equal-length buffers — if the caller's secret
 * is the wrong length we bail early (mismatch is guaranteed anyway, but we
 * must short-circuit before `timingSafeEqual` to avoid a thrown RangeError).
 * The compare-against-self call in that branch is NOT required for timing
 * correctness (the attacker has no control over "should I enter this
 * branch" — length is observable via URL length), but it keeps the code
 * path shape identical for the rare audit that cares.
 */
export function isSecretMatch(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string' || provided.length !== expected.length) {
    return false;
  }
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
