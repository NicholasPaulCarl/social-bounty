import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  BountyStatus,
  RewardType,
  SocialChannel,
  PostFormat,
} from '@social-bounty/shared';
import {
  mockBA,
  mockBA2,
  mockSA,
  mockParticipant,
  validCreateBountyData,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Abuse Prevention', () => {
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

  // ── XSS Prevention ──────────────────────────────

  describe('XSS prevention (stored as plain text, sanitized on output)', () => {
    it('AP-01: should store XSS in title without executing', async () => {
      const data = validCreateBountyData();
      data.title = '<script>alert("xss")</script>';
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: data.title }),
      );

      const result = await service.create(mockBA, data);

      // Stored as-is; output sanitization is frontend responsibility
      // The service should not reject valid-length strings
      expect(result).toBeDefined();
    });

    it('AP-02: should store XSS in custom eligibility rules', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        customRules: ['<img onerror=alert(1) src=x>'],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('AP-04: should store XSS in shortDescription', async () => {
      const data = validCreateBountyData();
      data.shortDescription = '<svg onload=alert(1)>';
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('AP-03: should reject XSS in tagAccount via regex', async () => {
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
  });

  // ── SQL Injection Prevention ─────────────────────

  describe('SQL injection prevention (Prisma parameterized queries)', () => {
    it('AP-05: should safely store SQL injection attempt in title', async () => {
      const data = validCreateBountyData();
      data.title = "'; DROP TABLE bounties; --";
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: data.title }),
      );

      const result = await service.create(mockBA, data);

      // Prisma parameterizes queries, so this is stored literally
      expect(result).toBeDefined();
      expect(prisma.bounty.create).toHaveBeenCalledTimes(1);
    });

    it('AP-06: should safely handle SQL injection in list search', async () => {
      prisma.bounty.findMany.mockResolvedValue([]);
      prisma.bounty.count.mockResolvedValue(0);

      const result = await service.list(mockBA, { search: "' OR 1=1 --" });

      // Should not throw; Prisma handles parameterization
      expect(result).toBeDefined();
      expect(result.data).toEqual([]);
    });
  });

  // ── Overflow / Boundary Attacks ──────────────────

  describe('Overflow and boundary attacks', () => {
    it('AP-09: should reject negative maxSubmissions', async () => {
      const data = validCreateBountyData();
      data.maxSubmissions = -1;

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-09: should reject maxSubmissions = 0', async () => {
      const data = validCreateBountyData();
      data.maxSubmissions = 0;

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-08: should handle very large reward value within Decimal(12,2)', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 9999999999.99 },
      ];
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });
  });

  // ── Mass Assignment Prevention ───────────────────

  describe('Mass assignment prevention', () => {
    it('AP-12: should ignore extra fields in request body', async () => {
      const data = {
        ...validCreateBountyData(),
        status: BountyStatus.LIVE, // should be ignored
        organisationId: 'hacker-org', // should be ignored
        createdById: 'hacker-id', // should be ignored
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      const result = await service.create(mockBA, data as any);

      expect(result).toBeDefined();
      // Verify that status is always DRAFT
      expect(prisma.bounty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: BountyStatus.DRAFT }),
        }),
      );
      // Verify org comes from user, not request
      expect(prisma.bounty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organisationId: mockBA.organisationId }),
        }),
      );
    });
  });

  // ── RBAC Bypass Prevention ───────────────────────

  describe('RBAC bypass prevention', () => {
    it('AP-19: participant should not be able to create bounty', async () => {
      const data = validCreateBountyData();

      // The controller-level @Roles check prevents this,
      // but service-level check for organisationId also catches it
      await expect(service.create(mockParticipant, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-18: BA should not access another org bounty for update', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ organisationId: 'org-1', status: BountyStatus.DRAFT }),
      );

      await expect(
        service.update('bounty-1', mockBA2, { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('AP-18: BA should not access another org bounty for delete', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({ organisationId: 'org-1', status: BountyStatus.DRAFT }),
      );

      await expect(
        service.delete('bounty-1', mockBA2),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SA should be able to update any org bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          organisationId: 'any-org',
          status: BountyStatus.DRAFT,
        }),
      );
      prisma.bounty.update.mockResolvedValue(
        baseBountyRecord({
          title: 'SA Updated',
          organisation: { id: 'any-org', name: 'Any', logo: null },
          createdBy: { id: 'ba-id', firstName: 'Test', lastName: 'BA' },
          _count: { submissions: 0 },
        }),
      );

      const result = await service.update('bounty-1', mockSA, { title: 'SA Updated' });

      expect(result).toBeDefined();
    });

    it('SA should be able to delete any org bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(
        baseBountyRecord({
          organisationId: 'any-org',
          status: BountyStatus.DRAFT,
        }),
      );
      prisma.bounty.update.mockResolvedValue(undefined);

      const result = await service.delete('bounty-1', mockSA);

      expect(result.message).toBe('Bounty deleted.');
    });
  });

  // ── Invalid Enum Attacks ─────────────────────────

  describe('Invalid enum attacks', () => {
    it('AP-10: should reject unknown channel', async () => {
      const data = validCreateBountyData();
      (data.channels as Record<string, string[]>)['YOUTUBE'] = ['VIDEO'];
      delete (data.channels as Record<string, unknown>)[SocialChannel.INSTAGRAM];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-11: should reject invalid reward type', async () => {
      const data = validCreateBountyData();
      data.rewards = [
        { rewardType: 'FREE' as RewardType, name: 'Free', monetaryValue: 50 },
      ];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-29: should reject invalid currency', async () => {
      const data = validCreateBountyData();
      (data as any).currency = 'BTC';

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── Prototype Pollution ──────────────────────────

  describe('Prototype pollution prevention', () => {
    it('AP-14: should handle prototype pollution in structured eligibility', async () => {
      const data = validCreateBountyData();
      data.structuredEligibility = {
        ...data.structuredEligibility,
        __proto__: { admin: true },
      } as any;
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      // Service should safely ignore __proto__ and create successfully
      const result = await service.create(mockBA, data);
      expect(result).toBeDefined();
    });
  });
});
