import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { BountyAccessService } from '../bounty-access/bounty-access.service';
import {
  UserRole,
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
  SocialChannel,
  PostFormat,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ApprovalLedgerService } from '../ledger/approval-ledger.service';
import { SubmissionScraperService } from './submission-scraper.service';

describe('SubmissionsService', () => {
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

  const liveBounty = {
    id: 'bounty-1',
    status: BountyStatus.LIVE,
    maxSubmissions: 100,
    endDate: new Date('2026-12-31'),
    brandId: 'org-1',
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
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'participant-1', email: 'participant@test.com', firstName: 'Test', lastName: 'User' },
    bounty: { id: 'bounty-1', title: 'Test Bounty', brandId: 'org-1', rewardValue: 100, currency: 'ZAR' },
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
      submissionUrlScrape: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      fileUpload: {
        deleteMany: jest.fn(),
      },
      payout: {
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((arg: any) =>
        typeof arg === 'function' ? arg(prisma) : Promise.all(arg),
      ),
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
        { provide: ApprovalLedgerService, useValue: { postApproval: jest.fn().mockResolvedValue(undefined) } },
        { provide: SubmissionScraperService, useValue: { scrapeAndVerify: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  // ── create ──────────────────────────────────────────

  describe('create', () => {
    it('should create a submission with SUBMITTED status', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        ...baseSubmission,
        proofImages: [],
      });

      const result = await service.create(
        'bounty-1',
        mockParticipant,
        { proofText: 'My proof', proofLinks: [] },
      );

      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
      expect(result.payoutStatus).toBe(PayoutStatus.NOT_PAID);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'submission.create' }),
      );
    });

    it('should throw NotFoundException for non-existent bounty', async () => {
      prisma.bounty.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', mockParticipant, { proofText: 'Proof', proofLinks: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if bounty is not LIVE', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.DRAFT,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof', proofLinks: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if bounty is CLOSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.CLOSED,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof', proofLinks: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if bounty is PAUSED', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        status: BountyStatus.PAUSED,
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof', proofLinks: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if max submissions reached', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        maxSubmissions: 5,
        _count: { submissions: 5 },
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof', proofLinks: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if bounty end date has passed', async () => {
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        endDate: new Date('2020-01-01'),
      });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof', proofLinks: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate submission', async () => {
      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue({ id: 'existing-sub' });

      await expect(
        service.create('bounty-1', mockParticipant, { proofText: 'Proof', proofLinks: [] }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── review ──────────────────────────────────────────

  describe('review', () => {
    const submittedSubmission = {
      ...baseSubmission,
      status: SubmissionStatus.SUBMITTED,
      bounty: { brandId: 'org-1', title: 'Test Bounty' },
      user: { email: 'participant@test.com', firstName: 'Test' },
    };

    it('should allow SUBMITTED -> IN_REVIEW', async () => {
      prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.IN_REVIEW,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      const result = await service.review(
        'sub-1',
        mockBA,
        SubmissionStatus.IN_REVIEW,
      );
      expect(result.status).toBe(SubmissionStatus.IN_REVIEW);
    });

    it('should allow SUBMITTED -> APPROVED (skip review)', async () => {
      prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.APPROVED,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      const result = await service.review(
        'sub-1',
        mockBA,
        SubmissionStatus.APPROVED,
        'Great work!',
      );
      expect(result.status).toBe(SubmissionStatus.APPROVED);
    });

    it('should allow SUBMITTED -> REJECTED', async () => {
      prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.REJECTED,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      const result = await service.review(
        'sub-1',
        mockBA,
        SubmissionStatus.REJECTED,
        'Not meeting requirements',
      );
      expect(result.status).toBe(SubmissionStatus.REJECTED);
    });

    it('should allow SUBMITTED -> NEEDS_MORE_INFO', async () => {
      prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.NEEDS_MORE_INFO,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      const result = await service.review(
        'sub-1',
        mockBA,
        SubmissionStatus.NEEDS_MORE_INFO,
        'Please add a screenshot',
      );
      expect(result.status).toBe(SubmissionStatus.NEEDS_MORE_INFO);
    });

    it('should allow IN_REVIEW -> APPROVED', async () => {
      const inReviewSub = {
        ...submittedSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      prisma.submission.findUnique.mockResolvedValue(inReviewSub);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.APPROVED,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      const result = await service.review(
        'sub-1',
        mockBA,
        SubmissionStatus.APPROVED,
      );
      expect(result.status).toBe(SubmissionStatus.APPROVED);
    });

    it('should allow IN_REVIEW -> REJECTED', async () => {
      const inReviewSub = {
        ...submittedSubmission,
        status: SubmissionStatus.IN_REVIEW,
      };
      prisma.submission.findUnique.mockResolvedValue(inReviewSub);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.REJECTED,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      const result = await service.review(
        'sub-1',
        mockBA,
        SubmissionStatus.REJECTED,
      );
      expect(result.status).toBe(SubmissionStatus.REJECTED);
    });

    it('should allow NEEDS_MORE_INFO -> IN_REVIEW', async () => {
      const nmiSub = {
        ...submittedSubmission,
        status: SubmissionStatus.NEEDS_MORE_INFO,
      };
      prisma.submission.findUnique.mockResolvedValue(nmiSub);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.IN_REVIEW,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      const result = await service.review(
        'sub-1',
        mockBA,
        SubmissionStatus.IN_REVIEW,
      );
      expect(result.status).toBe(SubmissionStatus.IN_REVIEW);
    });

    it('should reject APPROVED -> IN_REVIEW (invalid)', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...submittedSubmission,
        status: SubmissionStatus.APPROVED,
      });

      await expect(
        service.review('sub-1', mockBA, SubmissionStatus.IN_REVIEW),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject REJECTED -> APPROVED (invalid)', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...submittedSubmission,
        status: SubmissionStatus.REJECTED,
      });

      await expect(
        service.review('sub-1', mockBA, SubmissionStatus.APPROVED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if BA not in bounty org', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...submittedSubmission,
        bounty: { brandId: 'other-org', title: 'Other Bounty' },
      });

      await expect(
        service.review('sub-1', mockBA, SubmissionStatus.APPROVED),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SA to review any org submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...submittedSubmission,
        bounty: { brandId: 'other-org', title: 'Other Bounty' },
      });
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

    it('should send email notification on review', async () => {
      prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.APPROVED,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      await service.review('sub-1', mockBA, SubmissionStatus.APPROVED);

      expect(mailService.sendSubmissionStatusEmail).toHaveBeenCalledWith(
        'participant@test.com',
        {
          userName: 'Test',
          bountyTitle: 'Test Bounty',
          status: SubmissionStatus.APPROVED,
          reviewerNote: undefined,
          actionUrl: undefined,
        },
      );
    });

    it('should create audit log on review', async () => {
      prisma.submission.findUnique.mockResolvedValue(submittedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.APPROVED,
        reviewedBy: { id: 'ba-1', firstName: 'BA', lastName: 'User' },
      });

      await service.review('sub-1', mockBA, SubmissionStatus.APPROVED, 'Good');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'submission.review',
          beforeState: expect.objectContaining({ status: SubmissionStatus.SUBMITTED }),
          afterState: expect.objectContaining({ status: SubmissionStatus.APPROVED }),
        }),
      );
    });
  });

  // ── updatePayout ────────────────────────────────────

  describe('updatePayout', () => {
    const approvedSubmission = {
      ...baseSubmission,
      status: SubmissionStatus.APPROVED,
      payoutStatus: PayoutStatus.NOT_PAID,
      bounty: { ...baseSubmission.bounty, brandId: 'org-1' },
      payout: null,
    };

    it('should allow NOT_PAID -> PENDING', async () => {
      prisma.submission.findUnique.mockResolvedValue(approvedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        payoutStatus: PayoutStatus.PENDING,
      });

      const result = await service.updatePayout(
        'sub-1',
        mockBA,
        PayoutStatus.PENDING,
      );
      expect(result.payoutStatus).toBe(PayoutStatus.PENDING);
    });

    it('should allow NOT_PAID -> PAID', async () => {
      prisma.submission.findUnique.mockResolvedValue(approvedSubmission);
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        payoutStatus: PayoutStatus.PAID,
      });

      const result = await service.updatePayout(
        'sub-1',
        mockBA,
        PayoutStatus.PAID,
      );
      expect(result.payoutStatus).toBe(PayoutStatus.PAID);
    });

    it('should allow PENDING -> PAID', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...approvedSubmission,
        payoutStatus: PayoutStatus.PENDING,
      });
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        payoutStatus: PayoutStatus.PAID,
      });

      const result = await service.updatePayout(
        'sub-1',
        mockBA,
        PayoutStatus.PAID,
      );
      expect(result.payoutStatus).toBe(PayoutStatus.PAID);
    });

    it('should allow PENDING -> NOT_PAID (reversal)', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...approvedSubmission,
        payoutStatus: PayoutStatus.PENDING,
      });
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        payoutStatus: PayoutStatus.NOT_PAID,
      });

      const result = await service.updatePayout(
        'sub-1',
        mockBA,
        PayoutStatus.NOT_PAID,
      );
      expect(result.payoutStatus).toBe(PayoutStatus.NOT_PAID);
    });

    it('should reject PAID -> NOT_PAID (invalid)', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...approvedSubmission,
        payoutStatus: PayoutStatus.PAID,
      });

      await expect(
        service.updatePayout('sub-1', mockBA, PayoutStatus.NOT_PAID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payout on non-APPROVED submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...approvedSubmission,
        status: SubmissionStatus.SUBMITTED,
      });

      await expect(
        service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if BA not in bounty org', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...approvedSubmission,
        bounty: { ...baseSubmission.bounty, brandId: 'other-org' },
      });

      await expect(
        service.updatePayout('sub-1', mockBA, PayoutStatus.PENDING),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── updateSubmission ────────────────────────────────

  describe('updateSubmission', () => {
    const nmiSubmission = {
      ...baseSubmission,
      status: SubmissionStatus.NEEDS_MORE_INFO,
      proofImages: [],
    };

    it('should allow update when in NEEDS_MORE_INFO status', async () => {
      prisma.submission.findUnique.mockResolvedValue(nmiSubmission);
      prisma.submission.update.mockResolvedValue({
        ...nmiSubmission,
        status: SubmissionStatus.SUBMITTED,
        proofText: 'Updated proof',
        bounty: { id: 'bounty-1', title: 'Test', rewardType: 'CASH', rewardValue: 25, brandId: 'org-1' },
        user: { id: 'participant-1', firstName: 'P', lastName: 'User', email: 'p@test.com' },
        reviewedBy: null,
        proofImages: [],
      });

      const result = await service.updateSubmission(
        'sub-1',
        mockParticipant,
        { proofText: 'Updated proof' },
      );
      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
    });

    it('should reject update when not in NEEDS_MORE_INFO status', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.SUBMITTED,
        proofImages: [],
      });

      await expect(
        service.updateSubmission('sub-1', mockParticipant, {
          proofText: 'Updated',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject update from non-owner', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...nmiSubmission,
        userId: 'other-user',
      });

      await expect(
        service.updateSubmission('sub-1', mockParticipant, {
          proofText: 'Updated',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent submission', async () => {
      prisma.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSubmission('non-existent', mockParticipant, {
          proofText: 'Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findById ────────────────────────────────────────

  describe('findById', () => {
    const fullSubmission = {
      ...baseSubmission,
      bounty: {
        id: 'bounty-1',
        title: 'Test',
        rewardType: 'CASH',
        rewardValue: 25,
        brandId: 'org-1',
      },
      user: { id: 'participant-1', firstName: 'P', lastName: 'U', email: 'p@test.com' },
      reviewedBy: null,
      proofImages: [],
    };

    it('should return submission for own participant', async () => {
      prisma.submission.findUnique.mockResolvedValue(fullSubmission);

      const result = await service.findById('sub-1', mockParticipant);
      expect(result.id).toBe('sub-1');
    });

    it('should throw ForbiddenException if participant views other user submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        userId: 'other-participant',
      });

      await expect(
        service.findById('sub-1', mockParticipant),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow BA to view own org submission', async () => {
      prisma.submission.findUnique.mockResolvedValue(fullSubmission);

      const result = await service.findById('sub-1', mockBA);
      expect(result.id).toBe('sub-1');
    });

    it('should throw ForbiddenException if BA views other org submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        bounty: { ...fullSubmission.bounty, brandId: 'other-org' },
      });

      await expect(service.findById('sub-1', mockBA)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow SA to view any submission', async () => {
      prisma.submission.findUnique.mockResolvedValue({
        ...fullSubmission,
        bounty: { ...fullSubmission.bounty, brandId: 'other-org' },
      });

      const result = await service.findById('sub-1', mockSA);
      expect(result.id).toBe('sub-1');
    });
  });

  // ── PR 2: Scrape trigger + approval gate ───────────────

  describe('PR 2: scrape trigger + approval gate', () => {
    let scraper: { scrapeAndVerify: jest.Mock };

    beforeEach(() => {
      // Re-build module with a captured scraper mock so we can inspect calls.
      scraper = { scrapeAndVerify: jest.fn().mockResolvedValue(undefined) };
    });

    it('create chains scrapeAndVerify via setImmediate', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          SubmissionsService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: auditService },
          { provide: MailService, useValue: mailService },
          { provide: WalletService, useValue: { creditWallet: jest.fn().mockResolvedValue({}) } },
          { provide: BountyAccessService, useValue: { canSubmitToBounty: jest.fn().mockResolvedValue(true) } },
          { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE'), getActiveOrgTier: jest.fn().mockResolvedValue('FREE'), isFeatureEnabled: jest.fn().mockResolvedValue(false) } },
          { provide: ApprovalLedgerService, useValue: { postApproval: jest.fn().mockResolvedValue(undefined) } },
          { provide: SubmissionScraperService, useValue: scraper },
        ],
      }).compile();
      const svc = moduleRef.get<SubmissionsService>(SubmissionsService);

      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({ ...baseSubmission, proofImages: [] });
      prisma.submission.findUnique.mockResolvedValue({
        ...baseSubmission,
        proofImages: [],
        urlScrapes: [
          {
            id: 'scrape-1',
            url: 'https://instagram.com/reels/AAA',
            channel: 'INSTAGRAM',
            format: 'REEL',
            scrapeStatus: 'PENDING',
            scrapeResult: null,
            verificationChecks: null,
            errorMessage: null,
            scrapedAt: null,
          },
        ],
      });

      const proofLinks = [
        { channel: SocialChannel.INSTAGRAM, format: PostFormat.REEL, url: 'https://instagram.com/reels/AAA' },
      ];
      // NOTE: bounty has no `channels` in liveBounty fixture so coverage
      // validator would reject. Patch the fixture for this test.
      prisma.bounty.findUnique.mockResolvedValue({
        ...liveBounty,
        channels: { INSTAGRAM: ['REEL'] },
      });

      await svc.create('bounty-1', mockParticipant, {
        proofText: 'My proof',
        proofLinks,
      });

      // setImmediate is async — wait one tick for the callback to fire.
      await new Promise((resolve) => setImmediate(resolve));
      expect(scraper.scrapeAndVerify).toHaveBeenCalledWith('sub-1');
    });

    it('review rejects APPROVED when any URL scrape is not VERIFIED', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          SubmissionsService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: auditService },
          { provide: MailService, useValue: mailService },
          { provide: WalletService, useValue: { creditWallet: jest.fn().mockResolvedValue({}) } },
          { provide: BountyAccessService, useValue: { canSubmitToBounty: jest.fn().mockResolvedValue(true) } },
          { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE') } },
          { provide: ApprovalLedgerService, useValue: { postApproval: jest.fn().mockResolvedValue(undefined) } },
          { provide: SubmissionScraperService, useValue: scraper },
        ],
      }).compile();
      const svc = moduleRef.get<SubmissionsService>(SubmissionsService);

      prisma.submission.findUnique.mockResolvedValue({
        ...baseSubmission,
        bounty: { brandId: 'org-1', title: 'Test Bounty' },
        user: { email: 'p@test.com', firstName: 'Test' },
        urlScrapes: [
          {
            id: 'scrape-1',
            url: 'https://instagram.com/reels/AAA',
            channel: 'INSTAGRAM',
            format: 'REEL',
            scrapeStatus: 'FAILED',
            errorMessage: 'minViews not met',
          },
        ],
      });

      await expect(
        svc.review('sub-1', mockBA, SubmissionStatus.APPROVED),
      ).rejects.toThrow(BadRequestException);

      // Update was not called (gate stops the transition)
      expect(prisma.submission.update).not.toHaveBeenCalled();
    });

    it('create succeeds even when scrape callback throws (logged, not surfaced)', async () => {
      scraper.scrapeAndVerify = jest.fn().mockRejectedValue(new Error('apify down'));
      const moduleRef = await Test.createTestingModule({
        providers: [
          SubmissionsService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: auditService },
          { provide: MailService, useValue: mailService },
          { provide: WalletService, useValue: { creditWallet: jest.fn().mockResolvedValue({}) } },
          { provide: BountyAccessService, useValue: { canSubmitToBounty: jest.fn().mockResolvedValue(true) } },
          { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE') } },
          { provide: ApprovalLedgerService, useValue: { postApproval: jest.fn().mockResolvedValue(undefined) } },
          { provide: SubmissionScraperService, useValue: scraper },
        ],
      }).compile();
      const svc = moduleRef.get<SubmissionsService>(SubmissionsService);

      prisma.bounty.findUnique.mockResolvedValue(liveBounty);
      prisma.submission.findFirst.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({ ...baseSubmission, proofImages: [] });

      // No proofLinks → no scrape needed → still triggers, but call rejects.
      const result = await svc.create('bounty-1', mockParticipant, {
        proofText: 'My proof',
        proofLinks: [],
      });

      expect(result.id).toBe('sub-1');
      // Drain the setImmediate to verify it doesn't throw uncaught.
      await new Promise((resolve) => setImmediate(resolve));
      expect(scraper.scrapeAndVerify).toHaveBeenCalled();
    });

    it('updateSubmission re-triggers scrape only when proofLinks change', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          SubmissionsService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: auditService },
          { provide: MailService, useValue: mailService },
          { provide: WalletService, useValue: { creditWallet: jest.fn().mockResolvedValue({}) } },
          { provide: BountyAccessService, useValue: { canSubmitToBounty: jest.fn().mockResolvedValue(true) } },
          { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE') } },
          { provide: ApprovalLedgerService, useValue: { postApproval: jest.fn().mockResolvedValue(undefined) } },
          { provide: SubmissionScraperService, useValue: scraper },
        ],
      }).compile();
      const svc = moduleRef.get<SubmissionsService>(SubmissionsService);

      // 1) updateSubmission with proofText only → no scrape trigger
      prisma.submission.findUnique.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.NEEDS_MORE_INFO,
        bounty: { channels: { INSTAGRAM: ['REEL'] } },
      });
      prisma.submission.update.mockResolvedValue({
        ...baseSubmission,
        status: SubmissionStatus.SUBMITTED,
        bounty: { id: 'bounty-1', title: 'T', rewardType: 'CASH', rewardValue: 25, brandId: 'org-1' },
        user: { id: 'p-1', firstName: 'P', lastName: 'U', email: 'p@t.com' },
        reviewedBy: null,
        proofImages: [],
        urlScrapes: [],
      });

      await svc.updateSubmission('sub-1', mockParticipant, { proofText: 'updated' });
      await new Promise((resolve) => setImmediate(resolve));
      expect(scraper.scrapeAndVerify).not.toHaveBeenCalled();

      // 2) updateSubmission with new proofLinks → scrape trigger
      prisma.submissionUrlScrape.findMany.mockResolvedValue([]); // no existing rows
      await svc.updateSubmission('sub-1', mockParticipant, {
        proofLinks: [
          { channel: SocialChannel.INSTAGRAM, format: PostFormat.REEL, url: 'https://instagram.com/reels/X' },
        ],
      });
      await new Promise((resolve) => setImmediate(resolve));
      expect(scraper.scrapeAndVerify).toHaveBeenCalledWith('sub-1');
    });
  });
});
