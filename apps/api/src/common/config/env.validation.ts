import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';

/**
 * Outbound payout provider selector (ADR 0009). `tradesafe` is the live
 * rail post-ADR 0011 (single-rail cutover). `mock` routes through the
 * TradeSafe adapter in mock mode for dev / CI.
 */
export enum PayoutProvider {
  TRADESAFE = 'tradesafe',
  MOCK = 'mock',
}

class EnvironmentVariables {
  // NOTE: `FINANCIAL_KILL_SWITCH` was removed 2026-04-15 (orphan sweep C2).
  // The kill switch is a DB row (`SystemSetting.financial.kill_switch.active`)
  // flipped via the Finance admin dashboard — NOT an env var. See
  // `apps/api/src/modules/ledger/ledger.service.ts` (`isKillSwitchActive`).

  // ADR 0011 — TradeSafe unified inbound + outbound rail (supersedes the
  // prior split-provider posture from ADR 0008). All optional except the
  // always-required URL + secret fields above; PAYOUT_PROVIDER defaults
  // to 'tradesafe' at the reading site. Live TradeSafe calls require
  // TRADESAFE_CLIENT_ID + TRADESAFE_CLIENT_SECRET AND TRADESAFE_MOCK != 'true'.
  @IsOptional()
  @IsEnum(PayoutProvider)
  PAYOUT_PROVIDER?: PayoutProvider;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_API_BASE?: string;

  // TradeSafe OAuth 2.0 token endpoint (Client Credentials grant). Required
  // for live GraphQL calls; sandbox and prod share the same auth host:
  //   https://auth.tradesafe.co.za/oauth/token
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_AUTH_URL!: string;

  // TradeSafe GraphQL endpoint. Sandbox:
  //   https://api-developer.tradesafe.dev/graphql
  // Production:
  //   https://api.tradesafe.co.za/graphql
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_GRAPHQL_URL!: string;

  // Optional while mock-mode boot is supported: TRADESAFE_MOCK defaults to
  // `true` when creds are absent, which keeps dev/CI unblocked without
  // issuing real OAuth tokens. Live (PAYOUTS_ENABLED=true + MOCK=false)
  // requires both values populated — the TradeSafe client throws loudly
  // on the first GraphQL call otherwise.
  @IsOptional()
  @IsString()
  TRADESAFE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  TRADESAFE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  TRADESAFE_WEBHOOK_SECRET?: string;

  // Plan item 1.2 / Phase 1d (ADR 0011): URL-path secret embedded in the
  // callback URL configured inside TradeSafe's Merchant Portal. TradeSafe
  // does not currently document a body-signature scheme, so this secret is
  // the interim trust anchor for the transaction-state callback at
  // `POST /api/v1/webhooks/tradesafe/:secret`. Minimum length 32 to give
  // the URL-segment comparison a real guessing floor (any 32-char
  // alphanumeric is >190 bits of entropy, well above `crypto/timing`
  // concerns).
  @MinLength(32, {
    message: 'TRADESAFE_CALLBACK_SECRET must be at least 32 characters',
  })
  TRADESAFE_CALLBACK_SECRET!: string;

  // Defaults to `true` when TRADESAFE_CLIENT_ID + SECRET are absent so
  // dev/CI boots cleanly without issuing real OAuth tokens. Mock mode
  // returns fake checkout URLs / deposit callbacks — no real money moves.
  // Must be flipped to `false` once prod creds (R24) land and PAYOUTS_ENABLED=true.
  @IsOptional()
  @IsBooleanString()
  TRADESAFE_MOCK?: string;

  // R35 (2026-04-18): ADR 0009 §4 promises three OAuth URLs for the hunter
  // beneficiary-link callback flow. Gated by `PAYOUTS_ENABLED=true` (same
  // idiom as `BENEFICIARY_ENC_KEY` — dev ergonomics while the outbound
  // rail is gated). When payouts go live, all three must be populated or
  // the app refuses to boot; this is how `TradeSafeCallbackController`
  // avoids silently redirecting to `undefined`.
  //
  // Sandbox / prod URLs differ per environment — documented in
  // `docs/deployment/tradesafe-live-readiness.md` §3.
  @ValidateIf((o) => o.PAYOUTS_ENABLED === 'true')
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_OAUTH_REDIRECT_URL?: string;

