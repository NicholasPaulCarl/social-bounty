import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  DisputeStatus,
  DisputeCategory,
  DisputeReason,
  DisputeResolution,
  DISPUTE_LIMITS,
} from '@social-bounty/shared';

// ── Create Dispute DTO ──────────────────────────────────

export class CreateDisputeDto {
  @IsUUID()
  @IsNotEmpty()
  submissionId!: string;

  @IsEnum(DisputeCategory)
  category!: DisputeCategory;

  @IsEnum(DisputeReason)
  reason!: DisputeReason;

  @IsString()
  @IsNotEmpty()
  @MaxLength(DISPUTE_LIMITS.DESCRIPTION_MAX)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(DISPUTE_LIMITS.DESIRED_OUTCOME_MAX)
  desiredOutcome!: string;
}

// ── Update Dispute DTO ──────────────────────────────────

export class UpdateDisputeDto {
  @IsOptional()
  @IsString()
  @MaxLength(DISPUTE_LIMITS.DESCRIPTION_MAX)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(DISPUTE_LIMITS.DESIRED_OUTCOME_MAX)
  desiredOutcome?: string;
}

// ── Send Message DTO ────────────────────────────────────

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(DISPUTE_LIMITS.MESSAGE_MAX)
  content!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

// ── Resolve Dispute DTO ─────────────────────────────────

export class ResolveDisputeDto {
  @IsEnum(DisputeResolution)
  resolutionType!: DisputeResolution;

  @IsString()
  @IsNotEmpty()
  @MaxLength(DISPUTE_LIMITS.RESOLUTION_SUMMARY_MAX)
  resolutionSummary!: string;
}

// ── Assign Dispute DTO ──────────────────────────────────

export class AssignDisputeDto {
  @IsUUID()
  @IsNotEmpty()
  assignedToUserId!: string;
}

// ── Transition Dispute DTO ──────────────────────────────

export class TransitionDisputeDto {
  @IsEnum(DisputeStatus)
  status!: DisputeStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

// ── Escalate Dispute DTO ────────────────────────────────

export class EscalateDisputeDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

// ── Withdraw Dispute DTO ────────────────────────────────

export class WithdrawDisputeDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
