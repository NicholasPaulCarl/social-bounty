import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { PayoutMethod, WALLET_LIMITS } from '@social-bounty/shared';

export class RequestWithdrawalDto {
  @IsNumber()
  @Min(WALLET_LIMITS.MIN_WITHDRAWAL)
  @Max(WALLET_LIMITS.MAX_WITHDRAWAL)
  amount!: number;

  @IsEnum(PayoutMethod)
  method!: PayoutMethod;

  @IsObject()
  destination!: Record<string, string>;
}

export class AdminAdjustWalletDto {
  @IsNumber()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(WALLET_LIMITS.ADJUSTMENT_REASON_MAX)
  reason!: string;
}

export class AdminCompleteWithdrawalDto {
  @IsOptional()
  @IsString()
  proofUrl?: string;
}

export class AdminFailWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
