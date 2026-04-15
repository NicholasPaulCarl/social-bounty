import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
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
