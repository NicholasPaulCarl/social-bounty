import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SocialPlatform,
  BOUNTY_ACCESS_CONSTANTS,
} from '@social-bounty/shared';

// ── Apply to Bounty ──────────────────────────────────

export class ApplyToBountyDto {
  @IsOptional()
  @IsString()
  @MaxLength(BOUNTY_ACCESS_CONSTANTS.APPLICATION_MESSAGE_MAX)
  message?: string;
}

// ── Review Application ───────────────────────────────

export class ReviewApplicationDto {
  @IsEnum(['APPROVED', 'REJECTED'] as const, {
    message: 'status must be APPROVED or REJECTED',
  })
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(BOUNTY_ACCESS_CONSTANTS.REVIEW_NOTE_MAX)
  reviewNote?: string;
}

// ── Invitation Item ──────────────────────────────────

class InvitationItemDto {
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @IsString()
  handle!: string;
}

// ── Create Invitations ───────────────────────────────

export class CreateInvitationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BOUNTY_ACCESS_CONSTANTS.MAX_INVITATIONS_PER_BOUNTY)
  @ValidateNested({ each: true })
  @Type(() => InvitationItemDto)
  invitations!: InvitationItemDto[];
}
