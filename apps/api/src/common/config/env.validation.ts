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

export enum PaymentsProvider {
  NONE = 'none',
  STITCH_SANDBOX = 'stitch_sandbox',
  STITCH_LIVE = 'stitch_live',
}

export enum StitchPayoutSpeed {
  INSTANT = 'INSTANT',
  DEFAULT = 'DEFAULT',
}

/**
 * Outbound payout provider selector (ADR 0009). Defaults to `stitch` —
 * the current live inbound rail and gated outbound rail. `tradesafe` is
 * the forthcoming TradeSafe escrow adapter (scaffolded, not live). `mock`
 * routes through the TradeSafe adapter in mock mode for dev / CI.
 */
export enum PayoutProvider {
  STITCH = 'stitch',
  TRADESAFE = 'tradesafe',
  MOCK = 'mock',
}

class EnvironmentVariables {
  @IsEnum(PaymentsProvider)
  PAYMENTS_PROVIDER!: PaymentsProvider;

  @ValidateIf((o) => o.PAYMENTS_PROVIDER !== PaymentsProvider.NONE)
  @IsString()
  STITCH_CLIENT_ID!: string;

  @ValidateIf((o) => o.PAYMENTS_PROVIDER !== PaymentsProvider.NONE)
  @IsString()
  STITCH_CLIENT_SECRET!: string;

  @ValidateIf((o) => o.PAYMENTS_PROVIDER !== PaymentsProvider.NONE)
  @IsUrl({ require_tld: false, require_protocol: true })
  STITCH_API_BASE!: string;

  @ValidateIf((o) => o.PAYMENTS_PROVIDER !== PaymentsProvider.NONE)
  @IsUrl({ require_tld: false, require_protocol: true })
  STITCH_REDIRECT_URL!: string;

  @IsOptional()
  @IsString()
  STITCH_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsEnum(StitchPayoutSpeed)
  STITCH_PAYOUT_SPEED?: StitchPayoutSpeed;

  @IsOptional()
  @IsInt()
  @Min(0)
  STITCH_MIN_PAYOUT_CENTS?: number;

  // NOTE: `FINANCIAL_KILL_SWITCH` was removed 2026-04-15 (orphan sweep C2).
  // The kill switch is a DB row (`SystemSetting.financial.kill_switch.active`)
  // flipped via the Finance admin dashboard — NOT an env var. See
  // `apps/api/src/modules/ledger/ledger.service.ts` (`isKillSwitchActive`).

  // ADR 0009 — TradeSafe adapter scaffolding. All optional except
  // PAYOUT_PROVIDER which defaults to 'stitch'. Live TradeSafe calls require
  // TRADESAFE_CLIENT_ID + TRADESAFE_CLIENT_SECRET AND TRADESAFE_MOCK != 'true'.
  @IsOptional()
  @IsEnum(PayoutProvider)
  PAYOUT_PROVIDER?: PayoutProvider;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  TRADESAFE_API_BASE?: string;

  @IsOptional()
  @IsString()
  TRADESAFE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  TRADESAFE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  TRADESAFE_WEBHOOK_SECRET?: string;

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

  // Gates the live Stitch card-consent upgrade CTA. Default `false` while
  // Stitch subscriptions remain feature-gated at the account level. Flip to
  // `true` once Stitch support enables the product on the client id used
  // for this environment. The UI reflects the same state via its own flag;
  // the backend gate is defence-in-depth so direct API calls to
  // `POST /subscription/upgrade` return 503 rather than hitting Stitch.
  @IsOptional()
  @IsBooleanString()
  SUBSCRIPTION_UPGRADE_ENABLED?: string;

  // Users.id of the dedicated system-actor row used as the fallback
  // AuditLog actor for webhook- and scheduler-driven ledger writes.
  // Required when payments are live — several services throw loudly
  // at runtime if this is unset and they need to write an AuditLog.
  // Optional for `PAYMENTS_PROVIDER=none` so dev boots cleanly.
  @ValidateIf((o) => o.PAYMENTS_PROVIDER !== PaymentsProvider.NONE)
  @IsString()
  STITCH_SYSTEM_ACTOR_ID?: string;

  // AES-256-GCM key used to encrypt bank account numbers on
  // `StitchBeneficiary`. SECURITY-SENSITIVE.
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

  // Stripe (ADR 0001 legacy). Kept optional until the retirement batch
  // lands; still read by `PaymentsService` for any in-flight legacy flow.
  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

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
