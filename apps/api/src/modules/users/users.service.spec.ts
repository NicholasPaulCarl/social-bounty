import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole, SocialChannel } from '@social-bounty/shared';

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
    bio: null,
    profilePictureUrl: null,
    interests: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    brandMemberships: [],
    socialLinks: [],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      brandMember: {
        findFirst: jest.fn(),
      },
      socialLink: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      submission: {
        count: jest.fn(),
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
    it('should return user profile without brand when no membership', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('user@test.com');
      expect(result.brand).toBeNull();
      expect(result.bio).toBeNull();
      expect(result.interests).toEqual([]);
      expect(result.socialLinks).toEqual([]);
    });

    it('should include brand info when user has a membership', async () => {
      const userWithOrg = {
        ...baseUser,
        brandMemberships: [
          {
            role: 'OWNER',
            brand: { id: 'org-1', name: 'Acme Corp' },
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(userWithOrg);

      const result = await service.getProfile('user-1');

      expect(result.brand).toEqual({
        id: 'org-1',
        name: 'Acme Corp',
        role: 'OWNER',
      });
    });

    it('should include social links in profile', async () => {
      const userWithLinks = {
        ...baseUser,
        socialLinks: [
          {
            id: 'link-1',
            platform: SocialChannel.INSTAGRAM,
            url: 'https://instagram.com/test',
            handle: '@test',
            followerCount: 1000,
            postCount: 50,
            isVerified: true,
            verifiedAt: new Date('2025-06-01'),
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(userWithLinks);

      const result = await service.getProfile('user-1');

      expect(result.socialLinks).toHaveLength(1);
      expect(result.socialLinks[0].platform).toBe(SocialChannel.INSTAGRAM);
      expect(result.socialLinks[0].isVerified).toBe(true);
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

    it('should update bio and interests', async () => {
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        bio: 'Hello world',
        interests: ['Fitness & Wellness', 'Food & Cooking'],
        updatedAt: new Date('2025-06-01'),
      });

      const result = await service.updateProfile('user-1', {
        bio: 'Hello world',
        interests: ['Fitness & Wellness', 'Food & Cooking'],
      });

      expect(result.bio).toBe('Hello world');
      expect(result.interests).toEqual(['Fitness & Wellness', 'Food & Cooking']);
    });
  });

  // ── Social Links ──────────────────────────────────────────

  describe('getSocialLinks', () => {
    it('should return social links for user', async () => {
      prisma.socialLink.findMany.mockResolvedValue([
        {
          id: 'link-1',
          platform: SocialChannel.INSTAGRAM,
          url: 'https://instagram.com/test',
          handle: '@test',
          followerCount: 1000,
          postCount: 50,
          isVerified: true,
          verifiedAt: new Date('2025-06-01'),
        },
      ]);

      const result = await service.getSocialLinks('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe(SocialChannel.INSTAGRAM);
    });
  });

  describe('deleteSocialLink', () => {
    it('should delete social link owned by user', async () => {
      prisma.socialLink.findUnique.mockResolvedValue({
        id: 'link-1',
        userId: 'user-1',
      });
      prisma.socialLink.delete.mockResolvedValue({});

      const result = await service.deleteSocialLink('user-1', 'link-1');

      expect(result.message).toMatch(/deleted/i);
    });

    it('should throw NotFoundException when link not found', async () => {
      prisma.socialLink.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteSocialLink('user-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when link belongs to another user', async () => {
      prisma.socialLink.findUnique.mockResolvedValue({
        id: 'link-1',
        userId: 'other-user',
      });

      await expect(
        service.deleteSocialLink('user-1', 'link-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── Public Profile ────────────────────────────────────────

  describe('getPublicProfile', () => {
    it('should return public profile for a participant', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        bio: 'I am a hunter',
      });
      prisma.submission.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5); // approved

      const result = await service.getPublicProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.bio).toBe('I am a hunter');
      expect(result.stats.totalSubmissions).toBe(10);
      expect(result.stats.approvedSubmissions).toBe(5);
    });

    it('should throw NotFoundException when hunter not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.getPublicProfile('missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── List Hunters ──────────────────────────────────────────

  describe('listHunters', () => {
    it('should return paginated list of hunters', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          ...baseUser,
          socialLinks: [{ platform: SocialChannel.INSTAGRAM, followerCount: 1000 }],
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.listHunters({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  // ── Profile Picture ───────────────────────────────────────

  describe('deleteProfilePicture', () => {
    it('should clear profilePictureUrl', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        profilePictureUrl: '/uploads/old-pic.jpg',
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        profilePictureUrl: null,
      });

      const result = await service.deleteProfilePicture('user-1');

      expect(result.message).toMatch(/removed/i);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { profilePictureUrl: null },
        }),
      );
    });

    it('should throw BadRequestException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteProfilePicture('missing'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
