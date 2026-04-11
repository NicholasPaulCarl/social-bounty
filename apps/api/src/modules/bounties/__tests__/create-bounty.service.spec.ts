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
} from '@social-bounty/shared';
import {
  mockBA,
  mockSA,
  validCreateBountyData,
  baseBountyRecord,
  baseBountyRewardRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Create Bounty', () => {
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

  // ── Happy Paths ──────────────────────────────────

  describe('Happy paths', () => {
    it('HP-01: should create bounty with single channel and single reward', async () => {
      const data = validCreateBountyData();
      const expectedRecord = baseBountyRecord({ status: BountyStatus.DRAFT });
      prisma.bounty.create.mockResolvedValue(expectedRecord);

      const result = await service.create(mockBA, data);

      expect(result.status).toBe(BountyStatus.DRAFT);
      expect(result.title).toBe(expectedRecord.title);
      expect(prisma.bounty.create).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'bounty.create' }),
      );
    });

    it('HP-02: should create bounty with multiple channels and formats', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.STORY, PostFormat.REEL],
        [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
      };
      const record = baseBountyRecord({
        channels: data.channels,
      });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
      expect(prisma.bounty.create).toHaveBeenCalledTimes(1);
    });

    it('HP-03: should create bounty with 3 reward lines (Cash + Product + Service)', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash reward', monetaryValue: 50 },
        { rewardType: RewardType.PRODUCT, name: 'Free T-Shirt', monetaryValue: 25 },
        { rewardType: RewardType.SERVICE, name: 'Free consultation', monetaryValue: 100 },
      ];
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ rewardValue: 175 }),
      );

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
      expect(prisma.bounty.create).toHaveBeenCalledTimes(1);
    });

    it('HP-04: should create bounty with all eligibility rules enabled', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        minFollowers: 1000,
        publicProfile: true,
        minAccountAgeDays: 90,
        locationRestriction: 'South Africa',
        noCompetingBrandDays: 30,
        customRules: ['Must be 18+', 'No NSFW content'],
      };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ structuredEligibility: data.structuredEligibility }),
      );

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('HP-05: should create bounty with MINIMUM_DURATION visibility', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 7,
        minDurationUnit: DurationUnit.DAYS,
      };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({
          postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
          postMinDurationValue: 7,
          postMinDurationUnit: DurationUnit.DAYS,
          visibilityAcknowledged: false,
        }),
      );

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('HP-06: should create bounty with MUST_NOT_REMOVE visibility', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MUST_NOT_REMOVE,
        minDurationValue: null,
        minDurationUnit: null,
      };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({
          postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
          postMinDurationValue: null,
          postMinDurationUnit: null,
        }),
      );

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('HP-07: should save as draft with minimal fields', async () => {
      const data = validCreateBountyData();
      delete (data as any).maxSubmissions;
      delete (data as any).startDate;
      delete (data as any).endDate;
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({
          maxSubmissions: null,
          startDate: null,
          endDate: null,
          status: BountyStatus.DRAFT,
        }),
      );

      const result = await service.create(mockBA, data);

      expect(result.status).toBe(BountyStatus.DRAFT);
    });

    it('HP-11: should create bounty with all engagement requirements', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@acmecorp',
        mention: true,
        comment: true,
      };
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({
          engagementRequirements: data.engagementRequirements,
        }),
      );

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('HP-12: should create bounty with AI content permitted', async () => {
      const data = validCreateBountyData();
      data.aiContentPermitted = true;
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ aiContentPermitted: true }),
      );

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should allow SA to create bounty for any org', async () => {
      const saWithOrg = { ...mockSA, brandId: 'org-1' };
      const data = validCreateBountyData();
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(saWithOrg, data);

      expect(result).toBeDefined();
    });
  });

  // ── Validation Edge Cases ────────────────────────

  describe('Validation edge cases', () => {
    it('VE-30: should throw if user has no brandId', async () => {
      const noOrgUser = { ...mockBA, brandId: null };
      const data = validCreateBountyData();

      await expect(service.create(noOrgUser, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-17: should throw if endDate is before startDate', async () => {
      const data = validCreateBountyData();
      data.startDate = '2026-03-01T00:00:00.000Z';
      data.endDate = '2026-02-01T00:00:00.000Z';

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if endDate equals startDate', async () => {
      const data = validCreateBountyData();
      data.startDate = '2026-03-01T00:00:00.000Z';
      data.endDate = '2026-03-01T00:00:00.000Z';

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow creation without dates', async () => {
      const data = validCreateBountyData();
      delete (data as any).startDate;
      delete (data as any).endDate;
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ startDate: null, endDate: null }),
      );

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should create audit log on creation', async () => {
      const data = validCreateBountyData();
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      await service.create(mockBA, data);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bounty.create',
          actorId: mockBA.sub,
          entityType: 'Bounty',
        }),
      );
    });

    it('should always create in DRAFT status regardless of input', async () => {
      const data = validCreateBountyData();
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      await service.create(mockBA, data);

      expect(prisma.bounty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: BountyStatus.DRAFT }),
        }),
      );
    });

    it('should trim string fields', async () => {
      const data = validCreateBountyData();
      data.title = '  Padded Title  ';
      data.shortDescription = '  Padded  ';
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      await service.create(mockBA, data);

      const createCall = prisma.bounty.create.mock.calls[0][0];
      expect(createCall.data.title).toBe('Padded Title');
      expect(createCall.data.shortDescription).toBe('Padded');
    });
  });
});
