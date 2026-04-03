import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  mockBA,
  validCreateBountyData,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Engagement Requirements Validation', () => {
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

  // ── Valid Engagement Requirements ────────────────

  describe('Valid engagement requirements', () => {
    it('should accept all engagement fields', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@acmecorp',
        mention: true,
        comment: true,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept empty engagement (all false/null)', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: null,
        mention: false,
        comment: false,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept tagAccount with underscores and dots', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@acme_corp.official',
        mention: false,
        comment: false,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept tagAccount at exactly 2 chars (minimum)', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@a',
        mention: false,
        comment: false,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept tagAccount at 100 chars (maximum)', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@' + 'a'.repeat(99),
        mention: false,
        comment: false,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept only mention=true', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: null,
        mention: true,
        comment: false,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept only comment=true', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: null,
        mention: false,
        comment: true,
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });
  });

  // ── Invalid Engagement Requirements ──────────────

  describe('Invalid engagement requirements', () => {
    it('VE-18: should reject tagAccount without @ prefix', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: 'acmecorp',
        mention: false,
        comment: false,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-19: should reject tagAccount with just "@"', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@',
        mention: false,
        comment: false,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-20: should reject tagAccount with special chars', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@acme corp!',
        mention: false,
        comment: false,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject tagAccount with # symbol', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@acme#corp',
        mention: false,
        comment: false,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject tagAccount exceeding 100 chars', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@' + 'a'.repeat(100), // 101 total
        mention: false,
        comment: false,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-03: should reject XSS in tagAccount', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@<script>alert(1)</script>',
        mention: false,
        comment: false,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject tagAccount with emoji', async () => {
      const data = validCreateBountyData();
      data.engagementRequirements = {
        tagAccount: '@acme\u{1F600}corp',
        mention: false,
        comment: false,
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
