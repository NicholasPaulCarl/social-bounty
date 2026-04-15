import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  LedgerAccount,
  LedgerEntryType,
  PaymentStatus,
  RefundScenario,
  RefundState,
  StitchPaymentLinkStatus,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { StitchClient } from '../stitch/stitch.client';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { feeCents } from '../finance/rounding';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly stitch: StitchClient,
  ) {}

  /**
   * Brand or Super Admin initiates a pre-approval refund.
   * Writes a Refund row in REQUESTED state. Super Admin approval + Stitch call + ledger
   * happen in `approve`.
   */
  async requestBeforeApproval(
    bountyId: string,
    reason: string,
    user: AuthenticatedUser,
  ) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { submissions: { select: { id: true, status: true } } },
    });
    if (!bounty) throw new NotFoundException('Bounty not found');
    if (user.role !== UserRole.SUPER_ADMIN && bounty.brandId !== user.brandId) {
      throw new ForbiddenException('Not authorized');
    }
    if (bounty.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Only funded bounties can be refunded');
    }
    const hasApproved = bounty.submissions.some((s) => s.status === 'APPROVED');
    if (hasApproved) {
      throw new BadRequestException('Cannot refund before approval once a submission is approved');
    }
    if (bounty.faceValueCents == null) {
      throw new BadRequestException('Bounty has no recorded face value');
    }

    const refund = await this.prisma.refund.create({
      data: {
        bountyId,
        scenario: RefundScenario.BEFORE_APPROVAL,
        state: RefundState.REQUESTED,
        amountCents: bounty.faceValueCents,
        reason,
        requestedByUserId: user.sub,
      },
    });
    this.logger.log(`pre-approval refund requested: ${refund.id} (bounty ${bountyId})`);
    return refund;
  }

  /**
   * Super Admin approves a REQUESTED refund. Calls Stitch, flips state to PROCESSING,
   * stores stitchRefundId for idempotent webhook correlation.
   */
  async approveBeforeApproval(refundId: string, approver: AuthenticatedUser, note?: string) {
    if (approver.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can approve refunds');
    }
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { bounty: { include: { stitchPaymentLinks: true } } },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.state !== RefundState.REQUESTED) {
      throw new BadRequestException(`Refund is in state ${refund.state}; only REQUESTED can be approved`);
    }
    if (refund.scenario !== RefundScenario.BEFORE_APPROVAL) {
      throw new BadRequestException('Use the scenario-specific endpoint');
    }
    const settledLink = refund.bounty.stitchPaymentLinks.find(
      (l) => l.status === StitchPaymentLinkStatus.SETTLED && l.stitchPaymentId,
    );
    if (!settledLink?.stitchPaymentId) {
      throw new BadRequestException('No settled Stitch payment to refund');
    }

    const stitchRefund = await this.stitch.createRefund(
      settledLink.stitchPaymentId,
      refund.amountCents,
      'REQUESTED_BY_CUSTOMER',
    );

    const updated = await this.prisma.refund.update({
      where: { id: refund.id },
      data: {
        state: RefundState.PROCESSING,
        approvedByUserId: approver.sub,
        approvalNote: note,
        stitchRefundId: stitchRefund.id,
      },
    });
    this.logger.log(`pre-approval refund approved: ${refund.id} stitchRefundId=${stitchRefund.id}`);
    return updated;
  }

  /**
   * Webhook-driven: post the compensating ledger group and flip state to COMPLETED.
   * Idempotent via action=refund_processed, referenceId=refund.id.
   */
  /**
   * Post-approval, pre-payout refund. Super Admin initiates (one-step, no dual approval).
   *
   * Per payment-gateway.md §11: reverses the earnings split AND returns face value to
   * brand_reserve, then triggers the Stitch refund. The compensating ledger group is
   * posted in the same call (state=APPROVED immediately — we skip REQUESTED).
   *
   * Leg layout (mirrors ApprovalLedgerService.postApproval, reversed):
   *   Step 1 — undo the split:
   *     DEBIT  commission_revenue
   *     DEBIT  global_fee_revenue
   *     DEBIT  hunter_net_payable
   *     CREDIT hunter_pending   (== faceValue)
   *   Step 2 — drain hunter_pending → brand_reserve:
   *     DEBIT  hunter_pending   (== faceValue)
   *     CREDIT brand_reserve
   *
   * Financial Non-Negotiables #1 (balanced), #2 (idempotent via referenceId=refund.id),
   * #3 (single group), #5 (append-only), #6 (AuditLog in same tx), #9 (amounts rebuilt
   * from submission + bounty snapshots — never re-priced).
   *
   * Webhook `onStitchRefundProcessed` then flips state REFUND → COMPLETED once Stitch
   * confirms; no second ledger group is needed for the after-approval path.
   */
  async requestAfterApproval(submissionId: string, reason: string, user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can initiate post-approval refunds');
    }
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: { include: { stitchPaymentLinks: true } },
        payout: true,
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.payout?.paidAt) {
      throw new BadRequestException('Submission has been paid out; use after-payout endpoint');
    }
    if (!submission.bounty.faceValueCents || !submission.hunterNetCents) {
      throw new BadRequestException('Submission is missing ledger snapshot; cannot refund');
    }
    const bounty = submission.bounty;
    const faceValue: bigint = submission.bounty.faceValueCents;
    const hunterNet: bigint = submission.hunterNetCents;
    const globalBps = bounty.globalFeeRateBps ?? 0;
    // Rebuild from snapshots (Non-Negotiable #9). Commission is derived so the
    // group is guaranteed to reconcile to faceValue regardless of rounding path
    // — hunterNet = face - commission - globalFee at approval time.
    const globalFee = feeCents(faceValue, globalBps);
    const commission = faceValue - hunterNet - globalFee;
    if (commission < 0n) {
      throw new BadRequestException(
        `Refund reversal arithmetic failed: derived commission=${commission} (face=${faceValue} net=${hunterNet} globalFee=${globalFee})`,
      );
    }

    const settledLink = bounty.stitchPaymentLinks.find(
      (l) => l.status === StitchPaymentLinkStatus.SETTLED && l.stitchPaymentId,
    );
    if (!settledLink?.stitchPaymentId) {
      throw new BadRequestException('No settled Stitch payment to refund');
    }

    // Refund row goes in APPROVED (one-step) — mirrors the after-payout pattern.
    const refund = await this.prisma.refund.create({
      data: {
        bountyId: submission.bountyId,
        submissionId: submission.id,
        scenario: RefundScenario.AFTER_APPROVAL,
        state: RefundState.APPROVED,
        amountCents: faceValue,
        reason,
        requestedByUserId: user.sub,
        approvedByUserId: user.sub,
      },
    });

    const { transactionGroupId } = await this.ledger.postTransactionGroup({
      actionType: 'refund_processed',
      referenceId: refund.id,
      referenceType: 'Refund',
      description: `After-approval refund reversal: submission ${submission.id}`,
      postedBy: user.sub,
      currency: bounty.currency,
      legs: [
        // Step 1: undo earnings split back into hunter_pending.
        {
          account: LedgerAccount.commission_revenue,
          type: LedgerEntryType.DEBIT,
          amountCents: commission,
          userId: submission.userId,
        },
        {
          account: LedgerAccount.global_fee_revenue,
          type: LedgerEntryType.DEBIT,
          amountCents: globalFee,
          userId: submission.userId,
        },
        {
          account: LedgerAccount.hunter_net_payable,
          type: LedgerEntryType.DEBIT,
          amountCents: hunterNet,
          userId: submission.userId,
          submissionId: submission.id,
        },
        {
          account: LedgerAccount.hunter_pending,
          type: LedgerEntryType.CREDIT,
          amountCents: faceValue,
          userId: submission.userId,
          submissionId: submission.id,
        },
        // Step 2: drain hunter_pending back into brand_reserve.
        {
          account: LedgerAccount.hunter_pending,
          type: LedgerEntryType.DEBIT,
          amountCents: faceValue,
          userId: submission.userId,
          submissionId: submission.id,
        },
        {
          account: LedgerAccount.brand_reserve,
          type: LedgerEntryType.CREDIT,
          amountCents: faceValue,
          brandId: bounty.brandId,
          bountyId: bounty.id,
        },
      ],
      audit: {
        actorId: user.sub,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'REFUND_AFTER_APPROVAL',
        entityType: 'Refund',
        entityId: refund.id,
        reason,
        afterState: {
          faceValueCents: faceValue.toString(),
          commissionCents: commission.toString(),
          globalFeeCents: globalFee.toString(),
          hunterNetCents: hunterNet.toString(),
        },
      },
    });

    // Trigger the Stitch refund on the original settled payment.
    const stitchRefund = await this.stitch.createRefund(
      settledLink.stitchPaymentId,
      faceValue,
      'REQUESTED_BY_CUSTOMER',
    );

    const updated = await this.prisma.refund.update({
      where: { id: refund.id },
      data: {
        state: RefundState.PROCESSING,
        stitchRefundId: stitchRefund.id,
        transactionGroupId,
      },
    });
    this.logger.log(
      `after-approval refund initiated: ${refund.id} stitchRefundId=${stitchRefund.id} group=${transactionGroupId}`,
    );
    return updated;
  }

  /**
   * Post-payout refund. Dual Super Admin approval + linked KB entry required.
   * Clawback entries move hunter_paid → hunter_clearing for manual collection.
   */
  async requestAfterPayout(
    submissionId: string,
    reason: string,
    kbEntryId: string,
    dualApproverId: string,
    user: AuthenticatedUser,
  ) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can initiate after-payout refunds');
    }
    if (user.sub === dualApproverId) {
      throw new BadRequestException('Dual approver must be a different Super Admin');
    }
    if (!kbEntryId) {
      throw new BadRequestException('After-payout refunds require a linked KB entry');
    }
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { bounty: true, payout: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (!submission.hunterNetCents) {
      throw new BadRequestException('Submission is missing net amount snapshot');
    }

    const refund = await this.prisma.refund.create({
      data: {
        bountyId: submission.bountyId,
        submissionId: submission.id,
        scenario: RefundScenario.AFTER_PAYOUT,
        state: RefundState.APPROVED,
        amountCents: submission.hunterNetCents,
        reason,
        requestedByUserId: user.sub,
        approvedByUserId: user.sub,
        dualApprovalByUserId: dualApproverId,
        kbEntryId,
      },
    });

    // Clawback: hunter_paid → hunter_clearing (held pending manual collection)
    const { transactionGroupId } = await this.ledger.postTransactionGroup({
      actionType: 'refund_processed',
      referenceId: refund.id,
      referenceType: 'Refund',
      description: `After-payout refund clawback: submission ${submission.id}`,
      postedBy: user.sub,
      legs: [
        {
          account: LedgerAccount.hunter_paid,
          type: LedgerEntryType.DEBIT,
          amountCents: submission.hunterNetCents,
          userId: submission.userId,
          submissionId: submission.id,
        },
        {
          account: LedgerAccount.hunter_clearing,
          type: LedgerEntryType.CREDIT,
          amountCents: submission.hunterNetCents,
          userId: submission.userId,
          submissionId: submission.id,
          metadata: { kbEntryId, dualApprover: dualApproverId, reason },
        },
      ],
      audit: {
        actorId: user.sub,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'REFUND_AFTER_PAYOUT',
        entityType: 'Refund',
        entityId: refund.id,
        reason,
        afterState: { kbEntryId, dualApprover: dualApproverId },
      },
    });

    return this.prisma.refund.update({
      where: { id: refund.id },
      data: { state: RefundState.COMPLETED, transactionGroupId },
    });
  }

  async onStitchRefundProcessed(stitchRefundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { stitchRefundId },
      include: { bounty: true },
    });
    if (!refund) {
      this.logger.warn(`refund.processed for unknown stitchRefundId=${stitchRefundId}`);
      return;
    }
    if (refund.state === RefundState.COMPLETED) return; // already applied

    const bounty = refund.bounty;
    if (!bounty.faceValueCents) throw new Error('bounty missing faceValueCents');

    // Compute breakdown from bounty snapshot (Non-Negotiable #9 — don't re-look-up rates).
    const faceValue = bounty.faceValueCents;
    const adminBps = bounty.brandAdminFeeRateBps ?? 0;
    const globalBps = bounty.globalFeeRateBps ?? 0;
    const adminFee = (faceValue * BigInt(adminBps)) / 10000n;
    const globalFee = (faceValue * BigInt(globalBps)) / 10000n;
    const gatewayCredit = faceValue + adminFee + globalFee;

    const { transactionGroupId } = await this.ledger.postTransactionGroup({
      actionType: 'refund_processed',
      referenceId: refund.id,
      referenceType: 'Refund',
      description: `Pre-approval refund: bounty ${bounty.id}`,
      postedBy: 'stitch-webhook',
      currency: bounty.currency,
      legs: [
        { account: LedgerAccount.brand_reserve, type: LedgerEntryType.DEBIT, amountCents: faceValue, brandId: bounty.brandId, bountyId: bounty.id },
        { account: LedgerAccount.admin_fee_revenue, type: LedgerEntryType.DEBIT, amountCents: adminFee, brandId: bounty.brandId },
        { account: LedgerAccount.global_fee_revenue, type: LedgerEntryType.DEBIT, amountCents: globalFee, brandId: bounty.brandId },
        { account: LedgerAccount.gateway_clearing, type: LedgerEntryType.CREDIT, amountCents: gatewayCredit, brandId: bounty.brandId, bountyId: bounty.id, externalReference: stitchRefundId },
      ],
      audit: {
        actorId: 'stitch-webhook',
        actorRole: UserRole.SUPER_ADMIN,
        action: 'REFUND_PROCESSED',
        entityType: 'Refund',
        entityId: refund.id,
      },
    });

    await this.prisma.refund.update({
      where: { id: refund.id },
      data: { state: RefundState.COMPLETED, transactionGroupId },
    });
    await this.prisma.bounty.update({
      where: { id: bounty.id },
      data: { paymentStatus: PaymentStatus.REFUNDED },
    });
  }
}
