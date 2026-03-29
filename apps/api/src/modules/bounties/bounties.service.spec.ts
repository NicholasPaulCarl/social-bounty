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
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('BountiesService', () => {
  let service: BountiesService;
  let prisma: any;
  let auditService: { log: jest.Mock };

  const mockParticipant: AuthenticatedUser = {
    sub: 'participant-id',
    email: 'participant@test.com',
    role: UserRole.PARTICIPANT,
    organisationId: null,
  };

  const mockBA: AuthenticatedUser = {
    sub: 'ba-id',
    email: 'ba@test.com',
    role: UserRole.BUSINESS_ADMIN,
    organisationId: 'org-1',
  };

  const mockSA: AuthenticatedUser = {
    sub: 'sa-id',
    email: 'admin@test.com',
    role: UserRole.SUPER_ADMIN,
    organisationId: null,
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
    organisationId: 'org-1',
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

    it('should throw if user has no organisationId', async () => {
      const noOrgUser: AuthenticatedUser = {
        ...mockBA,
        organisationId: null,
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
        organisation: { id: 'org-1', name: 'Test', logo: null },
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
        organisation: { id: 'org-1', name: 'Test', logo: null },
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
        organisationId: 'other-org',
        organisation: { id: 'other-org', name: 'Other', logo: null },
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
        organisation: { id: 'org-1', name: 'Test', logo: null },
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
        organisationId: 'other-org',
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

    it('should reject DRAFT -> LIVE without visibilityAcknowledged', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        status: BountyStatus.DRAFT,
        visibilityAcknowledged: false,
      });
      prisma.bountyReward.findMany.mockResolvedValue([baseReward]);

      await expect(
        service.updateStatus('bounty-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });
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
        organisation: { id: 'org-1', name: 'Test', logo: null },
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
        organisation: { id: 'org-1', name: 'Test', logo: null },
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
        organisation: { id: 'org-1', name: 'Test', logo: null },
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
        organisationId: 'other-org',
      });

      await expect(
        service.update('bounty-1', mockBA, { title: 'New Title' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SA to update any org bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...baseBounty,
        organisationId: 'other-org',
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.update.mockResolvedValue({
        ...baseBounty,
        title: 'SA Updated',
        organisation: { id: 'other-org', name: 'Other', logo: null },
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
        organisationId: 'other-org',
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
          where: expect.objectContaining({ organisationId: 'org-1' }),
        }),
      );
    });

    it('should not restrict for SA', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValue(0);

      await service.list(mockSA, {});

      const callArgs = prisma.bounty.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBeUndefined();
      expect(callArgs.where.organisationId).toBeUndefined();
    });

    it('should return correct pagination meta', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValue(45);

      const result = await service.list(mockSA, { page: 2, limit: 10 });

      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 45,
        totalPages: 5,
      });
    });
  });
});
