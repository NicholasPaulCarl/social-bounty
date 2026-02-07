import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsDateString,
  IsInt,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { BountyStatus, RewardType, FIELD_LIMITS } from '@social-bounty/shared';

export class CreateBountyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.BOUNTY_TITLE_MAX)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.SHORT_DESCRIPTION_MAX)
  shortDescription!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.FULL_INSTRUCTIONS_MAX)
  fullInstructions!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.CATEGORY_MAX)
  category!: string;

  @IsEnum(RewardType)
  rewardType!: RewardType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rewardValue?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.REWARD_DESCRIPTION_MAX)
  rewardDescription?: string | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  maxSubmissions?: number | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.ELIGIBILITY_RULES_MAX)
  eligibilityRules!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.PROOF_REQUIREMENTS_MAX)
  proofRequirements!: string;
}

export class UpdateBountyDto {
  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.BOUNTY_TITLE_MAX)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.SHORT_DESCRIPTION_MAX)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.FULL_INSTRUCTIONS_MAX)
  fullInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.CATEGORY_MAX)
  category?: string;

  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @IsOptional()
  @IsNumber()
  rewardValue?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.REWARD_DESCRIPTION_MAX)
  rewardDescription?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxSubmissions?: number | null;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.ELIGIBILITY_RULES_MAX)
  eligibilityRules?: string;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.PROOF_REQUIREMENTS_MAX)
  proofRequirements?: string;
}

export class UpdateBountyStatusDto {
  @IsEnum(BountyStatus)
  status!: BountyStatus;
}
