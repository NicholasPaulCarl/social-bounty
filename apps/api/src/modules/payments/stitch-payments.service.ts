import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
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
import { LedgerService } from '../ledger/ledger.service';
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
    private readonly ledger: LedgerService,
  ) {}

  async createBountyFunding(
    bountyId: string,
    user: AuthenticatedUser,
    payer: { name: string; email?: string },
  ): Promise<CreateBountyFundingResult> {
    const now = new Date();
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        rewards: true,
        // Only resumable links: CREATED or INITIATED, and not expired.
        stitchPaymentLinks: {
          where: {
            status: { in: [StitchPaymentLinkStatus.CREATED, StitchPaymentLinkStatus.INITIATED] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
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

    // Kill-switch pre-flight (Financial Non-Negotiables). If on, abort before we
    // create (or re-surface) any payment link — otherwise the payer would complete
    // checkout and the settlement webhook would fail posting the ledger group,
    // triggering infinite Svix retries.
    if (await this.ledger.isKillSwitchActive()) {
      throw new ServiceUnavailableException('Funding paused');
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

    // Stitch merchantReference rejects special chars (colons, hyphens, etc.) and
    // must be unique per attempt — Stitch will 400 on a second payment with the
    // same reference. Alphanumeric only, capped at 50 chars.
    const bountySlug = bountyId.replace(/[^a-zA-Z0-9]/g, '');
    const stamp = now.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const merchantReference = `bountyfund${bountySlug}t${stamp}`.slice(0, 50);
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

  /**
   * Resolves a bounty-funding status from any identifier Stitch might send back
   * on the redirect: bountyId, stitchPaymentId, or merchantReference. Used by
   * the /business/bounties/funded return page to poll until the webhook
   * commits.
   */
  async resolveFundingStatus(
    opts: { bountyId?: string; stitchPaymentId?: string; merchantReference?: string },
    user: AuthenticatedUser,
  ): Promise<{
    bountyId: string;
    bountyTitle: string;
    status: string;
    paymentStatus: string;
    stitchPaymentLinkStatus: string | null;
  }> {
    let bountyId = opts.bountyId;
    if (!bountyId && opts.stitchPaymentId) {
      const link = await this.prisma.stitchPaymentLink.findUnique({
        where: { stitchPaymentLinkId: opts.stitchPaymentId },
      });
      bountyId = link?.bountyId;
    }
    if (!bountyId && opts.merchantReference) {
      const link = await this.prisma.stitchPaymentLink.findFirst({
        where: { merchantReference: opts.merchantReference },
        orderBy: { createdAt: 'desc' },
      });
      bountyId = link?.bountyId;
    }
    if (!bountyId) {
      throw new NotFoundException('Could not resolve bounty from provided identifiers');
    }
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        stitchPaymentLinks: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!bounty) throw new NotFoundException('Bounty not found');
    if (user.role !== UserRole.SUPER_ADMIN && bounty.brandId !== user.brandId) {
      throw new ForbiddenException('Not authorized');
    }
    return {
      bountyId: bounty.id,
      bountyTitle: bounty.title,
      status: bounty.status,
      paymentStatus: bounty.paymentStatus,
      stitchPaymentLinkStatus: bounty.stitchPaymentLinks[0]?.status ?? null,
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
