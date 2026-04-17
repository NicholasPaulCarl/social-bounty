import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DisputesService } from '../disputes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import {
  UserRole,
  DisputeStatus,
  DisputeCategory,
  DisputeReason,
  DisputeResolution,
  SubmissionStatus,
  PayoutStatus,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../../auth/jwt.strategy';

describe('DisputesService', () => {
  let service: DisputesService;
  let prisma: any;
  let auditService: { log: jest.Mock };
  let mailService: {
    sendDisputeOpenedEmail: jest.Mock;
    sendDisputeStatusChangeEmail: jest.Mock;
    sendDisputeResolvedEmail: jest.Mock;
  };

  // ── Fixtures ──────────────────────────────────────────

  const mockParticipant: AuthenticatedUser = {
    sub: 'participant-1',
    email: 'participant@test.com',
    role: UserRole.PARTICIPANT,
    brandId: null,
  };

  const mockBA: AuthenticatedUser = {
    sub: 'ba-1',
    email: 'ba@test.com',
    role: UserRole.BUSINESS_ADMIN,
    brandId: 'org-1',
  };

  const mockSA: AuthenticatedUser = {
    sub: 'sa-1',
    email: 'admin@test.com',
    role: UserRole.SUPER_ADMIN,
    brandId: null,
  };

  const mockSubmission = {
    id: 'sub-1',
    bountyId: 'bounty-1',
    userId: 'participant-1',
    status: SubmissionStatus.APPROVED,
    payoutStatus: PayoutStatus.NOT_PAID,
    bounty: {
      id: 'bounty-1',
      title: 'Test Bounty',
      brandId: 'org-1',
      brand: {
        id: 'org-1',
        name: 'Test Org',
        members: [{ user: { email: 'ba@test.com' } }],
      },
    },
    user: { id: 'participant-1', email: 'participant@test.com', firstName: 'Test', lastName: 'User' },
  };

  const mockDispute = {
    id: 'dispute-1',
    disputeNumber: 'DSP-0001',
    category: DisputeCategory.NON_PAYMENT,
    reason: DisputeReason.PAYMENT_NOT_RECEIVED,
    status: DisputeStatus.DRAFT,
    description: 'I have not received payment',
    desiredOutcome: 'Please pay me',
    submissionId: 'sub-1',
    bountyId: 'bounty-1',
    brandId: 'org-1',
    openedByUserId: 'participant-1',
    openedByRole: UserRole.PARTICIPANT,
    assignedToUserId: null,
    resolutionType: null,
    resolutionSummary: null,
    resolvedByUserId: null,
    resolvedAt: null,
    escalatedAt: null,
    responseDeadline: null,
    relatedDisputeId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    submission: {
      ...mockSubmission,
    },
    openedBy: { id: 'participant-1', email: 'participant@test.com', firstName: 'Test', lastName: 'User' },
    assignedTo: null,
    resolvedBy: null,
    messages: [],
    evidence: [],
    statusHistory: [],
  };

  // ── Setup ─────────────────────────────────────────────

  beforeEach(async () => {
    prisma = {
      dispute: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        update: jest.fn(),
      },
      disputeMessage: {
        create: jest.fn(),
      },
      disputeEvidence: {
        create: jest.fn(),
      },
      disputeStatusHistory: {
        create: jest.fn(),
      },
      submission: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    auditService = { log: jest.fn() };
    mailService = {
      sendDisputeOpenedEmail: jest.fn().mockResolvedValue(undefined),
      sendDisputeStatusChangeEmail: jest.fn().mockResolvedValue(undefined),
      sendDisputeResolvedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  // ── create ────────────────────────────────────────────

  describe('create', () => {
    const baseDto = {
      submissionId: 'sub-1',
      category: DisputeCategory.NON_PAYMENT,
      reason: DisputeReason.PAYMENT_NOT_RECEIVED,
      description: 'I have not received payment',
      desiredOutcome: 'Please pay me',
    };

    it('should create a NON_PAYMENT dispute for the submitting participant', async () => {
      prisma.submission.findUnique.mockResolvedValue(mockSubmission);
      const createdDispute = {
        id: 'dispute-1',
        disputeNumber: 'DSP-0001',
        category: DisputeCategory.NON_PAYMENT,
        reason: DisputeReason.PAYMENT_NOT_RECEIVED,
        status: DisputeStatus.DRAFT,
        description: 'I have not received payment',
        desiredOutcome: 'Please pay me',
        submissionId: 'sub-1',
        bountyId: 'bounty-1',
        brandId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.dispute.create.mockResolvedValue(createdDispute);
      prisma.disputeStatusHistory.create.mockResolvedValue({});

      const result = await service.create(mockParticipant, baseDto);

      expect(result.status).toBe(DisputeStatus.DRAFT);
      expect(result.category).toBe(DisputeCategory.NON_PAYMENT);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'dispute.create' }),
      );
    });

    it('should reject if participant tries to file a POST_QUALITY (Category B) dispute', async () => {
      prisma.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.create(mockParticipant, {
          ...baseDto,
          category: DisputeCategory.POST_QUALITY,
          reason: DisputeReason.POST_QUALITY_BELOW_STANDARD,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if submission is not found', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);

      await expect(service.create(mockParticipant, baseDto)).rejects.toThrow(NotFoundException);
    });

    it('should reject NON_PAYMENT dispute if submission is not APPROVED', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.SUBMITTED,
      });

      await expect(service.create(mockParticipant, baseDto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if reason does not match category', async () => {
      prisma.submission.findUnique.mockResolvedValue(mockSubmission);

      await expect(
        service.create(mockParticipant, {
          ...baseDto,
          // NON_PAYMENT category with a POST_QUALITY reason — mismatch
          reason: DisputeReason.POST_QUALITY_BELOW_STANDARD,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow business admin to file a POST_QUALITY dispute for their org', async () => {
      const paidSubmission = {
        ...mockSubmission,
        status: SubmissionStatus.APPROVED,
      };
      prisma.submission.findUnique.mockResolvedValue(paidSubmission);
      const createdDispute = {
        id: 'dispute-2',
        disputeNumber: 'DSP-0002',
        category: DisputeCategory.POST_QUALITY,
        reason: DisputeReason.POST_QUALITY_BELOW_STANDARD,
        status: DisputeStatus.DRAFT,
        description: 'Post quality issue',
        desiredOutcome: 'Content correction',
        submissionId: 'sub-1',
        bountyId: 'bounty-1',
        brandId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.dispute.create.mockResolvedValue(createdDispute);
      prisma.disputeStatusHistory.create.mockResolvedValue({});

      const result = await service.create(mockBA, {
        submissionId: 'sub-1',
        category: DisputeCategory.POST_QUALITY,
        reason: DisputeReason.POST_QUALITY_BELOW_STANDARD,
        description: 'Post quality issue',
        desiredOutcome: 'Content correction',
      });

      expect(result.status).toBe(DisputeStatus.DRAFT);
      expect(result.category).toBe(DisputeCategory.POST_QUALITY);
    });
  });

  // ── submitDraft (DRAFT → OPEN) ────────────────────────

  describe('submitDraft', () => {
    it('should transition a DRAFT dispute to OPEN', async () => {
      prisma.dispute.findUnique.mockResolvedValue(mockDispute);
      const updatedDispute = { ...mockDispute, status: DisputeStatus.OPEN };
      prisma.dispute.update.mockResolvedValue(updatedDispute);
      prisma.disputeStatusHistory.create.mockResolvedValue({});

      const result = await service.submitDraft('dispute-1', mockParticipant);

      expect(result.status).toBe(DisputeStatus.OPEN);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'dispute.status_change',
          afterState: expect.objectContaining({ status: DisputeStatus.OPEN }),
        }),
      );
    });

    it('should reject submitDraft if dispute is not in DRAFT status', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.OPEN,
      });

      await expect(service.submitDraft('dispute-1', mockParticipant)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject submitDraft if caller is not the filer', async () => {
      prisma.dispute.findUnique.mockResolvedValue(mockDispute); // openedByUserId = participant-1

      await expect(service.submitDraft('dispute-1', mockBA)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── transition (invalid) ──────────────────────────────

  describe('transition', () => {
    it('should reject an invalid transition (DRAFT → RESOLVED)', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.DRAFT,
        submission: {
          ...mockSubmission,
          bounty: { title: 'Test Bounty' },
          user: { email: 'participant@test.com' },
        },
        openedBy: { email: 'participant@test.com' },
      });

      await expect(
        service.transition('dispute-1', mockSA, { status: DisputeStatus.RESOLVED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow a valid transition (OPEN → UNDER_REVIEW)', async () => {
      const openDispute = {
        ...mockDispute,
        status: DisputeStatus.OPEN,
        submission: {
          ...mockSubmission,
          bounty: { title: 'Test Bounty' },
          user: { email: 'participant@test.com' },
        },
        openedBy: { email: 'participant@test.com' },
      };
      prisma.dispute.findUnique.mockResolvedValue(openDispute);
      const updatedDispute = { ...openDispute, status: DisputeStatus.UNDER_REVIEW, responseDeadline: null };
      prisma.dispute.update.mockResolvedValue(updatedDispute);
      prisma.disputeStatusHistory.create.mockResolvedValue({});

      const result = await service.transition('dispute-1', mockSA, {
        status: DisputeStatus.UNDER_REVIEW,
      });

      expect(result.status).toBe(DisputeStatus.UNDER_REVIEW);
    });
  });

  // ── RBAC: findById ────────────────────────────────────

  describe('findById RBAC', () => {
    const fullDispute = {
      ...mockDispute,
      submission: {
        id: 'sub-1',
        bountyId: 'bounty-1',
        status: SubmissionStatus.APPROVED,
        payoutStatus: PayoutStatus.NOT_PAID,
        bounty: { id: 'bounty-1', title: 'Test Bounty', brandId: 'org-1', brand: { name: 'Test Org' } },
      },
    };

    it('participant can only view their own dispute', async () => {
      const otherParticipant: AuthenticatedUser = {
        sub: 'other-participant',
        email: 'other@test.com',
        role: UserRole.PARTICIPANT,
        brandId: null,
      };
      prisma.dispute.findUnique.mockResolvedValue(fullDispute); // openedByUserId = participant-1

      await expect(service.findById('dispute-1', otherParticipant)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('business admin can only view disputes in their brand', async () => {
      const otherBA: AuthenticatedUser = {
        sub: 'ba-2',
        email: 'ba2@test.com',
        role: UserRole.BUSINESS_ADMIN,
        brandId: 'org-2', // different org
      };
      prisma.dispute.findUnique.mockResolvedValue(fullDispute); // brandId = org-1

      await expect(service.findById('dispute-1', otherBA)).rejects.toThrow(ForbiddenException);
    });

    it('super admin can view any dispute', async () => {
      prisma.dispute.findUnique.mockResolvedValue(fullDispute);

      await expect(service.findById('dispute-1', mockSA)).resolves.toBeDefined();
    });
  });

  // ── resolve ───────────────────────────────────────────

  describe('resolve', () => {
    const underReviewDispute = {
      ...mockDispute,
      status: DisputeStatus.UNDER_REVIEW,
      submission: {
        ...mockSubmission,
        bounty: { title: 'Test Bounty' },
        user: { email: 'participant@test.com' },
      },
      openedBy: { email: 'participant@test.com' },
    };

    it('should set resolution fields and status to RESOLVED', async () => {
      prisma.dispute.findUnique.mockResolvedValue(underReviewDispute);
      const resolvedAt = new Date();
      const resolvedDispute = {
        ...underReviewDispute,
        status: DisputeStatus.RESOLVED,
        resolutionType: DisputeResolution.PAYMENT_DENIED,
        resolutionSummary: 'Claim not substantiated',
        resolvedAt,
      };
      prisma.dispute.update.mockResolvedValue(resolvedDispute);
      prisma.disputeStatusHistory.create.mockResolvedValue({});
      prisma.submission.update.mockResolvedValue({});

      const result = await service.resolve('dispute-1', mockSA, {
        resolutionType: DisputeResolution.PAYMENT_DENIED,
        resolutionSummary: 'Claim not substantiated',
      });

      expect(result.status).toBe(DisputeStatus.RESOLVED);
      expect(result.resolutionType).toBe(DisputeResolution.PAYMENT_DENIED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'dispute.resolve' }),
      );
    });

    it('SUBMISSION_REVOKED resolution should update submission status to REJECTED', async () => {
      prisma.dispute.findUnique.mockResolvedValue(underReviewDispute);
      const resolvedDispute = {
        ...underReviewDispute,
        status: DisputeStatus.RESOLVED,
        resolutionType: DisputeResolution.SUBMISSION_REVOKED,
        resolutionSummary: 'Fraudulent submission',
        resolvedAt: new Date(),
      };
      prisma.dispute.update.mockResolvedValue(resolvedDispute);
      prisma.disputeStatusHistory.create.mockResolvedValue({});
      prisma.submission.update.mockResolvedValue({});

      await service.resolve('dispute-1', mockSA, {
        resolutionType: DisputeResolution.SUBMISSION_REVOKED,
        resolutionSummary: 'Fraudulent submission',
      });

      expect(prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            status: SubmissionStatus.REJECTED,
            payoutStatus: PayoutStatus.NOT_PAID,
          }),
        }),
      );
    });

    it('should throw BadRequestException when resolving from an invalid status (DRAFT)', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...underReviewDispute,
        status: DisputeStatus.DRAFT,
      });

      await expect(
        service.resolve('dispute-1', mockSA, {
          resolutionType: DisputeResolution.NO_ACTION,
          resolutionSummary: 'No action needed',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── withdraw ──────────────────────────────────────────

  describe('withdraw', () => {
    it('should allow filer to withdraw a DRAFT dispute', async () => {
      prisma.dispute.findUnique.mockResolvedValue(mockDispute); // status = DRAFT
      const withdrawn = { ...mockDispute, status: DisputeStatus.WITHDRAWN };
      prisma.dispute.update.mockResolvedValue(withdrawn);
      prisma.disputeStatusHistory.create.mockResolvedValue({});

      const result = await service.withdraw('dispute-1', mockParticipant, {});

      expect(result.status).toBe(DisputeStatus.WITHDRAWN);
    });

    it('should allow filer to withdraw an OPEN dispute', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.OPEN,
      });
      const withdrawn = { ...mockDispute, status: DisputeStatus.WITHDRAWN };
      prisma.dispute.update.mockResolvedValue(withdrawn);
      prisma.disputeStatusHistory.create.mockResolvedValue({});

      const result = await service.withdraw('dispute-1', mockParticipant, {});

      expect(result.status).toBe(DisputeStatus.WITHDRAWN);
    });

    it('should reject withdraw from a non-filer', async () => {
      prisma.dispute.findUnique.mockResolvedValue(mockDispute); // openedByUserId = participant-1

      await expect(service.withdraw('dispute-1', mockBA, {})).rejects.toThrow(ForbiddenException);
    });

    it('should reject withdraw from UNDER_REVIEW status', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      });

      await expect(service.withdraw('dispute-1', mockParticipant, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── sendMessage ───────────────────────────────────────

  describe('sendMessage', () => {
    it('should add a message to an open dispute', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.OPEN,
      });
      const createdMessage = {
        id: 'msg-1',
        disputeId: 'dispute-1',
        authorUserId: 'participant-1',
        authorRole: UserRole.PARTICIPANT,
        messageType: 'COMMENT',
        content: 'Hello',
        isInternal: false,
        createdAt: new Date(),
        author: { id: 'participant-1', firstName: 'Test', lastName: 'User' },
      };
      prisma.disputeMessage.create.mockResolvedValue(createdMessage);

      const result = await service.sendMessage('dispute-1', mockParticipant, {
        content: 'Hello',
        isInternal: false,
      });

      expect(result.content).toBe('Hello');
      expect(result.isInternal).toBe(false);
    });

    it('should reject internal messages from non-admin users', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.OPEN,
      });

      await expect(
        service.sendMessage('dispute-1', mockParticipant, {
          content: 'Internal note',
          isInternal: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject messages on a CLOSED dispute', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.CLOSED,
      });

      await expect(
        service.sendMessage('dispute-1', mockParticipant, { content: 'Late message' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow super admin to send internal messages', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        ...mockDispute,
        status: DisputeStatus.UNDER_REVIEW,
      });
      const createdMessage = {
        id: 'msg-2',
        disputeId: 'dispute-1',
        authorUserId: 'sa-1',
        authorRole: UserRole.SUPER_ADMIN,
        messageType: 'INTERNAL_NOTE',
        content: 'Internal note for team',
        isInternal: true,
        createdAt: new Date(),
        author: { id: 'sa-1', firstName: 'Super', lastName: 'Admin' },
      };
      prisma.disputeMessage.create.mockResolvedValue(createdMessage);

      const result = await service.sendMessage('dispute-1', mockSA, {
        content: 'Internal note for team',
        isInternal: true,
      });

      expect(result.isInternal).toBe(true);
    });
  });
});
