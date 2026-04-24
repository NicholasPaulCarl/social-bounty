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

    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        // Single-rail post ADR 0011: "live mode" = TRADESAFE_MOCK=false.
        if (key === 'TRADESAFE_MOCK') return overrides.tradeSafeMock ?? 'true';
        if (key === 'TRADESAFE_AGENT_TOKEN') return 'agent-token';
        if (key === 'TRADESAFE_DEFAULT_BUYER_TOKEN') return 'buyer-token';
        if (key === 'TRADESAFE_ESCROW_PLACEHOLDER_TOKEN') return 'seller-token';
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
});
