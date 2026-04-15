import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import { SettingsService } from '../../settings/settings.service';
import {
  UserRole,
  UserStatus,
  BrandStatus,
  BountyStatus,
  SubmissionStatus,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  PAGINATION_DEFAULTS,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../../auth/jwt.strategy';

describe('AdminService - Edge Cases', () => {
  let service: AdminService;
  let prisma: any;
  let auditService: { log: jest.Mock };
  let mailService: Record<string, jest.Mock>;
  let settingsService: {
    isSignupEnabled: jest.Mock;
    isSubmissionEnabled: jest.Mock;
    getSettings: jest.Mock;
    updateSettings: jest.Mock;
  };

  const mockSA: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'admin@test.com',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  };

  const mockSA2: AuthenticatedUser = {
    sub: 'sa-2',
    email: 'admin2@test.com',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      brand: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      brandMember: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      bounty: {
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      submission: {
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    auditService = { log: jest.fn() };
    mailService = {};
    settingsService = {
      isSignupEnabled: jest.fn().mockResolvedValue(true),
      isSubmissionEnabled: jest.fn().mockResolvedValue(true),
      getSettings: jest.fn().mockResolvedValue({
        signupsEnabled: true,
        submissionsEnabled: true,
        updatedAt: new Date('2026-02-07T00:00:00Z'),
        updatedById: null,
      }),
      updateSettings: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  // ── Settings Integration ──────────────────────────────────────

  describe('settings integration', () => {
    it('isSignupEnabled should delegate to settingsService', async () => {
      settingsService.isSignupEnabled.mockResolvedValue(false);
      expect(await service.isSignupEnabled()).toBe(false);

      settingsService.isSignupEnabled.mockResolvedValue(true);
      expect(await service.isSignupEnabled()).toBe(true);
    });

    it('isSubmissionEnabled should delegate to settingsService', async () => {
      settingsService.isSubmissionEnabled.mockResolvedValue(false);
      expect(await service.isSubmissionEnabled()).toBe(false);

      settingsService.isSubmissionEnabled.mockResolvedValue(true);
      expect(await service.isSubmissionEnabled()).toBe(true);
    });

    it('getSettings should return settings with updatedBy when updatedById exists', async () => {
      settingsService.getSettings.mockResolvedValue({
        signupsEnabled: false,
        submissionsEnabled: true,
        updatedAt: new Date('2026-02-07T12:00:00Z'),
        updatedById: 'sa-1',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'sa-1',
        email: 'admin@test.com',
      });

      const result = await service.getSettings();

      expect(result.signupsEnabled).toBe(false);
      expect(result.submissionsEnabled).toBe(true);
      expect(result.updatedBy).toEqual({ id: 'sa-1', email: 'admin@test.com' });
    });

    it('getSettings should return updatedBy as null when updatedById is null', async () => {
      settingsService.getSettings.mockResolvedValue({
        signupsEnabled: true,
        submissionsEnabled: true,
        updatedAt: new Date('2026-02-07T00:00:00Z'),
        updatedById: null,
      });

      const result = await service.getSettings();

      expect(result.updatedBy).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('getSettings should return updatedBy as null when updatedById user was deleted', async () => {
      settingsService.getSettings.mockResolvedValue({
        signupsEnabled: true,
        submissionsEnabled: true,
        updatedAt: new Date('2026-02-07T00:00:00Z'),
        updatedById: 'deleted-user',
      });
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getSettings();

      expect(result.updatedBy).toBeNull();
    });

    it('updateSettings should pass data through to settingsService and audit log', async () => {
      const beforeSettings = {
        signupsEnabled: true,
        submissionsEnabled: true,
        updatedAt: new Date('2026-02-07T00:00:00Z'),
        updatedById: null,
      };
      const afterSettings = {
        signupsEnabled: false,
        submissionsEnabled: true,
        updatedAt: new Date('2026-02-07T12:00:00Z'),
        updatedById: 'sa-1',
      };

      settingsService.getSettings
        .mockResolvedValueOnce(beforeSettings)
        .mockResolvedValueOnce(afterSettings)
        .mockResolvedValueOnce(afterSettings);

      prisma.user.findUnique.mockResolvedValue({
        id: 'sa-1',
        email: 'admin@test.com',
      });

      const result = await service.updateSettings(
        mockSA,
        { signupsEnabled: false },
        '10.0.0.1',
      );

      expect(settingsService.updateSettings).toHaveBeenCalledWith({
        signupsEnabled: false,
        submissionsEnabled: undefined,
        updatedById: 'sa-1',
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.SETTINGS_UPDATE,
          entityType: ENTITY_TYPES.SETTINGS,
          entityId: 'global',
          beforeState: { signupsEnabled: true, submissionsEnabled: true },
          afterState: { signupsEnabled: false, submissionsEnabled: true },
          ipAddress: '10.0.0.1',
        }),
      );
      expect(result.signupsEnabled).toBe(false);
    });

    it('updateSettings should handle toggling both settings at once', async () => {
      const beforeSettings = {
        signupsEnabled: true,
        submissionsEnabled: true,
        updatedAt: new Date('2026-02-07T00:00:00Z'),
        updatedById: null,
      };
      const afterSettings = {
        signupsEnabled: false,
        submissionsEnabled: false,
        updatedAt: new Date('2026-02-07T12:00:00Z'),
        updatedById: 'sa-1',
      };

      settingsService.getSettings
        .mockResolvedValueOnce(beforeSettings)
        .mockResolvedValueOnce(afterSettings)
        .mockResolvedValueOnce(afterSettings);

      prisma.user.findUnique.mockResolvedValue({
        id: 'sa-1',
        email: 'admin@test.com',
      });

      const result = await service.updateSettings(
        mockSA,
        { signupsEnabled: false, submissionsEnabled: false },
      );

      expect(settingsService.updateSettings).toHaveBeenCalledWith({
        signupsEnabled: false,
        submissionsEnabled: false,
        updatedById: 'sa-1',
      });
      expect(result.signupsEnabled).toBe(false);
      expect(result.submissionsEnabled).toBe(false);
    });
  });

  // ── Override Submission - Audit Logging ────────────────────────

  describe('overrideSubmission - audit logging', () => {
    it('should record before and after status in audit log', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.SUBMITTED,
      });
      prisma.submission.update.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.APPROVED,
        reviewedBy: { id: 'sa-1', firstName: 'Admin', lastName: 'User' },
        updatedAt: new Date(),
      });

      await service.overrideSubmission(
        'sub-1',
        mockSA,
        SubmissionStatus.APPROVED,
        'Valid submission found via support',
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'sa-1',
          actorRole: UserRole.SUPER_ADMIN,
          action: AUDIT_ACTIONS.SUBMISSION_OVERRIDE,
          entityType: ENTITY_TYPES.SUBMISSION,
          entityId: 'sub-1',
          beforeState: { status: SubmissionStatus.SUBMITTED },
          afterState: { status: SubmissionStatus.APPROVED },
          reason: 'Valid submission found via support',
        }),
      );
    });

    it('should set reviewedById to the acting admin on override', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.REJECTED,
      });
      prisma.submission.update.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.APPROVED,
        reviewedBy: { id: 'sa-1', firstName: 'Admin', lastName: 'User' },
        updatedAt: new Date(),
      });

      await service.overrideSubmission(
        'sub-1',
        mockSA,
        SubmissionStatus.APPROVED,
        'Override reason',
      );

      expect(prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubmissionStatus.APPROVED,
            reviewedById: 'sa-1',
          }),
        }),
      );
    });

    it('should override from NEEDS_MORE_INFO to REJECTED with audit trail', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 'sub-2',
        status: SubmissionStatus.NEEDS_MORE_INFO,
      });
      prisma.submission.update.mockResolvedValue({
        id: 'sub-2',
        status: SubmissionStatus.REJECTED,
        reviewedBy: { id: 'sa-1', firstName: 'Admin', lastName: 'User' },
        updatedAt: new Date(),
      });

      const result = await service.overrideSubmission(
        'sub-2',
        mockSA,
        SubmissionStatus.REJECTED,
        'Non-responsive participant',
      );

      expect(result.status).toBe(SubmissionStatus.REJECTED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeState: { status: SubmissionStatus.NEEDS_MORE_INFO },
          afterState: { status: SubmissionStatus.REJECTED },
        }),
      );
    });

    it('should override from IN_REVIEW to APPROVED with audit trail', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 'sub-3',
        status: SubmissionStatus.IN_REVIEW,
      });
      prisma.submission.update.mockResolvedValue({
        id: 'sub-3',
        status: SubmissionStatus.APPROVED,
        reviewedBy: { id: 'sa-2', firstName: 'Another', lastName: 'Admin' },
        updatedAt: new Date(),
      });

      const result = await service.overrideSubmission(
        'sub-3',
        mockSA2,
        SubmissionStatus.APPROVED,
        'Expedited approval',
      );

      expect(result.status).toBe(SubmissionStatus.APPROVED);
      expect(result.reviewedBy).toEqual({
        id: 'sa-2',
        firstName: 'Another',
        lastName: 'Admin',
      });
    });

    it('should include ipAddress in audit log for submission override', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.SUBMITTED,
      });
      prisma.submission.update.mockResolvedValue({
        id: 'sub-1',
        status: SubmissionStatus.REJECTED,
        reviewedBy: { id: 'sa-1', firstName: 'Admin', lastName: 'User' },
        updatedAt: new Date(),
      });

      await service.overrideSubmission(
        'sub-1',
        mockSA,
        SubmissionStatus.REJECTED,
        'Fraudulent',
        '172.16.0.1',
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '172.16.0.1',
        }),
      );
    });
  });

  // ── Cannot Suspend Own Account ────────────────────────────────

  describe('updateUserStatus - self-action prevention', () => {
    it('should throw BadRequestException when admin tries to suspend themselves', async () => {
      await expect(
        service.updateUserStatus(
          'sa-1',
          mockSA,
          UserStatus.SUSPENDED,
          'Self-suspension attempt',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateUserStatus(
          'sa-1',
          mockSA,
          UserStatus.SUSPENDED,
          'Self-suspension attempt',
        ),
      ).rejects.toThrow('Cannot change your own status');
    });

    it('should not query the database when self-action is detected', async () => {
      try {
        await service.updateUserStatus(
          'sa-1',
          mockSA,
          UserStatus.SUSPENDED,
          'Self attempt',
        );
      } catch {
        // expected
      }

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should not log an audit entry when self-action is prevented', async () => {
      try {
        await service.updateUserStatus(
          'sa-1',
          mockSA,
          UserStatus.ACTIVE,
          'Self status change',
        );
      } catch {
        // expected
      }

      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent self-activation (not just self-suspension)', async () => {
      await expect(
        service.updateUserStatus(
          'sa-1',
          mockSA,
          UserStatus.ACTIVE,
          'Self-activate attempt',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Cannot Change Own Role (via status of another SUPER_ADMIN) ─

  describe('updateUserStatus - cannot change another Super Admin', () => {
    it('should throw BadRequestException when trying to suspend another Super Admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'sa-2',
        status: UserStatus.ACTIVE,
        role: UserRole.SUPER_ADMIN,
      });

      await expect(
        service.updateUserStatus(
          'sa-2',
          mockSA,
          UserStatus.SUSPENDED,
          'Attempted suspension',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateUserStatus(
          'sa-2',
          mockSA,
          UserStatus.SUSPENDED,
          'Attempted suspension',
        ),
      ).rejects.toThrow('Cannot change status of another Super Admin');
    });

    it('should not update the database when target is a Super Admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'sa-2',
        status: UserStatus.ACTIVE,
        role: UserRole.SUPER_ADMIN,
      });

      try {
        await service.updateUserStatus(
          'sa-2',
          mockSA,
          UserStatus.SUSPENDED,
          'Attempted',
        );
      } catch {
        // expected
      }

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  // ── Dashboard Aggregated Data ─────────────────────────────────

  describe('getDashboard - aggregated data', () => {
    const setupDashboardMocks = (overrides?: {
      userCounts?: number[];
      orgCounts?: number[];
      bountyCounts?: number[];
      submissionCounts?: number[];
    }) => {
      const userCounts = overrides?.userCounts || [0, 0, 0, 0, 0, 0];
      const orgCounts = overrides?.orgCounts || [0, 0, 0];
      const bountyCounts = overrides?.bountyCounts || [0, 0, 0, 0, 0];
      const submissionCounts = overrides?.submissionCounts || [0, 0, 0, 0, 0, 0, 0, 0, 0];

      userCounts.forEach((v) => prisma.user.count.mockResolvedValueOnce(v));
      orgCounts.forEach((v) => prisma.brand.count.mockResolvedValueOnce(v));
      bountyCounts.forEach((v) => prisma.bounty.count.mockResolvedValueOnce(v));
      submissionCounts.forEach((v) => prisma.submission.count.mockResolvedValueOnce(v));
    };

    it('should return all zeros for an empty platform', async () => {
      setupDashboardMocks();

      const result = await service.getDashboard();

      expect(result.users.total).toBe(0);
      expect(result.users.active).toBe(0);
      expect(result.users.suspended).toBe(0);
      expect(result.users.byRole.PARTICIPANT).toBe(0);
      expect(result.users.byRole.BUSINESS_ADMIN).toBe(0);
      expect(result.users.byRole.SUPER_ADMIN).toBe(0);
      expect(result.organisations.total).toBe(0);
      expect(result.organisations.active).toBe(0);
      expect(result.organisations.suspended).toBe(0);
      expect(result.bounties.total).toBe(0);
      expect(result.bounties.byStatus.DRAFT).toBe(0);
      expect(result.bounties.byStatus.LIVE).toBe(0);
      expect(result.bounties.byStatus.PAUSED).toBe(0);
      expect(result.bounties.byStatus.CLOSED).toBe(0);
      expect(result.submissions.total).toBe(0);
      expect(result.submissions.byStatus.SUBMITTED).toBe(0);
      expect(result.submissions.byStatus.IN_REVIEW).toBe(0);
      expect(result.submissions.byStatus.NEEDS_MORE_INFO).toBe(0);
      expect(result.submissions.byStatus.APPROVED).toBe(0);
      expect(result.submissions.byStatus.REJECTED).toBe(0);
      expect(result.submissions.byPayoutStatus.NOT_PAID).toBe(0);
      expect(result.submissions.byPayoutStatus.PENDING).toBe(0);
      expect(result.submissions.byPayoutStatus.PAID).toBe(0);
    });

    it('should reflect correct role breakdown totals', async () => {
      setupDashboardMocks({
        // total=100, active=95, suspended=5, participant=80, BA=15, SA=5
        userCounts: [100, 95, 5, 80, 15, 5],
        orgCounts: [10, 9, 1],
        bountyCounts: [50, 5, 30, 5, 10],
        submissionCounts: [200, 50, 30, 10, 80, 30, 60, 10, 10],
      });

      const result = await service.getDashboard();

      expect(result.users.total).toBe(100);
      expect(result.users.byRole.PARTICIPANT).toBe(80);
      expect(result.users.byRole.BUSINESS_ADMIN).toBe(15);
      expect(result.users.byRole.SUPER_ADMIN).toBe(5);
    });

    it('should reflect correct bounty status breakdown', async () => {
      setupDashboardMocks({
        userCounts: [10, 10, 0, 8, 1, 1],
        orgCounts: [1, 1, 0],
        bountyCounts: [20, 3, 12, 2, 3],
        submissionCounts: [100, 20, 10, 5, 50, 15, 30, 10, 10],
      });

      const result = await service.getDashboard();

      expect(result.bounties.total).toBe(20);
      expect(result.bounties.byStatus.DRAFT).toBe(3);
      expect(result.bounties.byStatus.LIVE).toBe(12);
      expect(result.bounties.byStatus.PAUSED).toBe(2);
      expect(result.bounties.byStatus.CLOSED).toBe(3);
    });

    it('should reflect correct submission and payout status breakdown', async () => {
      setupDashboardMocks({
        userCounts: [50, 48, 2, 40, 8, 2],
        orgCounts: [5, 4, 1],
        bountyCounts: [30, 5, 15, 3, 7],
        submissionCounts: [500, 100, 50, 25, 250, 75, 150, 50, 50],
      });

      const result = await service.getDashboard();

      expect(result.submissions.total).toBe(500);
      expect(result.submissions.byStatus.SUBMITTED).toBe(100);
      expect(result.submissions.byStatus.IN_REVIEW).toBe(50);
      expect(result.submissions.byStatus.NEEDS_MORE_INFO).toBe(25);
      expect(result.submissions.byStatus.APPROVED).toBe(250);
      expect(result.submissions.byStatus.REJECTED).toBe(75);
      expect(result.submissions.byPayoutStatus.NOT_PAID).toBe(150);
      expect(result.submissions.byPayoutStatus.PENDING).toBe(50);
      expect(result.submissions.byPayoutStatus.PAID).toBe(50);
    });

    it('should make exactly 23 count queries', async () => {
      setupDashboardMocks({
        userCounts: [1, 1, 0, 1, 0, 0],
        orgCounts: [0, 0, 0],
        bountyCounts: [0, 0, 0, 0, 0],
        submissionCounts: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      });

      await service.getDashboard();

      expect(prisma.user.count).toHaveBeenCalledTimes(6);
      expect(prisma.brand.count).toHaveBeenCalledTimes(3);
      expect(prisma.bounty.count).toHaveBeenCalledTimes(5);
      expect(prisma.submission.count).toHaveBeenCalledTimes(9);
    });
  });

  // ── User Management Edge Cases ────────────────────────────────

  describe('getUserDetail - edge cases', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserDetail('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getUserDetail('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });

    it('should return organisation as null when user has no memberships', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'lonely@test.com',
        firstName: 'Lonely',
        lastName: 'User',
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        brandMemberships: [],
        _count: { submissions: 0 },
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      prisma.submission.count.mockResolvedValue(0);

      const result = await service.getUserDetail('user-1');

      expect(result.brand).toBeNull();
      expect(result.submissionCount).toBe(0);
      expect(result.approvedSubmissionCount).toBe(0);
    });

    it('should return correct organisation info when user has membership', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'member@test.com',
        firstName: 'Member',
        lastName: 'User',
        role: UserRole.BUSINESS_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        brandMemberships: [
          {
            brand: { id: 'org-1', name: 'Test Corp' },
          },
        ],
        _count: { submissions: 5 },
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-02-01'),
      });
      prisma.submission.count.mockResolvedValue(3);

      const result = await service.getUserDetail('user-2');

      expect(result.brand).toEqual({ id: 'org-1', name: 'Test Corp' });
      expect(result.submissionCount).toBe(5);
      expect(result.approvedSubmissionCount).toBe(3);
    });
  });

  describe('updateUserStatus - user not found', () => {
    it('should throw NotFoundException when target user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserStatus(
          'ghost-user',
          mockSA,
          UserStatus.SUSPENDED,
          'Nonexistent user',
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.updateUserStatus(
          'ghost-user',
          mockSA,
          UserStatus.SUSPENDED,
          'Nonexistent user',
        ),
      ).rejects.toThrow('User not found');
    });

    it('should not update or audit when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      try {
        await service.updateUserStatus(
          'ghost-user',
          mockSA,
          UserStatus.SUSPENDED,
          'Nonexistent',
        );
      } catch {
        // expected
      }

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  // ── listUsers - edge cases ────────────────────────────────────

  describe('listUsers - edge cases', () => {
    it('should apply default pagination when no params given', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.listUsers({});

      expect(result.meta.page).toBe(PAGINATION_DEFAULTS.PAGE);
      expect(result.meta.limit).toBe(PAGINATION_DEFAULTS.LIMIT);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should cap limit to MAX_LIMIT when excessive value is provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.listUsers({ limit: 999 });

      expect(result.meta.limit).toBe(PAGINATION_DEFAULTS.MAX_LIMIT);
    });

    it('should build search filter using OR across email, firstName, lastName, id', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers({ search: 'test@example.com' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: 'test@example.com', mode: 'insensitive' } },
              { firstName: { contains: 'test@example.com', mode: 'insensitive' } },
              { lastName: { contains: 'test@example.com', mode: 'insensitive' } },
              { id: 'test@example.com' },
            ]),
          }),
        }),
      );
    });

    it('should filter by role and status when both provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers({
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: UserRole.PARTICIPANT,
            status: UserStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should map user data correctly including organisation', async () => {
      const now = new Date('2026-02-07T10:00:00Z');
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u-1',
          email: 'alice@test.com',
          firstName: 'Alice',
          lastName: 'Smith',
          role: UserRole.BUSINESS_ADMIN,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          brandMemberships: [
            { brand: { id: 'org-1', name: 'Acme Inc' } },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'u-1',
        email: 'alice@test.com',
        firstName: 'Alice',
        lastName: 'Smith',
        role: UserRole.BUSINESS_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        brand: { id: 'org-1', name: 'Acme Inc' },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    });

    it('should return null organisation when user has no memberships', async () => {
      const now = new Date();
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u-2',
          email: 'bob@test.com',
          firstName: 'Bob',
          lastName: 'Jones',
          role: UserRole.PARTICIPANT,
          status: UserStatus.ACTIVE,
          emailVerified: false,
          brandMemberships: [],
          createdAt: now,
          updatedAt: now,
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers({});

      expect(result.data[0].brand).toBeNull();
    });
  });

  // ── createBrand - edge cases ───────────────────────────

  describe('createBrand - edge cases', () => {
    it('should throw BadRequestException when owner user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createBrand(
          mockSA,
          {
            name: 'New Org',
            contactEmail: 'org@test.com',
            ownerUserId: 'non-existent',
          },
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createBrand(
          mockSA,
          {
            name: 'New Org',
            contactEmail: 'org@test.com',
            ownerUserId: 'non-existent',
          },
        ),
      ).rejects.toThrow('Owner user not found');
    });

    it('should throw BadRequestException when user already belongs to an org', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
      });
      prisma.brandMember.findFirst.mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        brandId: 'existing-org',
      });

      await expect(
        service.createBrand(
          mockSA,
          {
            name: 'Second Org',
            contactEmail: 'org2@test.com',
            ownerUserId: 'user-1',
          },
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createBrand(
          mockSA,
          {
            name: 'Second Org',
            contactEmail: 'org2@test.com',
            ownerUserId: 'user-1',
          },
        ),
      ).rejects.toThrow('User already belongs to a brand');
    });

    it('should trim org name and lowercase contact email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
      });
      prisma.brandMember.findFirst.mockResolvedValue(null);

      const createdOrg = {
        id: 'org-new',
        name: 'Trimmed Corp',
        contactEmail: 'contact@test.com',
        logo: null,
        status: BrandStatus.ACTIVE,
        createdAt: new Date(),
      };
      prisma.brand.create.mockResolvedValue(createdOrg);
      prisma.brandMember.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      await service.createBrand(
        mockSA,
        {
          name: '  Trimmed Corp  ',
          contactEmail: '  Contact@Test.COM  ',
          ownerUserId: 'user-1',
        },
      );

      expect(prisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Trimmed Corp',
            contactEmail: 'contact@test.com',
          }),
        }),
      );
    });
  });

  // ── overrideBounty - edge cases ───────────────────────────────

  describe('overrideBounty - edge cases', () => {
    it('should override from DRAFT to CLOSED directly', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-1',
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.update.mockResolvedValue({
        id: 'bounty-1',
        status: BountyStatus.CLOSED,
        updatedAt: new Date(),
      });

      const result = await service.overrideBounty(
        'bounty-1',
        mockSA,
        BountyStatus.CLOSED,
        'Removed before launch',
      );

      expect(result.status).toBe(BountyStatus.CLOSED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeState: { status: BountyStatus.DRAFT },
          afterState: { status: BountyStatus.CLOSED },
        }),
      );
    });

    it('should override from PAUSED to LIVE directly', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-2',
        status: BountyStatus.PAUSED,
      });
      prisma.bounty.update.mockResolvedValue({
        id: 'bounty-2',
        status: BountyStatus.LIVE,
        updatedAt: new Date(),
      });

      const result = await service.overrideBounty(
        'bounty-2',
        mockSA,
        BountyStatus.LIVE,
        'Re-enabled by admin',
      );

      expect(result.status).toBe(BountyStatus.LIVE);
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.overrideBounty('ghost', mockSA, BountyStatus.CLOSED, 'Test'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Recent Errors - edge cases ────────────────────────────────

  describe('recordError and getRecentErrors', () => {
    it('should store and retrieve a recorded error', async () => {
      service.recordError({
        message: 'Test error',
        stackTrace: 'Error: Test\n  at test.ts:1',
        endpoint: '/api/test',
        userId: 'user-1',
        severity: 'error',
      });

      const result = await service.getRecentErrors({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].message).toBe('Test error');
      expect(result.data[0].endpoint).toBe('/api/test');
      expect(result.data[0].userId).toBe('user-1');
      expect(result.data[0].severity).toBe('error');
      expect(result.meta.total).toBe(1);
    });

    it('should default severity to "error" and userId to null', async () => {
      service.recordError({
        message: 'Default error',
        stackTrace: 'stack',
        endpoint: '/api/default',
      });

      const result = await service.getRecentErrors({});

      expect(result.data[0].severity).toBe('error');
      expect(result.data[0].userId).toBeNull();
    });

    it('should order errors newest first', async () => {
      service.recordError({
        message: 'First error',
        stackTrace: 'stack',
        endpoint: '/api/first',
      });
      service.recordError({
        message: 'Second error',
        stackTrace: 'stack',
        endpoint: '/api/second',
      });

      const result = await service.getRecentErrors({});

      expect(result.data[0].message).toBe('Second error');
      expect(result.data[1].message).toBe('First error');
    });

    it('should paginate recent errors correctly', async () => {
      for (let i = 0; i < 5; i++) {
        service.recordError({
          message: `Error ${i}`,
          stackTrace: 'stack',
          endpoint: `/api/err${i}`,
        });
      }

      const page1 = await service.getRecentErrors({ page: 1, limit: 2 });
      const page2 = await service.getRecentErrors({ page: 2, limit: 2 });
      const page3 = await service.getRecentErrors({ page: 3, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page3.data).toHaveLength(1);
      expect(page1.meta.total).toBe(5);
      expect(page1.meta.totalPages).toBe(3);
    });

    it('should return empty data for empty error store', async () => {
      const result = await service.getRecentErrors({});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  // ── Org Status - edge cases ───────────────────────────────────

  describe('updateBrandStatus - edge cases', () => {
    it('should throw NotFoundException for non-existent organisation', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBrandStatus(
          'ghost-org',
          mockSA,
          BrandStatus.SUSPENDED,
          'Test',
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.updateBrandStatus(
          'ghost-org',
          mockSA,
          BrandStatus.SUSPENDED,
          'Test',
        ),
      ).rejects.toThrow('Brand not found');
    });

    it('should not pause bounties when reinstating (setting to ACTIVE)', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.SUSPENDED,
      });
      prisma.brand.update.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.ACTIVE,
        updatedAt: new Date(),
      });

      await service.updateBrandStatus(
        'org-1',
        mockSA,
        BrandStatus.ACTIVE,
        'Reinstated',
      );

      expect(prisma.bounty.updateMany).not.toHaveBeenCalled();
    });

    it('should pause LIVE bounties when suspending', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.ACTIVE,
      });
      prisma.brand.update.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.SUSPENDED,
        updatedAt: new Date(),
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 2 });

      await service.updateBrandStatus(
        'org-1',
        mockSA,
        BrandStatus.SUSPENDED,
        'Policy violation',
      );

      expect(prisma.bounty.updateMany).toHaveBeenCalledWith({
        where: { brandId: 'org-1', status: BountyStatus.LIVE },
        data: { status: BountyStatus.PAUSED },
      });
    });

    it('should include before and after state in audit log for org status change', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.ACTIVE,
      });
      prisma.brand.update.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.SUSPENDED,
        updatedAt: new Date(),
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 0 });

      await service.updateBrandStatus(
        'org-1',
        mockSA,
        BrandStatus.SUSPENDED,
        'Compliance issue',
        '10.0.0.1',
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.BRAND_STATUS_CHANGE,
          entityType: ENTITY_TYPES.BRAND,
          entityId: 'org-1',
          beforeState: { status: BrandStatus.ACTIVE },
          afterState: { status: BrandStatus.SUSPENDED },
          reason: 'Compliance issue',
          ipAddress: '10.0.0.1',
        }),
      );
    });
  });

  // ── Audit Log - edge cases ────────────────────────────────────

  describe('getAuditLog - edge cases', () => {
    it('should throw NotFoundException for non-existent audit log entry', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(service.getAuditLog('non-existent')).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.getAuditLog('non-existent')).rejects.toThrow(
        'Audit log entry not found',
      );
    });
  });

  // ── listAuditLogs - edge cases ────────────────────────────────

  describe('listAuditLogs - edge cases', () => {
    it('should filter by entityType and entityId', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({
        entityType: ENTITY_TYPES.BOUNTY,
        entityId: 'bounty-123',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: ENTITY_TYPES.BOUNTY,
            entityId: 'bounty-123',
          }),
        }),
      );
    });

    it('should filter by action', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({ action: AUDIT_ACTIONS.SUBMISSION_OVERRIDE });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: AUDIT_ACTIONS.SUBMISSION_OVERRIDE,
          }),
        }),
      );
    });

    it('should handle startDate-only filter without endDate', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({ startDate: '2026-01-01' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: new Date('2026-01-01'),
            }),
          }),
        }),
      );
    });

    it('should handle endDate-only filter without startDate', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({ endDate: '2026-12-31' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lte: new Date('2026-12-31'),
            }),
          }),
        }),
      );
    });
  });

  // ── System Health - edge cases ────────────────────────────────

  describe('getSystemHealth - edge cases', () => {
    it('should include memory usage data', async () => {
      const result = await service.getSystemHealth();

      expect(result.memory).toBeDefined();
      expect(typeof result.memory.used).toBe('number');
      expect(typeof result.memory.total).toBe('number');
      expect(result.memory.used).toBeGreaterThan(0);
      expect(result.memory.total).toBeGreaterThan(0);
    });

    it('should include uptime as a positive number', async () => {
      const result = await service.getSystemHealth();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return timestamp as ISO string', async () => {
      const result = await service.getSystemHealth();

      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
