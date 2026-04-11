import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { BountyAccessService } from './bounty-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  UserRole,
  BountyStatus,
  BountyAccessType,
  BountyApplicationStatus,
  BountyInvitationStatus,
  SubscriptionTier,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('BountyAccessService', () => {
  let service: BountyAccessService;
  let prisma: any;
  let auditService: { log: jest.Mock };
  let subscriptionsService: { getActiveTier: jest.Mock };

  // ── Fixtures ────────────────────────────────────────────

  const mockParticipant: AuthenticatedUser = {
    sub: 'user-1',
    email: 'user@test.com',
    role: UserRole.PARTICIPANT,
    brandId: null,
  };

  const mockAdmin: AuthenticatedUser = {
    sub: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'org-1',
  };

  const mockSuperAdmin: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'sa@test.com',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  };

  const closedLiveBounty = {
    id: 'bounty-1',
    brandId: 'org-1',
    accessType: BountyAccessType.CLOSED,
    status: BountyStatus.LIVE,
    deletedAt: null,
  };

  const publicLiveBounty = {
    id: 'bounty-2',
    brandId: 'org-1',
    accessType: BountyAccessType.PUBLIC,
    status: BountyStatus.LIVE,
    deletedAt: null,
  };

  const now = new Date('2026-01-15T10:00:00.000Z');

  const baseApplication = {
    id: 'app-1',
    bountyId: 'bounty-1',
    userId: 'user-1',
    message: 'I want to apply',
    reviewNote: null,
    status: BountyApplicationStatus.PENDING,
    appliedAt: now,
    reviewedAt: null,
    user: {
      firstName: 'Test',
      lastName: 'User',
      profilePictureUrl: 'https://example.com/pic.jpg',
    },
  };

  const baseInvitation = {
    id: 'inv-1',
    bountyId: 'bounty-1',
    socialPlatform: 'X',
    socialHandle: 'testuser',
    userId: 'user-1',
    invitedBy: 'admin-1',
    status: BountyInvitationStatus.PENDING,
    invitedAt: now,
    respondedAt: null,
  };

  // ── Module Setup ────────────────────────────────────────

  beforeEach(async () => {
    prisma = {
      bounty: {
        findUnique: jest.fn(),
      },
      bountyApplication: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      bountyInvitation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      userSocialHandle: {
        findUnique: jest.fn(),
      },
    };

    auditService = { log: jest.fn() };
    subscriptionsService = { getActiveTier: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BountyAccessService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: SubscriptionsService, useValue: subscriptionsService },
      ],
    }).compile();

    service = module.get<BountyAccessService>(BountyAccessService);
  });

  // ══════════════════════════════════════════════════════════
  // applyToBounty
  // ══════════════════════════════════════════════════════════

  describe('applyToBounty', () => {
    it('should create an application successfully for a PRO user', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyApplication.findUnique.mockResolvedValue(null);
      subscriptionsService.getActiveTier.mockResolvedValue(SubscriptionTier.PRO);
      prisma.bountyApplication.create.mockResolvedValue(baseApplication);

      const result = await service.applyToBounty('user-1', 'bounty-1', {
        message: 'I want to apply',
      });

      expect(result).toEqual({
        id: 'app-1',
        bountyId: 'bounty-1',
        userId: 'user-1',
        userName: 'Test User',
        userProfilePicture: 'https://example.com/pic.jpg',
        status: BountyApplicationStatus.PENDING,
        message: 'I want to apply',
        reviewNote: null,
        appliedAt: now.toISOString(),
        reviewedAt: null,
      });

      expect(prisma.bountyApplication.create).toHaveBeenCalledWith({
        data: {
          bountyId: 'bounty-1',
          userId: 'user-1',
          message: 'I want to apply',
          status: BountyApplicationStatus.PENDING,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
            },
          },
        },
      });
    });

    it('should throw BadRequestException when bounty is not CLOSED access type', async () => {
      prisma.bounty.findUnique.mockResolvedValue(publicLiveBounty);

      await expect(
        service.applyToBounty('user-1', 'bounty-2', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.applyToBounty('user-1', 'bounty-2', {}),
      ).rejects.toThrow('Applications are only available for closed bounties');
    });

    it('should throw BadRequestException when bounty is not LIVE', async () => {
      const draftBounty = {
        ...closedLiveBounty,
        status: BountyStatus.DRAFT,
      };
      prisma.bounty.findUnique.mockResolvedValue(draftBounty);

      await expect(
        service.applyToBounty('user-1', 'bounty-1', {}),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.applyToBounty('user-1', 'bounty-1', {}),
      ).rejects.toThrow('Bounty is not currently accepting applications');
    });

    it('should throw ConflictException when user already has an application', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyApplication.findUnique.mockResolvedValue(baseApplication);

      await expect(
        service.applyToBounty('user-1', 'bounty-1', {}),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.applyToBounty('user-1', 'bounty-1', {}),
      ).rejects.toThrow('You already have an application for this bounty');
    });

    it('should throw ForbiddenException for FREE tier user without invitation', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyApplication.findUnique.mockResolvedValue(null);
      subscriptionsService.getActiveTier.mockResolvedValue(SubscriptionTier.FREE);
      prisma.bountyInvitation.findFirst.mockResolvedValue(null);

      await expect(
        service.applyToBounty('user-1', 'bounty-1', {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.applyToBounty('user-1', 'bounty-1', {}),
      ).rejects.toThrow(
        'Pro subscription required to apply to closed bounties without an invitation. Upgrade to Pro to apply.',
      );
    });

    it('should allow FREE tier user with a valid invitation', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyApplication.findUnique.mockResolvedValue(null);
      subscriptionsService.getActiveTier.mockResolvedValue(SubscriptionTier.FREE);
      prisma.bountyInvitation.findFirst.mockResolvedValue(baseInvitation);
      prisma.bountyApplication.create.mockResolvedValue(baseApplication);

      const result = await service.applyToBounty('user-1', 'bounty-1', {
        message: 'I want to apply',
      });

      expect(result.id).toBe('app-1');
      expect(result.status).toBe(BountyApplicationStatus.PENDING);
      expect(prisma.bountyApplication.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when bounty does not exist', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.applyToBounty('user-1', 'nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when bounty is soft-deleted', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...closedLiveBounty,
        deletedAt: new Date(),
      });

      await expect(
        service.applyToBounty('user-1', 'bounty-1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════
  // withdrawApplication
  // ══════════════════════════════════════════════════════════

  describe('withdrawApplication', () => {
    it('should withdraw a pending application successfully', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue(baseApplication);
      prisma.bountyApplication.update.mockResolvedValue({
        ...baseApplication,
        status: BountyApplicationStatus.WITHDRAWN,
      });

      const result = await service.withdrawApplication('user-1', 'bounty-1');

      expect(result).toEqual({ message: 'Application withdrawn successfully' });
      expect(prisma.bountyApplication.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { status: BountyApplicationStatus.WITHDRAWN },
      });
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.withdrawApplication('user-1', 'bounty-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.withdrawApplication('user-1', 'bounty-1'),
      ).rejects.toThrow('Application not found');
    });

    it('should throw BadRequestException when application is not PENDING', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue({
        ...baseApplication,
        status: BountyApplicationStatus.APPROVED,
      });

      await expect(
        service.withdrawApplication('user-1', 'bounty-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.withdrawApplication('user-1', 'bounty-1'),
      ).rejects.toThrow('Only pending applications can be withdrawn');
    });
  });

  // ══════════════════════════════════════════════════════════
  // reviewApplication
  // ══════════════════════════════════════════════════════════

  describe('reviewApplication', () => {
    const applicationWithBounty = {
      ...baseApplication,
      bounty: closedLiveBounty,
    };

    it('should approve a pending application successfully', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue(applicationWithBounty);
      const reviewedAt = new Date();
      prisma.bountyApplication.update.mockResolvedValue({
        ...baseApplication,
        status: BountyApplicationStatus.APPROVED,
        reviewedBy: 'admin-1',
        reviewNote: 'Looks good',
        reviewedAt,
      });

      const result = await service.reviewApplication('app-1', mockAdmin, {
        status: 'APPROVED',
        reviewNote: 'Looks good',
      });

      expect(result.status).toBe(BountyApplicationStatus.APPROVED);
      expect(result.reviewNote).toBe('Looks good');
      expect(result.reviewedAt).toBe(reviewedAt.toISOString());
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'admin-1',
          action: 'application.approved',
          entityType: 'BountyApplication',
          entityId: 'app-1',
        }),
      );
    });

    it('should reject a pending application successfully', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue(applicationWithBounty);
      const reviewedAt = new Date();
      prisma.bountyApplication.update.mockResolvedValue({
        ...baseApplication,
        status: BountyApplicationStatus.REJECTED,
        reviewedBy: 'admin-1',
        reviewNote: 'Not suitable',
        reviewedAt,
      });

      const result = await service.reviewApplication('app-1', mockAdmin, {
        status: 'REJECTED',
        reviewNote: 'Not suitable',
      });

      expect(result.status).toBe(BountyApplicationStatus.REJECTED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'application.rejected',
        }),
      );
    });

    it('should throw NotFoundException when application does not exist', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewApplication('nonexistent', mockAdmin, {
          status: 'APPROVED',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.reviewApplication('nonexistent', mockAdmin, {
          status: 'APPROVED',
        }),
      ).rejects.toThrow('Application not found');
    });

    it('should throw BadRequestException when application is not PENDING', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue({
        ...applicationWithBounty,
        status: BountyApplicationStatus.APPROVED,
      });

      await expect(
        service.reviewApplication('app-1', mockAdmin, {
          status: 'APPROVED',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.reviewApplication('app-1', mockAdmin, {
          status: 'APPROVED',
        }),
      ).rejects.toThrow('Only pending applications can be reviewed');
    });

    it('should throw ForbiddenException when admin is not from the same org', async () => {
      const otherAdmin: AuthenticatedUser = {
        sub: 'admin-2',
        email: 'other@test.com',
        role: UserRole.BUSINESS_ADMIN,
        brandId: 'org-other',
      };

      prisma.bountyApplication.findUnique.mockResolvedValue(applicationWithBounty);

      await expect(
        service.reviewApplication('app-1', otherAdmin, {
          status: 'APPROVED',
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.reviewApplication('app-1', otherAdmin, {
          status: 'APPROVED',
        }),
      ).rejects.toThrow('Not authorized');
    });

    it('should allow SUPER_ADMIN to review applications from any org', async () => {
      prisma.bountyApplication.findUnique.mockResolvedValue(applicationWithBounty);
      const reviewedAt = new Date();
      prisma.bountyApplication.update.mockResolvedValue({
        ...baseApplication,
        status: BountyApplicationStatus.APPROVED,
        reviewedBy: 'sa-1',
        reviewNote: null,
        reviewedAt,
      });

      const result = await service.reviewApplication('app-1', mockSuperAdmin, {
        status: 'APPROVED',
      });

      expect(result.status).toBe(BountyApplicationStatus.APPROVED);
    });
  });

  // ══════════════════════════════════════════════════════════
  // createInvitations
  // ══════════════════════════════════════════════════════════

  describe('createInvitations', () => {
    it('should create invitations successfully', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyInvitation.count.mockResolvedValue(0);
      prisma.userSocialHandle.findUnique.mockResolvedValue(null);
      prisma.bountyInvitation.findUnique.mockResolvedValue(null);
      prisma.bountyInvitation.create.mockResolvedValue({
        ...baseInvitation,
        userId: null,
      });

      const result = await service.createInvitations(
        'bounty-1',
        mockAdmin,
        [{ platform: 'X', handle: '@TestUser' }],
      );

      expect(result.created).toBe(1);
      expect(result.invitations).toHaveLength(1);
      expect(result.invitations[0].socialHandle).toBe('testuser');

      // Verify handle was normalized (lowercased, @ removed)
      expect(prisma.bountyInvitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          socialHandle: 'testuser',
          socialPlatform: 'X',
          bountyId: 'bounty-1',
          invitedBy: 'admin-1',
          status: BountyInvitationStatus.PENDING,
        }),
      });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'invitation.create',
          afterState: { count: 1 },
        }),
      );
    });

    it('should throw BadRequestException when exceeding max invitations', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyInvitation.count.mockResolvedValue(99);

      await expect(
        service.createInvitations('bounty-1', mockAdmin, [
          { platform: 'X', handle: 'user1' },
          { platform: 'X', handle: 'user2' },
        ]),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createInvitations('bounty-1', mockAdmin, [
          { platform: 'X', handle: 'user1' },
          { platform: 'X', handle: 'user2' },
        ]),
      ).rejects.toThrow('Cannot exceed 100 invitations per bounty');
    });

    it('should skip duplicate invitations silently', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyInvitation.count.mockResolvedValue(0);
      prisma.userSocialHandle.findUnique.mockResolvedValue(null);
      // First invitation is a duplicate, second is new
      prisma.bountyInvitation.findUnique
        .mockResolvedValueOnce({ id: 'existing-inv' }) // duplicate
        .mockResolvedValueOnce(null); // new
      prisma.bountyInvitation.create.mockResolvedValue({
        ...baseInvitation,
        id: 'inv-2',
        socialHandle: 'newuser',
      });

      const result = await service.createInvitations('bounty-1', mockAdmin, [
        { platform: 'X', handle: 'existinguser' },
        { platform: 'X', handle: 'newuser' },
      ]);

      expect(result.created).toBe(1);
      expect(prisma.bountyInvitation.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException when admin is not from the same org', async () => {
      const otherAdmin: AuthenticatedUser = {
        sub: 'admin-2',
        email: 'other@test.com',
        role: UserRole.BUSINESS_ADMIN,
        brandId: 'org-other',
      };

      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);

      await expect(
        service.createInvitations('bounty-1', otherAdmin, [
          { platform: 'X', handle: 'user1' },
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should link invitation to existing user when social handle matches', async () => {
      prisma.bounty.findUnique.mockResolvedValue(closedLiveBounty);
      prisma.bountyInvitation.count.mockResolvedValue(0);
      prisma.userSocialHandle.findUnique.mockResolvedValue({
        userId: 'matched-user-id',
        platform: 'X',
        normalizedHandle: 'knownuser',
      });
      prisma.bountyInvitation.findUnique.mockResolvedValue(null);
      prisma.bountyInvitation.create.mockResolvedValue({
        ...baseInvitation,
        userId: 'matched-user-id',
        socialHandle: 'knownuser',
      });

      const result = await service.createInvitations('bounty-1', mockAdmin, [
        { platform: 'X', handle: 'KnownUser' },
      ]);

      expect(prisma.bountyInvitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'matched-user-id',
        }),
      });
      expect(result.created).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════
  // revokeInvitation
  // ══════════════════════════════════════════════════════════

  describe('revokeInvitation', () => {
    const invitationWithBounty = {
      ...baseInvitation,
      bounty: closedLiveBounty,
    };

    it('should revoke a pending invitation successfully', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(invitationWithBounty);
      prisma.bountyInvitation.delete.mockResolvedValue(invitationWithBounty);

      const result = await service.revokeInvitation('inv-1', mockAdmin);

      expect(result).toEqual({ message: 'Invitation revoked successfully' });
      expect(prisma.bountyInvitation.delete).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'invitation.revoke',
          entityType: 'BountyInvitation',
          entityId: 'inv-1',
        }),
      );
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(null);

      await expect(
        service.revokeInvitation('nonexistent', mockAdmin),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.revokeInvitation('nonexistent', mockAdmin),
      ).rejects.toThrow('Invitation not found');
    });

    it('should throw BadRequestException when invitation is not PENDING', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue({
        ...invitationWithBounty,
        status: BountyInvitationStatus.ACCEPTED,
      });

      await expect(
        service.revokeInvitation('inv-1', mockAdmin),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.revokeInvitation('inv-1', mockAdmin),
      ).rejects.toThrow('Only pending invitations can be revoked');
    });
  });

  // ══════════════════════════════════════════════════════════
  // acceptInvitation
  // ══════════════════════════════════════════════════════════

  describe('acceptInvitation', () => {
    it('should accept a pending invitation successfully', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(baseInvitation);
      const respondedAt = new Date();
      prisma.bountyInvitation.update.mockResolvedValue({
        ...baseInvitation,
        status: BountyInvitationStatus.ACCEPTED,
        respondedAt,
      });

      const result = await service.acceptInvitation('inv-1', 'user-1');

      expect(result.status).toBe(BountyInvitationStatus.ACCEPTED);
      expect(result.respondedAt).toBe(respondedAt.toISOString());
      expect(prisma.bountyInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: {
          status: BountyInvitationStatus.ACCEPTED,
          respondedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptInvitation('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.acceptInvitation('nonexistent', 'user-1'),
      ).rejects.toThrow('Invitation not found');
    });

    it('should throw ForbiddenException when user does not own the invitation', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(baseInvitation);

      await expect(
        service.acceptInvitation('inv-1', 'wrong-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.acceptInvitation('inv-1', 'wrong-user'),
      ).rejects.toThrow('Not authorized');
    });

    it('should throw BadRequestException when invitation is not PENDING', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue({
        ...baseInvitation,
        status: BountyInvitationStatus.ACCEPTED,
      });

      await expect(
        service.acceptInvitation('inv-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.acceptInvitation('inv-1', 'user-1'),
      ).rejects.toThrow('Only pending invitations can be accepted');
    });
  });

  // ══════════════════════════════════════════════════════════
  // declineInvitation
  // ══════════════════════════════════════════════════════════

  describe('declineInvitation', () => {
    it('should decline a pending invitation successfully', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(baseInvitation);
      const respondedAt = new Date();
      prisma.bountyInvitation.update.mockResolvedValue({
        ...baseInvitation,
        status: BountyInvitationStatus.DECLINED,
        respondedAt,
      });

      const result = await service.declineInvitation('inv-1', 'user-1');

      expect(result.status).toBe(BountyInvitationStatus.DECLINED);
      expect(result.respondedAt).toBe(respondedAt.toISOString());
      expect(prisma.bountyInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: {
          status: BountyInvitationStatus.DECLINED,
          respondedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when invitation does not exist', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(null);

      await expect(
        service.declineInvitation('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.declineInvitation('nonexistent', 'user-1'),
      ).rejects.toThrow('Invitation not found');
    });

    it('should throw ForbiddenException when user does not own the invitation', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue(baseInvitation);

      await expect(
        service.declineInvitation('inv-1', 'wrong-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.declineInvitation('inv-1', 'wrong-user'),
      ).rejects.toThrow('Not authorized');
    });

    it('should throw BadRequestException when invitation is not PENDING', async () => {
      prisma.bountyInvitation.findUnique.mockResolvedValue({
        ...baseInvitation,
        status: BountyInvitationStatus.DECLINED,
      });

      await expect(
        service.declineInvitation('inv-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.declineInvitation('inv-1', 'user-1'),
      ).rejects.toThrow('Only pending invitations can be declined');
    });
  });

  // ══════════════════════════════════════════════════════════
  // canSubmitToBounty
  // ══════════════════════════════════════════════════════════

  describe('canSubmitToBounty', () => {
    it('should return true for a PUBLIC bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        accessType: BountyAccessType.PUBLIC,
      });

      const result = await service.canSubmitToBounty('user-1', 'bounty-2');

      expect(result).toBe(true);
      // Should not check applications or invitations for public bounties
      expect(prisma.bountyApplication.findFirst).not.toHaveBeenCalled();
      expect(prisma.bountyInvitation.findFirst).not.toHaveBeenCalled();
    });

    it('should return true when user has an approved application', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        accessType: BountyAccessType.CLOSED,
      });
      prisma.bountyApplication.findFirst.mockResolvedValue({
        id: 'app-1',
        status: BountyApplicationStatus.APPROVED,
      });

      const result = await service.canSubmitToBounty('user-1', 'bounty-1');

      expect(result).toBe(true);
      expect(prisma.bountyApplication.findFirst).toHaveBeenCalledWith({
        where: {
          bountyId: 'bounty-1',
          userId: 'user-1',
          status: BountyApplicationStatus.APPROVED,
        },
      });
    });

    it('should return true when user has an accepted invitation', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        accessType: BountyAccessType.CLOSED,
      });
      prisma.bountyApplication.findFirst.mockResolvedValue(null);
      prisma.bountyInvitation.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: BountyInvitationStatus.ACCEPTED,
      });

      const result = await service.canSubmitToBounty('user-1', 'bounty-1');

      expect(result).toBe(true);
      expect(prisma.bountyInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          bountyId: 'bounty-1',
          userId: 'user-1',
          status: BountyInvitationStatus.ACCEPTED,
        },
      });
    });

    it('should return false when user has no access to a closed bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        accessType: BountyAccessType.CLOSED,
      });
      prisma.bountyApplication.findFirst.mockResolvedValue(null);
      prisma.bountyInvitation.findFirst.mockResolvedValue(null);

      const result = await service.canSubmitToBounty('user-1', 'bounty-1');

      expect(result).toBe(false);
    });

    it('should return false when bounty does not exist', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      const result = await service.canSubmitToBounty('user-1', 'nonexistent');

      expect(result).toBe(false);
    });
  });
});
