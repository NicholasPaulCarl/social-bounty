import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BountyStatus,
  PaymentStatus,
  StitchPaymentLinkStatus,
} from '@prisma/client';
import { SubscriptionTier, UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculatorService } from '../finance/fee-calculator.service';
import { StitchClient } from '../stitch/stitch.client';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

export interface CreateBountyFundingResult {
  paymentLinkId: string;
  hostedUrl: string;
  amountCents: string; // BigInt serialized
  faceValueCents: string;
  brandAdminFeeCents: string;
  globalFeeCents: string;
}

const LINK_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class StitchPaymentsService {
  private readonly logger = new Logger(StitchPaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stitch: StitchClient,
    private readonly fees: FeeCalculatorService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async createBountyFunding(
    bountyId: string,
    user: AuthenticatedUser,
    payer: { name: string; email?: string },
  ): Promise<CreateBountyFundingResult> {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { rewards: true, stitchPaymentLinks: { where: { status: { in: ['CREATED', 'INITIATED'] } } } },
    });
    if (!bounty || bounty.deletedAt) throw new NotFoundException('Bounty not found');
    if (user.role !== UserRole.SUPER_ADMIN && bounty.brandId !== user.brandId) {
      throw new ForbiddenException('Not authorized');
    }
    if (bounty.status !== BountyStatus.DRAFT) {
      throw new BadRequestException('Payment can only be created for DRAFT bounties');
    }
    if (bounty.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment has already been completed');
    }
    if (bounty.stitchPaymentLinks.length > 0) {
      const existing = bounty.stitchPaymentLinks[0];
      this.logger.log(`returning existing link ${existing.id} for bounty ${bountyId}`);
      return {
        paymentLinkId: existing.id,
        hostedUrl: existing.hostedUrl,
        amountCents: existing.amountCents.toString(),
        faceValueCents: (bounty.faceValueCents ?? 0n).toString(),
        brandAdminFeeCents: '0',
        globalFeeCents: '0',
      };
    }

    // KYB gate — enforced when STITCH is live; sandbox bypass permitted.
    const isLive = this.config.get<string>('PAYMENTS_PROVIDER') === 'stitch_live';
    if (isLive) {
      const brand = await this.prisma.brand.findUnique({ where: { id: bounty.brandId } });
      if (brand?.kybStatus !== 'APPROVED') {
        throw new ForbiddenException('Brand KYB is not approved — cannot accept live payments');
      }
    }

    // Compute face value in cents from rewards.
    const faceValueCents = this.computeFaceValueCents(bounty.rewards);
    if (faceValueCents <= 0n) {
      throw new BadRequestException('Bounty has no positive reward value');
    }

    // Snapshot brand tier at funding time (Non-Negotiable #9).
    const brandTier = await this.subscriptions.getActiveOrgTier(bounty.brandId);

    // Fee breakdown (processing/bank fees set at 0 for Phase 1; actual Stitch fees
    // are booked from the webhook payload on settlement).
    const breakdown = this.fees.forBrandFunding({
      faceValueCents,
      planSnapshotBrand: brandTier,
      processingFeeCents: 0n,
      bankChargeCents: 0n,
    });

    const merchantReference = `bounty:${bountyId}:fund`.slice(0, 50);
    const link = await this.stitch.createPaymentLink({
      amountCents: breakdown.brandTotalChargeCents,
      merchantReference,
      payerName: payer.name,
      payerEmailAddress: payer.email,
      expiresAt: new Date(Date.now() + LINK_EXPIRY_MS),
    });

    const [record] = await this.prisma.$transaction([
      this.prisma.stitchPaymentLink.create({
        data: {
          bountyId,
          stitchPaymentLinkId: link.id,
          hostedUrl: link.url,
          merchantReference,
          amountCents: breakdown.brandTotalChargeCents,
          currency: bounty.currency,
          status: StitchPaymentLinkStatus.INITIATED,
          expiresAt: new Date(Date.now() + LINK_EXPIRY_MS),
          metadata: {
            brandId: bounty.brandId,
            userId: user.sub,
            planSnapshotBrand: brandTier,
            breakdown: {
              faceValueCents: breakdown.faceValueCents.toString(),
              brandAdminFeeCents: breakdown.brandAdminFeeCents.toString(),
              globalFeeCents: breakdown.globalFeeCents.toString(),
              brandTotalChargeCents: breakdown.brandTotalChargeCents.toString(),
              brandAdminFeeRateBps: breakdown.brandAdminFeeRateBps,
              globalFeeRateBps: breakdown.globalFeeRateBps,
            },
          },
        },
      }),
      this.prisma.bounty.update({
        where: { id: bountyId },
        data: {
          planSnapshotBrand: brandTier,
          brandAdminFeeRateBps: breakdown.brandAdminFeeRateBps,
          globalFeeRateBps: breakdown.globalFeeRateBps,
          faceValueCents: breakdown.faceValueCents,
          paymentStatus: PaymentStatus.PENDING,
        },
      }),
    ]);

    return {
      paymentLinkId: record.id,
      hostedUrl: record.hostedUrl,
      amountCents: record.amountCents.toString(),
      faceValueCents: breakdown.faceValueCents.toString(),
      brandAdminFeeCents: breakdown.brandAdminFeeCents.toString(),
      globalFeeCents: breakdown.globalFeeCents.toString(),
    };
  }

  private computeFaceValueCents(
    rewards: { monetaryValue: { toString(): string } }[],
  ): bigint {
    let total = 0n;
    for (const r of rewards) {
      const str = r.monetaryValue.toString();
      const [whole, frac = '00'] = str.split('.');
      const padded = (frac + '00').slice(0, 2);
      total += BigInt(whole) * 100n + BigInt(padded);
    }
    return total;
  }
}