  @ValidateIf((o) => o.PAYOUTS_ENABLED === 'true')
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_SUCCESS_URL?: string;

  @ValidateIf((o) => o.PAYOUTS_ENABLED === 'true')
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_FAILURE_URL?: string;

  // ADR 0011 (single-rail inbound + outbound). The browser redirect target
  // `TradeSafePaymentsService.checkoutLink` passes back to the hosted
  // checkout — brands land here after completing their bounty-funding
  // payment. Required at boot so live funding flows never redirect to
  // `undefined`; dev default is `http://localhost:3000/business/bounties/funded`.
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_REDIRECT_URL!: string;

  // Provider-agnostic system actor ID used by webhook handlers, schedulers,
  // and reconciliation to write AuditLog rows. AuditLog.actorId is a FK to
  // users.id — this must be a real user UUID (typically a SUPER_ADMIN).
  // Required for webhook-driven ledger posts and clearance jobs.
  @IsString()
  SYSTEM_ACTOR_ID!: string;

  // Dev-only override for Free-tier clearance window, in hours.
  // When set, ApprovalLedgerService uses this instead of CLEARANCE_HOURS.FREE (72).
  // Fractional values are allowed so we can simulate near-instant clearance in
  // live-testing (e.g. 0.0083 ≈ 30s). Ignored unless set.
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  CLEARANCE_OVERRIDE_HOURS_FREE?: number;

  // Dev-only override for Pro-tier clearance window, in hours.
  // When set, ApprovalLedgerService uses this instead of CLEARANCE_HOURS.PRO (0).
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  CLEARANCE_OVERRIDE_HOURS_PRO?: number;

  // ────────────────────────────────────────────────────────────────
  // Feature-flag validation (orphan sweep H2, 2026-04-15).
  // These env vars are read by schedulers/services and previously went
  // unvalidated at boot — a typo in staging would silently disable
  // financial jobs. Defaults live in the reading code; validation here
  // only guards against malformed values.
  // ────────────────────────────────────────────────────────────────

  // Gates `PayoutsScheduler`, `ClearanceScheduler`, and (via fallback)
  // `ExpiredBountyScheduler`. Default `false` (outbound rail gated
  // until TradeSafe integration per ADR 0008). Do not flip without
  // ADR sign-off.
  @IsOptional()
  @IsBooleanString()
  PAYOUTS_ENABLED?: string;

  // Gates `ReconciliationScheduler`. Default `true` (reconciliation is
  // always-on in Phase 1+). Set to `false` only for controlled drills.
  @IsOptional()
  @IsBooleanString()
  RECONCILIATION_ENABLED?: string;

  // Per-job override for `ExpiredBountyScheduler`. When unset, falls back
  // to `PAYOUTS_ENABLED`. Explicit `true`/`false` wins.
  @IsOptional()
  @IsBooleanString()
  EXPIRED_BOUNTY_RELEASE_ENABLED?: string;

  // AES-256-GCM key used to encrypt hunter bank account numbers on the
  // beneficiary row. SECURITY-SENSITIVE.
  //
  // R29 hardening (batch 14A, 2026-04-15): required when
  // `PAYOUTS_ENABLED=true`. The JWT_SECRET fallback in `BeneficiaryService`
  // is tolerated ONLY when payouts are gated off (current pre-TradeSafe
  // state, ADR 0008) — no live beneficiary rows are written in that mode.
  // Flipping `PAYOUTS_ENABLED=true` without a dedicated key would re-use
  // the token-signing secret to encrypt real bank account numbers; a
  // single key compromise would then decrypt every stored account.
  //
  // Minimum length 32: AES-256 key material needs ≥32 bytes of entropy.
  // Shorter secrets get stretched via scrypt but yield a weak derived key.
  @ValidateIf((o) => o.PAYOUTS_ENABLED === 'true')
  @IsString()
  @MinLength(32, {
    message:
      'BENEFICIARY_ENC_KEY must be at least 32 characters when PAYOUTS_ENABLED=true (AES-256 key material)',
  })
  BENEFICIARY_ENC_KEY?: string;

  // Apify — optional social analytics scraper. When unset, the service
  // logs a warning and the front-end falls back to the deterministic mock.
  @IsOptional()
  @IsString()
  APIFY_API_TOKEN?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  APIFY_ACTOR_TIMEOUT_MS?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });
  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${details}`);
  }
  return validated;
}
