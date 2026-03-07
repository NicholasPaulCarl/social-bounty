import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  UserRole,
  BountyStatus,
  SubmissionStatus,
  PayoutStatus,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  PAGINATION_DEFAULTS,
  FILE_UPLOAD_LIMITS,
  VERIFICATION_DEADLINE_HOURS,
} from '@social-bounty/shared';
import type { ReportedMetricsInput } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const REVIEW_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO'],
  IN_REVIEW: ['APPROVED', 'REJECTED', 'NEEDS_MORE_INFO'],
  NEEDS_MORE_INFO: ['IN_REVIEW', 'APPROVED', 'REJECTED'],
};

const PAYOUT_TRANSITIONS: Record<string, string[]> = {
  NOT_PAID: ['PENDING', 'PAID'],
  PENDING: ['PAID', 'NOT_PAID'],
  PAID: [], // terminal state — no transitions allowed
};

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  async create(
    bountyId: string,
    user: AuthenticatedUser,
    data: { proofText: string; proofLinks?: string[]; reportedMetrics?: ReportedMetricsInput },
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { _count: { select: { submissions: true } } },
    });

    if (!bounty) {
      throw new NotFoundException('Bounty not found');
    }

    if (bounty.status !== BountyStatus.LIVE) {
      throw new BadRequestException('Bounty is not accepting submissions');
    }

    if (bounty.maxSubmissions && bounty._count.submissions >= bounty.maxSubmissions) {
      throw new BadRequestException('Maximum submissions reached');
    }

    if (bounty.endDate && new Date() > bounty.endDate) {
      throw new BadRequestException('Bounty submission period has ended');
    }

    // Atomic: check for existing + create in transaction
    const submission = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.submission.findFirst({
        where: { bountyId, userId: user.sub },
      });

      if (existing) {
        throw new ConflictException('You already have a submission for this bounty');
      }

      return tx.submission.create({
        data: {
          bountyId,
          userId: user.sub,
          proofText: data.proofText.trim(),
          proofLinks: data.proofLinks || [],
          status: SubmissionStatus.SUBMITTED,
          payoutStatus: PayoutStatus.NOT_PAID,
          reportedMetrics: data.reportedMetrics
            ? (data.reportedMetrics as any)
            : undefined,
        },
        include: {
          proofImages: true,
        },
      });
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.SUBMISSION_CREATE,
      entityType: ENTITY_TYPES.SUBMISSION,
      entityId: submission.id,
      afterState: { bountyId, status: submission.status },
      ipAddress,
    });

    return {
      id: submission.id,
      bountyId: submission.bountyId,
      userId: submission.userId,
      proofText: submission.proofText,
      proofLinks: submission.proofLinks,
      proofImages: submission.proofImages.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileUrl: `/api/v1/files/${f.id}`,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
      })),
      status: submission.status,
      payoutStatus: submission.payoutStatus,
      reportedMetrics: (submission as any).reportedMetrics as ReportedMetricsInput | null ?? null,
      verificationDeadline: (submission as any).verificationDeadline?.toISOString() ?? null,
      createdAt: submission.createdAt.toISOString(),
    };
  }

  async listMySubmissions(
    user: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      status?: SubmissionStatus;
      payoutStatus?: PayoutStatus;
      bountyId?: string;
    },
  ) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const where: Prisma.SubmissionWhereInput = { userId: user.sub };
    if (params.status) where.status = params.status;
    if (params.payoutStatus) where.payoutStatus = params.payoutStatus;
    if (params.bountyId) where.bountyId = params.bountyId;

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          bounty: {
            select: {
              id: true,
              title: true,
              rewardType: true,
              rewardValue: true,
              organisation: {
                select: { id: true, name: true },
              },
            },
          },
          proofImages: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      data: submissions.map((s) => ({
        id: s.id,
        bountyId: s.bountyId,
        bounty: {
          id: s.bounty.id,
          title: s.bounty.title,
          rewardType: s.bounty.rewardType,
          rewardValue: s.bounty.rewardValue?.toString() || null,
          organisation: s.bounty.organisation,
        },
        proofText: s.proofText,
        proofLinks: s.proofLinks,
        proofImages: s.proofImages.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          fileUrl: `/api/v1/files/${f.id}`,
          mimeType: f.mimeType,
          fileSize: f.fileSize,
        })),
        status: s.status,
        reviewerNote: s.reviewerNote,
        payoutStatus: s.payoutStatus,
        reportedMetrics: (s as any).reportedMetrics as ReportedMetricsInput | null ?? null,
        verificationDeadline: (s as any).verificationDeadline?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listForBounty(
    bountyId: string,
    user: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      status?: SubmissionStatus;
      payoutStatus?: PayoutStatus;
    },
  ) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!bounty) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const where: Prisma.SubmissionWhereInput = { bountyId };
    if (params.status) where.status = params.status;
    if (params.payoutStatus) where.payoutStatus = params.payoutStatus;

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          reviewedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          proofImages: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      data: submissions.map((s) => ({
        id: s.id,
        userId: s.userId,
        user: s.user,
        proofText: s.proofText,
        proofLinks: s.proofLinks,
        proofImages: s.proofImages.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          fileUrl: `/api/v1/files/${f.id}`,
          mimeType: f.mimeType,
          fileSize: f.fileSize,
        })),
        status: s.status,
        reviewerNote: s.reviewerNote,
        reviewedBy: s.reviewedBy,
        payoutStatus: s.payoutStatus,
        reportedMetrics: (s as any).reportedMetrics as ReportedMetricsInput | null ?? null,
        verificationDeadline: (s as any).verificationDeadline?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: AuthenticatedUser) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            rewardType: true,
            rewardValue: true,
            organisationId: true,
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        proofImages: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // RBAC
    if (user.role === UserRole.PARTICIPANT && submission.userId !== user.sub) {
      throw new ForbiddenException('Not authorized');
    }

    if (
      user.role === UserRole.BUSINESS_ADMIN &&
      submission.bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    return {
      id: submission.id,
      bountyId: submission.bountyId,
      bounty: {
        id: submission.bounty.id,
        title: submission.bounty.title,
        rewardType: submission.bounty.rewardType,
        rewardValue: submission.bounty.rewardValue?.toString() || null,
      },
      userId: submission.userId,
      user: submission.user,
      proofText: submission.proofText,
      proofLinks: submission.proofLinks,
      proofImages: submission.proofImages.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileUrl: `/api/v1/files/${f.id}`,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
      })),
      status: submission.status,
      reviewerNote: submission.reviewerNote,
      reviewedBy: submission.reviewedBy,
      payoutStatus: submission.payoutStatus,
      reportedMetrics: (submission as any).reportedMetrics as ReportedMetricsInput | null ?? null,
      verificationDeadline: (submission as any).verificationDeadline?.toISOString() ?? null,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
    };
  }

  async updateSubmission(
    id: string,
    user: AuthenticatedUser,
    data: { proofText?: string; proofLinks?: string[]; removeImageIds?: string[] },
    ipAddress?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: { proofImages: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.userId !== user.sub) {
      throw new ForbiddenException('Not the original submitter');
    }

    if (submission.status !== SubmissionStatus.NEEDS_MORE_INFO) {
      throw new BadRequestException('Submission is not in NEEDS_MORE_INFO status');
    }

    const beforeState = {
      proofText: submission.proofText,
      status: submission.status,
    };

    // Remove specified images
    if (data.removeImageIds && data.removeImageIds.length > 0) {
      await this.prisma.fileUpload.deleteMany({
        where: {
          id: { in: data.removeImageIds },
          submissionId: id,
        },
      });
    }

    const updateData: Prisma.SubmissionUpdateInput = {
      status: SubmissionStatus.SUBMITTED,
    };
    if (data.proofText !== undefined) updateData.proofText = data.proofText.trim();
    if (data.proofLinks !== undefined) updateData.proofLinks = data.proofLinks;

    const updated = await this.prisma.submission.update({
      where: { id },
      data: updateData,
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            rewardType: true,
            rewardValue: true,
            organisationId: true,
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        proofImages: true,
      },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.SUBMISSION_UPDATE,
      entityType: ENTITY_TYPES.SUBMISSION,
      entityId: id,
      beforeState,
      afterState: { status: updated.status },
      ipAddress,
    });

    return {
      id: updated.id,
      bountyId: updated.bountyId,
      bounty: {
        id: updated.bounty.id,
        title: updated.bounty.title,
        rewardType: updated.bounty.rewardType,
        rewardValue: updated.bounty.rewardValue?.toString() || null,
      },
      userId: updated.userId,
      user: updated.user,
      proofText: updated.proofText,
      proofLinks: updated.proofLinks,
      proofImages: updated.proofImages.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileUrl: `/api/v1/files/${f.id}`,
        mimeType: f.mimeType,
        fileSize: f.fileSize,
      })),
      status: updated.status,
      reviewerNote: updated.reviewerNote,
      reviewedBy: updated.reviewedBy,
      payoutStatus: updated.payoutStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async review(
    id: string,
    user: AuthenticatedUser,
    newStatus: SubmissionStatus,
    reviewerNote?: string,
    ipAddress?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        bounty: {
          select: { organisationId: true, title: true },
        },
        user: { select: { email: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      submission.bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    const allowed = REVIEW_TRANSITIONS[submission.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${submission.status} to ${newStatus}`,
      );
    }

    const beforeState = {
      status: submission.status,
      reviewerNote: submission.reviewerNote,
    };

    // Append to reviewHistory
    const existingHistory = (submission as any).reviewHistory as any[] || [];
    const historyEntry = {
      status: newStatus,
      changedAt: new Date().toISOString(),
      changedBy: user.sub,
      note: reviewerNote || null,
    };

    // Set verification deadline when approving
    const updatePayload: any = {
      status: newStatus,
      reviewerNote: reviewerNote ?? submission.reviewerNote,
      reviewedById: user.sub,
      reviewHistory: [...existingHistory, historyEntry] as any,
    };
    if (newStatus === SubmissionStatus.APPROVED) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + VERIFICATION_DEADLINE_HOURS);
      updatePayload.verificationDeadline = deadline;
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data: updatePayload,
      include: {
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.SUBMISSION_REVIEW,
      entityType: ENTITY_TYPES.SUBMISSION,
      entityId: id,
      beforeState,
      afterState: { status: newStatus, reviewerNote: reviewerNote || null },
      ipAddress,
    });

    // Send email notification for status change
    this.mailService
      .sendSubmissionStatusChange(
        submission.user.email,
        submission.bounty.title,
        newStatus,
      )
      .catch((err) => {
        console.error('Failed to send status change email:', err);
      });

    return {
      id: updated.id,
      status: updated.status,
      reviewerNote: updated.reviewerNote,
      reviewedBy: updated.reviewedBy,
      payoutStatus: updated.payoutStatus,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async updatePayout(
    id: string,
    user: AuthenticatedUser,
    newPayoutStatus: PayoutStatus,
    note?: string,
    ipAddress?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        bounty: { select: { organisationId: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      submission.bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (submission.status !== SubmissionStatus.APPROVED) {
      throw new BadRequestException('Only approved submissions can have payout status updated');
    }

    const allowed = PAYOUT_TRANSITIONS[submission.payoutStatus] || [];
    if (!allowed.includes(newPayoutStatus)) {
      throw new BadRequestException(
        `Cannot transition payout from ${submission.payoutStatus} to ${newPayoutStatus}`,
      );
    }

    const beforeState = { payoutStatus: submission.payoutStatus };

    const updated = await this.prisma.submission.update({
      where: { id },
      data: { payoutStatus: newPayoutStatus },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.SUBMISSION_PAYOUT_CHANGE,
      entityType: ENTITY_TYPES.SUBMISSION,
      entityId: id,
      beforeState,
      afterState: { payoutStatus: newPayoutStatus, note: note || null },
      ipAddress,
    });

    return {
      id: updated.id,
      payoutStatus: updated.payoutStatus,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getReviewQueue(user: AuthenticatedUser, filters: {
    orgId?: string;
    status?: SubmissionStatus;
    bountyId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Number(filters.page) || 1;
    const limit = Math.min(Number(filters.limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Determine org scope
    let organisationId = filters.orgId;
    if (user.role === UserRole.BUSINESS_ADMIN) {
      const membership = await this.prisma.organisationMember.findFirst({
        where: { userId: user.sub },
      });
      if (!membership) throw new ForbiddenException('Not a member of any organisation');
      organisationId = membership.organisationId;
    }

    const where: Prisma.SubmissionWhereInput = {
      bounty: {
        ...(organisationId ? { organisationId } : {}),
        ...(filters.bountyId ? { id: filters.bountyId } : {}),
        deletedAt: null,
      },
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          bounty: { select: { id: true, title: true, rewardValue: true, rewardType: true, category: true, organisationId: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [filters.sortBy || 'createdAt']: filters.sortOrder || 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.submission.count({ where }),
    ]);

    // Calculate summary stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statsWhere: Prisma.SubmissionWhereInput = {
      bounty: { ...(organisationId ? { organisationId } : {}), deletedAt: null },
    };

    const [pending, inReview, needsMoreInfo, approvedToday, rejectedToday] = await Promise.all([
      this.prisma.submission.count({ where: { ...statsWhere, status: SubmissionStatus.SUBMITTED } }),
      this.prisma.submission.count({ where: { ...statsWhere, status: SubmissionStatus.IN_REVIEW } }),
      this.prisma.submission.count({ where: { ...statsWhere, status: SubmissionStatus.NEEDS_MORE_INFO } }),
      this.prisma.submission.count({ where: { ...statsWhere, status: SubmissionStatus.APPROVED, updatedAt: { gte: today } } }),
      this.prisma.submission.count({ where: { ...statsWhere, status: SubmissionStatus.REJECTED, updatedAt: { gte: today } } }),
    ]);

    return {
      stats: { pending, inReview, needsMoreInfo, approvedToday, rejectedToday },
      data: submissions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyEarnings(userId: string) {
    const [totalSubmissions, approvedCount, earnings] = await Promise.all([
      this.prisma.submission.count({ where: { userId } }),
      this.prisma.submission.count({ where: { userId, status: SubmissionStatus.APPROVED } }),
      this.prisma.submission.findMany({
        where: { userId, status: SubmissionStatus.APPROVED },
        include: { bounty: { select: { rewardValue: true } } },
      }),
    ]);

    let totalEarned = 0;
    let pendingPayout = 0;
    for (const sub of earnings) {
      const val = sub.bounty.rewardValue ? Number(sub.bounty.rewardValue) : 0;
      if (sub.payoutStatus === PayoutStatus.PAID) {
        totalEarned += val;
      } else {
        pendingPayout += val;
      }
    }

    return { totalSubmissions, approvedCount, totalEarned, pendingPayout };
  }

  async uploadFiles(
    submissionId: string,
    user: AuthenticatedUser,
    files: Express.Multer.File[],
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { proofImages: true },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.userId !== user.sub) {
      throw new ForbiddenException('Not the original submitter');
    }

    // Check total file count
    const existingCount = submission.proofImages.length;
    if (existingCount + files.length > FILE_UPLOAD_LIMITS.MAX_FILES_PER_SUBMISSION) {
      throw new BadRequestException(
        `Cannot upload ${files.length} files. Maximum ${FILE_UPLOAD_LIMITS.MAX_FILES_PER_SUBMISSION} files per submission (${existingCount} already uploaded).`,
      );
    }

    const fileRecords = await this.prisma.$transaction(
      files.map((file) =>
        this.prisma.fileUpload.create({
          data: {
            submissionId,
            userId: user.sub,
            fileName: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'),
            fileUrl: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
          },
        }),
      ),
    );

    return fileRecords.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      fileUrl: `/api/v1/files/${f.id}`,
      mimeType: f.mimeType,
      fileSize: f.fileSize,
    }));
  }
}
