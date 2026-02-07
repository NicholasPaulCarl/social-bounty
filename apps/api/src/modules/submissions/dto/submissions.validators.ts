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
} from 'class-validator';
import {
  SubmissionStatus,
  PayoutStatus,
  FIELD_LIMITS,
  FILE_UPLOAD_LIMITS,
} from '@social-bounty/shared';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIELD_LIMITS.PROOF_TEXT_MAX)
  proofText!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(FILE_UPLOAD_LIMITS.MAX_PROOF_LINKS)
  @IsUrl({}, { each: true })
  proofLinks?: string[];
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(FIELD_LIMITS.PROOF_TEXT_MAX)
  proofText?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(FILE_UPLOAD_LIMITS.MAX_PROOF_LINKS)
  @IsUrl({}, { each: true })
  proofLinks?: string[];

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
}
