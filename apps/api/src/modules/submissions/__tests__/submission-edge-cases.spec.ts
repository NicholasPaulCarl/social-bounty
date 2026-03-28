import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SubmissionsService } from '../submissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import {
  UserRole,
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../../auth/jwt.strategy';

describe('SubmissionsService - Submission Edge Cases', () => {
  let service: SubmissionsService;
  let prisma: any;
  let auditService: { log: jest.Mock };
  let mailService: {
    sendSubmissionStatusChange: jest.Mock;
    sendSubmissionStatusEmail: jest.Mock;
    sendPayoutNotificationEmail: jest.Mock;
    sendBountyPublishedEmail: jest.Mock;
  };

  // ── User Fixtures ──────────────────────────────────

  const mockParticipant: AuthenticatedUser = {
    sub: 'participant-1',
    email: 'participant@test.com',
    role: UserRole.PARTICIPANT,
    organisationId: null,
  };

  const mockParticipant2: AuthenticatedUser = {
    sub: 'participant-2',
    email: 'participant2@test.com',
    role: UserRole.PARTICIPANT,
    organisationId: null,
  };

  const mockBA: AuthenticatedUser = {
    sub: 'ba-1',
    email: 'ba@test.com',
    role: UserRole.BUSINESS_ADMIN,
    organisationId: 'org-1',
  };

  const mockBA2: AuthenticatedUser = {
    sub: 'ba-2',
    email: 'ba2@test.com',
    role: UserRole.BUSINESS_ADMIN,
    organisationId: 'org-2',
  };

  const mockSA: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'admin@test.com',
    role: UserRole.SUPER_ADMIN,
    organisationId: null,
  };

  // ── Data Fixtures ──────────────────────────────────

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
    reviewerNote: null,
    reviewedById: null,
    reportedMetrics: null,
    verificationDeadline: null,
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
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => {
        if (typeof fn === 'function') {
          return fn(prisma);
        }
        return Promise.all(fn);
      }),
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
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  // ── 1. Duplicate submission by same user is rejected ────────────────

  describe('Duplicate submission by same user', () => {
    it('should throw ConflictException when user already submitted to this bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue({ id: 'existing-sub-1' });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Second attempt' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should include a descriptive message about the duplicate', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue({ id: 'existing-sub-1' });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Second attempt' }),
      ).rejects.toThrow('You already have a submission for this bounty');
    });

    it('should not call submission.create when duplicate is detected', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue({ id: 'existing-sub-1' });

      try {
        await service.create('bounty-1', mockParticipant, { proofText: 'Again' });
      } catch {
        // expected
      }

      expect(prisma.submission.create).not.toHaveBeenCalled();
    });

    it('should allow a different user to submit to the same bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        ...baseSubmission,
        id: 'sub-new',
        userId: 'participant-2',
        proofImages: [],
      });

      const result = await service.create('bounty-1', mockParticipant2, {
        proofText: 'My proof',
      });

      expect(result.id).toBe('sub-new');
      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
    });
  });

  // ── 2. Submission to a CLOSED bounty is rejected ────────────────────

  describe('Submission to a CLOSED bounty', () => {
    it('should throw BadRequestException when bounty is CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.CLOSED,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include a message about bounty not accepting submissions', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.CLOSED,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow('Bounty is not accepting submissions');
    });

    it('should not call $transaction when bounty is CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.CLOSED,
      });

      try {
        await service.create('bounty-1', mockParticipant, { proofText: 'Proof' });
      } catch {
        // expected
      }

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ── 3. Submission to a PAUSED bounty is rejected ────────────────────

  describe('Submission to a PAUSED bounty', () => {
    it('should throw BadRequestException when bounty is PAUSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.PAUSED,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include a message about bounty not accepting submissions', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.PAUSED,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow('Bounty is not accepting submissions');
    });

    it('should also reject DRAFT bounty submissions', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.DRAFT,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── 4. Submission when maxSubmissions is reached ────────────────────

  describe('Submission when maxSubmissions is reached', () => {
    it('should throw BadRequestException when max submissions reached exactly', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        maxSubmissions: 10,
        _count: { submissions: 10 },
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw with "Maximum submissions reached" message', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        maxSubmissions: 10,
        _count: { submissions: 10 },
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow('Maximum submissions reached');
    });

    it('should reject when submissions exceed maxSubmissions', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        maxSubmissions: 5,
        _count: { submissions: 7 },
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow submission when one slot remains', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        maxSubmissions: 10,
        _count: { submissions: 9 },
      });
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        ...baseSubmission,
        proofImages: [],
      });

      const result = await service.create('bounty-1', mockParticipant, {
        proofText: 'Proof',
      });

      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
    });

    it('should allow submission when maxSubmissions is null (unlimited)', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        maxSubmissions: null,
        _count: { submissions: 1000 },
      });
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        ...baseSubmission,
        proofImages: [],
      });

      const result = await service.create('bounty-1', mockParticipant, {
        proofText: 'Proof',
      });

      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
    });
  });

  // ── 5. Review status transitions ───────────────────────────────────

  describe('Review status transitions', () => {
    const submittedSubmission = {
      ...baseSubmission,
      status: SubmissionStatus.SUBMITTED,
      bounty: { organisationId: 'org-1', title: 'Test Bounty' },
      user: { email: 'participant@test.com' },
    };

    const reviewUpdateResult = (status: SubmissionStatus) => ({
      ...baseSubmission,
      status,
      reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
    });

    // Valid transitions from SUBMITTED
    describe('from SUBMITTED', () => {
      it('should allow SUBMITTED -> IN_REVIEW', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.IN_REVIEW),
        );

        const result = await service.review('sub-1', mockBA, SubmissionStatus.IN_REVIEW);
        expect(result.status).toBe(SubmissionStatus.IN_REVIEW);
      });

      it('should allow SUBMITTED -> APPROVED', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.APPROVED),
        );

        const result = await service.review('sub-1', mockBA, SubmissionStatus.APPROVED);
        expect(result.status).toBe(SubmissionStatus.APPROVED);
      });

      it('should allow SUBMITTED -> REJECTED', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.REJECTED),
        );

        const result = await service.review('sub-1', mockBA, SubmissionStatus.REJECTED);
        expect(result.status).toBe(SubmissionStatus.REJECTED);
      });

      it('should allow SUBMITTED -> NEEDS_MORE_INFO', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.NEEDS_MORE_INFO),
        );

        const result = await service.review(
          'sub-1',
          mockBA,
          SubmissionStatus.NEEDS_MORE_INFO,
        );
        expect(result.status).toBe(SubmissionStatus.NEEDS_MORE_INFO);
      });

      it('should reject SUBMITTED -> SUBMITTED (same state)', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedSubmission);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.SUBMITTED),
        ).rejects.toThrow(BadRequestException);
      });
    });

    // Valid transitions from IN_REVIEW
    describe('from IN_REVIEW', () => {
      const inReviewSubmission = {
        ...submittedSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };

      it('should allow IN_REVIEW -> APPROVED', async () => {
        prisma.submission.findUnique.mockResolvedValue(inReviewSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.APPROVED),
        );

        const result = await service.review('sub-1', mockBA, SubmissionStatus.APPROVED);
        expect(result.status).toBe(SubmissionStatus.APPROVED);
      });

      it('should allow IN_REVIEW -> REJECTED', async () => {
        prisma.submission.findUnique.mockResolvedValue(inReviewSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.REJECTED),
        );

        const result = await service.review('sub-1', mockBA, SubmissionStatus.REJECTED);
        expect(result.status).toBe(SubmissionStatus.REJECTED);
      });

      it('should allow IN_REVIEW -> NEEDS_MORE_INFO', async () => {
        prisma.submission.findUnique.mockResolvedValue(inReviewSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.NEEDS_MORE_INFO),
        );

        const result = await service.review(
          'sub-1',
          mockBA,
          SubmissionStatus.NEEDS_MORE_INFO,
        );
        expect(result.status).toBe(SubmissionStatus.NEEDS_MORE_INFO);
      });

      it('should reject IN_REVIEW -> SUBMITTED (invalid)', async () => {
        prisma.submission.findUnique.mockResolvedValue(inReviewSubmission);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.SUBMITTED),
        ).rejects.toThrow(BadRequestException);
      });
    });

    // Valid transitions from NEEDS_MORE_INFO
    describe('from NEEDS_MORE_INFO', () => {
      const nmiSubmission = {
        ...submittedSubmission,
        status: SubmissionStatus.NEEDS_MORE_INFO,
      };

      it('should allow NEEDS_MORE_INFO -> IN_REVIEW', async () => {
        prisma.submission.findUnique.mockResolvedValue(nmiSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.IN_REVIEW),
        );

        const result = await service.review(
          'sub-1',
          mockBA,
          SubmissionStatus.IN_REVIEW,
        );
        expect(result.status).toBe(SubmissionStatus.IN_REVIEW);
      });

      it('should allow NEEDS_MORE_INFO -> APPROVED', async () => {
        prisma.submission.findUnique.mockResolvedValue(nmiSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.APPROVED),
        );

        const result = await service.review('sub-1', mockBA, SubmissionStatus.APPROVED);
        expect(result.status).toBe(SubmissionStatus.APPROVED);
      });

      it('should allow NEEDS_MORE_INFO -> REJECTED', async () => {
        prisma.submission.findUnique.mockResolvedValue(nmiSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.REJECTED),
        );

        const result = await service.review('sub-1', mockBA, SubmissionStatus.REJECTED);
        expect(result.status).toBe(SubmissionStatus.REJECTED);
      });
    });

    // Terminal states: APPROVED and REJECTED have no outgoing transitions
    describe('from terminal states', () => {
      it('should reject APPROVED -> any transition', async () => {
        const approvedSubmission = {
          ...submittedSubmission,
          status: SubmissionStatus.APPROVED,
        };
        prisma.submission.findUnique.mockResolvedValue(approvedSubmission);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.IN_REVIEW),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.REJECTED),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.NEEDS_MORE_INFO),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject REJECTED -> any transition', async () => {
        const rejectedSubmission = {
          ...submittedSubmission,
          status: SubmissionStatus.REJECTED,
        };
        prisma.submission.findUnique.mockResolvedValue(rejectedSubmission);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.APPROVED),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.IN_REVIEW),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.NEEDS_MORE_INFO),
        ).rejects.toThrow(BadRequestException);
      });

      it('should include current and target status in error message', async () => {
        const approvedSubmission = {
          ...submittedSubmission,
          status: SubmissionStatus.APPROVED,
        };
        prisma.submission.findUnique.mockResolvedValue(approvedSubmission);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.REJECTED),
        ).rejects.toThrow(
          `Cannot transition from ${SubmissionStatus.APPROVED} to ${SubmissionStatus.REJECTED}`,
        );
      });
    });

    // Review audit logging
    describe('review audit logging', () => {
      it('should create an audit log entry for every valid review', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
        prisma.submission.update.mockResolvedValue(
          reviewUpdateResult(SubmissionStatus.APPROVED),
        );

        await service.review('sub-1', mockBA, SubmissionStatus.APPROVED, 'Great work!');

        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'submission.review',
            actorId: 'ba-1',
            entityId: 'sub-1',
            beforeState: expect.objectContaining({ status: SubmissionStatus.SUBMITTED }),
            afterState: expect.objectContaining({ status: SubmissionStatus.APPROVED }),
          }),
        );
      });

      it('should not create an audit log for invalid transitions', async () => {
        const approvedSubmission = {
          ...submittedSubmission,
          status: SubmissionStatus.APPROVED,
        };
        prisma.submission.findUnique.mockResolvedValue(approvedSubmission);

        try {
          await service.review('sub-1', mockBA, SubmissionStatus.REJECTED);
        } catch {
          // expected
        }

        expect(auditService.log).not.toHaveBeenCalled();
      });
    });
  });

  // ── 6. Payout status transitions ───────────────────────────────────

  describe('Payout status transitions', () => {
    const approvedSubmission = {
      ...baseSubmission,
      status: SubmissionStatus.APPROVED,
      payoutStatus: PayoutStatus.NOT_PAID,
      bounty: { ...baseSubmission.bounty, organisationId: 'org-1' },
    };

    const payoutUpdateResult = (payoutStatus: PayoutStatus) => ({
      ...baseSubmission,
      payoutStatus,
    });

    // Valid transitions from NOT_PAID
    describe('from NOT_PAID', () => {
      it('should allow NOT_PAID -> PENDING', async () => {
        prisma.submission.findUnique.mockResolvedValue(approvedSubmission);
        prisma.submission.update.mockResolvedValue(
          payoutUpdateResult(PayoutStatus.PENDING),
        );

        const result = await service.updatePayout(
          'sub-1',
          mockBA,
          PayoutStatus.PENDING,
        );
        expect(result.payoutStatus).toBe(PayoutStatus.PENDING);
      });

      it('should allow NOT_PAID -> PAID (direct)', async () => {
        prisma.submission.findUnique.mockResolvedValue(approvedSubmission);
        prisma.submission.update.mockResolvedValue(
          payoutUpdateResult(PayoutStatus.PAID),
        );

        const result = await service.updatePayout('sub-1', mockBA, PayoutStatus.PAID);
        expect(result.payoutStatus).toBe(PayoutStatus.PAID);
      });
    });

    // Valid transitions from PENDING
    describe('from PENDING', () => {
      const pendingSubmission = {
        ...approvedSubmission,
        payoutStatus: PayoutStatus.PENDING,
      };

      it('should allow PENDING -> PAID', async () => {
        prisma.submission.findUnique.mockResolvedValue(pendingSubmission);
        prisma.submission.update.mockResolvedValue(
          payoutUpdateResult(PayoutStatus.PAID),
        );

        const result = await service.updatePayout('sub-1', mockBA, PayoutStatus.PAID);
        expect(result.payoutStatus).toBe(PayoutStatus.PAID);
      });

      it('should allow PENDING -> NOT_PAID (reversal)', async () => {
        prisma.submission.findUnique.mockResolvedValue(pendingSubmission);
        prisma.submission.update.mockResolvedValue(
          payoutUpdateResult(PayoutStatus.NOT_PAID),
        );

        const result = await service.updatePayout(
          'sub-1',
          mockBA,
          PayoutStatus.NOT_PAID,
        );
        expect(result.payoutStatus).toBe(PayoutStatus.NOT_PAID);
      });
    });

    // PAID is terminal
    describe('from PAID (terminal state)', () => {
      const paidSubmission = {
        ...approvedSubmission,
        payoutStatus: PayoutStatus.PAID,
      };

      it('should reject PAID -> NOT_PAID', async () => {
        prisma.submission.findUnique.mockResolvedValue(paidSubmission);

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.NOT_PAID),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject PAID -> PENDING', async () => {
        prisma.submission.findUnique.mockResolvedValue(paidSubmission);

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
        ).rejects.toThrow(BadRequestException);
      });

      it('should include current and target status in error message', async () => {
        prisma.submission.findUnique.mockResolvedValue(paidSubmission);

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.NOT_PAID),
        ).rejects.toThrow(
          `Cannot transition payout from ${PayoutStatus.PAID} to ${PayoutStatus.NOT_PAID}`,
        );
      });
    });

    // Payout requires APPROVED status
    describe('payout requires APPROVED status', () => {
      it('should reject payout on SUBMITTED submission', async () => {
        prisma.submission.findUnique.mockResolvedValue({
          ...approvedSubmission,
          status: SubmissionStatus.SUBMITTED,
        });

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject payout on IN_REVIEW submission', async () => {
        prisma.submission.findUnique.mockResolvedValue({
          ...approvedSubmission,
          status: SubmissionStatus.IN_REVIEW,
        });

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject payout on REJECTED submission', async () => {
        prisma.submission.findUnique.mockResolvedValue({
          ...approvedSubmission,
          status: SubmissionStatus.REJECTED,
        });

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject payout on NEEDS_MORE_INFO submission', async () => {
        prisma.submission.findUnique.mockResolvedValue({
          ...approvedSubmission,
          status: SubmissionStatus.NEEDS_MORE_INFO,
        });

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
        ).rejects.toThrow(BadRequestException);
      });

      it('should include descriptive error message for non-approved payout attempt', async () => {
        prisma.submission.findUnique.mockResolvedValue({
          ...approvedSubmission,
          status: SubmissionStatus.SUBMITTED,
        });

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
        ).rejects.toThrow('Only approved submissions can have payout status updated');
      });
    });

    // Payout audit logging
    describe('payout audit logging', () => {
      it('should create an audit log for valid payout transition', async () => {
        prisma.submission.findUnique.mockResolvedValue(approvedSubmission);
        prisma.submission.update.mockResolvedValue(
          payoutUpdateResult(PayoutStatus.PAID),
        );

        await service.updatePayout('sub-1', mockBA, PayoutStatus.PAID, 'Paid out');

        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'submission.payout_change',
            actorId: 'ba-1',
            entityId: 'sub-1',
            beforeState: expect.objectContaining({
              payoutStatus: PayoutStatus.NOT_PAID,
            }),
            afterState: expect.objectContaining({
              payoutStatus: PayoutStatus.PAID,
            }),
          }),
        );
      });

      it('should not create an audit log for invalid payout transition', async () => {
        prisma.submission.findUnique.mockResolvedValue({
          ...approvedSubmission,
          payoutStatus: PayoutStatus.PAID,
        });

        try {
          await service.updatePayout('sub-1', mockBA, PayoutStatus.NOT_PAID);
        } catch {
          // expected
        }

        expect(auditService.log).not.toHaveBeenCalled();
      });
    });
  });

  // ── 7. Participant can only view their own submissions ─────────────

  describe('Participant can only view their own submissions', () => {
    const fullSubmission = {
      ...baseSubmission,
      bounty: {
        id: 'bounty-1',
        title: 'Test',
        rewardType: 'CASH',
        rewardValue: 25,
        organisationId: 'org-1',
      },
      user: {
        id: 'participant-1',
        firstName: 'P',
        lastName: 'User',
        email: 'p@test.com',
      },
      reviewedBy: null,
      proofImages: [],
    };

    it('should allow participant to view their own submission', async () => {
      prisma.submission.findUnique.mockResolvedValue(fullSubmission);

      const result = await service.findById('sub-1', mockParticipant);
      expect(result.id).toBe('sub-1');
    });

    it('should throw ForbiddenException when participant tries to view another user submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        userId: 'other-participant',
      });

      await expect(
        service.findById('sub-1', mockParticipant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with descriptive message', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        userId: 'other-participant',
      });

      await expect(
        service.findById('sub-1', mockParticipant),
      ).rejects.toThrow('Not authorized');
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('non-existent', mockParticipant),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter listMySubmissions by the requesting user ID only', async () => {
      prisma.submission.findMany.mockResolvedValue([]);
      prisma.submission.count.mockResolvedValue(0);

      await service.listMySubmissions(mockParticipant, {});

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'participant-1' }),
        }),
      );
    });

    it('should not return submissions from other users in listMySubmissions', async () => {
      prisma.submission.findMany.mockResolvedValue([]);
      prisma.submission.count.mockResolvedValue(0);

      await service.listMySubmissions(mockParticipant2, {});

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'participant-2' }),
        }),
      );
    });
  });

  // ── 8. Business admin can only view submissions for their org's bounties ─

  describe('Business admin can only view submissions for their org bounties', () => {
    const fullSubmission = {
      ...baseSubmission,
      bounty: {
        id: 'bounty-1',
        title: 'Test',
        rewardType: 'CASH',
        rewardValue: 25,
        organisationId: 'org-1',
      },
      user: {
        id: 'participant-1',
        firstName: 'P',
        lastName: 'User',
        email: 'p@test.com',
      },
      reviewedBy: null,
      proofImages: [],
    };

    it('should allow BA to view submission for own org bounty', async () => {
      prisma.submission.findUnique.mockResolvedValue(fullSubmission);

      const result = await service.findById('sub-1', mockBA);
      expect(result.id).toBe('sub-1');
    });

    it('should throw ForbiddenException when BA tries to view other org submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        bounty: { ...fullSubmission.bounty, organisationId: 'org-2' },
      });

      await expect(service.findById('sub-1', mockBA)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException with "Not authorized" message', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        bounty: { ...fullSubmission.bounty, organisationId: 'other-org' },
      });

      await expect(service.findById('sub-1', mockBA)).rejects.toThrow('Not authorized');
    });

    it('should allow Super Admin to view any org submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        bounty: { ...fullSubmission.bounty, organisationId: 'any-org' },
      });

      const result = await service.findById('sub-1', mockSA);
      expect(result.id).toBe('sub-1');
    });

    // listForBounty RBAC
    describe('listForBounty RBAC', () => {
      it('should allow BA to list submissions for their own org bounty', async () => {
        prisma.bounty.findUnique.mockResolvedValue({
          id: 'bounty-1',
          organisationId: 'org-1',
        });
        prisma.submission.findMany.mockResolvedValue([]);
        prisma.submission.count.mockResolvedValue(0);

        const result = await service.listForBounty('bounty-1', mockBA, {});
        expect(result.data).toEqual([]);
        expect(result.meta.total).toBe(0);
      });

      it('should throw ForbiddenException when BA lists submissions for other org bounty', async () => {
        prisma.bounty.findUnique.mockResolvedValue({
          id: 'bounty-1',
          organisationId: 'org-2',
        });

        await expect(
          service.listForBounty('bounty-1', mockBA, {}),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should allow Super Admin to list submissions for any org bounty', async () => {
        prisma.bounty.findUnique.mockResolvedValue({
          id: 'bounty-1',
          organisationId: 'other-org',
        });
        prisma.submission.findMany.mockResolvedValue([]);
        prisma.submission.count.mockResolvedValue(0);

        const result = await service.listForBounty('bounty-1', mockSA, {});
        expect(result.data).toEqual([]);
      });

      it('should throw NotFoundException when bounty does not exist for listForBounty', async () => {
        prisma.bounty.findUnique.mockResolvedValue(null);

        await expect(
          service.listForBounty('non-existent', mockBA, {}),
        ).rejects.toThrow(NotFoundException);
      });
    });

    // Review RBAC
    describe('review RBAC', () => {
      const submittedForOtherOrg = {
        ...baseSubmission,
        status: SubmissionStatus.SUBMITTED,
        bounty: { organisationId: 'org-2', title: 'Other Org Bounty' },
        user: { email: 'participant@test.com' },
      };

      it('should throw ForbiddenException when BA reviews submission for other org', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedForOtherOrg);

        await expect(
          service.review('sub-1', mockBA, SubmissionStatus.APPROVED),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should allow SA to review submission for any org', async () => {
        prisma.submission.findUnique.mockResolvedValue(submittedForOtherOrg);
        prisma.submission.update.mockResolvedValue({
          ...baseSubmission,
          status: SubmissionStatus.APPROVED,
          reviewedBy: { id: 'sa-1', firstName: 'Admin', lastName: 'User' },
        });

        const result = await service.review(
          'sub-1',
          mockSA,
          SubmissionStatus.APPROVED,
        );
        expect(result.status).toBe(SubmissionStatus.APPROVED);
      });
    });

    // Payout RBAC
    describe('payout RBAC', () => {
      const approvedForOtherOrg = {
        ...baseSubmission,
        status: SubmissionStatus.APPROVED,
        payoutStatus: PayoutStatus.NOT_PAID,
        bounty: { ...baseSubmission.bounty, organisationId: 'org-2' },
      };

      it('should throw ForbiddenException when BA updates payout for other org', async () => {
        prisma.submission.findUnique.mockResolvedValue(approvedForOtherOrg);

        await expect(
          service.updatePayout('sub-1', mockBA, PayoutStatus.PAID),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should allow SA to update payout for any org', async () => {
        prisma.submission.findUnique.mockResolvedValue(approvedForOtherOrg);
        prisma.submission.update.mockResolvedValue({
          ...baseSubmission,
          payoutStatus: PayoutStatus.PAID,
        });

        const result = await service.updatePayout('sub-1', mockSA, PayoutStatus.PAID);
        expect(result.payoutStatus).toBe(PayoutStatus.PAID);
      });
    });
  });
});
