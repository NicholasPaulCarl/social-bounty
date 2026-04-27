import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BountyStatus,
  PaymentStatus,
  TradeSafeTransactionState,
} from '@prisma/client';
import { SubscriptionTier, UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculatorService } from '../finance/fee-calculator.service';
import { LedgerService } from '../ledger/ledger.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TradeSafeGraphQLClient } from './tradesafe-graphql.client';
import { TradeSafePaymentsService } from './tradesafe-payments.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('TradeSafePaymentsService (ADR 0011 Phase 3 — inbound cutover)', () => {
  const fakeUser: AuthenticatedUser = {
    sub: 'user-1',
    email: 'brand@example.com',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'brand-1',
  } as unknown as AuthenticatedUser;

  function buildService(overrides: Partial<{
    bounty: Record<string, unknown> | null;
    brand: Record<string, unknown> | null;
    isKillSwitchActive: boolean;
    tradeSafeTransactionResult: Record<string, unknown>;
    checkoutLinkResult: string;
    tradeSafeMock: string;
    // 2026-04-27 cooldown: allow individual party-token envs to be
    // simulated as unset (empty string) so we can exercise the
    // agent-token fallback path. `null` means "treat as unset" (returns
    // '' from config.get); a string returns that string; undefined uses
    // the default 'buyer-token' / 'seller-token' / 'agent-token'.
    defaultBuyerToken: string | null;
    escrowPlaceholderToken: string | null;
    agentToken: string | null;
  }> = {}) {
    const bounty = overrides.bounty === undefined
      ? {
          id: 'bounty-1',
          brandId: 'brand-1',
          title: 'Test',
          shortDescription: 'Desc',
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.UNPAID,
          faceValueCents: null,
          currency: 'ZAR',
          deletedAt: null,
          rewards: [{ monetaryValue: { toString: () => '100.00' } }],
          tradeSafeTransaction: null,
        }
      : overrides.bounty;

    const prisma = {
      bounty: {
        findUnique: jest.fn().mockResolvedValue(bounty),
        update: jest.fn().mockResolvedValue({}),
      },
      brand: {
        findUnique: jest.fn().mockResolvedValue(
          overrides.brand === undefined
            ? { kybStatus: 'APPROVED' }
            : overrides.brand,
        ),
      },
      tradeSafeTransaction: {
        create: jest.fn().mockImplementation((args: any) =>
          Promise.resolve({
            tradeSafeTransactionId: args.data.tradeSafeTransactionId,
            totalValueCents: args.data.totalValueCents,
          }),
        ),
      },
      $transaction: jest
        .fn()
        .mockImplementation((ops: Promise<any>[]) =>
          Array.isArray(ops)
            ? Promise.all(ops)
            : typeof ops === 'function'
              ? (ops as any)({})
              : ops,
        ),
    } as unknown as PrismaService;

    // Helper that simulates `ConfigService.get('X', '')` behaviour: when
    // an env override is `null` we return the supplied fallback (typically
    // ''); when it's a string we return that; when it's undefined we use
    // the per-test default below.
    const resolveEnv = (
      override: string | null | undefined,
      fallback: unknown,
      defaultValue: string,
    ): unknown => {
      if (override === null) return fallback;
      if (override === undefined) return defaultValue;
      return override;
    };
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        // Single-rail post ADR 0011: "live mode" = TRADESAFE_MOCK=false.
        if (key === 'TRADESAFE_MOCK') return overrides.tradeSafeMock ?? 'true';
        if (key === 'TRADESAFE_AGENT_TOKEN')
          return resolveEnv(overrides.agentToken, fallback, 'agent-token');
        if (key === 'TRADESAFE_DEFAULT_BUYER_TOKEN')
          return resolveEnv(overrides.defaultBuyerToken, fallback, 'buyer-token');
        if (key === 'TRADESAFE_ESCROW_PLACEHOLDER_TOKEN')
          return resolveEnv(overrides.escrowPlaceholderToken, fallback, 'seller-token');
        if (key === 'TRADESAFE_INDUSTRY') return 'GENERAL_GOODS_SERVICES';
        return fallback;
      }),
    } as unknown as ConfigService;

    const graphql = {
      transactionCreate: jest
        .fn()
        .mockResolvedValue(
          overrides.tradeSafeTransactionResult ?? {
            id: 'tradesafe-txn-1',
            allocations: [{ id: 'alloc-1' }],
          },
        ),
      checkoutLink: jest
        .fn()
        .mockResolvedValue(overrides.checkoutLinkResult ?? 'https://checkout.tradesafe.test/abc'),
    } as unknown as TradeSafeGraphQLClient;

    const fees = new FeeCalculatorService();

    const subscriptions = {
      getActiveOrgTier: jest.fn().mockResolvedValue(SubscriptionTier.FREE),
    } as unknown as SubscriptionsService;

    const ledger = {
      isKillSwitchActive: jest
        .fn()
        .mockResolvedValue(overrides.isKillSwitchActive ?? false),
    } as unknown as LedgerService;

    const svc = new TradeSafePaymentsService(
      prisma,
      config,
      graphql,
      fees,
      subscriptions,
      ledger,
    );
    return { svc, prisma, graphql, ledger, subscriptions };
  }

  it('happy path — creates TradeSafe transaction + hostedUrl', async () => {
    const { svc, graphql } = buildService();
    const result = await svc.createBountyFunding('bounty-1', fakeUser, {
      name: 'Brand Co',
    });
    expect(graphql.transactionCreate).toHaveBeenCalledTimes(1);
    expect(graphql.checkoutLink).toHaveBeenCalledWith('tradesafe-txn-1');
    expect(result.transactionId).toBe('tradesafe-txn-1');
    expect(result.hostedUrl).toBe('https://checkout.tradesafe.test/abc');
    expect(result.faceValueCents).toBe('10000');
  });

  it('rejects when brand KYB is not approved on live rail', async () => {
    const { svc } = buildService({
      tradeSafeMock: 'false',
      brand: { kybStatus: 'PENDING' },
    });
    await expect(
      svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('aborts when kill-switch is active', async () => {
    const { svc, graphql } = buildService({ isKillSwitchActive: true });
    await expect(
      svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(graphql.transactionCreate).not.toHaveBeenCalled();
  });

  it('resumes existing PENDING transaction — no second transactionCreate', async () => {
    const { svc, graphql } = buildService({
      bounty: {
        id: 'bounty-1',
        brandId: 'brand-1',
        title: 'Test',
        shortDescription: 'Desc',
        status: BountyStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
        faceValueCents: 10000n,
        currency: 'ZAR',
        deletedAt: null,
        rewards: [{ monetaryValue: { toString: () => '100.00' } }],
        tradeSafeTransaction: {
          tradeSafeTransactionId: 'existing-txn-1',
          state: TradeSafeTransactionState.CREATED,
          checkoutUrl: 'https://checkout.tradesafe.test/existing',
          totalValueCents: 12075n,
        },
      },
    });
    const result = await svc.createBountyFunding('bounty-1', fakeUser, {
      name: 'Brand',
    });
    expect(graphql.transactionCreate).not.toHaveBeenCalled();
    expect(graphql.checkoutLink).not.toHaveBeenCalled();
    expect(result.transactionId).toBe('existing-txn-1');
    expect(result.hostedUrl).toBe('https://checkout.tradesafe.test/existing');
  });

  it('idempotency — concurrent double-call returns same result via existing-PENDING path', async () => {
    // Simulate: first call creates, second sees the row and returns it.
    const firstBounty: any = {
      id: 'bounty-1',
      brandId: 'brand-1',
      title: 'Test',
      shortDescription: 'Desc',
      status: BountyStatus.DRAFT,
      paymentStatus: PaymentStatus.UNPAID,
      faceValueCents: null,
      currency: 'ZAR',
      deletedAt: null,
      rewards: [{ monetaryValue: { toString: () => '100.00' } }],
      tradeSafeTransaction: null,
    };
    const { svc, graphql, prisma } = buildService({ bounty: firstBounty });

    const first = await svc.createBountyFunding('bounty-1', fakeUser, {
      name: 'Brand',
    });
    expect(graphql.transactionCreate).toHaveBeenCalledTimes(1);

    // Second call: bounty now has tradeSafeTransaction (resumption).
    (prisma.bounty.findUnique as jest.Mock).mockResolvedValueOnce({
      ...firstBounty,
      paymentStatus: PaymentStatus.PENDING,
      faceValueCents: 10000n,
      tradeSafeTransaction: {
        tradeSafeTransactionId: first.transactionId,
        state: TradeSafeTransactionState.CREATED,
        checkoutUrl: first.hostedUrl,
        totalValueCents: BigInt(first.amountCents),
      },
    });

    const second = await svc.createBountyFunding('bounty-1', fakeUser, {
      name: 'Brand',
    });
    expect(graphql.transactionCreate).toHaveBeenCalledTimes(1); // unchanged
    expect(second.transactionId).toBe(first.transactionId);
    expect(second.hostedUrl).toBe(first.hostedUrl);
  });

  it('rejects when bounty not found', async () => {
    const { svc } = buildService({ bounty: null });
    await expect(
      svc.createBountyFunding('nope', fakeUser, { name: 'Brand' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects non-DRAFT bounty', async () => {
    const { svc } = buildService({
      bounty: {
        id: 'bounty-1',
        brandId: 'brand-1',
        title: 'Test',
        shortDescription: 'Desc',
        status: BountyStatus.LIVE,
        paymentStatus: PaymentStatus.UNPAID,
        faceValueCents: null,
        currency: 'ZAR',
        deletedAt: null,
        rewards: [{ monetaryValue: { toString: () => '100.00' } }],
        tradeSafeTransaction: null,
      },
    });
    await expect(
      svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // ─── 2026-04-27 gap coverage — edges the previous 7-test set didn't pin ───
  //
  // Each of these maps to one specific guard in createBountyFunding(). Without
  // the test, a refactor could silently relax the gate and we'd only catch it
  // in production. The "guards" here directly enforce Financial Non-Negotiables
  // §4 (#2 idempotency, #4 integer cents, #8 platform custody).

  describe('createBountyFunding — additional guards', () => {
    it('rejects soft-deleted bounty (deletedAt set) — 404 not 500', async () => {
      const { svc } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          title: 'Test',
          shortDescription: 'Desc',
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.UNPAID,
          faceValueCents: null,
          currency: 'ZAR',
          // Critical: a soft-deleted bounty is recoverable from the DB but
          // must not accept new payments. The guard at line 84 of the
          // service checks `bounty.deletedAt`. Without this test, a future
          // include/select refactor could drop the field and we'd silently
          // start funding deleted bounties.
          deletedAt: new Date('2026-04-20T00:00:00Z'),
          rewards: [{ monetaryValue: { toString: () => '100.00' } }],
          tradeSafeTransaction: null,
        },
      });
      await expect(
        svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when caller is BUSINESS_ADMIN of a different brand (RBAC)', async () => {
      // Service caller is brand-1 (per fakeUser); bounty belongs to brand-2.
      // Non-SUPER_ADMIN must not fund another brand's bounty.
      const { svc } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-2', // ← mismatched
          title: 'Other Brand Bounty',
          shortDescription: 'Desc',
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.UNPAID,
          faceValueCents: null,
          currency: 'ZAR',
          deletedAt: null,
          rewards: [{ monetaryValue: { toString: () => '100.00' } }],
          tradeSafeTransaction: null,
        },
      });
      await expect(
        svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('SUPER_ADMIN can fund a bounty for any brand (RBAC bypass)', async () => {
      const superAdmin = {
        sub: 'admin-1',
        email: 'admin@example.com',
        role: UserRole.SUPER_ADMIN,
        brandId: null,
      } as unknown as AuthenticatedUser;

      const { svc, graphql } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-2', // not the admin's brand — but admin is super
          title: 'Brand 2 bounty',
          shortDescription: 'Desc',
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.UNPAID,
          faceValueCents: null,
          currency: 'ZAR',
          deletedAt: null,
          rewards: [{ monetaryValue: { toString: () => '100.00' } }],
          tradeSafeTransaction: null,
        },
      });

      const result = await svc.createBountyFunding('bounty-1', superAdmin, {
        name: 'Brand 2',
      });
      expect(graphql.transactionCreate).toHaveBeenCalledTimes(1);
      expect(result.transactionId).toBe('tradesafe-txn-1');
    });

    it('rejects already-PAID bounty (no double-fund)', async () => {
      const { svc } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          title: 'Test',
          shortDescription: 'Desc',
          // status is still DRAFT but paymentStatus already PAID — guards
          // against a corrupted state where the bounty is somehow both
          // DRAFT (status guard would pass) and PAID. The PaymentStatus
          // check at line 91 catches it.
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.PAID,
          faceValueCents: 10000n,
          currency: 'ZAR',
          deletedAt: null,
          rewards: [{ monetaryValue: { toString: () => '100.00' } }],
          tradeSafeTransaction: null,
        },
      });
      await expect(
        svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects bounty with zero face value (no positive reward)', async () => {
      const { svc } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          title: 'Free bounty',
          shortDescription: 'Desc',
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.UNPAID,
          faceValueCents: null,
          currency: 'ZAR',
          deletedAt: null,
          // Zero-value reward — service rejects before reaching TradeSafe.
          // Without this, we'd transactionCreate with value=0, which
          // TradeSafe would reject anyway, but at the cost of one
          // unnecessary OAuth + GraphQL round-trip and a transaction row
          // in an aborted state.
          rewards: [{ monetaryValue: { toString: () => '0.00' } }],
          tradeSafeTransaction: null,
        },
      });
      await expect(
        svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sums multi-reward face value correctly (Financial Non-Negotiable #4: integer cents)', async () => {
      // Three rewards: 100.00 + 50.50 + 0.01 = 150.51 ZAR = 15051 cents.
      // Locks in computeFaceValueCents — a refactor that uses Number()
      // instead of bigint would drift on the 0.01 case.
      const { svc, graphql } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          title: 'Multi-reward',
          shortDescription: 'Desc',
          status: BountyStatus.DRAFT,
          paymentStatus: PaymentStatus.UNPAID,
          faceValueCents: null,
          currency: 'ZAR',
          deletedAt: null,
          rewards: [
            { monetaryValue: { toString: () => '100.00' } },
            { monetaryValue: { toString: () => '50.50' } },
            { monetaryValue: { toString: () => '0.01' } },
          ],
          tradeSafeTransaction: null,
        },
      });

      const result = await svc.createBountyFunding('bounty-1', fakeUser, {
        name: 'Brand',
      });

      // 150.51 ZAR → 15051 cents face value (independent of fees).
      expect(result.faceValueCents).toBe('15051');
      // The single allocation passed to transactionCreate carries 150.51 ZAR
      // (toZar conversion at the boundary).
      const createCall = (graphql.transactionCreate as jest.Mock).mock
        .calls[0][0];
      expect(createCall.allocations).toHaveLength(1);
      expect(createCall.allocations[0].value).toBeCloseTo(150.51, 2);
    });

    it('passes the bounty id as the TradeSafe `reference` (correlation key on webhooks)', async () => {
      // Critical correlation identifier — TradeSafe echoes `reference` back
      // on every transaction-state callback. If this drifts, webhook handlers
      // cannot find the bounty by reference, only by transactionId. Real
      // failure mode if the schema ever changes (e.g. someone adds a prefix).
      const { svc, graphql } = buildService();
      await svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' });

      const createCall = (graphql.transactionCreate as jest.Mock).mock
        .calls[0][0];
      expect(createCall.reference).toBe('bounty-1');
    });

    it('passes BUYER + SELLER + AGENT parties (Financial Non-Negotiable #8: platform custody)', async () => {
      const { svc, graphql } = buildService();
      await svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' });

      const createCall = (graphql.transactionCreate as jest.Mock).mock
        .calls[0][0];
      const roles = (createCall.parties as Array<{ role: string }>).map(
        (p) => p.role,
      );
      // All three parties present. The platform's AGENT party is what makes
      // "platform custody" real on TradeSafe — without it, funds would route
      // brand → hunter directly, violating §4 #8.
      expect(roles).toEqual(expect.arrayContaining(['BUYER', 'SELLER', 'AGENT']));
    });

    it('sets feeAllocation=BUYER (brand pays TradeSafe-side fees, not hunter)', async () => {
      const { svc, graphql } = buildService();
      await svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' });

      const createCall = (graphql.transactionCreate as jest.Mock).mock
        .calls[0][0];
      // Locks in the commercial decision (ADR 0011 §8). If this flips to
      // SELLER, hunters would lose money to TradeSafe fees on every
      // bounty — a silent revenue redirect we must NOT do.
      expect(createCall.feeAllocation).toBe('BUYER');
    });

    it('falls back to TRADESAFE_AGENT_TOKEN when TRADESAFE_DEFAULT_BUYER_TOKEN is unset (regression: `||` not `??`)', async () => {
      // The previous code used `?? agentToken`, but `config.get('X', '')`
      // returns '' (not undefined) so `?? ` never fired. An unset env
      // would silently send an empty BUYER token to TradeSafe, producing
      // a 400 in live mode. After the cooldown fix, the fallback works.
      const { svc, graphql } = buildService({ defaultBuyerToken: null });
      await svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' });

      const createCall = (graphql.transactionCreate as jest.Mock).mock
        .calls[0][0];
      const buyer = (createCall.parties as Array<{ token: string; role: string }>)
        .find((p) => p.role === 'BUYER');
      expect(buyer?.token).toBe('agent-token');
    });

    it('falls back to TRADESAFE_AGENT_TOKEN when TRADESAFE_ESCROW_PLACEHOLDER_TOKEN is unset', async () => {
      const { svc, graphql } = buildService({ escrowPlaceholderToken: null });
      await svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' });

      const createCall = (graphql.transactionCreate as jest.Mock).mock
        .calls[0][0];
      const seller = (createCall.parties as Array<{ token: string; role: string }>)
        .find((p) => p.role === 'SELLER');
      expect(seller?.token).toBe('agent-token');
    });

    it('uses the configured TRADESAFE_INDUSTRY env, falling back to GENERAL_GOODS_SERVICES', async () => {
      const { svc, graphql } = buildService();
      await svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' });

      const createCall = (graphql.transactionCreate as jest.Mock).mock
        .calls[0][0];
      expect(createCall.industry).toBe('GENERAL_GOODS_SERVICES');
    });

    it('persists totalValueCents = face + admin + global fees on the TradeSafeTransaction row', async () => {
      const { svc, prisma } = buildService();
      await svc.createBountyFunding('bounty-1', fakeUser, { name: 'Brand' });

      const txnCreateCall = (
        prisma.tradeSafeTransaction.create as jest.Mock
      ).mock.calls[0][0];
      // Brand pays face value + admin fee + global fee. The row stores the
      // total brand charge, which the funds-received handler later cross-
      // checks against the rebuilt-from-snapshot ledger total.
      expect(txnCreateCall.data.totalValueCents).toBeGreaterThan(10000n);
      expect(txnCreateCall.data.bountyId).toBe('bounty-1');
      expect(txnCreateCall.data.tradeSafeTransactionId).toBe('tradesafe-txn-1');
      expect(txnCreateCall.data.checkoutUrl).toBe(
        'https://checkout.tradesafe.test/abc',
      );
    });
  });

  describe('resolveFundingStatus', () => {
    it('resolves by bountyId path', async () => {
      const { svc } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-1',
          title: 'Test',
          shortDescription: 'Desc',
          status: BountyStatus.LIVE,
          paymentStatus: PaymentStatus.PAID,
          faceValueCents: 10000n,
          currency: 'ZAR',
          deletedAt: null,
          rewards: [{ monetaryValue: { toString: () => '100.00' } }],
          tradeSafeTransaction: {
            tradeSafeTransactionId: 'tradesafe-txn-1',
            state: TradeSafeTransactionState.FUNDS_RECEIVED,
            checkoutUrl: 'https://checkout.tradesafe.test/abc',
            totalValueCents: 12075n,
          },
        },
      });

      const result = await svc.resolveFundingStatus(
        { bountyId: 'bounty-1' },
        fakeUser,
      );

      expect(result.bountyId).toBe('bounty-1');
      expect(result.status).toBe(BountyStatus.LIVE);
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(result.tradeSafeTransactionState).toBe('FUNDS_RECEIVED');
    });

    it('rejects when neither bountyId nor tradeSafeTransactionId provided', async () => {
      const { svc } = buildService();
      await expect(
        svc.resolveFundingStatus({}, fakeUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('enforces RBAC — non-SUPER_ADMIN of another brand gets ForbiddenException', async () => {
      // The post-checkout return page calls this endpoint. RBAC must
      // prevent leaking another brand's payment state. Without this guard,
      // anyone with a bounty UUID could probe payment status across brands.
      const { svc } = buildService({
        bounty: {
          id: 'bounty-1',
          brandId: 'brand-2',
          title: 'Test',
          shortDescription: 'Desc',
          status: BountyStatus.LIVE,
          paymentStatus: PaymentStatus.PAID,
          faceValueCents: 10000n,
          currency: 'ZAR',
          deletedAt: null,
          rewards: [{ monetaryValue: { toString: () => '100.00' } }],
          tradeSafeTransaction: null,
        },
      });

      await expect(
        svc.resolveFundingStatus({ bountyId: 'bounty-1' }, fakeUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
