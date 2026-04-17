import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  UserRole,
  DisputeStatus,
  DisputeCategory,
  DisputeReason,
  DisputeResolution,
  DisputeMessageType,
  EvidenceType,
  SubmissionStatus,
  PayoutStatus,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  PAGINATION_DEFAULTS,
  DISPUTE_LIMITS,
  DISPUTE_EVIDENCE_LIMITS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const DISPUTE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['OPEN', 'WITHDRAWN'],
  OPEN: ['UNDER_REVIEW', 'ESCALATED', 'WITHDRAWN'],
  UNDER_REVIEW: ['AWAITING_RESPONSE', 'ESCALATED', 'RESOLVED'],
  AWAITING_RESPONSE: ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED'],
  ESCALATED: ['UNDER_REVIEW', 'RESOLVED'],
  RESOLVED: ['CLOSED'],
};

const CATEGORY_REASONS: Record<string, string[]> = {
  NON_PAYMENT: [
    'PAYMENT_NOT_RECEIVED',
    'PAYMENT_INCORRECT_AMOUNT',
    'PAYMENT_DELAYED_BEYOND_TERMS',
    'PAYOUT_MARKED_BUT_NOT_RECEIVED',
  ],
  POST_QUALITY: [
    'POST_EDITED_AFTER_APPROVAL',
    'POST_REMOVED',
    'POST_QUALITY_BELOW_STANDARD',
    'POST_WRONG_PLATFORM',
    'POST_MISSING_REQUIRED_ELEMENTS',
  ],
  POST_NON_COMPLIANCE: [
    'POST_DELETED_AFTER_PAYMENT',
    'POST_EDITED_AFTER_PAYMENT',
    'DISCLOSURE_REMOVED',
    'COMPETITOR_CONTENT_ADDED',
    'TERMS_VIOLATED_AFTER_PAYMENT',
  ],
};

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  // ── Create ──────────────────────────────────────────────

  async create(
    user: AuthenticatedUser,
    dto: {
      submissionId: string;
      category: DisputeCategory;
      reason: DisputeReason;
      description: string;
      desiredOutcome: string;
    },
    ipAddress?: string,
  ) {
    // 1. Load the submission + bounty + brand
    const submission = await this.prisma.submission.findUnique({
      where: { id: dto.submissionId },
      include: {
        bounty: {
          include: {
            brand: { select: { id: true, name: true } },
          },
        },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // 2. Authorization based on category
    if (dto.category === DisputeCategory.NON_PAYMENT) {
      // Only the participant who made the submission can file NON_PAYMENT
      if (submission.userId !== user.sub) {
        throw new ForbiddenException('Only the submission participant can file a non-payment dispute');
      }
    } else if (
      dto.category === DisputeCategory.POST_QUALITY ||
      dto.category === DisputeCategory.POST_NON_COMPLIANCE
    ) {
      // Only business admin of the org that owns the bounty can file
      if (
        user.role !== UserRole.SUPER_ADMIN &&
        (user.role !== UserRole.BUSINESS_ADMIN ||
          submission.bounty.brandId !== user.brandId)
      ) {
        throw new ForbiddenException(
          'Only a business admin of the bounty brand can file this dispute category',
        );
      }
    }

    // 3. Category matches submission state
    if (dto.category === DisputeCategory.NON_PAYMENT) {
      if (submission.status !== SubmissionStatus.APPROVED) {
        throw new BadRequestException(
          'Non-payment disputes require an approved submission',
        );
      }
    } else if (dto.category === DisputeCategory.POST_QUALITY) {
      if (submission.status !== SubmissionStatus.APPROVED) {
        throw new BadRequestException(
          'Post quality disputes require an approved submission',
        );
      }
    } else if (dto.category === DisputeCategory.POST_NON_COMPLIANCE) {
      if (submission.payoutStatus !== PayoutStatus.PAID) {
        throw new BadRequestException(
          'Post non-compliance disputes require a paid submission',
        );
      }
    }

    // 4. Reason belongs to category
    const allowedReasons = CATEGORY_REASONS[dto.category] || [];
    if (!allowedReasons.includes(dto.reason)) {
      throw new BadRequestException(
        `Reason '${dto.reason}' is not valid for category '${dto.category}'`,
      );
    }

    // 5. Max 3 active disputes per submission
    const activeStatuses = [
      DisputeStatus.DRAFT,
      DisputeStatus.OPEN,
      DisputeStatus.UNDER_REVIEW,
      DisputeStatus.AWAITING_RESPONSE,
      DisputeStatus.ESCALATED,
    ];
    const activeCount = await this.prisma.dispute.count({
      where: {
        submissionId: dto.submissionId,
        status: { in: activeStatuses },
      },
    });
    if (activeCount >= DISPUTE_LIMITS.MAX_ACTIVE_PER_SUBMISSION) {
      throw new ConflictException(
        `Maximum ${DISPUTE_LIMITS.MAX_ACTIVE_PER_SUBMISSION} active disputes per submission`,
      );
    }

    // 6. Rate limit: 5 per day per user
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const recentCount = await this.prisma.dispute.count({
      where: {
        openedByUserId: user.sub,
        createdAt: { gte: dayAgo },
      },
    });
    if (recentCount >= DISPUTE_LIMITS.MAX_PER_USER_PER_DAY) {
      throw new BadRequestException(
        `Maximum ${DISPUTE_LIMITS.MAX_PER_USER_PER_DAY} disputes per day`,
      );
    }

    // 7. Generate disputeNumber
    const disputeNumber = await this.generateDisputeNumber();

    // 8. Create dispute + initial status history in transaction
    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          disputeNumber,
          category: dto.category,
          reason: dto.reason,
          status: DisputeStatus.DRAFT,
          description: dto.description.trim(),
          desiredOutcome: dto.desiredOutcome.trim(),
          submissionId: dto.submissionId,
          bountyId: submission.bountyId,
          openedByUserId: user.sub,
          openedByRole: user.role as UserRole,
          brandId: submission.bounty.brandId,
        },
      });

      await tx.disputeStatusHistory.create({
        data: {
          disputeId: created.id,
          fromStatus: null,
          toStatus: DisputeStatus.DRAFT,
          changedByUserId: user.sub,
          changedByRole: user.role as UserRole,
          note: 'Dispute created',
        },
      });

      return created;
    });

    // 9. Audit log
    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_CREATE,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: dispute.id,
      afterState: {
        disputeNumber,
        category: dto.category,
        reason: dto.reason,
        submissionId: dto.submissionId,
        status: DisputeStatus.DRAFT,
      },
      ipAddress,
    });

    return {
      id: dispute.id,
      disputeNumber: dispute.disputeNumber,
      category: dispute.category,
      reason: dispute.reason,
      status: dispute.status,
      description: dispute.description,
      desiredOutcome: dispute.desiredOutcome,
      submissionId: dispute.submissionId,
      bountyId: dispute.bountyId,
      brandId: dispute.brandId,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
    };
  }

  // ── Find By ID ────────────────────────────────────────

  async findById(id: string, user: AuthenticatedUser) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            bounty: {
              select: { id: true, title: true, brandId: true, brand: { select: { name: true } } },
            },
          },
        },
        openedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        messages: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        evidence: {
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // RBAC
    if (user.role === UserRole.PARTICIPANT && dispute.openedByUserId !== user.sub) {
      throw new ForbiddenException('Not authorized');
    }

    if (
      user.role === UserRole.BUSINESS_ADMIN &&
      dispute.brandId !== user.brandId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    // Filter out internal messages for non-admins
    const isAdmin = user.role === UserRole.SUPER_ADMIN;
    const filteredMessages = dispute.messages
      .filter((m) => isAdmin || !m.isInternal)
      .map((m) => ({
        id: m.id,
        disputeId: m.disputeId,
        authorUserId: m.authorUserId,
        authorRole: m.authorRole,
        authorName: `${m.author.firstName} ${m.author.lastName}`.trim(),
        messageType: m.messageType,
        content: m.content,
        isInternal: m.isInternal,
        createdAt: m.createdAt.toISOString(),
      }));

    return {
      id: dispute.id,
      disputeNumber: dispute.disputeNumber,
      category: dispute.category,
      reason: dispute.reason,
      status: dispute.status,
      description: dispute.description,
      desiredOutcome: dispute.desiredOutcome,
      submission: {
        id: dispute.submission.id,
        bountyId: dispute.submission.bountyId,
        bountyTitle: dispute.submission.bounty.title,
        status: dispute.submission.status,
        payoutStatus: dispute.submission.payoutStatus,
      },
      openedBy: {
        id: dispute.openedBy.id,
        firstName: dispute.openedBy.firstName,
        lastName: dispute.openedBy.lastName,
        email: dispute.openedBy.email,
        role: dispute.openedByRole,
      },
      openedByRole: dispute.openedByRole,
      brandId: dispute.brandId,
      brandName: dispute.submission.bounty.brand.name,
      assignedTo: dispute.assignedTo
        ? {
            id: dispute.assignedTo.id,
            firstName: dispute.assignedTo.firstName,
            lastName: dispute.assignedTo.lastName,
            email: dispute.assignedTo.email,
            role: UserRole.SUPER_ADMIN,
          }
        : null,
      resolutionType: dispute.resolutionType,
      resolutionSummary: dispute.resolutionSummary,
      resolvedBy: dispute.resolvedBy
        ? {
            id: dispute.resolvedBy.id,
            firstName: dispute.resolvedBy.firstName,
            lastName: dispute.resolvedBy.lastName,
            email: dispute.resolvedBy.email,
            role: UserRole.SUPER_ADMIN,
          }
        : null,
      resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
      escalatedAt: dispute.escalatedAt?.toISOString() ?? null,
      responseDeadline: dispute.responseDeadline?.toISOString() ?? null,
      relatedDisputeId: dispute.relatedDisputeId,
      messages: filteredMessages,
      evidence: dispute.evidence.map((e) => ({
        id: e.id,
        disputeId: e.disputeId,
        evidenceType: e.evidenceType,
        fileUrl: e.fileUrl,
        url: e.url,
        fileName: e.fileName,
        mimeType: e.mimeType,
        fileSize: e.fileSize,
        description: e.description,
        uploadedBy: e.uploadedBy,
        createdAt: e.createdAt.toISOString(),
      })),
      statusHistory: dispute.statusHistory.map((sh) => ({
        id: sh.id,
        fromStatus: sh.fromStatus,
        toStatus: sh.toStatus,
        changedBy: {
          id: sh.changedBy.id,
          firstName: sh.changedBy.firstName,
          lastName: sh.changedBy.lastName,
          role: sh.changedByRole,
        },
        note: sh.note,
        createdAt: sh.createdAt.toISOString(),
      })),
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
    };
  }

  // ── List Mine ─────────────────────────────────────────

  async listMine(
    user: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      status?: DisputeStatus;
      category?: DisputeCategory;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'status', 'category'];
    const sortBy: string = params.sortBy && ALLOWED_SORT_FIELDS.includes(params.sortBy) ? params.sortBy : 'createdAt';

    const where: Prisma.DisputeWhereInput = { openedByUserId: user.sub };
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          openedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
          submission: {
            include: {
              bounty: {
                select: { title: true, brand: { select: { name: true } } },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: params.sortOrder || 'desc' },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data: disputes.map((d) => ({
        id: d.id,
        disputeNumber: d.disputeNumber,
        category: d.category,
        reason: d.reason,
        status: d.status,
        description: d.description,
        submissionId: d.submissionId,
        bountyTitle: d.submission.bounty.title,
        openedBy: d.openedBy,
        brandName: d.submission.bounty.brand.name,
        assignedTo: d.assignedTo,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── List For Brand ─────────────────────────────

  async listForBrand(
    user: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      status?: DisputeStatus;
      category?: DisputeCategory;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    if (!user.brandId) {
      throw new ForbiddenException('Not a member of any brand');
    }

    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'status', 'category'];
    const sortBy: string = params.sortBy && ALLOWED_SORT_FIELDS.includes(params.sortBy) ? params.sortBy : 'createdAt';

    const where: Prisma.DisputeWhereInput = {
      brandId: user.brandId,
    };
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          openedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
          submission: {
            include: {
              bounty: {
                select: { title: true, brand: { select: { name: true } } },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: params.sortOrder || 'desc' },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data: disputes.map((d) => ({
        id: d.id,
        disputeNumber: d.disputeNumber,
        category: d.category,
        reason: d.reason,
        status: d.status,
        description: d.description,
        submissionId: d.submissionId,
        bountyTitle: d.submission.bounty.title,
        openedBy: d.openedBy,
        brandName: d.submission.bounty.brand.name,
        assignedTo: d.assignedTo,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── List All (Admin) ──────────────────────────────────

  async listAll(params: {
    page?: number;
    limit?: number;
    status?: DisputeStatus;
    category?: DisputeCategory;
    assignedToUserId?: string;
    openedByUserId?: string;
    brandId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );

    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'status', 'category'];
    const sortBy: string = params.sortBy && ALLOWED_SORT_FIELDS.includes(params.sortBy) ? params.sortBy : 'createdAt';

    const where: Prisma.DisputeWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    if (params.assignedToUserId) where.assignedToUserId = params.assignedToUserId;
    if (params.openedByUserId) where.openedByUserId = params.openedByUserId;
    if (params.brandId) where.brandId = params.brandId;
    if (params.search) {
      where.OR = [
        { disputeNumber: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          openedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
          submission: {
            include: {
              bounty: {
                select: { title: true, brand: { select: { name: true } } },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: params.sortOrder || 'desc' },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data: disputes.map((d) => ({
        id: d.id,
        disputeNumber: d.disputeNumber,
        category: d.category,
        reason: d.reason,
        status: d.status,
        description: d.description,
        submissionId: d.submissionId,
        bountyTitle: d.submission.bounty.title,
        openedBy: d.openedBy,
        brandName: d.submission.bounty.brand.name,
        assignedTo: d.assignedTo,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Update (DRAFT only) ───────────────────────────────

  async update(
    id: string,
    user: AuthenticatedUser,
    dto: { description?: string; desiredOutcome?: string },
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.openedByUserId !== user.sub) {
      throw new ForbiddenException('Only the filer can update the dispute');
    }

    if (dispute.status !== DisputeStatus.DRAFT) {
      throw new BadRequestException('Only draft disputes can be updated');
    }

    const updateData: Prisma.DisputeUpdateInput = {};
    if (dto.description !== undefined) updateData.description = dto.description.trim();
    if (dto.desiredOutcome !== undefined) updateData.desiredOutcome = dto.desiredOutcome.trim();

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      disputeNumber: updated.disputeNumber,
      category: updated.category,
      reason: updated.reason,
      status: updated.status,
      description: updated.description,
      desiredOutcome: updated.desiredOutcome,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Submit Draft ──────────────────────────────────────

  async submitDraft(id: string, user: AuthenticatedUser, ipAddress?: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            bounty: {
              select: {
                title: true,
                brandId: true,
                brand: {
                  select: {
                    members: {
                      select: {
                        user: { select: { email: true } },
                      },
                    },
                  },
                },
              },
            },
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.openedByUserId !== user.sub) {
      throw new ForbiddenException('Only the filer can submit the dispute');
    }

    if (dispute.status !== DisputeStatus.DRAFT) {
      throw new BadRequestException('Only draft disputes can be submitted');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.dispute.update({
        where: { id },
        data: { status: DisputeStatus.OPEN },
      });

      await tx.disputeStatusHistory.create({
        data: {
          disputeId: id,
          fromStatus: DisputeStatus.DRAFT,
          toStatus: DisputeStatus.OPEN,
          changedByUserId: user.sub,
          changedByRole: user.role as UserRole,
          note: 'Dispute submitted',
        },
      });

      return result;
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_STATUS_CHANGE,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: id,
      beforeState: { status: DisputeStatus.DRAFT },
      afterState: { status: DisputeStatus.OPEN },
      ipAddress,
    });

    // Notify the counterparty
    const bountyTitle = dispute.submission.bounty.title;
    const disputeUrl = `/disputes/${id}`;

    // If participant filed, notify org admins; if business admin filed, notify participant
    if (dispute.openedByRole === UserRole.PARTICIPANT) {
      const orgEmails = dispute.submission.bounty.brand.members.map(
        (m) => m.user.email,
      );
      for (const email of orgEmails) {
        this.mailService
          .sendDisputeOpenedEmail(email, {
            disputeNumber: dispute.disputeNumber,
            category: dispute.category,
            description: dispute.description,
            bountyTitle,
            disputeUrl,
          })
          .catch((err) => {
            this.logger.error('Failed to send dispute opened email:', err);
          });
      }
    } else {
      this.mailService
        .sendDisputeOpenedEmail(dispute.submission.user.email, {
          disputeNumber: dispute.disputeNumber,
          category: dispute.category,
          description: dispute.description,
          bountyTitle,
          disputeUrl,
        })
        .catch((err) => {
          this.logger.error('Failed to send dispute opened email:', err);
        });
    }

    return {
      id: updated.id,
      disputeNumber: updated.disputeNumber,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Send Message ──────────────────────────────────────

  async sendMessage(
    disputeId: string,
    user: AuthenticatedUser,
    dto: { content: string; isInternal?: boolean },
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (
      dispute.status === DisputeStatus.CLOSED ||
      dispute.status === DisputeStatus.WITHDRAWN
    ) {
      throw new BadRequestException('Cannot send messages on a closed or withdrawn dispute');
    }

    // isInternal only for SUPER_ADMIN
    if (dto.isInternal && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can send internal messages');
    }

    const messageType = dto.isInternal
      ? DisputeMessageType.INTERNAL_NOTE
      : DisputeMessageType.COMMENT;

    const message = await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        authorUserId: user.sub,
        authorRole: user.role as UserRole,
        messageType,
        content: dto.content.trim(),
        isInternal: dto.isInternal || false,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_MESSAGE,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: disputeId,
      afterState: {
        messageId: message.id,
        messageType,
        isInternal: dto.isInternal || false,
      },
      ipAddress,
    });

    return {
      id: message.id,
      disputeId: message.disputeId,
      authorUserId: message.authorUserId,
      authorRole: message.authorRole,
      authorName: `${message.author.firstName} ${message.author.lastName}`.trim(),
      messageType: message.messageType,
      content: message.content,
      isInternal: message.isInternal,
      createdAt: message.createdAt.toISOString(),
    };
  }

  // ── Transition ────────────────────────────────────────

  async transition(
    id: string,
    user: AuthenticatedUser,
    dto: { status: DisputeStatus; note?: string },
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            bounty: { select: { title: true } },
            user: { select: { email: true } },
          },
        },
        openedBy: { select: { email: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const allowed = DISPUTE_TRANSITIONS[dispute.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${dispute.status} to ${dto.status}`,
      );
    }

    const oldStatus = dispute.status;
    const updateData: Prisma.DisputeUpdateInput = {
      status: dto.status,
    };

    // If moving to AWAITING_RESPONSE, set responseDeadline to 7 days from now
    if (dto.status === DisputeStatus.AWAITING_RESPONSE) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + DISPUTE_LIMITS.RESPONSE_DEADLINE_DAYS);
      updateData.responseDeadline = deadline;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.dispute.update({
        where: { id },
        data: updateData,
      });

      await tx.disputeStatusHistory.create({
        data: {
          disputeId: id,
          fromStatus: oldStatus as DisputeStatus,
          toStatus: dto.status,
          changedByUserId: user.sub,
          changedByRole: user.role as UserRole,
          note: dto.note || null,
        },
      });

      return result;
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_STATUS_CHANGE,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: id,
      beforeState: { status: oldStatus },
      afterState: { status: dto.status },
      ipAddress,
    });

    // Email notification to both parties
    const bountyTitle = dispute.submission.bounty.title;
    const disputeUrl = `/disputes/${id}`;
    const emailData = {
      disputeNumber: dispute.disputeNumber,
      oldStatus,
      newStatus: dto.status,
      bountyTitle,
      disputeUrl,
    };

    this.mailService
      .sendDisputeStatusChangeEmail(dispute.openedBy.email, emailData)
      .catch((err) => {
        this.logger.error('Failed to send dispute status change email:', err);
      });

    this.mailService
      .sendDisputeStatusChangeEmail(dispute.submission.user.email, emailData)
      .catch((err) => {
        this.logger.error('Failed to send dispute status change email:', err);
      });

    return {
      id: updated.id,
      disputeNumber: updated.disputeNumber,
      status: updated.status,
      responseDeadline: updated.responseDeadline?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Assign ────────────────────────────────────────────

  async assign(
    id: string,
    user: AuthenticatedUser,
    dto: { assignedToUserId: string },
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: { assignedToUserId: dto.assignedToUserId },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_ASSIGN,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: id,
      beforeState: { assignedToUserId: dispute.assignedToUserId },
      afterState: { assignedToUserId: dto.assignedToUserId },
      ipAddress,
    });

    return {
      id: updated.id,
      disputeNumber: updated.disputeNumber,
      assignedToUserId: updated.assignedToUserId,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Resolve ───────────────────────────────────────────

  async resolve(
    id: string,
    user: AuthenticatedUser,
    dto: { resolutionType: DisputeResolution; resolutionSummary: string },
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            bounty: { select: { title: true } },
            user: { select: { email: true } },
          },
        },
        openedBy: { select: { email: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const allowed = DISPUTE_TRANSITIONS[dispute.status] || [];
    if (!allowed.includes(DisputeStatus.RESOLVED)) {
      throw new BadRequestException(
        `Cannot resolve a dispute in ${dispute.status} status`,
      );
    }

    const oldStatus = dispute.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          resolutionType: dto.resolutionType,
          resolutionSummary: dto.resolutionSummary.trim(),
          resolvedByUserId: user.sub,
          resolvedAt: new Date(),
        },
      });

      await tx.disputeStatusHistory.create({
        data: {
          disputeId: id,
          fromStatus: oldStatus as DisputeStatus,
          toStatus: DisputeStatus.RESOLVED,
          changedByUserId: user.sub,
          changedByRole: user.role as UserRole,
          note: `Resolution: ${dto.resolutionType} - ${dto.resolutionSummary}`,
        },
      });

      // Side effects on submission/payout based on resolution type
      if (dto.resolutionType === DisputeResolution.SUBMISSION_REVOKED) {
        await tx.submission.update({
          where: { id: dispute.submissionId },
          data: {
            status: SubmissionStatus.REJECTED,
            payoutStatus: PayoutStatus.NOT_PAID,
          },
        });
      } else if (dto.resolutionType === DisputeResolution.PAYMENT_APPROVED) {
        await tx.submission.update({
          where: { id: dispute.submissionId },
          data: {
            payoutStatus: PayoutStatus.PENDING,
          },
        });
      } else if (dto.resolutionType === DisputeResolution.RESUBMISSION_REQUIRED) {
        await tx.submission.update({
          where: { id: dispute.submissionId },
          data: {
            status: SubmissionStatus.NEEDS_MORE_INFO,
          },
        });
      }

      return result;
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_RESOLVE,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: id,
      beforeState: { status: oldStatus },
      afterState: {
        status: DisputeStatus.RESOLVED,
        resolutionType: dto.resolutionType,
      },
      ipAddress,
    });

    // Email both parties
    const bountyTitle = dispute.submission.bounty.title;
    const disputeUrl = `/disputes/${id}`;
    const emailData = {
      disputeNumber: dispute.disputeNumber,
      resolution: dto.resolutionType,
      resolutionSummary: dto.resolutionSummary,
      bountyTitle,
      disputeUrl,
    };

    this.mailService
      .sendDisputeResolvedEmail(dispute.openedBy.email, emailData)
      .catch((err) => {
        this.logger.error('Failed to send dispute resolved email:', err);
      });

    this.mailService
      .sendDisputeResolvedEmail(dispute.submission.user.email, emailData)
      .catch((err) => {
        this.logger.error('Failed to send dispute resolved email:', err);
      });

    return {
      id: updated.id,
      disputeNumber: updated.disputeNumber,
      status: updated.status,
      resolutionType: updated.resolutionType,
      resolutionSummary: updated.resolutionSummary,
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Escalate ──────────────────────────────────────────

  async escalate(
    id: string,
    user: AuthenticatedUser,
    dto: { reason: string },
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const allowed = DISPUTE_TRANSITIONS[dispute.status] || [];
    if (!allowed.includes(DisputeStatus.ESCALATED)) {
      throw new BadRequestException(
        `Cannot escalate a dispute in ${dispute.status} status`,
      );
    }

    const oldStatus = dispute.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.ESCALATED,
          escalatedAt: new Date(),
        },
      });

      await tx.disputeStatusHistory.create({
        data: {
          disputeId: id,
          fromStatus: oldStatus as DisputeStatus,
          toStatus: DisputeStatus.ESCALATED,
          changedByUserId: user.sub,
          changedByRole: user.role as UserRole,
          note: dto.reason,
        },
      });

      return result;
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_ESCALATE,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: id,
      beforeState: { status: oldStatus },
      afterState: { status: DisputeStatus.ESCALATED },
      ipAddress,
    });

    return {
      id: updated.id,
      disputeNumber: updated.disputeNumber,
      status: updated.status,
      escalatedAt: updated.escalatedAt?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Withdraw ──────────────────────────────────────────

  async withdraw(
    id: string,
    user: AuthenticatedUser,
    dto: { reason?: string },
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.openedByUserId !== user.sub) {
      throw new ForbiddenException('Only the filer can withdraw the dispute');
    }

    if (
      dispute.status !== DisputeStatus.DRAFT &&
      dispute.status !== DisputeStatus.OPEN
    ) {
      throw new BadRequestException(
        'Can only withdraw disputes in DRAFT or OPEN status',
      );
    }

    const oldStatus = dispute.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.dispute.update({
        where: { id },
        data: { status: DisputeStatus.WITHDRAWN },
      });

      await tx.disputeStatusHistory.create({
        data: {
          disputeId: id,
          fromStatus: oldStatus as DisputeStatus,
          toStatus: DisputeStatus.WITHDRAWN,
          changedByUserId: user.sub,
          changedByRole: user.role as UserRole,
          note: dto.reason || 'Withdrawn by filer',
        },
      });

      return result;
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_WITHDRAW,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: id,
      beforeState: { status: oldStatus },
      afterState: { status: DisputeStatus.WITHDRAWN },
      ipAddress,
    });

    return {
      id: updated.id,
      disputeNumber: updated.disputeNumber,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Upload Evidence ──────────────────────────────────

  async uploadEvidence(
    disputeId: string,
    user: AuthenticatedUser,
    files: Express.Multer.File[],
    descriptions: string[],
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        evidence: { select: { id: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Cannot upload to closed/withdrawn disputes
    if (
      dispute.status === DisputeStatus.CLOSED ||
      dispute.status === DisputeStatus.WITHDRAWN
    ) {
      throw new BadRequestException(
        'Cannot upload evidence to a closed or withdrawn dispute',
      );
    }

    // Validate caller is involved party or admin
    const isOpener = dispute.openedByUserId === user.sub;
    const isOrgAdmin =
      user.role === UserRole.BUSINESS_ADMIN &&
      dispute.brandId === user.brandId;
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

    if (!isOpener && !isOrgAdmin && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only involved parties or admins can upload evidence',
      );
    }

    // Check total file count
    const existingCount = dispute.evidence.length;
    if (existingCount + files.length > DISPUTE_EVIDENCE_LIMITS.MAX_FILES_PER_DISPUTE) {
      throw new BadRequestException(
        `Cannot upload ${files.length} files. Maximum ${DISPUTE_EVIDENCE_LIMITS.MAX_FILES_PER_DISPUTE} files per dispute (${existingCount} already uploaded).`,
      );
    }

    // Determine evidence type from mime type
    const getEvidenceType = (mimeType: string): EvidenceType => {
      if (mimeType === 'application/pdf') return EvidenceType.DOCUMENT;
      return EvidenceType.SCREENSHOT;
    };

    // Create evidence records
    const evidenceRecords = await this.prisma.$transaction(
      files.map((file, index) =>
        this.prisma.disputeEvidence.create({
          data: {
            disputeId,
            uploadedByUserId: user.sub,
            evidenceType: getEvidenceType(file.mimetype),
            fileUrl: file.path,
            fileName: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'),
            mimeType: file.mimetype,
            fileSize: file.size,
            description: descriptions[index] || null,
          },
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        }),
      ),
    );

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.DISPUTE_EVIDENCE_UPLOAD,
      entityType: ENTITY_TYPES.DISPUTE,
      entityId: disputeId,
      afterState: {
        fileCount: files.length,
        evidenceIds: evidenceRecords.map((e) => e.id),
      },
      ipAddress,
    });

    return evidenceRecords.map((e) => ({
      id: e.id,
      disputeId: e.disputeId,
      evidenceType: e.evidenceType,
      fileUrl: e.fileUrl,
      fileName: e.fileName,
      mimeType: e.mimeType,
      fileSize: e.fileSize,
      description: e.description,
      uploadedBy: e.uploadedBy,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  // ── Stats ─────────────────────────────────────────────

  async getStats() {
    const [
      total,
      open,
      underReview,
      awaitingResponse,
      escalated,
      resolved,
      closed,
    ] = await Promise.all([
      this.prisma.dispute.count(),
      this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      this.prisma.dispute.count({ where: { status: DisputeStatus.UNDER_REVIEW } }),
      this.prisma.dispute.count({ where: { status: DisputeStatus.AWAITING_RESPONSE } }),
      this.prisma.dispute.count({ where: { status: DisputeStatus.ESCALATED } }),
      this.prisma.dispute.count({ where: { status: DisputeStatus.RESOLVED } }),
      this.prisma.dispute.count({ where: { status: DisputeStatus.CLOSED } }),
    ]);

    // Avg resolution time for resolved disputes
    const resolvedDisputes = await this.prisma.dispute.findMany({
      where: {
        status: { in: [DisputeStatus.RESOLVED, DisputeStatus.CLOSED] },
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionDays: number | null = null;
    if (resolvedDisputes.length > 0) {
      const totalMs = resolvedDisputes.reduce((sum, d) => {
        return sum + (d.resolvedAt!.getTime() - d.createdAt.getTime());
      }, 0);
      avgResolutionDays = Math.round(
        (totalMs / resolvedDisputes.length / (1000 * 60 * 60 * 24)) * 10,
      ) / 10;
    }

    return {
      total,
      open,
      underReview,
      awaitingResponse,
      escalated,
      resolved,
      closed,
      avgResolutionDays,
    };
  }

  // ── Private Helpers ───────────────────────────────────

  private async generateDisputeNumber(): Promise<string> {
    const lastDispute = await this.prisma.dispute.findFirst({
      orderBy: { disputeNumber: 'desc' },
      select: { disputeNumber: true },
    });

    let nextNumber = 1;
    if (lastDispute?.disputeNumber) {
      const match = lastDispute.disputeNumber.match(/DSP-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `DSP-${String(nextNumber).padStart(6, '0')}`;
  }
}
