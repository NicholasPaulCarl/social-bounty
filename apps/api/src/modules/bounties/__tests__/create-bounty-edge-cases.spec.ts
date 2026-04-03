import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
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
  PaymentStatus,
} from '@social-bounty/shared';
import {
  mockBA,
  mockParticipant,
  validCreateBountyData,
  baseBountyRecord,
  baseBountyRewardRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Create Bounty Edge Cases', () => {
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

  // ── 1. Create with minimal data (title only) succeeds as DRAFT ────

  describe('Create with minimal data (title only)', () => {
    it('should succeed as DRAFT with only a title provided', async () => {
      const data = { title: 'Minimal Draft Bounty' };
      const record = baseBountyRecord({
        title: 'Minimal Draft Bounty',
        shortDescription: '',
        fullInstructions: '',
        category: '',
        proofRequirements: '',
        status: BountyStatus.DRAFT,
        channels: undefined,
      });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, data);

      expect(result.status).toBe(BountyStatus.DRAFT);
      expect(result.title).toBe('Minimal Draft Bounty');
      expect(prisma.bounty.create).toHaveBeenCalledTimes(1);
      expect(prisma.bounty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Minimal Draft Bounty',
            status: BountyStatus.DRAFT,
            shortDescription: '',
            fullInstructions: '',
            category: '',
            proofRequirements: '',
          }),
        }),
      );
    });

    it('should not create any reward rows when title-only draft', async () => {
      const data = { title: 'Title Only' };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: 'Title Only', status: BountyStatus.DRAFT }),
      );

      await service.create(mockBA, data);

      expect(prisma.bountyReward.createMany).not.toHaveBeenCalled();
    });

    it('should fire an audit log even for minimal draft', async () => {
      const data = { title: 'Audit Test' };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: 'Audit Test', status: BountyStatus.DRAFT }),
      );

      await service.create(mockBA, data);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bounty.create',
          actorId: mockBA.sub,
        }),
      );
    });
  });

  // ── 2. Create with empty rewards array [] succeeds ────────────────

  describe('Create with empty rewards array', () => {
    it('should succeed with rewards = [] and not create reward rows', async () => {
      const data = {
        ...validCreateBountyData(),
        rewards: [] as any[],
      };
      const record = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.create.mockResolvedValue(record);
      prisma.bountyReward.findMany.mockResolvedValue([]);

      const result = await service.create(mockBA, data);

      expect(result.status).toBe(BountyStatus.DRAFT);
      expect(prisma.bountyReward.createMany).not.toHaveBeenCalled();
      expect(result.rewards).toEqual([]);
    });

    it('should succeed with rewards = undefined and not create reward rows', async () => {
      const data = {
        ...validCreateBountyData(),
        rewards: undefined,
      };
      const record = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, data as any);

      expect(result.status).toBe(BountyStatus.DRAFT);
      expect(prisma.bountyReward.createMany).not.toHaveBeenCalled();
    });
  });

  // ── 3. Create with undefined optional fields succeeds ─────────────

  describe('Create with undefined optional fields', () => {
    it('should succeed when channels, rewards, postVisibility, structuredEligibility, engagementRequirements are all undefined', async () => {
      const data = {
        title: 'Undefined Optionals',
        shortDescription: undefined,
        fullInstructions: undefined,
        category: undefined,
        proofRequirements: undefined,
        maxSubmissions: undefined,
        startDate: undefined,
        endDate: undefined,
        channels: undefined,
        rewards: undefined,
        postVisibility: undefined,
        structuredEligibility: undefined,
        currency: undefined,
        aiContentPermitted: undefined,
        engagementRequirements: undefined,
        payoutMetrics: undefined,
      };
      const record = baseBountyRecord({
        title: 'Undefined Optionals',
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, data as any);

      expect(result).toBeDefined();
      expect(result.status).toBe(BountyStatus.DRAFT);
      expect(result.title).toBe('Undefined Optionals');
    });

    it('should default currency to ZAR when undefined', async () => {
      const data = { title: 'Currency Default', currency: undefined };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ currency: Currency.ZAR }),
      );

      await service.create(mockBA, data as any);

      expect(prisma.bounty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currency: Currency.ZAR,
          }),
        }),
      );
    });

    it('should default aiContentPermitted to false when undefined', async () => {
      const data = { title: 'AI Default' };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      await service.create(mockBA, data as any);

      expect(prisma.bounty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            aiContentPermitted: false,
          }),
        }),
      );
    });
  });

  // ── 4. Create without organisationId fails ────────────────────────

  describe('Create without organisationId', () => {
    it('should fail with BadRequestException when user.organisationId is null', async () => {
      const noOrgUser = { ...mockBA, organisationId: null };
      const data = validCreateBountyData();

      await expect(service.create(noOrgUser, data)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(noOrgUser, data)).rejects.toThrow(
        'You must belong to an organisation to create bounties',
      );
    });

    it('should fail with BadRequestException when user.organisationId is undefined', async () => {
      const noOrgUser = { ...mockBA, organisationId: undefined as any };
      const data = validCreateBountyData();

      await expect(service.create(noOrgUser, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail for participant who has no org', async () => {
      const data = validCreateBountyData();

      await expect(service.create(mockParticipant, data)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockParticipant, data)).rejects.toThrow(
        'You must belong to an organisation to create bounties',
      );
    });

    it('should not call prisma.bounty.create when organisationId is missing', async () => {
      const noOrgUser = { ...mockBA, organisationId: null };
      const data = validCreateBountyData();

      try {
        await service.create(noOrgUser, data);
      } catch {
        // expected
      }

      expect(prisma.bounty.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ── 5. Update with empty rewards array doesn't crash ──────────────

  describe('Update with empty rewards array', () => {
    it('should NOT crash when data.rewards is an empty array', async () => {
      const existingBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.findUnique.mockResolvedValue(existingBounty);

      const updatedBounty = {
        ...existingBounty,
        title: 'Updated Title',
        rewards: [],
        _count: { submissions: 0 },
        organisation: { id: 'org-1', name: 'Test Org', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'User' },
      };
      prisma.bounty.update.mockResolvedValue(updatedBounty);

      const result = await service.update(
        'bounty-1',
        mockBA,
        { rewards: [], title: 'Updated Title' },
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Title');
      // Empty rewards should use the non-transaction update path
      expect(prisma.bounty.update).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should return empty rewards array without error', async () => {
      const existingBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.findUnique.mockResolvedValue(existingBounty);

      const updatedBounty = {
        ...existingBounty,
        rewards: [],
        _count: { submissions: 0 },
        organisation: { id: 'org-1', name: 'Test Org', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'User' },
      };
      prisma.bounty.update.mockResolvedValue(updatedBounty);

      const result = await service.update('bounty-1', mockBA, { rewards: [] });

      expect(result.rewards).toEqual([]);
      expect(result.totalRewardValue).toBeNull();
    });
  });

  // ── 6. DRAFT->LIVE without optional fields succeeds ───────────────

  describe('DRAFT->LIVE without optional fields', () => {
    it('should succeed when structuredEligibility and engagementRequirements are null', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Test Bounty',
        shortDescription: 'Description',
        fullInstructions: 'Instructions here',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        structuredEligibility: null,
        engagementRequirements: null,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);
      prisma.bounty.update.mockResolvedValue({
        ...draftBounty,
        status: BountyStatus.LIVE,
        updatedAt: new Date(),
      });

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE);

      expect(result.status).toBe(BountyStatus.LIVE);
    });

    it('should succeed when payoutMetrics is null', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Payout Test',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST] },
        postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
        postMinDurationValue: 7,
        postMinDurationUnit: DurationUnit.DAYS,
        visibilityAcknowledged: true,
        payoutMetrics: null,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);
      prisma.bounty.update.mockResolvedValue({
        ...draftBounty,
        status: BountyStatus.LIVE,
        updatedAt: new Date(),
      });

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE);

      expect(result.status).toBe(BountyStatus.LIVE);
    });

    it('should succeed when maxSubmissions, startDate, endDate are null', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'No Dates',
        shortDescription: 'Desc',
        fullInstructions: 'Instruct',
        category: 'Social Media',
        proofRequirements: 'Proof',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.FEED_POST] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        maxSubmissions: null,
        startDate: null,
        endDate: null,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);
      prisma.bounty.update.mockResolvedValue({
        ...draftBounty,
        status: BountyStatus.LIVE,
        updatedAt: new Date(),
      });

      const result = await service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE);

      expect(result.status).toBe(BountyStatus.LIVE);
    });
  });

  // ── 7. DRAFT->LIVE without required fields fails ──────────────────

  describe('DRAFT->LIVE without required fields', () => {
    it('should fail when channels is null', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Test Bounty',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: null,
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/channels/i);
    });

    it('should fail when rewards array is empty (no reward rows)', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Test Bounty',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/rewards/i);
    });

    it('should fail when title is empty string', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: '',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/title/i);
    });

    it('should fail when shortDescription is empty', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Good Title',
        shortDescription: '',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/shortDescription/i);
    });

    it('should fail when fullInstructions is empty', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Good Title',
        shortDescription: 'Good Desc',
        fullInstructions: '',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/fullInstructions/i);
    });

    it('should fail when postVisibilityRule is null', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Good Title',
        shortDescription: 'Good Desc',
        fullInstructions: 'Good Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: null,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/postVisibilityRule/i);
    });

    it('should fail when visibilityAcknowledged is false', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Test',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: false,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/visibilityAcknowledged/i);
    });

    it('should include ALL missing fields in the error message', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: '',
        shortDescription: '',
        fullInstructions: '',
        category: '',
        proofRequirements: '',
        channels: null,
        postVisibilityRule: null,
        visibilityAcknowledged: false,
        paymentStatus: PaymentStatus.PAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE);
      } catch (e: any) {
        const message = e.message;
        expect(message).toContain('title');
        expect(message).toContain('shortDescription');
        expect(message).toContain('fullInstructions');
        expect(message).toContain('proofRequirements');
        expect(message).toContain('channels');
        expect(message).toContain('postVisibilityRule');
        expect(message).toContain('rewards');
        expect(message).toContain('visibilityAcknowledged');
      }
    });
  });

  // ── 8. DRAFT->LIVE without payment fails ──────────────────────────

  describe('DRAFT->LIVE without payment', () => {
    it('should fail when paymentStatus is UNPAID', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Paid Bounty',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.UNPAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/payment/i);
    });

    it('should fail when paymentStatus is PENDING', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'Pending Payment',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.PENDING,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(/payment/i);
    });

    it('should not update the bounty status when payment check fails', async () => {
      const draftBounty = baseBountyRecord({
        id: 'bounty-1',
        organisationId: 'org-1',
        status: BountyStatus.DRAFT,
        title: 'No Payment',
        shortDescription: 'Description',
        fullInstructions: 'Instructions',
        category: 'Social Media',
        proofRequirements: 'Submit URL',
        channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
        postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
        visibilityAcknowledged: true,
        paymentStatus: PaymentStatus.UNPAID,
      });
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);
      prisma.bountyReward.findMany.mockResolvedValue([baseBountyRewardRecord()]);

      try {
        await service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE);
      } catch {
        // expected
      }

      expect(prisma.bounty.update).not.toHaveBeenCalled();
    });
  });
});
