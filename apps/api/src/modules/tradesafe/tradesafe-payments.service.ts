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
  TradeSafeTransactionState,
} from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculatorService } from '../finance/fee-calculator.service';
import { LedgerService } from '../ledger/ledger.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { TradeSafeGraphQLClient } from './tradesafe-graphql.client';
import { toZar } from './tradesafe-graphql.operations';
import type { TradeSafeIndustry, TradeSafeWorkflow } from './tradesafe-graphql.operations';

export interface CreateBountyFundingResult {
  transactionId: string;
  hostedUrl: string;
  amountCents: string;
  faceValueCents: string;
  brandAdminFeeCents: string;
  globalFeeCents: string;
}

/**
 * Brand bounty-funding via TradeSafe hosted checkout (ADR 0011 Phase 3).
 *
 * Mirrors the shape of the historical `StitchPaymentsService` so the
 * controller contract + front-end redirect dance is identical — only
 * the provider identifiers change (`transactionId` instead of
 * `paymentLinkId`, TradeSafe hosted URL instead of Stitch's).
 *
 * Financial Non-Negotiables honoured (see `CLAUDE.md §4`):
 *   #2 Idempotency — existing-PENDING resumption guards against double
 *      transactionCreate calls from browser retry / page refresh.
 *      TradeSafe-side idempotency sits on the authoritative callback
 *      re-fetch + ledger `UNIQUE(referenceId, actionType)` pair in
 *      {@link TradeSafeWebhookHandler.handleFundsReceived}.
 *   #4 Integer minor units — ledger stores cents; `toZar` converts at
 *      the adapter boundary only.
 *   #8 Platform custody — TradeSafe AGENT role = platform. Funds flow
 *      brand → TradeSafe escrow → hunter; platform controls every
 *      release. See ADR 0011 §3 Non-Negotiable #8 reinterpretation.
 *   #9 Plan snapshot — `planSnapshotBrand` + `*FeeRateBps` columns
 *      are captured on the Bounty row at funding time. In-flight
 *      transactions are never re-priced on plan change.
 *  #10 Global fee independence — 3.5% `GLOBAL_FEE` is computed and
 *      accounted separately from the brand admin fee.
 */
@Injectable()
export class TradeSafePaymentsService {
  private readonly logger = new Logger(TradeSafePaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly graphql: TradeSafeGraphQLClient,
    private readonly fees: FeeCalculatorService,
    private readonly subscriptions: SubscriptionsService,
    private readonly ledger: LedgerService,
  ) {}

