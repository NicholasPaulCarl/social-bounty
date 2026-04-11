import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  BountyStatus,
  RewardType,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  DurationUnit,
  Currency,
} from '@social-bounty/shared';
import {
  mockBA,
  mockBA2,
  mockSA,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Update Bounty', () => {
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
        { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE'), getActiveOrgTier: jest.fn().mockResolvedValue('FREE'), isFeatureEnabled: jest.fn().mockResolvedValue(false) } },
      ],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
  });

  const updateIncludes = {
    brand: { id: 'org-1', name: 'Test', logo: null },
    createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
    _count: { submissions: 0 },
  };

  // ── DRAFT Edits (all fields allowed) ─────────────

  describe('DRAFT bounty edits', () => {
    it('should allow updating title on DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          title: 'Updated Title',
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should allow updating channels on DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          channels: { [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST] },
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, {
        channels: { [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST] },
      });

      expect(result).toBeDefined();
    });

    it('should allow updating currency on DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          currency: Currency.USD,
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, { currency: Currency.USD });

      expect(result).toBeDefined();
    });

    it('should allow updating aiContentPermitted on DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          aiContentPermitted: true,
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, { aiContentPermitted: true });

      expect(result).toBeDefined();
    });

    it('should allow updating all fields simultaneously on DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          title: 'New Title',
          shortDescription: 'New desc',
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, {
        title: 'New Title',
        shortDescription: 'New desc',
        fullInstructions: 'New instructions',
        category: 'New Category',
        maxSubmissions: 200,
      });

      expect(result).toBeDefined();
    });
  });

  // ── LIVE Edits (restricted) ──────────────────────

  describe('LIVE bounty edits', () => {
    it('VE-31: should reject updating title on LIVE bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, { title: 'New Title' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating shortDescription on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, { shortDescription: 'New desc' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating fullInstructions on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, { fullInstructions: 'New instructions' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating channels on LIVE (prevents bait-and-switch)', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, {
          channels: { [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST] },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating rewards on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, {
          rewards: [{ rewardType: RewardType.CASH, name: 'New', monetaryValue: 100 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating currency on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, { currency: Currency.USD }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating postVisibility on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, {
          postVisibility: { rule: PostVisibilityRule.MUST_NOT_REMOVE },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating engagementRequirements on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );

      await expect(
        service.update('bounty-1', mockBA, {
          engagementRequirements: { tagAccount: '@new', mention: true, comment: true },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('IS-10: should allow updating maxSubmissions on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.LIVE,
          maxSubmissions: 200,
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, { maxSubmissions: 200 });

      expect(result).toBeDefined();
    });

    it('should allow updating endDate on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.LIVE,
          endDate: new Date('2026-05-01'),
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, {
        endDate: '2026-05-01T00:00:00.000Z',
      });

      expect(result).toBeDefined();
    });

    it('should allow updating proofRequirements on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.LIVE,
          proofRequirements: 'Updated proof reqs',
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, {
        proofRequirements: 'Updated proof reqs',
      });

      expect(result).toBeDefined();
    });

    it('should allow updating eligibilityRules on LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.LIVE }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.LIVE,
          eligibilityRules: 'Updated rules',
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, {
        eligibilityRules: 'Updated rules',
      });

      expect(result).toBeDefined();
    });
  });

  // ── PAUSED Edits (all fields allowed) ────────────

  describe('PAUSED bounty edits', () => {
    it('should allow updating all fields on PAUSED bounty (same as DRAFT)', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.PAUSED }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.PAUSED,
          title: 'Updated While Paused',
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockBA, { title: 'Updated While Paused' });

      expect(result).toBeDefined();
    });
  });

  // ── CLOSED Edits (no edits allowed) ──────────────

  describe('CLOSED bounty edits', () => {
    it('VE-32: should reject any edit on CLOSED bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.CLOSED }),
      );

      await expect(
        service.update('bounty-1', mockBA, { maxSubmissions: 200 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating title on CLOSED bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.CLOSED }),
      );

      await expect(
        service.update('bounty-1', mockBA, { title: 'New Title' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Authorization ────────────────────────────────

  describe('Authorization', () => {
    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockBA, { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if BA not in bounty org', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ brandId: 'org-1' }),
      );

      await expect(
        service.update('bounty-1', mockBA2, { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SA to update any org bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          brandId: 'other-org',
          status: BountyStatus.DRAFT,
        }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          title: 'SA Updated',
          ...updateIncludes,
        }),
      );

      const result = await service.update('bounty-1', mockSA, { title: 'SA Updated' });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for soft-deleted bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ deletedAt: new Date() }),
      );

      await expect(
        service.update('bounty-1', mockBA, { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Audit Logging ────────────────────────────────

  describe('Audit logging', () => {
    it('should create audit log on update', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ status: BountyStatus.DRAFT }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          title: 'Updated',
          ...updateIncludes,
        }),
      );

      await service.update('bounty-1', mockBA, { title: 'Updated' });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bounty.update',
          actorId: mockBA.sub,
          entityType: 'Bounty',
          entityId: 'bounty-1',
        }),
      );
    });
  });

  // ── Visibility Acknowledgment Reset ──────────────

  describe('Visibility acknowledgment reset on postVisibility change', () => {
    it('IS-08: should reset visibilityAcknowledged when postVisibility updated on DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
        }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          visibilityAcknowledged: false,
          postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
          ...updateIncludes,
        }),
      );

      await service.update('bounty-1', mockBA, {
        postVisibility: { rule: PostVisibilityRule.MUST_NOT_REMOVE },
      });

      // The update should include visibilityAcknowledged: false
      const updateCall = prisma.bounty.update.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('visibilityAcknowledged', false);
    });
  });
});
