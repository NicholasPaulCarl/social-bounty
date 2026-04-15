import { Injectable, Logger } from '@nestjs/common';
import {
  BountyStatus,
  LedgerAccount,
  LedgerEntryType,
  PaymentStatus,
  Prisma,
  StitchPaymentLinkStatus,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

/**
 * Handles Stitch inbound payment events. Translates the provider payload into
 * a canonical brand-funding ledger group and flips the Bounty into LIVE.
 *
 * Idempotency: action=stitch_payment_settled, referenceId=stitchPaymentId.
 */
@Injectable()
export class BrandFundingHandler {
  private readonly logger = new Logger(BrandFundingHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async onPaymentSettled(payload: Record<string, unknown>): Promise<void> {
    const { stitchPaymentId, stitchPaymentLinkId, processingFeeCents, bankChargeCents } =
      this.extractSettlementData(payload);

    if (!stitchPaymentId) {
      this.logger.warn('payment.settled missing payment id; ignoring');
      return;
    }

    const link = await this.findPaymentLink({ stitchPaymentId, stitchPaymentLinkId });
    if (!link) {
      this.logger.warn(`payment.settled for unknown link (payment=${stitchPaymentId})`);
      return;
    }

    const bounty = await this.prisma.bounty.findUnique({ where: { id: link.bountyId } });
    if (!bounty) {
      this.logger.warn(`payment.settled for link with missing bounty ${link.bountyId}`);
      return;
    }

    const meta = (link.metadata as Record<string, unknown>) ?? {};
    const breakdown = (meta.breakdown as Record<string, string | number>) ?? {};
    const faceValueCents = BigInt(String(breakdown.faceValueCents ?? bounty.faceValueCents ?? 0n));
    const brandAdminFeeCents = BigInt(String(breakdown.brandAdminFeeCents ?? 0n));
    const globalFeeCents = BigInt(String(breakdown.globalFeeCents ?? 0n));
    const processingFee = processingFeeCents ?? 0n;
    const bankCharge = bankChargeCents ?? 0n;

    const debitTotal = faceValueCents + brandAdminFeeCents + globalFeeCents + processingFee + bankCharge;
    const creditSum = link.amountCents + processingFee + bankCharge; // what Stitch cleared

    // If Stitch charged the estimated amount (Phase 1 path: zero processing/bank),
    // the debit equals link.amountCents exactly. If Stitch reports non-zero fees,
    // they're absorbed by the platform: we debit gateway_clearing by link.amountCents
    // and the fees come out of net revenue, not from the brand.
    const gatewayDebit = link.amountCents + processingFee + bankCharge;

    await this.ledger.postTransactionGroup({
      actionType: 'stitch_payment_settled',
      referenceId: stitchPaymentId,
      referenceType: 'StitchPaymentLink',
      description: `Brand funding settled: bounty ${bounty.id}`,
      postedBy: 'stitch-webhook',
      currency: link.currency,
      legs: [
        {
          account: LedgerAccount.gateway_clearing,
          type: LedgerEntryType.DEBIT,
          amountCents: gatewayDebit,
          brandId: bounty.brandId,
          bountyId: bounty.id,
          externalReference: stitchPaymentId,
        },
        {
          account: LedgerAccount.brand_reserve,
          type: LedgerEntryType.CREDIT,
          amountCents: faceValueCents,
          brandId: bounty.brandId,
          bountyId: bounty.id,
        },
        {
          account: LedgerAccount.admin_fee_revenue,
          type: LedgerEntryType.CREDIT,
          amountCents: brandAdminFeeCents,
          brandId: bounty.brandId,
        },
        {
          account: LedgerAccount.global_fee_revenue,
          type: LedgerEntryType.CREDIT,
          amountCents: globalFeeCents,
          brandId: bounty.brandId,
        },
        ...(processingFee > 0n
          ? [
              {
                account: LedgerAccount.processing_expense,
                type: LedgerEntryType.CREDIT,
                amountCents: processingFee,
              },
            ]
          : []),
        ...(bankCharge > 0n
          ? [
              {
                account: LedgerAccount.bank_charges,
                type: LedgerEntryType.CREDIT,
                amountCents: bankCharge,
              },
            ]
          : []),
      ],
      audit: {
        actorId: 'stitch-webhook',
        actorRole: UserRole.SUPER_ADMIN,
        action: 'BOUNTY_FUNDED',
        entityType: 'Bounty',
        entityId: bounty.id,
        afterState: {
          faceValueCents: faceValueCents.toString(),
          brandAdminFeeCents: brandAdminFeeCents.toString(),
          globalFeeCents: globalFeeCents.toString(),
          stitchPaymentId,
        },
      },
    });

    // Flip Bounty to LIVE + paymentStatus PAID + link to SETTLED.
    await this.prisma.$transaction([
      this.prisma.bounty.update({
        where: { id: bounty.id },
        data: {
          status: bounty.status === BountyStatus.DRAFT ? BountyStatus.LIVE : bounty.status,
          paymentStatus: PaymentStatus.PAID,
        },
      }),
      this.prisma.stitchPaymentLink.update({
        where: { id: link.id },
        data: {
          status: StitchPaymentLinkStatus.SETTLED,
          stitchPaymentId,
        },
      }),
    ]);

    // Suppress unused debitTotal/creditSum warning; they're computed for reconciliation logging.
    this.logger.log(
      `payment.settled processed bounty=${bounty.id} stitchPaymentId=${stitchPaymentId} debitCheck=${debitTotal}==${creditSum}`,
    );
  }

  async onPaymentFailed(payload: Record<string, unknown>): Promise<void> {
    const { stitchPaymentId, stitchPaymentLinkId } = this.extractSettlementData(payload);
    const link = await this.findPaymentLink({ stitchPaymentId, stitchPaymentLinkId });
    if (!link) return;

    await this.prisma.stitchPaymentLink.update({
      where: { id: link.id },
      data: { status: StitchPaymentLinkStatus.FAILED, stitchPaymentId: stitchPaymentId ?? null },
    });
    await this.prisma.bounty.update({
      where: { id: link.bountyId },
      data: { paymentStatus: PaymentStatus.UNPAID },
    });
  }

  private async findPaymentLink(opts: {
    stitchPaymentId?: string;
    stitchPaymentLinkId?: string;
  }) {
    if (opts.stitchPaymentLinkId) {
      const byLink = await this.prisma.stitchPaymentLink.findUnique({
        where: { stitchPaymentLinkId: opts.stitchPaymentLinkId },
      });
      if (byLink) return byLink;
    }
    if (opts.stitchPaymentId) {
      const byPay = await this.prisma.stitchPaymentLink.findUnique({
        where: { stitchPaymentId: opts.stitchPaymentId },
      });
      if (byPay) return byPay;
    }
    return null;
  }

  private extractSettlementData(payload: Record<string, unknown>): {
    stitchPaymentId?: string;
    stitchPaymentLinkId?: string;
    processingFeeCents?: bigint;
    bankChargeCents?: bigint;
  } {
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const payment = (data.payment as Record<string, unknown>) ?? data;
    const id = this.readString(payment.id) ?? this.readString(payment.paymentId);
    const linkId = this.readString(payment.paymentLinkId) ?? this.readString(payment.linkId);
    const fees = (payment.fees as Array<Record<string, unknown>>) ?? [];
    let processingFeeCents = 0n;
    let bankChargeCents = 0n;
    for (const fee of fees) {
      const amt = this.readBigInt(fee.amount);
      if (amt == null) continue;
      const type = this.readString(fee.type);
      if (type === 'BANK_CHARGE') bankChargeCents += amt;
      else processingFeeCents += amt;
    }
    return {
      stitchPaymentId: id,
      stitchPaymentLinkId: linkId,
      processingFeeCents: processingFeeCents > 0n ? processingFeeCents : undefined,
      bankChargeCents: bankChargeCents > 0n ? bankChargeCents : undefined,
    };
  }

  private readString(v: unknown): string | undefined {
    return typeof v === 'string' ? v : undefined;
  }

  private readBigInt(v: unknown): bigint | undefined {
    if (typeof v === 'number' && Number.isFinite(v)) return BigInt(Math.round(v));
    if (typeof v === 'string' && /^-?\d+$/.test(v)) return BigInt(v);
    if (typeof v === 'bigint') return v;
    return undefined;
  }
}
