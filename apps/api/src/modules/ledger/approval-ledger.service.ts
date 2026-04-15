import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LedgerAccount,
  LedgerEntryType,
  SubmissionStatus,
} from '@prisma/client';
import {
  CLEARANCE_HOURS,
  SubscriptionTier,
  UserRole,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculatorService } from '../finance/fee-calculator.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LedgerService } from './ledger.service';

export interface PostSubmissionApprovalInput {
  submissionId: string;
  approverId: string;
  approverRole: UserRole;
}

@Injectable()
export class ApprovalLedgerService {
  private readonly logger = new Logger(ApprovalLedgerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly fees: FeeCalculatorService,
    private readonly subscriptions: SubscriptionsService,
    private readonly config?: ConfigService,
  ) {}

  /**
   * Resolves the clearance window for a given tier, honouring the dev-only
   * CLEARANCE_OVERRIDE_HOURS_FREE / CLEARANCE_OVERRIDE_HOURS_PRO env vars when
   * set. Falls back to the canonical constants from @social-bounty/shared.
   *
   * Rationale: lets us shrink the 72h Free-tier window down to seconds in
   * dev/staging so the approve → clearance → payout loop is live-testable.
   * Production must leave these unset.
   */
  private clearanceHoursFor(tier: SubscriptionTier): number {
    const envKey =
      tier === SubscriptionTier.PRO
        ? 'CLEARANCE_OVERRIDE_HOURS_PRO'
        : 'CLEARANCE_OVERRIDE_HOURS_FREE';
    const raw = this.config?.get<string | number>(envKey);
    if (raw !== undefined && raw !== null && `${raw}`.length > 0) {
      const parsed = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        this.logger.warn(
          `clearance window overridden via ${envKey}=${parsed}h (tier=${tier}); DO NOT USE IN PRODUCTION`,
        );
        return parsed;
      }
      this.logger.error(
        `${envKey} is set to an invalid value (${raw}); falling back to canonical CLEARANCE_HOURS`,
      );
    }
    return tier === SubscriptionTier.PRO ? CLEARANCE_HOURS.PRO : CLEARANCE_HOURS.FREE;
  }

  /**
   * Post the approval earnings split ledger group for a submission.
   * Idempotent via action=submission_approved, referenceId=submissionId.
   */
  async postApproval(input: PostSubmissionApprovalInput): Promise<void> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: input.submissionId },
      include: { bounty: true, user: { select: { id: true } } },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== SubmissionStatus.APPROVED) {
      throw new BadRequestException('Submission must be APPROVED before posting earnings');
    }

    const bounty = submission.bounty;
    if (bounty.faceValueCents == null) {
      throw new BadRequestException('Bounty has no recorded faceValueCents; fund it first');
    }

    // Hunter plan snapshot captured here (Non-Negotiable #9) — never looked up mid-flow thereafter.
    const hunterTier = await this.subscriptions.getActiveTier(submission.userId);
    const breakdown = this.fees.forHunterApproval({
      faceValueCents: bounty.faceValueCents,
      planSnapshotHunter: hunterTier,
      payoutFeeCents: 0n, // actual payout fee booked at payout settlement time
      bankChargeCents: 0n,
    });

    const clearanceHours = this.clearanceHoursFor(hunterTier);
    const clearanceReleaseAt = new Date(Date.now() + clearanceHours * 60 * 60 * 1000);

    const { transactionGroupId } = await this.ledger.postTransactionGroup({
      actionType: 'submission_approved',
      referenceId: submission.id,
      referenceType: 'Submission',
      description: `Earnings split for submission ${submission.id}`,
      postedBy: input.approverId,
      currency: bounty.currency,
      legs: [
        // Leg 1: drain reserve into hunter_pending
        {
          account: LedgerAccount.brand_reserve,
          type: LedgerEntryType.DEBIT,
          amountCents: bounty.faceValueCents,
          brandId: bounty.brandId,
          bountyId: bounty.id,
        },
        {
          account: LedgerAccount.hunter_pending,
          type: LedgerEntryType.CREDIT,
          amountCents: bounty.faceValueCents,
          userId: submission.userId,
          submissionId: submission.id,
          clearanceReleaseAt,
        },
        // Leg 2: split hunter_pending into fees + net_payable
        {
          account: LedgerAccount.hunter_pending,
          type: LedgerEntryType.DEBIT,
          amountCents: bounty.faceValueCents,
          userId: submission.userId,
          submissionId: submission.id,
        },
        {
          account: LedgerAccount.commission_revenue,
          type: LedgerEntryType.CREDIT,
          amountCents: breakdown.commissionCents,
          userId: submission.userId,
        },
        {
          account: LedgerAccount.global_fee_revenue,
          type: LedgerEntryType.CREDIT,
          amountCents: breakdown.globalFeeCents,
          userId: submission.userId,
        },
        {
          account: LedgerAccount.hunter_net_payable,
          type: LedgerEntryType.CREDIT,
          amountCents: breakdown.hunterNetCents,
          userId: submission.userId,
          submissionId: submission.id,
          clearanceReleaseAt,
        },
      ],
      audit: {
        actorId: input.approverId,
        actorRole: input.approverRole,
        action: 'SUBMISSION_APPROVED_LEDGER',
        entityType: 'Submission',
        entityId: submission.id,
        afterState: {
          faceValueCents: bounty.faceValueCents.toString(),
          commissionCents: breakdown.commissionCents.toString(),
          globalFeeCents: breakdown.globalFeeCents.toString(),
          hunterNetCents: breakdown.hunterNetCents.toString(),
          clearanceReleaseAt: clearanceReleaseAt.toISOString(),
          planSnapshotHunter: hunterTier,
        },
      },
    });

    // Snapshot on Submission for fast admin queries; source of truth remains the ledger.
    await this.prisma.submission.update({
      where: { id: submission.id },
      data: {
        planSnapshotHunter: hunterTier,
        commissionRateBps: breakdown.commissionRateBps,
        clearanceReleaseAt,
        hunterNetCents: breakdown.hunterNetCents,
        transactionGroupIdApproval: transactionGroupId,
      },
    });

    this.logger.log(
      `earnings split posted: submission=${submission.id} tier=${hunterTier} net=${breakdown.hunterNetCents}`,
    );
  }
}
