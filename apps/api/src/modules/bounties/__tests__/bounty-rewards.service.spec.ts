import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  RewardType,
  BountyStatus,
} from '@social-bounty/shared';
import {
  mockBA,
  validCreateBountyData,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Reward Validation', () => {
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

  // ── Valid Rewards ────────────────────────────────

  describe('Valid rewards', () => {
    it('should accept single CASH reward', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash reward', monetaryValue: 50 },
      ];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept exactly 10 reward lines (maximum)', async () => {
      const data = validCreateBountyData();
      data.rewards = Array.from({ length: 10 }, (_, i) => ({
        rewardType: RewardType.CASH,
        name: `Reward ${i + 1}`,
        monetaryValue: 10,
      }));
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept mixed reward types', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 50 },
        { rewardType: RewardType.PRODUCT, name: 'T-Shirt', monetaryValue: 25 },
        { rewardType: RewardType.SERVICE, name: 'Consultation', monetaryValue: 100 },
        { rewardType: RewardType.OTHER, name: 'Gift card', monetaryValue: 20 },
      ];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept reward name at exactly 200 chars', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'a'.repeat(200), monetaryValue: 50 },
      ];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept monetaryValue with 2 decimal places', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 49.99 },
      ];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept whole number monetaryValue', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 100 },
      ];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });
  });

  // ── Invalid Rewards ──────────────────────────────

  describe('Invalid rewards', () => {
    it('VE-01: should allow empty rewards array (draft saving)', async () => {
      const data = validCreateBountyData();
      data.rewards = [];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);
      expect(result).toBeDefined();
    });

    it('VE-02: should reject reward with monetaryValue = 0', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 0 },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-03: should reject reward with negative monetaryValue', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: -10 },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-04: should reject 11 reward lines (exceeds max 10)', async () => {
      const data = validCreateBountyData();
      data.rewards = Array.from({ length: 11 }, (_, i) => ({
        rewardType: RewardType.CASH,
        name: `Reward ${i + 1}`,
        monetaryValue: 10,
      }));

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-05: should reject reward name > 200 chars', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'a'.repeat(201), monetaryValue: 50 },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-27: should reject monetaryValue with 3 decimal places', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 10.123 },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-07: should handle large but valid reward value within Decimal(12,2)', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 9999999999.99 },
      ];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      // Value within Decimal(12,2) range should be accepted
      const result = await service.create(mockBA, data);
      expect(result).toBeDefined();
    });

    it('AP-20: should reject NaN as monetaryValue', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: NaN },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-11: should reject invalid reward type enum', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: 'FREE' as RewardType, name: 'Free stuff', monetaryValue: 50 },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject reward with empty name', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: '', monetaryValue: 50 },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── Reward Replacement on Update ─────────────────

  describe('Reward replacement on update', () => {
    it('IS-03: should replace all rewards when updating DRAFT bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          organisation: { id: 'org-1', name: 'Test', logo: null },
          createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
          _count: { submissions: 0 },
        }),
      );

      const result = await service.update('bounty-1', mockBA, {
        rewards: [
          { rewardType: RewardType.PRODUCT, name: 'New product', monetaryValue: 75 },
        ],
      });

      expect(result).toBeDefined();
      // Verify transaction was used to atomically replace rewards
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
