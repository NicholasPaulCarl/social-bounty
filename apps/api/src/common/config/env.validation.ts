import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
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

  @IsOptional()
  @IsBooleanString()
  FINANCIAL_KILL_SWITCH?: string;

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
