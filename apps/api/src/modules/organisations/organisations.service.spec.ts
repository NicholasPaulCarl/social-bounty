import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let prisma: any;
  let auditService: { log: jest.Mock };

  const mockParticipant: AuthenticatedUser = {
    sub: 'user-1',
    email: 'user@test.com',
    role: UserRole.PARTICIPANT,
    organisationId: null,
  };

  const mockOwner: AuthenticatedUser = {
    sub: 'owner-1',
    email: 'owner@test.com',
    role: UserRole.BUSINESS_ADMIN,
    organisationId: 'org-1',
  };

  const mockSA: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'admin@test.com',
    role: UserRole.SUPER_ADMIN,
    organisationId: null,
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
      organisation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      organisationMember: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<OrganisationsService>(OrganisationsService);
  });

  // ── create ───────────────────────────────────────────────

  describe('create', () => {
    it('should create an organisation and run within a transaction', async () => {
      prisma.organisationMember.findFirst.mockResolvedValue(null);
      prisma.organisation.create.mockResolvedValue(baseOrg);
      prisma.organisationMember.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.create(
        mockParticipant,
        { name: 'Acme Corp', contactEmail: 'contact@acme.com' },
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.name).toBe('Acme Corp');
      expect(result.contactEmail).toBe('contact@acme.com');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'organisation.create' }),
      );
    });

    it('should throw ConflictException if user already belongs to an org', async () => {
      prisma.organisationMember.findFirst.mockResolvedValue({ id: 'mem-1' });

      await expect(
        service.create(mockParticipant, { name: 'New Org', contactEmail: 'new@org.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── findById ─────────────────────────────────────────────

  describe('findById', () => {
    it('should return org detail for member of that org', async () => {
      prisma.organisation.findUnique.mockResolvedValue(baseOrg);

      const result = await service.findById('org-1', mockOwner);

      expect(result.id).toBe('org-1');
      expect(result.memberCount).toBe(1);
    });

    it('should throw NotFoundException when org does not exist', async () => {
      prisma.organisation.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('missing-org', mockOwner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not in the org and not SA', async () => {
      prisma.organisation.findUnique.mockResolvedValue(baseOrg);

      const outsider: AuthenticatedUser = {
        sub: 'other-1',
        email: 'other@test.com',
        role: UserRole.BUSINESS_ADMIN,
        organisationId: 'other-org',
      };

      await expect(
        service.findById('org-1', outsider),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to view any org', async () => {
      prisma.organisation.findUnique.mockResolvedValue(baseOrg);

      const result = await service.findById('org-1', mockSA);

      expect(result.id).toBe('org-1');
    });
  });

  // ── update ───────────────────────────────────────────────

  describe('update', () => {
    it('should update org when caller is the owner', async () => {
      prisma.organisation.findUnique.mockResolvedValue(baseOrg);
      prisma.organisationMember.findFirst.mockResolvedValue({
        id: 'mem-1',
        role: 'OWNER',
      });
      prisma.organisation.update.mockResolvedValue({
        ...baseOrg,
        name: 'Acme Updated',
        updatedAt: new Date('2025-06-01'),
      });

      const result = await service.update('org-1', mockOwner, {
        name: 'Acme Updated',
      });

      expect(result.name).toBe('Acme Updated');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'organisation.update' }),
      );
    });

    it('should throw ForbiddenException when caller is not the owner', async () => {
      prisma.organisation.findUnique.mockResolvedValue(baseOrg);
      prisma.organisationMember.findFirst.mockResolvedValue(null);

      const nonOwner: AuthenticatedUser = {
        sub: 'member-1',
        email: 'member@test.com',
        role: UserRole.BUSINESS_ADMIN,
        organisationId: 'org-1',
      };

      await expect(
        service.update('org-1', nonOwner, { name: 'Hacked Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to update without ownership check', async () => {
      prisma.organisation.findUnique.mockResolvedValue(baseOrg);
      prisma.organisation.update.mockResolvedValue({
        ...baseOrg,
        name: 'SA Updated',
        updatedAt: new Date('2025-06-01'),
      });

      const result = await service.update('org-1', mockSA, {
        name: 'SA Updated',
      });

      expect(result.name).toBe('SA Updated');
      // Should NOT have checked membership for SA
      expect(prisma.organisationMember.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when org does not exist', async () => {
      prisma.organisation.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-org', mockOwner, { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
