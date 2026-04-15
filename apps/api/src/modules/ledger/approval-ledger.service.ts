import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
  ) {}

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

    const clearanceHours =
      hunterTier === SubscriptionTier.PRO ? CLEARANCE_HOURS.PRO : CLEARANCE_HOURS.FREE;
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
