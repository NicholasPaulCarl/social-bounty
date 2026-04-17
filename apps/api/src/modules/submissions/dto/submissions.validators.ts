import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SubmissionStatus,
  PayoutStatus,
  SocialChannel,
  PostFormat,
  FIELD_LIMITS,
  FILE_UPLOAD_LIMITS,
} from '@social-bounty/shared';

// Per (channel, format) URL input — replaces the legacy flat string[].
// The submission-coverage.validator (in the parent dir) enforces the
// per-format coverage rules against bounty.channels at service level.
export class ProofLinkInputDto {
  @IsEnum(SocialChannel)
  channel!: SocialChannel;

  @IsEnum(PostFormat)
  format!: PostFormat;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url!: string;
}

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.PROOF_TEXT_MAX)
  proofText!: string;

  @IsArray()
  @ArrayMaxSize(FILE_UPLOAD_LIMITS.MAX_PROOF_LINKS)
  @ValidateNested({ each: true })
  @Type(() => ProofLinkInputDto)
  proofLinks!: ProofLinkInputDto[];
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.PROOF_TEXT_MAX)
  proofText?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(FILE_UPLOAD_LIMITS.MAX_PROOF_LINKS)
  @ValidateNested({ each: true })
  @Type(() => ProofLinkInputDto)
  proofLinks?: ProofLinkInputDto[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeImageIds?: string[];
}

export class ReviewSubmissionDto {
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.REVIEWER_NOTE_MAX)
  reviewerNote?: string;
}

export class UpdatePayoutDto {
  @IsEnum(PayoutStatus)
  payoutStatus!: PayoutStatus;

  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.PAYOUT_NOTE_MAX)
  note?: string;

  @IsOptional()
  @IsString()
  proofOfPaymentUrl?: string;

  @IsOptional()
  @IsString()
  proofOfPaymentName?: string;
}
