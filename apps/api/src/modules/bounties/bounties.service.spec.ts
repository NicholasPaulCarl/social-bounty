import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BountiesService } from './bounties.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  UserRole,
  BountyStatus,
  RewardType,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  DurationUnit,
  Currency,
  BountyAccessType,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MailService } from '../mail/mail.service';

describe('BountiesService', () => {
  let service: BountiesService;
  let prisma: any;
  let auditService: { log: jest.Mock };

  const mockParticipant: AuthenticatedUser = {
    sub: 'participant-id',
    email: 'participant@test.com',
    role: UserRole.PARTICIPANT,
    brandId: null,
  };

  const mockBA: AuthenticatedUser = {
    sub: 'ba-id',
    email: 'ba@test.com',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'org-1',
  };

  const mockSA: AuthenticatedUser = {
    sub: 'sa-id',
    email: 'admin@test.com',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  };

  const baseBounty = {
    id: 'bounty-1',
    title: 'Test Bounty',
    shortDescription: 'A test bounty',
    fullInstructions: 'Full instructions here',
    category: 'Social Media',
    rewardType: RewardType.CASH,
    rewardValue: 25,
    rewardDescription: null,
    maxSubmissions: 100,
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-03-01'),
    eligibilityRules: 'Must have account',
    proofRequirements: 'Submit URL',
    status: BountyStatus.DRAFT,
    brandId: 'org-1',
    createdById: 'ba-id',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // New fields
    currency: Currency.ZAR,
    channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    aiContentPermitted: false,
    engagementRequirements: { tagAccount: '@acmecorp', mention: true, comment: false },
    postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
    postMinDurationValue: 7,
    postMinDurationUnit: DurationUnit.DAYS,
    structuredEligibility: { minFollowers: 100 },
    visibilityAcknowledged: false,
    accessType: BountyAccessType.PUBLIC,
  };

  const baseReward = {
    id: 'reward-1',
    bountyId: 'bounty-1',
    rewardType: RewardType.CASH,
    name: 'Cash reward',
    monetaryValue: { toString: () => '25.00' },
    sortOrder: 0,
    createdAt: new Date(),
  };

  const createData = {
    title: 'New Bounty',
    shortDescription: 'Short desc',
    fullInstructions: 'Full instructions',
    category: 'Social Media',
    proofRequirements: 'Submit URL',
    channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] } as Record<string, string[]>,
    rewards: [
      { rewardType: RewardType.CASH, name: 'Cash reward', monetaryValue: 25 },
    ],
    postVisibility: {
      rule: PostVisibilityRule.MINIMUM_DURATION,
      minDurationValue: 7,
      minDurationUnit: DurationUnit.DAYS,
    },
    structuredEligibility: { minFollowers: 100, publicProfile: true },
    currency: Currency.ZAR,
    aiContentPermitted: false,
    engagementRequirements: { tagAccount: '@acmecorp', mention: true, comment: false },
  };

  beforeEach(async () => {
    const bountyCreate = jest.fn();
    const bountyUpdate = jest.fn();
    const rewardCreateMany = jest.fn();
    const rewardFindMany = jest.fn().mockResolvedValue([baseReward]);

    prisma = {
      bounty: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: bountyCreate,
        update: bountyUpdate,
        delete: jest.fn(),
      },
      bountyReward: {
        createMany: rewardCreateMany,
        deleteMany: jest.fn(),
        findMany: rewardFindMany,
      },
      submission: {
        findFirst: jest.fn(),
        // Batched per-viewer lookup in `list` — empty by default so existing
        // tests with non-participant viewers stay unaffected.
        findMany: jest.fn().mockResolvedValue([]),
      },
      bountyApplication: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      ledgerEntry: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { amount: null } }),
      },
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          bounty: { create: bountyCreate, update: bountyUpdate },
          bountyReward: {
            createMany: rewardCreateMany,
            deleteMany: jest.fn(),
            findMany: rewardFindMany,
          },
        });
      }),
    };

    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BountiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE'), getActiveOrgTier: jest.fn().mockResolvedValue('FREE'), isFeatureEnabled: jest.fn().mockResolvedValue(false) } },
        { provide: MailService, useValue: { sendBountyPublishedEmail: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
  });

  // ── create ──────────────────────────────────────────

  describe('create', () => {
    it('should create a bounty in DRAFT status', async () => {
      prisma.bounty.create.mockResolvedValue({
        ...baseBounty,
        ...createData,
        status: BountyStatus.DRAFT,
      });

      const result = await service.create(mockBA, createData);

      expect(result.status).toBe(BountyStatus.DRAFT);
      expect(result.title).toBe('New Bounty');
      expect(prisma.bounty.create).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'bounty.create' }),
      );
    });

    it('should throw if user has no brandId', async () => {
      const noOrgUser: AuthenticatedUser = {
        ...mockBA,
        brandId: null,
      };

      await expect(service.create(noOrgUser, createData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if endDate is before startDate', async () => {
      await expect(
        service.create(mockBA, {
          ...createData,
          startDate: '2026-03-01T00:00:00.000Z',
          endDate: '2026-02-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow creation without dates', async () => {
      prisma.bounty.create.mockResolvedValue({
        ...baseBounty,
        startDate: null,
        endDate: null,
      });

      const result = await service.create(mockBA, createData);

      expect(result).toBeDefined();
    });
  });

  // ── findById ────────────────────────────────────────

  describe('findById', () => {
    it('should return bounty for SA regardless of status', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
        brand: { id: 'org-1', name: 'Test', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        brandAssets: [],
        _count: { submissions: 5 },
      });

      const result = await service.findById('bounty-1', mockSA);
      expect(result.id).toBe('bounty-1');
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent', mockBA)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if participant views non-LIVE bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
        brand: { id: 'org-1', name: 'Test', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [],
        _count: { submissions: 0 },
      });

      await expect(
        service.findById('bounty-1', mockParticipant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if BA views other org bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        brandId: 'other-org',
        brand: { id: 'other-org', name: 'Other', logo: null },
        createdBy: { id: 'other-ba', firstName: 'O', lastName: 'B' },
        rewards: [],
        _count: { submissions: 0 },
      });

      await expect(service.findById('bounty-1', mockBA)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should include userSubmission for participant who has submitted', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        brand: { id: 'org-1', name: 'Test', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        brandAssets: [],
        _count: { submissions: 5 },
      });
      prisma.submission.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'SUBMITTED',
        payoutStatus: 'NOT_PAID',
      });

      const result = await service.findById('bounty-1', mockParticipant);
      expect(result.userSubmission).toEqual({
        id: 'sub-1',
        status: 'SUBMITTED',
        payoutStatus: 'NOT_PAID',
      });
    });

    it('should expose accessType on the detail response (CLOSED surfaces the value)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        accessType: BountyAccessType.CLOSED,
        brand: { id: 'org-1', name: 'Test', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        brandAssets: [],
        _count: { submissions: 0 },
      });

      const result = await service.findById('bounty-1', mockSA);
      expect(result.accessType).toBe(BountyAccessType.CLOSED);
    });

    it('derives brand.verified from kybStatus on the detail response', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        brand: { id: 'org-1', name: 'KYB Done', logo: null, kybStatus: 'APPROVED' },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        brandAssets: [],
        _count: { submissions: 0 },
      });

      const result = await service.findById('bounty-1', mockSA);
      expect(result.brand.verified).toBe(true);

      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        brand: { id: 'org-2', name: 'Pending', logo: null, kybStatus: 'PENDING' },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        brandAssets: [],
        _count: { submissions: 0 },
      });

      const result2 = await service.findById('bounty-1', mockSA);
      expect(result2.brand.verified).toBe(false);
    });

    it('sets userHasApplied/userHasSubmitted from parallel findFirsts for participants', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        brand: { id: 'org-1', name: 'Test', logo: null, kybStatus: 'APPROVED' },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        brandAssets: [],
        _count: { submissions: 5 },
      });
      prisma.submission.findFirst.mockResolvedValue({
        id: 'sub-1',
        status: 'SUBMITTED',
        payoutStatus: 'NOT_PAID',
      });
      prisma.bountyApplication.findFirst.mockResolvedValue({ id: 'app-1' });

      const result = await service.findById('bounty-1', mockParticipant);
      expect(result.userHasApplied).toBe(true);
      expect(result.userHasSubmitted).toBe(true);
      // userSubmission round-trips alongside the new flags.
      expect(result.userSubmission).toEqual({
        id: 'sub-1',
        status: 'SUBMITTED',
        payoutStatus: 'NOT_PAID',
      });
    });

    it('sets userHasApplied/userHasSubmitted to false for non-participant viewers', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        brand: { id: 'org-1', name: 'Test', logo: null, kybStatus: 'APPROVED' },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        brandAssets: [],
        _count: { submissions: 0 },
      });

      const result = await service.findById('bounty-1', mockSA);
      expect(result.userHasApplied).toBe(false);
      expect(result.userHasSubmitted).toBe(false);
      expect(prisma.bountyApplication.findFirst).not.toHaveBeenCalled();
      expect(prisma.submission.findFirst).not.toHaveBeenCalled();
    });
  });

  // ── updateStatus ────────────────────────────────────

  describe('updateStatus', () => {
    it('should allow DRAFT -> LIVE when all preconditions met', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
        visibilityAcknowledged: true,
        paymentStatus: 'PAID',
      });
      prisma.bountyReward.findMany.mockResolvedValue([baseReward]);
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });

      const result = await service.updateStatus(
        'bounty-1',
        mockBA,
        BountyStatus.LIVE,
      );
      expect(result.status).toBe(BountyStatus.LIVE);
    });

    it('should allow LIVE -> PAUSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.PAUSED,
      });

      const result = await service.updateStatus(
        'bounty-1',
        mockBA,
        BountyStatus.PAUSED,
      );
      expect(result.status).toBe(BountyStatus.PAUSED);
    });

    it('should allow PAUSED -> LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.PAUSED,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });

      const result = await service.updateStatus(
        'bounty-1',
        mockBA,
        BountyStatus.LIVE,
      );
      expect(result.status).toBe(BountyStatus.LIVE);
    });

    it('should allow LIVE -> CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.CLOSED,
      });

      const result = await service.updateStatus(
        'bounty-1',
        mockBA,
        BountyStatus.CLOSED,
      );
      expect(result.status).toBe(BountyStatus.CLOSED);
    });

    it('should allow PAUSED -> CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.PAUSED,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.CLOSED,
      });

      const result = await service.updateStatus(
        'bounty-1',
        mockBA,
        BountyStatus.CLOSED,
      );
      expect(result.status).toBe(BountyStatus.CLOSED);
    });

    it('should reject CLOSED -> LIVE (terminal state)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.CLOSED,
      });

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> PAUSED (invalid)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
      });

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.PAUSED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject DRAFT -> CLOSED (invalid)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
      });

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.CLOSED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject LIVE -> DRAFT (invalid)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.DRAFT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow PAUSED -> DRAFT', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.PAUSED,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
      });

      const result = await service.updateStatus(
        'bounty-1',
        mockBA,
        BountyStatus.DRAFT,
      );
      expect(result.status).toBe(BountyStatus.DRAFT);
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if BA not in bounty org', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        brandId: 'other-org',
      });

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create audit log on status change', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.PAUSED,
      });

      await service.updateStatus('bounty-1', mockBA, BountyStatus.PAUSED);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bounty.status_change',
          beforeState: { status: BountyStatus.LIVE },
          afterState: { status: BountyStatus.PAUSED },
        }),
      );
    });

    // visibilityAcknowledged requirement removed from DRAFT->LIVE gating.
    // The acknowledgment toggle was removed from the brand UX; the field
    // remains on the Bounty model for historical rows but is no longer
    // checked on status transitions. Prior test "should reject DRAFT ->
    // LIVE without visibilityAcknowledged" is intentionally deleted.
  });

  // ── update ──────────────────────────────────────────

  describe('update', () => {
    it('should allow all fields on DRAFT bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        title: 'Updated Title',
        brand: { id: 'org-1', name: 'Test', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        _count: { submissions: 0 },
      });

      const result = await service.update(
        'bounty-1',
        mockBA,
        { title: 'Updated Title' },
      );
      expect(result.title).toBe('Updated Title');
    });

    it('should reject non-editable fields on LIVE bounty with descriptive error', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });

      await expect(
        service.update('bounty-1', mockBA, { title: 'New Title' }),
      ).rejects.toThrow(BadRequestException);

      // Verify the error message tells users what CAN be edited
      try {
        await service.update('bounty-1', mockBA, { title: 'New Title' });
      } catch (e: any) {
        expect(e.message).toContain('LIVE bounties can only edit:');
        expect(e.message).toContain('eligibilityRules');
        expect(e.message).toContain('proofRequirements');
        expect(e.message).toContain('maxSubmissions');
        expect(e.message).toContain('endDate');
        expect(e.message).toContain('title');
      }
    });

    it('should allow editable fields on LIVE bounty (eligibilityRules)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        eligibilityRules: 'Updated rules',
        brand: { id: 'org-1', name: 'Test', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        _count: { submissions: 0 },
      });

      const result = await service.update(
        'bounty-1',
        mockBA,
        { eligibilityRules: 'Updated rules' },
      );
      expect(result).toBeDefined();
    });

    it('should allow editable fields on LIVE bounty (proofRequirements, maxSubmissions, endDate)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
        proofRequirements: 'New proof',
        maxSubmissions: 50,
        endDate: new Date('2026-04-01'),
        brand: { id: 'org-1', name: 'Test', logo: null },
        createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
        rewards: [baseReward],
        _count: { submissions: 0 },
      });

      const result = await service.update(
        'bounty-1',
        mockBA,
        { proofRequirements: 'New proof', maxSubmissions: 50, endDate: '2026-04-01T00:00:00.000Z' },
      );
      expect(result).toBeDefined();
    });

    it('should reject editing CLOSED bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.CLOSED,
      });

      await expect(
        service.update('bounty-1', mockBA, { title: 'New Title' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if BA not in bounty org', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        brandId: 'other-org',
      });

      await expect(
        service.update('bounty-1', mockBA, { title: 'New Title' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SA to update any org bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        brandId: 'other-org',
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        title: 'SA Updated',
        brand: { id: 'other-org', name: 'Other', logo: null },
        createdBy: { id: 'other-ba', firstName: 'O', lastName: 'B' },
        rewards: [baseReward],
        _count: { submissions: 0 },
      });

      const result = await service.update(
        'bounty-1',
        mockSA,
        { title: 'SA Updated' },
      );
      expect(result).toBeDefined();
    });
  });

  // ── delete ──────────────────────────────────────────

  describe('delete', () => {
    it('should allow deleting DRAFT bounties', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.delete.mockResolvedValue(undefined);

      const result = await service.delete('bounty-1', mockBA);
      expect(result.message).toBe('Bounty deleted.');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'bounty.delete' }),
      );
    });

    it('should reject deleting LIVE bounties', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.LIVE,
      });

      await expect(service.delete('bounty-1', mockBA)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject deleting PAUSED bounties', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.PAUSED,
      });

      await expect(service.delete('bounty-1', mockBA)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject deleting CLOSED bounties', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.CLOSED,
      });

      await expect(service.delete('bounty-1', mockBA)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent', mockBA)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if BA not in bounty org', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        brandId: 'other-org',
        status: BountyStatus.DRAFT,
      });

      await expect(service.delete('bounty-1', mockBA)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── list ────────────────────────────────────────────

  describe('list', () => {
    it('should filter LIVE only for participants', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValue(0);

      await service.list(mockParticipant, {});

      expect(prisma.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: BountyStatus.LIVE }),
        }),
      );
    });

    it('should filter by org for BA', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValue(0);

      await service.list(mockBA, {});

      expect(prisma.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ brandId: 'org-1' }),
        }),
      );
    });

    it('should not restrict for SA', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValue(0);

      await service.list(mockSA, {});

      const callArgs = prisma.bounty.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBeUndefined();
      expect(callArgs.where.brandId).toBeUndefined();
    });

    it('should return correct pagination meta', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      // First count() = total (where), second count() = newToday — service
      // calls them in `Promise.all`, so order matches the call sequence.
      prisma.bounty.count
        .mockResolvedValueOnce(45)
        .mockResolvedValueOnce(3);

      const result = await service.list(mockSA, { page: 2, limit: 10 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 45,
        totalPages: 5,
        newToday: 3,
        // Non-participant viewer → weekEarnings stays undefined.
        weekEarnings: undefined,
      });
    });

    it('should expose accessType on each list item', async () => {
      prisma.bounty.findMany.mockResolvedValue([
        {
          ...baseBounty,
          status: BountyStatus.LIVE,
          accessType: BountyAccessType.CLOSED,
          brand: { id: 'org-1', name: 'Test', logo: null },
          rewards: [baseReward],
          _count: { submissions: 0 },
        },
      ]);
      prisma.bounty.count.mockResolvedValue(1);

      const result = await service.list(mockSA, {});

      expect(result.data[0].accessType).toBe(BountyAccessType.CLOSED);
    });

    it('derives brand.verified from kybStatus on each list item', async () => {
      prisma.bounty.findMany.mockResolvedValue([
        {
          ...baseBounty,
          id: 'b-approved',
          status: BountyStatus.LIVE,
          brand: { id: 'org-1', name: 'KYB Done', logo: null, kybStatus: 'APPROVED' },
          rewards: [baseReward],
          _count: { submissions: 0 },
        },
        {
          ...baseBounty,
          id: 'b-pending',
          status: BountyStatus.LIVE,
          brand: { id: 'org-2', name: 'Awaiting KYB', logo: null, kybStatus: 'PENDING' },
          rewards: [baseReward],
          _count: { submissions: 0 },
        },
      ]);
      prisma.bounty.count.mockResolvedValueOnce(2).mockResolvedValueOnce(0);

      const result = await service.list(mockSA, {});

      expect(result.data[0].brand.verified).toBe(true);
      expect(result.data[1].brand.verified).toBe(false);
    });

    it('maps userHasApplied/userHasSubmitted from batched lookups for participants', async () => {
      prisma.bounty.findMany.mockResolvedValue([
        {
          ...baseBounty,
          id: 'b-1',
          status: BountyStatus.LIVE,
          brand: { id: 'org-1', name: 'Test', logo: null, kybStatus: 'APPROVED' },
          rewards: [baseReward],
          _count: { submissions: 0 },
        },
        {
          ...baseBounty,
          id: 'b-2',
          status: BountyStatus.LIVE,
          brand: { id: 'org-1', name: 'Test', logo: null, kybStatus: 'APPROVED' },
          rewards: [baseReward],
          _count: { submissions: 0 },
        },
        {
          ...baseBounty,
          id: 'b-3',
          status: BountyStatus.LIVE,
          brand: { id: 'org-1', name: 'Test', logo: null, kybStatus: 'APPROVED' },
          rewards: [baseReward],
          _count: { submissions: 0 },
        },
      ]);
      prisma.bounty.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
      // Participant has applied to b-1 and b-3; submitted only on b-3.
      prisma.bountyApplication.findMany.mockResolvedValue([
        { bountyId: 'b-1' },
        { bountyId: 'b-3' },
      ]);
      prisma.submission.findMany.mockResolvedValue([{ bountyId: 'b-3' }]);

      const result = await service.list(mockParticipant, {});

      const byId = Object.fromEntries(result.data.map((b) => [b.id, b]));
      expect(byId['b-1'].userHasApplied).toBe(true);
      expect(byId['b-1'].userHasSubmitted).toBe(false);
      expect(byId['b-2'].userHasApplied).toBe(false);
      expect(byId['b-2'].userHasSubmitted).toBe(false);
      expect(byId['b-3'].userHasApplied).toBe(true);
      expect(byId['b-3'].userHasSubmitted).toBe(true);
      // Single batched query each — never N+1.
      expect(prisma.bountyApplication.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.submission.findMany).toHaveBeenCalledTimes(1);
    });

    it('skips per-viewer applied/submitted lookups for non-participant viewers', async () => {
      prisma.bounty.findMany.mockResolvedValue([
        {
          ...baseBounty,
          status: BountyStatus.LIVE,
          brand: { id: 'org-1', name: 'Test', logo: null, kybStatus: 'APPROVED' },
          rewards: [baseReward],
          _count: { submissions: 0 },
        },
      ]);
      prisma.bounty.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      const result = await service.list(mockBA, {});

      expect(result.data[0].userHasApplied).toBe(false);
      expect(result.data[0].userHasSubmitted).toBe(false);
      expect(prisma.bountyApplication.findMany).not.toHaveBeenCalled();
      expect(prisma.submission.findMany).not.toHaveBeenCalled();
      expect(prisma.ledgerEntry.aggregate).not.toHaveBeenCalled();
    });

    it('computes meta.newToday via the dedicated count call', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      // Order in Promise.all: total count, newToday count.
      prisma.bounty.count
        .mockResolvedValueOnce(99)
        .mockResolvedValueOnce(7);

      const result = await service.list(mockSA, {});

      expect(result.meta.newToday).toBe(7);
      // Second call must be the today-bucket query.
      const secondCall = prisma.bounty.count.mock.calls[1][0];
      expect(secondCall.where.status).toBe(BountyStatus.LIVE);
      expect(secondCall.where.createdAt.gte).toBeInstanceOf(Date);
    });

    it('aggregates meta.weekEarnings only for participants', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      // 12 345 cents earned in the last 7 days (BigInt → Number).
      prisma.ledgerEntry.aggregate.mockResolvedValue({ _sum: { amount: BigInt(12345) } });

      const result = await service.list(mockParticipant, {});

      expect(result.meta.weekEarnings).toBe(12345);
      expect(prisma.ledgerEntry.aggregate).toHaveBeenCalledTimes(1);
    });

    it('leaves meta.weekEarnings undefined when the ledger aggregate throws', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      prisma.ledgerEntry.aggregate.mockRejectedValue(new Error('db blip'));

      const result = await service.list(mockParticipant, {});

      // The list endpoint must never break because of a soft analytics failure.
      expect(result.meta.weekEarnings).toBeUndefined();
      expect(result.data).toEqual([]);
    });
  });
});
