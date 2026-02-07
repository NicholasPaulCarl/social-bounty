import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsDateString,
  IsInt,
  IsBoolean,
  IsArray,
  IsObject,
  MaxLength,
  Matches,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BountyStatus,
  RewardType,
  Currency,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  DurationUnit,
  FIELD_LIMITS,
  BOUNTY_REWARD_LIMITS,
} from '@social-bounty/shared';

// ── Nested DTOs ────────────────────────────────────────

export class RewardLineDto {
  @IsEnum(RewardType)
  rewardType!: RewardType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX)
  name!: string;

  @IsNumber()
  @IsPositive()
  monetaryValue!: number;
}

export class PostVisibilityDto {
  @IsEnum(PostVisibilityRule)
  rule!: PostVisibilityRule;

  @IsOptional()
  @ValidateIf((o) => o.rule === PostVisibilityRule.MINIMUM_DURATION)
  @IsInt()
  @IsPositive()
  minDurationValue?: number | null;

  @IsOptional()
  @ValidateIf((o) => o.rule === PostVisibilityRule.MINIMUM_DURATION)
  @IsEnum(DurationUnit)
  minDurationUnit?: DurationUnit | null;
}

export class StructuredEligibilityDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  minFollowers?: number | null;

  @IsOptional()
  @IsBoolean()
  publicProfile?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAccountAgeDays?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationRestriction?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  noCompetingBrandDays?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES)
  @IsString({ each: true })
  @MaxLength(BOUNTY_REWARD_LIMITS.CUSTOM_RULE_MAX_LENGTH, { each: true })
  customRules?: string[];
}

export class EngagementRequirementsDto {
  @IsOptional()
  @IsString()
  @Matches(/^@[a-zA-Z0-9_.]{1,99}$/, {
    message: 'tagAccount must start with @ followed by alphanumeric characters, underscores, or dots (max 100 chars)',
  })
  tagAccount?: string | null;

  @IsOptional()
  @IsBoolean()
  mention?: boolean;

  @IsOptional()
  @IsBoolean()
  comment?: boolean;
}

// ── Payout Metrics DTO ────────────────────────────────

export class PayoutMetricsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  minViews?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minLikes?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minComments?: number | null;
}

// ── Create Bounty DTO ──────────────────────────────────

export class CreateBountyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.BOUNTY_TITLE_MAX)
  title!: string;

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
  @IsString()
  @MaxLength(FIELD_LIMITS.PROOF_REQUIREMENTS_MAX)
  proofRequirements?: string;

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

  // ── New structured fields (all optional for draft saves) ──

  @IsOptional()
  @IsObject()
  channels?: Record<string, string[]>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(BOUNTY_REWARD_LIMITS.MAX_REWARD_LINES)
  @ValidateNested({ each: true })
  @Type(() => RewardLineDto)
  rewards?: RewardLineDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PostVisibilityDto)
  postVisibility?: PostVisibilityDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StructuredEligibilityDto)
  structuredEligibility?: StructuredEligibilityDto;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsBoolean()
  aiContentPermitted?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => EngagementRequirementsDto)
  engagementRequirements?: EngagementRequirementsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayoutMetricsDto)
  payoutMetrics?: PayoutMetricsDto;

  // ── Legacy fields (optional, for backward compat) ──

  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rewardValue?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.REWARD_DESCRIPTION_MAX)
  rewardDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.ELIGIBILITY_RULES_MAX)
  eligibilityRules?: string;
}

// ── Update Bounty DTO ──────────────────────────────────

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
  @MaxLength(FIELD_LIMITS.PROOF_REQUIREMENTS_MAX)
  proofRequirements?: string;

  // ── New structured fields (optional for partial updates) ──

  @IsOptional()
  @IsObject()
  channels?: Record<string, string[]>;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BOUNTY_REWARD_LIMITS.MAX_REWARD_LINES)
  @ValidateNested({ each: true })
  @Type(() => RewardLineDto)
  rewards?: RewardLineDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PostVisibilityDto)
  postVisibility?: PostVisibilityDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StructuredEligibilityDto)
  structuredEligibility?: StructuredEligibilityDto;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsBoolean()
  aiContentPermitted?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => EngagementRequirementsDto)
  engagementRequirements?: EngagementRequirementsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayoutMetricsDto)
  payoutMetrics?: PayoutMetricsDto;

  // ── Legacy fields (optional, for backward compat) ──

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
  @IsString()
  @MaxLength(FIELD_LIMITS.ELIGIBILITY_RULES_MAX)
  eligibilityRules?: string;
}

// ── Status Update DTO ──────────────────────────────────

export class UpdateBountyStatusDto {
  @IsEnum(BountyStatus)
  status!: BountyStatus;
}