  async createBountyFunding(
    bountyId: string,
    user: AuthenticatedUser,
    payer: { name: string; email?: string },
  ): Promise<CreateBountyFundingResult> {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        rewards: true,
        tradeSafeTransaction: true,
        // Wave 1 — pull the brand's KYB-minted TradeSafe BUYER token so we
        // can prefer it over the env-default. `select` keeps the payload
        // small and avoids changing the existing kyb-status guard which
        // does its own `findUnique`.
        brand: { select: { tradeSafeTokenId: true } },
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

    // Kill-switch pre-flight (Financial Non-Negotiables §4 #7). We must not
    // create a hosted checkout while inbound is paused — the settlement
    // callback would fail to post its ledger group and TradeSafe would retry
    // indefinitely.
    if (await this.ledger.isKillSwitchActive()) {
      throw new ServiceUnavailableException('Funding paused');
    }

    // Existing-PENDING resumption. If the brand opened the funding flow
    // already (e.g. browser refresh between `transactionCreate` and
    // `checkoutLink`), surface the stored `checkoutUrl` instead of
    // creating a second TradeSafe transaction.
    const existingTxn = bounty.tradeSafeTransaction;
    if (
      existingTxn &&
      existingTxn.state === TradeSafeTransactionState.CREATED &&
      existingTxn.checkoutUrl
    ) {
      this.logger.log(
        `returning existing tradesafe transaction ${existingTxn.tradeSafeTransactionId} for bounty ${bountyId}`,
      );
      return {
        transactionId: existingTxn.tradeSafeTransactionId,
        hostedUrl: existingTxn.checkoutUrl,
        amountCents: existingTxn.totalValueCents.toString(),
        faceValueCents: (bounty.faceValueCents ?? 0n).toString(),
        brandAdminFeeCents: '0',
        globalFeeCents: '0',
      };
    }

    // KYB gate — enforced when a live TradeSafe tenant is configured.
    // Mock mode (default when creds absent) bypasses the gate so dev/CI
    // can exercise the funding flow without real KYB data. In production
    // TRADESAFE_MOCK must be "false" before KYB is meaningfully enforced.
    const isLive = this.config.get<string>('TRADESAFE_MOCK', 'true') === 'false';
    if (isLive) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: bounty.brandId },
      });
      if (brand?.kybStatus !== 'APPROVED') {
        throw new ForbiddenException(
          'Brand KYB is not approved — cannot accept live payments',
        );
      }
    }

    // Per ADR 0013 §2 — `maxSubmissions` is required at funding time so the
    // multiplier in `computeFaceValueCents` has a defined operand. The
    // frontend wizard (Wave B) gates the fund button on this field, but we
    // re-assert at the API boundary because the service is also reachable
    // via SUPER_ADMIN tools and direct API callers.
    if (bounty.maxSubmissions == null || bounty.maxSubmissions <= 0) {
      throw new BadRequestException(
        'maxSubmissions is required before funding a bounty',
      );
    }

    // Compute face value in cents from rewards × maxSubmissions (ADR 0013 §1).
    // Pre-ADR-0013 this was sum(rewards) only — under-funded any bounty with
    // `maxSubmissions > 1` because the brand_reserve hit zero on submission #2.
    const faceValueCents = this.computeFaceValueCents(
      bounty.rewards,
      bounty.maxSubmissions,
    );
    if (faceValueCents <= 0n) {
      throw new BadRequestException('Bounty has no positive reward value');
    }

    // Snapshot brand tier at funding time (Non-Negotiable #9).
    const brandTier = await this.subscriptions.getActiveOrgTier(bounty.brandId);

    // Fee breakdown — processing/bank fees set at 0 at funding time; actual
    // TradeSafe fees are booked against the settlement statement (ADR 0011
    // OQ-2 — deferred until first live-sandbox settlement).
    const breakdown = this.fees.forBrandFunding({
      faceValueCents,
      planSnapshotBrand: brandTier,
      processingFeeCents: 0n,
      bankChargeCents: 0n,
    });

    // Resolve platform AGENT token. Required for every TradeSafe transaction
    // per ADR 0011 §1. Not throwing if absent so the service can run against
    // the mock adapter in dev — but when live (TRADESAFE_MOCK=false) operators
    // must have `TRADESAFE_AGENT_TOKEN` configured.
    const agentToken = this.config.get<string>('TRADESAFE_AGENT_TOKEN', '');

    const reference = bountyId; // TradeSafe echoes this back on webhooks.
    const industry = (this.config.get<string>('TRADESAFE_INDUSTRY') ??
      'GENERAL_GOODS_SERVICES') as TradeSafeIndustry;
    const workflow = 'STANDARD' as TradeSafeWorkflow;

    // BUYER + SELLER are the brand and the hunter respectively; per ADR 0011
    // OQ-3, hunter SELLER token is captured just-in-time on first apply.
    // Until Phase 2 token lifecycle lands, we create the transaction with a
    // placeholder SELLER party.
    //
    // BUYER token resolution order (Wave 1, R24 pre-launch):
    //   1. `bounty.brand.tradeSafeTokenId` — minted by `KybService.approve`
    //      after a successful CIPC-evidenced KYB review. This is the only
    //      production-correct token for a live brand, since TradeSafe ties
    //      the party to real registration details.
    //   2. `TRADESAFE_DEFAULT_BUYER_TOKEN` env — fallback for dev / pre-
    //      approval flows where `TRADESAFE_MOCK=true` (the kyb gate above
    //      short-circuits to allow funding without a real token).
    //   3. `agentToken` — final safety net so we never send an empty token
    //      to TradeSafe.
    //
    // `||` not `??` throughout: `config.get('X', '')` returns the empty
    // string when env unset, and `'' ?? agentToken` is `''` (nullish
    // coalescing only fires on null/undefined). `||` correctly falls
    // through on empty string. The same trap applied to the prior
    // version that this Wave 1 change widened, see commit 72d00b7.
    const buyerToken =
      bounty.brand?.tradeSafeTokenId ||
      this.config.get<string>('TRADESAFE_DEFAULT_BUYER_TOKEN', '') ||
      agentToken;
    const sellerToken =
      this.config.get<string>('TRADESAFE_ESCROW_PLACEHOLDER_TOKEN', '') ||
      agentToken;

    const txn = await this.graphql.transactionCreate({
      title: `Bounty ${bounty.title}`.slice(0, 120),
      description: bounty.shortDescription || bounty.title,
      industry,
      workflow,
      feeAllocation: 'BUYER',
      reference,
      allocations: [
        {
          title: `Bounty ${bountyId} reward`,
          description: bounty.shortDescription || bounty.title,
          value: toZar(faceValueCents),
          daysToDeliver: 30,
          daysToInspect: 7,
        },
      ],
      parties: [
        { token: buyerToken, role: 'BUYER' },
        { token: sellerToken, role: 'SELLER' },
        { token: agentToken, role: 'AGENT' },
      ],
    });

    const checkoutUrl = await this.graphql.checkoutLink(txn.id);

    // Persist the TradeSafe transaction row + snapshot fee metadata onto
    // the bounty. Single $transaction — idempotent writers only.
    const [record] = await this.prisma.$transaction([
      this.prisma.tradeSafeTransaction.create({
        data: {
          bountyId,
          tradeSafeTransactionId: txn.id,
          reference,
          state: TradeSafeTransactionState.CREATED,
          totalValueCents: breakdown.brandTotalChargeCents,
          currency: bounty.currency,
          checkoutUrl,
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
      transactionId: record.tradeSafeTransactionId,
      hostedUrl: checkoutUrl,
      amountCents: record.totalValueCents.toString(),
      faceValueCents: breakdown.faceValueCents.toString(),
      brandAdminFeeCents: breakdown.brandAdminFeeCents.toString(),
      globalFeeCents: breakdown.globalFeeCents.toString(),
    };
  }

  /**
   * Resolves a bounty-funding status from any identifier TradeSafe might
   * echo back on the post-checkout redirect: bountyId or
   * tradeSafeTransactionId. Used by the /business/bounties/funded return
   * page to poll until the TradeSafe callback flips the bounty to PAID.
   */
  async resolveFundingStatus(
    opts: { bountyId?: string; tradeSafeTransactionId?: string },
    user: AuthenticatedUser,
  ): Promise<{
    bountyId: string;
    bountyTitle: string;
    status: string;
    paymentStatus: string;
    tradeSafeTransactionState: string | null;
  }> {
    let bountyId = opts.bountyId;
    if (!bountyId && opts.tradeSafeTransactionId) {
      const txn = await this.prisma.tradeSafeTransaction.findUnique({
        where: { tradeSafeTransactionId: opts.tradeSafeTransactionId },
      });
      bountyId = txn?.bountyId;
    }
    if (!bountyId) {
      throw new NotFoundException(
        'Could not resolve bounty from provided identifiers',
      );
    }
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { tradeSafeTransaction: true },
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
      tradeSafeTransactionState: bounty.tradeSafeTransaction?.state ?? null,
    };
  }

  /**
   * Multi-claim escrow formula (ADR 0013 §1):
   *   faceValueCents = sum(rewards[i].monetaryValue) × maxSubmissions
   *
   * Pre-ADR-0013 the formula was `sum(rewards)` alone, which under-funded
   * any bounty with `maxSubmissions > 1`. The brand_reserve would hit zero
   * on submission #2, tripping `checkReserveVsBounty` reconciliation.
   *
   * `maxSubmissions` is a positive integer guarded by the caller; the
   * `BigInt(maxSubmissions)` conversion preserves Financial Non-Negotiable
   * #4 (integer minor units) — bigint multiplication accepts a number
   * operand but using a bigint factor here is explicit, audit-friendly,
   * and keeps the multiplication entirely inside bigint arithmetic.
   */
  private computeFaceValueCents(
    rewards: { monetaryValue: { toString(): string } }[],
    maxSubmissions: number,
  ): bigint {
    let perClaim = 0n;
    for (const r of rewards) {
      const str = r.monetaryValue.toString();
      const [whole, frac = '00'] = str.split('.');
      const padded = (frac + '00').slice(0, 2);
      perClaim += BigInt(whole) * 100n + BigInt(padded);
    }
    return perClaim * BigInt(maxSubmissions);
  }
}
