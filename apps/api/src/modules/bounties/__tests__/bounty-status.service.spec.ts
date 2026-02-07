import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  BountyStatus,
  PostVisibilityRule,
  DurationUnit,
  SocialChannel,
  PostFormat,
  RewardType,
  Currency,
} from '@social-bounty/shared';
import {
  mockBA,
  mockBA2,
  mockSA,
  mockParticipant,
  baseBountyRecord,
  baseBountyRewardRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Status Transitions & DRAFT->LIVE Gate', () => {
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

  // ── Valid Transitions ────────────────────────────

  describe('Valid status transitions', () => {
    it('should allow DRAFT -> LIVE when all preconditions met', async () => {
      const bounty = baseBountyRecord({
        status: BountyStatus.DRAFT,
        visibilityAcknowledged: true,
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
        postMinDurationValue: 7,
        postMinDurationUnit: DurationUnit.DAYS,
        structuredEligibility: { minFollowers: 100 },
        engagementRequirements: { mention: true },
        currency: Currency.ZAR,
        paymentStatus: 'PAID',
      });
      prisma.bounty.findUnique.mockResolvedValue(bounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);
      prisma.bounty.update.mockResolvedValue({
        ...bounty,
        status: BountyStatus.LIVE,
      });

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE);

      expect(result.status).toBe(BountyStatus.LIVE);
    });

    it('should allow LIVE -> PAUSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.PAUSED }),
      );

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.PAUSED);

      expect(result.status).toBe(BountyStatus.PAUSED);
    });

    it('should allow PAUSED -> LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.PAUSED,
          visibilityAcknowledged: true,
        }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE);

      expect(result.status).toBe(BountyStatus.LIVE);
    });

    it('should allow LIVE -> CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.CLOSED }),
      );

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.CLOSED);

      expect(result.status).toBe(BountyStatus.CLOSED);
    });

    it('should allow PAUSED -> CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.PAUSED }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.CLOSED }),
      );

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.CLOSED);

      expect(result.status).toBe(BountyStatus.CLOSED);
    });
  });

  // ── Invalid Transitions ──────────────────────────

  describe('Invalid status transitions', () => {
    it('should reject CLOSED -> LIVE (terminal state)', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.CLOSED }),
      );

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject CLOSED -> DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.CLOSED }),
      );

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.DRAFT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> PAUSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.PAUSED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.CLOSED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if BA not in bounty org', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ organisationId: 'other-org' }),
      );

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── DRAFT -> LIVE Preconditions ──────────────────

  describe('DRAFT -> LIVE preconditions', () => {
    it('VE-21: should reject DRAFT -> LIVE without visibilityAcknowledged', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: false,
          channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
          postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
        }),
      );
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('VE-22: should reject DRAFT -> LIVE with no rewards', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
        }),
      );
      prisma.bountyReward.findMany.mockResolvedValue([]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('VE-23: should reject DRAFT -> LIVE with channels=null', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
          channels: null,
        }),
      );
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> LIVE with empty title', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
          title: '',
        }),
      );
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> LIVE with postVisibilityRule=null', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
          postVisibilityRule: null,
        }),
      );
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> LIVE with structuredEligibility=null', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
          structuredEligibility: null,
        }),
      );
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> LIVE with engagementRequirements=null', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
          engagementRequirements: null,
        }),
      );
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Audit Logging ────────────────────────────────

  describe('Audit logging', () => {
    it('should create audit log on status change', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.LIVE,
        }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.PAUSED }),
      );

      await service.updateStatus('bounty-1', mockBA, BountyStatus.PAUSED);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bounty.status_change',
          beforeState: { status: BountyStatus.LIVE },
          afterState: { status: BountyStatus.PAUSED },
        }),
      );
    });
  });

  // ── RBAC ─────────────────────────────────────────

  describe('RBAC for status changes', () => {
    it('should allow SA to change status of any bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.LIVE,
          organisationId: 'other-org',
        }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.PAUSED }),
      );

      const result = await service.updateStatus('bounty-1', mockSA, BountyStatus.PAUSED);

      expect(result.status).toBe(BountyStatus.PAUSED);
    });

    it('AP-18: should reject BA from different org', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ organisationId: 'org-1' }),
      );

      await expect(
        service.updateStatus('bounty-1', mockBA2, BountyStatus.LIVE),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
