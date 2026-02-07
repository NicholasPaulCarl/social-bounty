import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { BountyStatus, RewardType, Currency } from '@social-bounty/shared';
import type { PayoutMetricsInput } from '@social-bounty/shared';
import {
  mockBA,
  validCreateBountyData,
  baseBountyRecord,
  baseBountyRewardRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Payout Metrics', () => {
  let service: BountiesService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let auditService: ReturnType<typeof createMockAuditService>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    auditService = createMockAuditService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BountiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
  });

  describe('Create with payout metrics', () => {
    it('should create bounty with payout metrics', async () => {
      const data = validCreateBountyData();
      const metrics: PayoutMetricsInput = {
        minViews: 100,
        minLikes: 10,
        minComments: 5,
      };
      const record = baseBountyRecord({
        payoutMetrics: metrics,
      });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, { ...data, payoutMetrics: metrics });

      expect(result).toBeDefined();
      expect(prisma.bounty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payoutMetrics: metrics,
          }),
        }),
      );
    });

    it('should create bounty with partial payout metrics (only minViews)', async () => {
      const data = validCreateBountyData();
      const metrics: PayoutMetricsInput = {
        minViews: 500,
        minLikes: null,
        minComments: null,
      };
      const record = baseBountyRecord({ payoutMetrics: metrics });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, { ...data, payoutMetrics: metrics });

      expect(result).toBeDefined();
    });

    it('should create bounty without payout metrics', async () => {
      const data = validCreateBountyData();
      const record = baseBountyRecord({ payoutMetrics: null });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
      const createCall = prisma.bounty.create.mock.calls[0][0];
      // When payoutMetrics is not provided, it should be undefined (omitted)
      expect(createCall.data.payoutMetrics === null || createCall.data.payoutMetrics === undefined).toBe(true);
    });
  });

  describe('Payout metrics validation', () => {
    it('should reject negative minViews', async () => {
      const data = validCreateBountyData();
      const metrics: PayoutMetricsInput = { minViews: -1, minLikes: null, minComments: null };

      await expect(
        service.create(mockBA, { ...data, payoutMetrics: metrics }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject negative minLikes', async () => {
      const data = validCreateBountyData();
      const metrics: PayoutMetricsInput = { minViews: null, minLikes: -5, minComments: null };

      await expect(
        service.create(mockBA, { ...data, payoutMetrics: metrics }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject negative minComments', async () => {
      const data = validCreateBountyData();
      const metrics: PayoutMetricsInput = { minViews: null, minLikes: null, minComments: -1 };

      await expect(
        service.create(mockBA, { ...data, payoutMetrics: metrics }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept zero values for metrics', async () => {
      const data = validCreateBountyData();
      const metrics: PayoutMetricsInput = { minViews: 0, minLikes: 0, minComments: 0 };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ payoutMetrics: metrics }),
      );

      const result = await service.create(mockBA, { ...data, payoutMetrics: metrics });

      expect(result).toBeDefined();
    });
  });

  describe('Update with payout metrics', () => {
    it('should update bounty payout metrics', async () => {
      const existingBounty = baseBountyRecord({
        id: 'bounty-1',
        status: BountyStatus.DRAFT,
        payoutMetrics: null,
        rewards: [baseBountyRewardRecord()],
      });
      prisma.bounty.findUnique.mockResolvedValue(existingBounty);

      const updatedRecord = {
        ...existingBounty,
        payoutMetrics: { minViews: 200, minLikes: 20, minComments: 10 },
        _count: { submissions: 0 },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'User' },
        organisation: { id: 'org-1', name: 'Test Org', logo: null },
      };
      prisma.bounty.update.mockResolvedValue(updatedRecord);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      const result = await service.update('bounty-1', mockBA, {
        payoutMetrics: { minViews: 200, minLikes: 20, minComments: 10 },
      });

      expect(result).toBeDefined();
    });
  });
});
