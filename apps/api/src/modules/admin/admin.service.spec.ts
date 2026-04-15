import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import {
  UserRole,
  UserStatus,
  BrandStatus,
  BountyStatus,
  SubmissionStatus,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;
  let auditService: { log: jest.Mock };
  let mailService: Record<string, jest.Mock>;

  const mockSA: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'admin@test.com',
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
      organisationMember: {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
        {
          provide: SettingsService,
          useValue: {
            isSignupEnabled: jest.fn().mockResolvedValue(true),
            isSubmissionEnabled: jest.fn().mockResolvedValue(true),
            getSettings: jest.fn().mockResolvedValue({
              signupsEnabled: true,
              submissionsEnabled: true,
              updatedAt: new Date(),
              updatedById: null,
            }),
            updateSettings: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  // ── updateUserStatus ────────────────────────────────

  describe('updateUserStatus', () => {
    it('should suspend an active user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.ACTIVE,
        role: UserRole.PARTICIPANT,
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.SUSPENDED,
        updatedAt: new Date(),
      });

      const result = await service.updateUserStatus(
        'user-1',
        mockSA,
        UserStatus.SUSPENDED,
        'Terms violation',
      );

      expect(result.status).toBe(UserStatus.SUSPENDED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.status_change',
          reason: 'Terms violation',
          beforeState: { status: UserStatus.ACTIVE },
          afterState: { status: UserStatus.SUSPENDED },
        }),
      );
    });

    it('should reinstate a suspended user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.SUSPENDED,
        role: UserRole.PARTICIPANT,
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        status: UserStatus.ACTIVE,
        updatedAt: new Date(),
      });

      const result = await service.updateUserStatus(
        'user-1',
        mockSA,
        UserStatus.ACTIVE,
        'Investigation cleared',
      );

      expect(result.status).toBe(UserStatus.ACTIVE);
    });

    it('should prevent self-suspension', async () => {
      await expect(
        service.updateUserStatus(
          'sa-1',
          mockSA,
          UserStatus.SUSPENDED,
          'Test',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent suspending another Super Admin', async () => {
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
          'Test',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserStatus(
          'non-existent',
          mockSA,
          UserStatus.SUSPENDED,
          'Test',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateBrandStatus ─────────────────────────────────

  describe('updateBrandStatus', () => {
    it('should suspend an organisation and pause LIVE bounties', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.ACTIVE,
      });
      prisma.brand.update.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.SUSPENDED,
        updatedAt: new Date(),
      });
      prisma.bounty.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.updateBrandStatus(
        'org-1',
        mockSA,
        BrandStatus.SUSPENDED,
        'Policy violation',
      );

      expect(result.status).toBe(BrandStatus.SUSPENDED);
      expect(prisma.bounty.updateMany).toHaveBeenCalledWith({
        where: { brandId: 'org-1', status: BountyStatus.LIVE },
        data: { status: BountyStatus.PAUSED },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'brand.status_change',
          reason: 'Policy violation',
        }),
      );
    });

    it('should reinstate an organisation without re-publishing bounties', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.SUSPENDED,
      });
      prisma.brand.update.mockResolvedValue({
        id: 'org-1',
        status: BrandStatus.ACTIVE,
        updatedAt: new Date(),
      });

      const result = await service.updateBrandStatus(
        'org-1',
        mockSA,
        BrandStatus.ACTIVE,
        'Investigation resolved',
      );

      expect(result.status).toBe(BrandStatus.ACTIVE);
      // bounty.updateMany should NOT be called for reinstatement
      expect(prisma.bounty.updateMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent org', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBrandStatus(
          'non-existent',
          mockSA,
          BrandStatus.SUSPENDED,
          'Test',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── overrideBounty ──────────────────────────────────

  describe('overrideBounty', () => {
    it('should override bounty status bypassing state machine', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        id: 'bounty-1',
        status: BountyStatus.LIVE,
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
        'Violates terms',
      );

      expect(result.status).toBe(BountyStatus.CLOSED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bounty.override',
          reason: 'Violates terms',
          beforeState: { status: BountyStatus.LIVE },
          afterState: { status: BountyStatus.CLOSED },
        }),
      );
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.overrideBounty(
          'non-existent',
          mockSA,
          BountyStatus.CLOSED,
          'Test',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── overrideSubmission ──────────────────────────────

  describe('overrideSubmission', () => {
    it('should override submission status bypassing state machine', async () => {
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

      const result = await service.overrideSubmission(
        'sub-1',
        mockSA,
        SubmissionStatus.APPROVED,
        'Valid proof via support ticket',
      );

      expect(result.status).toBe(SubmissionStatus.APPROVED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.override',
          reason: 'Valid proof via support ticket',
        }),
      );
    });

    it('should throw NotFoundException for non-existent submission', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.overrideSubmission(
          'non-existent',
          mockSA,
          SubmissionStatus.APPROVED,
          'Test',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getUserDetail ───────────────────────────────────

  describe('getUserDetail', () => {
    it('should return user detail with submission counts', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        brandMemberships: [],
        _count: { submissions: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.submission.count.mockResolvedValue(7);

      const result = await service.getUserDetail('user-1');

      expect(result.submissionCount).toBe(10);
      expect(result.approvedSubmissionCount).toBe(7);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserDetail('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getDashboard ────────────────────────────────────

  describe('getDashboard', () => {
    it('should return platform-wide counts', async () => {
      // Mock all 23 count calls
      prisma.user.count
        .mockResolvedValueOnce(350)    // total
        .mockResolvedValueOnce(340)    // active
        .mockResolvedValueOnce(10)     // suspended
        .mockResolvedValueOnce(320)    // participants
        .mockResolvedValueOnce(25)     // BAs
        .mockResolvedValueOnce(5);     // SAs
      prisma.brand.count
        .mockResolvedValueOnce(25)     // total
        .mockResolvedValueOnce(23)     // active
        .mockResolvedValueOnce(2);     // suspended
      prisma.bounty.count
        .mockResolvedValueOnce(150)    // total
        .mockResolvedValueOnce(20)     // draft
        .mockResolvedValueOnce(80)     // live
        .mockResolvedValueOnce(15)     // paused
        .mockResolvedValueOnce(35);    // closed
      prisma.submission.count
        .mockResolvedValueOnce(2500)   // total
        .mockResolvedValueOnce(400)    // submitted
        .mockResolvedValueOnce(150)    // in_review
        .mockResolvedValueOnce(50)     // nmi
        .mockResolvedValueOnce(1500)   // approved
        .mockResolvedValueOnce(400)    // rejected
        .mockResolvedValueOnce(500)    // not_paid
        .mockResolvedValueOnce(200)    // pending
        .mockResolvedValueOnce(800);   // paid

      const result = await service.getDashboard();

      expect(result.users.total).toBe(350);
      expect(result.users.active).toBe(340);
      expect(result.brands.total).toBe(25);
      expect(result.bounties.total).toBe(150);
      expect(result.bounties.byStatus.LIVE).toBe(80);
      expect(result.submissions.total).toBe(2500);
      expect(result.submissions.byPayoutStatus.PAID).toBe(800);
    });
  });

  // ── listAuditLogs ───────────────────────────────────

  describe('listAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          actorId: 'sa-1',
          actor: { id: 'sa-1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User' },
          actorRole: UserRole.SUPER_ADMIN,
          action: 'user.status_change',
          entityType: 'User',
          entityId: 'user-1',
          beforeState: { status: 'ACTIVE' },
          afterState: { status: 'SUSPENDED' },
          reason: 'Terms violation',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
        },
      ]);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.listAuditLogs({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by actorId', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({ actorId: 'sa-1' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ actorId: 'sa-1' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({
        startDate: '2026-02-01',
        endDate: '2026-02-07',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  // ── getAuditLog ─────────────────────────────────────

  describe('getAuditLog', () => {
    it('should return a single audit log entry', async () => {
      prisma.auditLog.findUnique.mockResolvedValue({
        id: 'log-1',
        actorId: 'sa-1',
        actor: { id: 'sa-1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User' },
        actorRole: UserRole.SUPER_ADMIN,
        action: 'bounty.override',
        entityType: 'Bounty',
        entityId: 'bounty-1',
        beforeState: { status: 'LIVE' },
        afterState: { status: 'CLOSED' },
        reason: 'Violates terms',
        ipAddress: '127.0.0.1',
        createdAt: new Date(),
      });

      const result = await service.getAuditLog('log-1');

      expect(result.id).toBe('log-1');
      expect(result.action).toBe('bounty.override');
    });

    it('should throw NotFoundException for non-existent log', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(service.getAuditLog('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getSystemHealth ─────────────────────────────────

  describe('getSystemHealth', () => {
    it('should return ok status when database is healthy', async () => {
      const result = await service.getSystemHealth();

      expect(result.status).toBe('ok');
      expect(result.services.database.status).toBe('ok');
      expect(result.version).toBe('1.0.0');
    });

    it('should return degraded status when database is down', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await service.getSystemHealth();

      expect(result.status).toBe('degraded');
      expect(result.services.database.status).toBe('error');
    });
  });
});
