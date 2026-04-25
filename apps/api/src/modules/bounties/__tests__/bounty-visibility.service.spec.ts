import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { MailService } from '../../mail/mail.service';
import {
  PostVisibilityRule,
  DurationUnit,
  BountyStatus,
} from '@social-bounty/shared';
import {
  mockBA,
  validCreateBountyData,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
  createMockMailService,
} from './test-fixtures';

describe('BountiesService - Post Visibility Validation', () => {
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
        { provide: MailService, useValue: createMockMailService() },
      ],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
  });

  // ── Valid Post Visibility ────────────────────────

  describe('Valid post visibility', () => {
    it('should accept MUST_NOT_REMOVE without duration fields', async () => {
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

    it('should accept MINIMUM_DURATION with valid HOURS (1)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 1,
        minDurationUnit: DurationUnit.HOURS,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept MINIMUM_DURATION with max HOURS (168)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 168,
        minDurationUnit: DurationUnit.HOURS,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept MINIMUM_DURATION with valid DAYS (1)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 1,
        minDurationUnit: DurationUnit.DAYS,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept MINIMUM_DURATION with max DAYS (90)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 90,
        minDurationUnit: DurationUnit.DAYS,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept MINIMUM_DURATION with valid WEEKS (1)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 1,
        minDurationUnit: DurationUnit.WEEKS,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept MINIMUM_DURATION with max WEEKS (12)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 12,
        minDurationUnit: DurationUnit.WEEKS,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });
  });

  // ── Invalid Post Visibility ──────────────────────

  describe('Invalid post visibility', () => {
    it('VE-09: should reject MINIMUM_DURATION without duration value', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: null,
        minDurationUnit: DurationUnit.DAYS,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-09: should reject MINIMUM_DURATION without duration unit', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 7,
        minDurationUnit: null,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-10: should reject MINIMUM_DURATION with duration value = 0', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 0,
        minDurationUnit: DurationUnit.DAYS,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject MINIMUM_DURATION with negative duration value', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: -1,
        minDurationUnit: DurationUnit.DAYS,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-11: should reject HOURS = 169 (exceeds max 168)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 169,
        minDurationUnit: DurationUnit.HOURS,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-12: should reject DAYS = 91 (exceeds max 90)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 91,
        minDurationUnit: DurationUnit.DAYS,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-13: should reject WEEKS = 13 (exceeds max 12)', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 13,
        minDurationUnit: DurationUnit.WEEKS,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-14: should reject MUST_NOT_REMOVE with duration fields set', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MUST_NOT_REMOVE,
        minDurationValue: 7,
        minDurationUnit: DurationUnit.DAYS,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid visibility rule enum', async () => {
      const data = validCreateBountyData();
      (data.postVisibility as any).rule = 'INVALID_RULE';

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid duration unit enum', async () => {
      const data = validCreateBountyData();
      data.postVisibility = {
        rule: PostVisibilityRule.MINIMUM_DURATION,
        minDurationValue: 7,
        minDurationUnit: 'MONTHS' as DurationUnit,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── Visibility Acknowledgment ────────────────────

  describe('Visibility acknowledgment', () => {
    // VE-35 removed: the acknowledgment reset on postVisibility-change
    // is gone. Acknowledgment was removed from the brand UX, so the
    // update no longer touches visibilityAcknowledged at all.
    it('should NOT touch visibilityAcknowledged when postVisibility changes on update', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
          postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
          postMinDurationValue: 7,
          postMinDurationUnit: DurationUnit.DAYS,
        }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          visibilityAcknowledged: true,
          postVisibilityRule: PostVisibilityRule.MUST_NOT_REMOVE,
          brand: { id: 'org-1', name: 'Test', logo: null },
          createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
          _count: { submissions: 0 },
        }),
      );

      await service.update('bounty-1', mockBA, {
        postVisibility: {
          rule: PostVisibilityRule.MUST_NOT_REMOVE,
        },
      });

      // The update call must NOT include visibilityAcknowledged
      const updateCall = prisma.bounty.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('visibilityAcknowledged');
    });

    it('VE-33: should reject acknowledge-visibility when no postVisibilityRule is set', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.DRAFT,
          postVisibilityRule: null,
        }),
      );

      await expect(
        service.acknowledgeVisibility('bounty-1', mockBA),
      ).rejects.toThrow(BadRequestException);
    });

    it('VE-34: should reject acknowledge-visibility on LIVE bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          status: BountyStatus.LIVE,
          postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
        }),
      );

      await expect(
        service.acknowledgeVisibility('bounty-1', mockBA),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
