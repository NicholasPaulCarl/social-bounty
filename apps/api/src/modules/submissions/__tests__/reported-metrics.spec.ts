import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsService } from '../submissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import { WalletService } from '../../wallet/wallet.service';
import { BountyAccessService } from '../../bounty-access/bounty-access.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  UserRole,
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
  VERIFICATION_DEADLINE_HOURS,
} from '@social-bounty/shared';
import type { AuthenticatedUser } from '../../auth/jwt.strategy';

describe('SubmissionsService - Reported Metrics', () => {
  let service: SubmissionsService;
  let prisma: any;
  let auditService: { log: jest.Mock };
  let mailService: {
    sendSubmissionStatusChange: jest.Mock;
    sendSubmissionStatusEmail: jest.Mock;
    sendPayoutNotificationEmail: jest.Mock;
    sendBountyPublishedEmail: jest.Mock;
  };

  const mockParticipant: AuthenticatedUser = {
    sub: 'participant-1',
    email: 'participant@test.com',
    role: UserRole.PARTICIPANT,
    organisationId: null,
  };

  const mockBA: AuthenticatedUser = {
    sub: 'ba-1',
    email: 'ba@test.com',
    role: UserRole.BUSINESS_ADMIN,
    organisationId: 'org-1',
  };

  const liveBounty = {
    id: 'bounty-1',
    status: BountyStatus.LIVE,
    maxSubmissions: 100,
    endDate: new Date('2026-12-31'),
    organisationId: 'org-1',
    title: 'Test Bounty',
    _count: { submissions: 5 },
  };

  const baseSubmission = {
    id: 'sub-1',
    bountyId: 'bounty-1',
    userId: 'participant-1',
    proofText: 'My proof',
    proofLinks: ['https://example.com'],
    proofImages: [],
    status: SubmissionStatus.SUBMITTED,
    payoutStatus: PayoutStatus.NOT_PAID,
    reportedMetrics: null,
    verificationDeadline: null,
    reviewerNote: null,
    reviewedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'participant-1', email: 'participant@test.com', firstName: 'Test', lastName: 'User' },
    bounty: { id: 'bounty-1', title: 'Test Bounty', organisationId: 'org-1', rewardValue: 100, currency: 'ZAR' },
  };

  beforeEach(async () => {
    prisma = {
      bounty: {
        findUnique: jest.fn(),
      },
      submission: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      fileUpload: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    auditService = { log: jest.fn() };
    mailService = {
      sendSubmissionStatusChange: jest.fn().mockResolvedValue(undefined),
      sendSubmissionStatusEmail: jest.fn().mockResolvedValue(undefined),
      sendPayoutNotificationEmail: jest.fn().mockResolvedValue(undefined),
      sendBountyPublishedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
        { provide: WalletService, useValue: { creditWallet: jest.fn().mockResolvedValue({}) } },
        { provide: BountyAccessService, useValue: { canSubmitToBounty: jest.fn().mockResolvedValue(true) } },
        { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE'), getActiveOrgTier: jest.fn().mockResolvedValue('FREE'), isFeatureEnabled: jest.fn().mockResolvedValue(false) } },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  describe('Create submission with reported metrics', () => {
    it('should create submission with reported metrics', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        ...baseSubmission,
        reportedMetrics: { views: 1500, likes: 120, comments: 30 },
      });

      const result = await service.create('bounty-1', mockParticipant, {
        proofText: 'My proof',
        proofLinks: ['https://example.com'],
        reportedMetrics: { views: 1500, likes: 120, comments: 30 },
      });

      expect(result).toBeDefined();
      expect(result.reportedMetrics).toEqual({ views: 1500, likes: 120, comments: 30 });
      expect(prisma.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reportedMetrics: { views: 1500, likes: 120, comments: 30 },
          }),
        }),
      );
    });

    it('should create submission without reported metrics', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        ...baseSubmission,
        reportedMetrics: null,
      });

      const result = await service.create('bounty-1', mockParticipant, {
        proofText: 'My proof',
      });

      expect(result).toBeDefined();
      expect(result.reportedMetrics).toBeNull();
    });

    it('should create submission with partial reported metrics', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        ...baseSubmission,
        reportedMetrics: { views: 500, likes: null, comments: null },
      });

      const result = await service.create('bounty-1', mockParticipant, {
        proofText: 'My proof',
        reportedMetrics: { views: 500 },
      });

      expect(result).toBeDefined();
    });
  });

  describe('Approval sets verification deadline', () => {
    it('should set verificationDeadline on approval', async () => {
      const submissionWithBounty = {
        ...baseSubmission,
        status: SubmissionStatus.SUBMITTED,
        bounty: {
          id: 'bounty-1',
          organisationId: 'org-1',
          title: 'Test Bounty',
          rewardType: 'CASH',
          rewardValue: 50,
        },
        user: {
          id: 'participant-1',
          email: 'participant@test.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      prisma.submission.findUnique.mockResolvedValue(submissionWithBounty);

      const now = new Date();
      const expectedDeadline = new Date(now.getTime() + VERIFICATION_DEADLINE_HOURS * 60 * 60 * 1000);

      prisma.submission.update.mockResolvedValue({
        ...submissionWithBounty,
        status: SubmissionStatus.APPROVED,
        verificationDeadline: expectedDeadline,
      });

      const result = await service.review('sub-1', mockBA, SubmissionStatus.APPROVED);

      expect(result).toBeDefined();
      expect(prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubmissionStatus.APPROVED,
            verificationDeadline: expect.any(Date),
          }),
        }),
      );
    });

    it('should NOT set verificationDeadline on rejection', async () => {
      const submissionWithBounty = {
        ...baseSubmission,
        status: SubmissionStatus.SUBMITTED,
        bounty: {
          id: 'bounty-1',
          organisationId: 'org-1',
          title: 'Test Bounty',
          rewardType: 'CASH',
          rewardValue: 50,
        },
        user: {
          id: 'participant-1',
          email: 'participant@test.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      prisma.submission.findUnique.mockResolvedValue(submissionWithBounty);
      prisma.submission.update.mockResolvedValue({
        ...submissionWithBounty,
        status: SubmissionStatus.REJECTED,
      });

      await service.review('sub-1', mockBA, SubmissionStatus.REJECTED, 'Did not meet requirements');

      const updateCall = prisma.submission.update.mock.calls[0][0];
      expect(updateCall.data.verificationDeadline).toBeUndefined();
    });
  });
});
