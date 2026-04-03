import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscriptionTier,
  SubscriptionEntityType,
  SubscriptionStatus,
  SubscriptionFeature,
  UserRole,
} from '@social-bounty/shared';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;

  const mockTx = {} as any;

  beforeEach(async () => {
    prisma = {
      subscription: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      subscriptionPayment: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  // ── getActiveTier ──────────────────────────────────

  describe('getActiveTier', () => {
    it('should return FREE when no subscription exists', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      const tier = await service.getActiveTier('user-1');
      expect(tier).toBe(SubscriptionTier.FREE);
    });

    it('should return PRO for active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      const tier = await service.getActiveTier('user-1');
      expect(tier).toBe(SubscriptionTier.PRO);
    });

    it('should return PRO for PAST_DUE subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        tier: 'PRO',
        status: 'PAST_DUE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      const tier = await service.getActiveTier('user-1');
      expect(tier).toBe(SubscriptionTier.PRO);
    });

    it('should return PRO for cancelled subscription still in period', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        tier: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      const tier = await service.getActiveTier('user-1');
      expect(tier).toBe(SubscriptionTier.PRO);
    });

    it('should return FREE for cancelled subscription past period end', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        tier: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: new Date(Date.now() - 86400000),
      });
      const tier = await service.getActiveTier('user-1');
      expect(tier).toBe(SubscriptionTier.FREE);
    });
  });

  // ── getActiveOrgTier ───────────────────────────────

  describe('getActiveOrgTier', () => {
    it('should return FREE when no org subscription exists', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      const tier = await service.getActiveOrgTier('org-1');
      expect(tier).toBe(SubscriptionTier.FREE);
    });

    it('should return PRO for active org subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      const tier = await service.getActiveOrgTier('org-1');
      expect(tier).toBe(SubscriptionTier.PRO);
    });
  });

  // ── isFeatureEnabled ───────────────────────────────

  describe('isFeatureEnabled', () => {
    it('should return false for CLOSED_BOUNTY_ACCESS on FREE tier', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      const enabled = await service.isFeatureEnabled('user-1', SubscriptionFeature.CLOSED_BOUNTY_APPLICATION);
      expect(enabled).toBe(false);
    });

    it('should return true for CLOSED_BOUNTY_ACCESS on PRO tier', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      const enabled = await service.isFeatureEnabled('user-1', SubscriptionFeature.CLOSED_BOUNTY_APPLICATION);
      expect(enabled).toBe(true);
    });
  });

  // ── getSubscription ────────────────────────────────

  describe('getSubscription', () => {
    it('should return FREE tier details for hunter with no subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      const result = await service.getSubscription('user-1', UserRole.PARTICIPANT);
      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.status).toBe(SubscriptionStatus.FREE);
      expect(result.entityType).toBe(SubscriptionEntityType.HUNTER);
      expect(result.features).toBeDefined();
    });

    it('should return subscription details for active hunter', async () => {
      const now = new Date();
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        tier: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 86400000),
        cancelAtPeriodEnd: false,
      });
      const result = await service.getSubscription('user-1', UserRole.PARTICIPANT);
      expect(result.tier).toBe(SubscriptionTier.PRO);
      expect(result.id).toBe('sub-1');
    });

    it('should query by organisationId for business admin', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      await service.getSubscription('user-1', UserRole.BUSINESS_ADMIN, 'org-1');
      expect(prisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { organisationId: 'org-1', entityType: SubscriptionEntityType.BRAND },
      });
    });
  });

  // ── subscribe ──────────────────────────────────────

  describe('subscribe', () => {
    it('should create a new PRO subscription for hunter', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({
        id: 'sub-new',
        tier: 'PRO',
        status: 'ACTIVE',
      });
      // getSubscription call after create
      prisma.subscription.findFirst
        .mockResolvedValueOnce(null) // first check for existing
        .mockResolvedValueOnce({ id: 'sub-new', tier: 'PRO', status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: new Date(), cancelAtPeriodEnd: false });

      const result = await service.subscribe('user-1', UserRole.PARTICIPANT);
      expect(prisma.subscription.create).toHaveBeenCalled();
      expect(prisma.subscriptionPayment.create).toHaveBeenCalled();
    });

    it('should throw if already has active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'ACTIVE',
        tier: 'PRO',
      });
      await expect(
        service.subscribe('user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reactivate cancelled subscription still in period', async () => {
      const future = new Date(Date.now() + 86400000);
      prisma.subscription.findFirst
        .mockResolvedValueOnce({
          id: 'sub-1',
          status: 'CANCELLED',
          tier: 'PRO',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: future,
        })
        .mockResolvedValueOnce({
          id: 'sub-1',
          status: 'CANCELLED',
          tier: 'PRO',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: future,
        })
        .mockResolvedValueOnce({
          id: 'sub-1',
          status: 'ACTIVE',
          tier: 'PRO',
          currentPeriodStart: new Date(),
          currentPeriodEnd: future,
          cancelAtPeriodEnd: false,
        });

      prisma.subscription.update.mockResolvedValue({});
      await service.subscribe('user-1', UserRole.PARTICIPANT);
      expect(prisma.subscription.update).toHaveBeenCalled();
    });
  });

  // ── cancel ─────────────────────────────────────────

  describe('cancel', () => {
    it('should cancel an active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      });
      prisma.subscription.update.mockResolvedValue({});
      // getSubscription after cancel
      prisma.subscription.findFirst
        .mockResolvedValueOnce({ id: 'sub-1', status: 'ACTIVE', cancelAtPeriodEnd: false })
        .mockResolvedValueOnce({ id: 'sub-1', status: 'CANCELLED', tier: 'PRO', currentPeriodStart: new Date(), currentPeriodEnd: new Date(), cancelAtPeriodEnd: true });

      await service.cancel('user-1', UserRole.PARTICIPANT);
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.CANCELLED,
            cancelAtPeriodEnd: true,
          }),
        }),
      );
    });

    it('should throw if already cancelled', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'CANCELLED',
        cancelAtPeriodEnd: true,
      });
      await expect(
        service.cancel('user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      await expect(
        service.cancel('user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── reactivate ─────────────────────────────────────

  describe('reactivate', () => {
    it('should reactivate a cancelled subscription', async () => {
      const future = new Date(Date.now() + 86400000);
      prisma.subscription.findFirst
        .mockResolvedValueOnce({
          id: 'sub-1',
          status: 'CANCELLED',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: future,
        })
        .mockResolvedValueOnce({
          id: 'sub-1',
          status: 'ACTIVE',
          tier: 'PRO',
          currentPeriodStart: new Date(),
          currentPeriodEnd: future,
          cancelAtPeriodEnd: false,
        });

      prisma.subscription.update.mockResolvedValue({});
      await service.reactivate('user-1', UserRole.PARTICIPANT);
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.ACTIVE,
            cancelAtPeriodEnd: false,
          }),
        }),
      );
    });

    it('should throw if no subscription found', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      await expect(
        service.reactivate('user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if subscription is not cancelled', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      });
      await expect(
        service.reactivate('user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if period already ended', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'CANCELLED',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() - 86400000),
      });
      await expect(
        service.reactivate('user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── expireSubscription ─────────────────────────────

  describe('expireSubscription', () => {
    it('should set tier to FREE and status to EXPIRED', async () => {
      prisma.subscription.update.mockResolvedValue({});
      await service.expireSubscription('sub-1');
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.EXPIRED,
          cancelAtPeriodEnd: false,
        },
      });
    });
  });

  // ── renewSubscription ──────────────────────────────

  describe('renewSubscription', () => {
    it('should extend period and create payment', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        priceAmount: 350,
      });
      prisma.subscription.update.mockResolvedValue({});
      prisma.subscriptionPayment.create.mockResolvedValue({});

      await service.renewSubscription('sub-1');
      expect(prisma.subscription.update).toHaveBeenCalled();
      expect(prisma.subscriptionPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionId: 'sub-1',
            amount: 350,
            status: 'SUCCEEDED',
          }),
        }),
      );
    });

    it('should do nothing if subscription not found', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);
      await service.renewSubscription('sub-missing');
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  // ── getPaymentHistory ──────────────────────────────

  describe('getPaymentHistory', () => {
    it('should return empty result if no subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue(null);
      const result = await service.getPaymentHistory('user-1', UserRole.PARTICIPANT);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should return paginated payments', async () => {
      prisma.subscription.findFirst.mockResolvedValue({ id: 'sub-1' });
      const now = new Date();
      prisma.subscriptionPayment.findMany.mockResolvedValue([
        {
          id: 'pay-1',
          amount: 350,
          currency: 'ZAR',
          status: 'SUCCEEDED',
          billingPeriodStart: now,
          billingPeriodEnd: now,
          attemptNumber: 1,
          paidAt: now,
          failureReason: null,
          createdAt: now,
        },
      ]);
      prisma.subscriptionPayment.count.mockResolvedValue(1);

      const result = await service.getPaymentHistory('user-1', UserRole.PARTICIPANT, undefined, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].amount).toBe(350);
      expect(result.meta.total).toBe(1);
    });
  });
});
