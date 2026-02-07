import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  mockBA,
  validCreateBountyData,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Structured Eligibility Validation', () => {
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

  // ── Valid Eligibility ────────────────────────────

  describe('Valid structured eligibility', () => {
    it('should accept all predefined rules populated', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        minFollowers: 1000,
        publicProfile: true,
        minAccountAgeDays: 90,
        locationRestriction: 'South Africa',
        noCompetingBrandDays: 30,
        customRules: ['Must be 18+'],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept empty eligibility (all null/empty)', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        minFollowers: null,
        publicProfile: false,
        minAccountAgeDays: null,
        locationRestriction: null,
        noCompetingBrandDays: null,
        customRules: [],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept exactly 5 custom rules (maximum)', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        customRules: Array.from({ length: 5 }, (_, i) => `Rule ${i + 1}`),
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept custom rule at exactly 500 chars', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        customRules: ['a'.repeat(500)],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept locationRestriction at exactly 200 chars', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        locationRestriction: 'a'.repeat(200),
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept minFollowers = 1', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { minFollowers: 1 };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });
  });

  // ── Invalid Eligibility ──────────────────────────

  describe('Invalid structured eligibility', () => {
    it('VE-16: should reject 6 custom rules (exceeds max 5)', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        customRules: Array.from({ length: 6 }, (_, i) => `Rule ${i + 1}`),
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-15: should reject custom rule > 500 chars', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        customRules: ['a'.repeat(501)],
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-24: should reject minFollowers = 0', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { minFollowers: 0 };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-25: should reject negative minFollowers', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { minFollowers: -5 };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject minFollowers as float', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { minFollowers: 10.5 };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-26: should reject locationRestriction > 200 chars', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        locationRestriction: 'a'.repeat(201),
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject minAccountAgeDays = 0', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { minAccountAgeDays: 0 };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject negative minAccountAgeDays', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { minAccountAgeDays: -10 };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject negative noCompetingBrandDays', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { noCompetingBrandDays: -1 };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-17: should reject non-string values in customRules', async () => {
      const data = validCreateBountyData();
      (data.structuredEligibility as Record<string, unknown>).customRules = [123, true, null];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject empty string in customRules array', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = { customRules: ['Valid rule', ''] };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
