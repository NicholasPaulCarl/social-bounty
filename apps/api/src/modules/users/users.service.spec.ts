import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@social-bounty/shared';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let auditService: { log: jest.Mock };

  const baseUser = {
    id: 'user-1',
    email: 'user@test.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.PARTICIPANT,
    status: 'ACTIVE',
    emailVerified: true,
    passwordHash: 'hashed-password',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    organisationMemberships: [],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      organisationMember: {
        findFirst: jest.fn(),
      },
    };

    auditService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── getProfile ───────────────────────────────────────────

  describe('getProfile', () => {
    it('should return user profile without organisation when no membership', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('user@test.com');
      expect(result.organisation).toBeNull();
    });

    it('should include organisation info when user has a membership', async () => {
      const userWithOrg = {
        ...baseUser,
        organisationMemberships: [
          {
            role: 'OWNER',
            organisation: { id: 'org-1', name: 'Acme Corp' },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(userWithOrg);

      const result = await service.getProfile('user-1');

      expect(result.organisation).toEqual({
        id: 'org-1',
        name: 'Acme Corp',
        role: 'OWNER',
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('missing')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── updateProfile ────────────────────────────────────────

  describe('updateProfile', () => {
    it('should update name fields and return the updated profile', async () => {
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        firstName: 'Janet',
        lastName: 'Smith',
        updatedAt: new Date('2025-06-01'),
      });

      const result = await service.updateProfile('user-1', {
        firstName: 'Janet',
        lastName: 'Smith',
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { firstName: 'Janet', lastName: 'Smith' },
        }),
      );
      expect(result.firstName).toBe('Janet');
      expect(result.lastName).toBe('Smith');
    });
  });

  // ── changePassword ───────────────────────────────────────

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue(baseUser);

      const result = await service.changePassword(
        'user-1',
        'currentPass',
        'newPass123',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('currentPass', 'hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 12);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { passwordHash: 'new-hash' },
        }),
      );
      expect(result.message).toMatch(/success/i);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.password_change' }),
      );
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', 'wrongPass', 'newPass123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when new password equals current password', async () => {
      await expect(
        service.changePassword('user-1', 'samePass', 'samePass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('missing', 'current', 'newpass'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
