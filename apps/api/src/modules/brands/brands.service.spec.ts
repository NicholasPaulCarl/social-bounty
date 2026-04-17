import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApifyService } from '../apify/apify.service';
import { UserRole } from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('BrandsService', () => {
  let service: BrandsService;
  let prisma: any;
  let auditService: { log: jest.Mock };

  const mockParticipant: AuthenticatedUser = {
    sub: 'user-1',
    email: 'user@test.com',
    role: UserRole.PARTICIPANT,
    brandId: null,
  };

  const mockOwner: AuthenticatedUser = {
    sub: 'owner-1',
    email: 'owner@test.com',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'org-1',
  };

  const mockSA: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'admin@test.com',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  };

  const baseOrg = {
    id: 'org-1',
    name: 'Acme Corp',
    logo: null,
    contactEmail: 'contact@acme.com',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    _count: { members: 1, bounties: 0 },
  };

  beforeEach(async () => {
    prisma = {
      brand: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      brandMember: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        {
          provide: ApifyService,
          useValue: {
            refreshForBrand: jest.fn().mockResolvedValue(undefined),
            refreshIfStale: jest.fn().mockResolvedValue(undefined),
            getStaleness: jest.fn().mockResolvedValue(null),
            normalizeHandles: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  // ── create ───────────────────────────────────────────────

  describe('create', () => {
    it('should create a brand and run within a transaction', async () => {
      prisma.brand.create.mockResolvedValue(baseOrg);
      prisma.brandMember.create.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: UserRole.PARTICIPANT,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.create(
        mockParticipant,
        { name: 'Acme Corp', contactEmail: 'contact@acme.com' },
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.name).toBe('Acme Corp');
      expect(result.contactEmail).toBe('contact@acme.com');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'brand.create' }),
      );
    });

    it('should throw ConflictException if handle is already taken', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        id: 'existing-org',
        handle: 'taken',
      });

      await expect(
        service.create(mockParticipant, {
          name: 'New Org',
          contactEmail: 'new@org.com',
          handle: 'taken',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── findById ─────────────────────────────────────────────

  describe('findById', () => {
    it('should return org detail for member of that org', async () => {
      prisma.brand.findUnique.mockResolvedValue(baseOrg);

      const result = await service.findById('org-1', mockOwner);

      expect(result.id).toBe('org-1');
      expect(result.memberCount).toBe(1);
    });

    it('should throw NotFoundException when org does not exist', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('missing-org', mockOwner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not in the org and not SA', async () => {
      prisma.brand.findUnique.mockResolvedValue(baseOrg);

      const outsider: AuthenticatedUser = {
        sub: 'other-1',
        email: 'other@test.com',
        role: UserRole.BUSINESS_ADMIN,
        brandId: 'other-org',
      };

      await expect(
        service.findById('org-1', outsider),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to view any org', async () => {
      prisma.brand.findUnique.mockResolvedValue(baseOrg);

      const result = await service.findById('org-1', mockSA);

      expect(result.id).toBe('org-1');
    });
  });

  // ── update ───────────────────────────────────────────────

  describe('update', () => {
    it('should update org when caller is the owner', async () => {
      prisma.brand.findUnique.mockResolvedValue(baseOrg);
      prisma.brandMember.findFirst.mockResolvedValue({
        id: 'mem-1',
        role: 'OWNER',
      });
      prisma.brand.update.mockResolvedValue({
        ...baseOrg,
        name: 'Acme Updated',
        updatedAt: new Date('2025-06-01'),
      });

      const result = await service.update('org-1', mockOwner, {
        name: 'Acme Updated',
      });

      expect(result.name).toBe('Acme Updated');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'brand.update' }),
      );
    });

    it('should throw ForbiddenException when caller is not the owner', async () => {
      prisma.brand.findUnique.mockResolvedValue(baseOrg);
      prisma.brandMember.findFirst.mockResolvedValue(null);

      const nonOwner: AuthenticatedUser = {
        sub: 'member-1',
        email: 'member@test.com',
        role: UserRole.BUSINESS_ADMIN,
        brandId: 'org-1',
      };

      await expect(
        service.update('org-1', nonOwner, { name: 'Hacked Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to update without ownership check', async () => {
      prisma.brand.findUnique.mockResolvedValue(baseOrg);
      prisma.brand.update.mockResolvedValue({
        ...baseOrg,
        name: 'SA Updated',
        updatedAt: new Date('2025-06-01'),
      });

      const result = await service.update('org-1', mockSA, {
        name: 'SA Updated',
      });

      expect(result.name).toBe('SA Updated');
      // Should NOT have checked membership for SA
      expect(prisma.brandMember.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when org does not exist', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-org', mockOwner, { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
