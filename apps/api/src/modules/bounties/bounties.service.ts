import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  UserRole,
  BountyStatus,
  RewardType,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  PAGINATION_DEFAULTS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const LIVE_EDITABLE_FIELDS = new Set([
  'eligibilityRules',
  'proofRequirements',
  'maxSubmissions',
  'endDate',
]);

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['LIVE'],
  LIVE: ['PAUSED', 'CLOSED'],
  PAUSED: ['LIVE', 'CLOSED'],
};

@Injectable()
export class BountiesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async list(
    user: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      status?: BountyStatus;
      category?: string;
      rewardType?: RewardType;
      search?: string;
      organisationId?: string;
    },
  ) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const sortBy = params.sortBy || PAGINATION_DEFAULTS.SORT_BY;
    const sortOrder = params.sortOrder || PAGINATION_DEFAULTS.SORT_ORDER;

    const where: Prisma.BountyWhereInput = { deletedAt: null };

    // Role-based filtering
    if (user.role === UserRole.PARTICIPANT) {
      where.status = BountyStatus.LIVE;
    } else if (user.role === UserRole.BUSINESS_ADMIN) {
      where.organisationId = user.organisationId || undefined;
      if (params.status) where.status = params.status;
    } else {
      // Super Admin sees all
      if (params.status) where.status = params.status;
      if (params.organisationId)
        where.organisationId = params.organisationId;
    }

    if (params.category) where.category = params.category;
    if (params.rewardType) where.rewardType = params.rewardType;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        {
          shortDescription: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [bounties, total] = await Promise.all([
      this.prisma.bounty.findMany({
        where,
        include: {
          organisation: {
            select: { id: true, name: true, logo: true },
          },
          _count: { select: { submissions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.bounty.count({ where }),
    ]);

    return {
      data: bounties.map((b) => ({
        id: b.id,
        title: b.title,
        shortDescription: b.shortDescription,
        category: b.category,
        rewardType: b.rewardType,
        rewardValue: b.rewardValue?.toString() || null,
        rewardDescription: b.rewardDescription,
        maxSubmissions: b.maxSubmissions,
        startDate: b.startDate?.toISOString() || null,
        endDate: b.endDate?.toISOString() || null,
        status: b.status,
        submissionCount: b._count.submissions,
        organisation: b.organisation,
        createdAt: b.createdAt.toISOString(),
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
    const bounty = await this.prisma.bounty.findUnique({
      where: { id },
      include: {
        organisation: {
          select: { id: true, name: true, logo: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    // RBAC checks
    if (user.role === UserRole.PARTICIPANT && bounty.status !== BountyStatus.LIVE) {
      throw new ForbiddenException('Bounty not accessible');
    }

    if (
      user.role === UserRole.BUSINESS_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized to view this bounty');
    }

    // Check if participant has already submitted
    let userSubmission = null;
    if (user.role === UserRole.PARTICIPANT) {
      const submission = await this.prisma.submission.findFirst({
        where: { bountyId: id, userId: user.sub },
        select: { id: true, status: true, payoutStatus: true },
      });
      if (submission) {
        userSubmission = {
          id: submission.id,
          status: submission.status,
          payoutStatus: submission.payoutStatus,
        };
      }
    }

    const submissionCount = bounty._count.submissions;
    const remainingSubmissions =
      bounty.maxSubmissions != null
        ? bounty.maxSubmissions - submissionCount
        : null;

    return {
      id: bounty.id,
      title: bounty.title,
      shortDescription: bounty.shortDescription,
      fullInstructions: bounty.fullInstructions,
      category: bounty.category,
      rewardType: bounty.rewardType,
      rewardValue: bounty.rewardValue?.toString() || null,
      rewardDescription: bounty.rewardDescription,
      maxSubmissions: bounty.maxSubmissions,
      remainingSubmissions,
      startDate: bounty.startDate?.toISOString() || null,
      endDate: bounty.endDate?.toISOString() || null,
      eligibilityRules: bounty.eligibilityRules,
      proofRequirements: bounty.proofRequirements,
      status: bounty.status,
      submissionCount,
      organisation: bounty.organisation,
      createdBy: bounty.createdBy,
      userSubmission,
      createdAt: bounty.createdAt.toISOString(),
      updatedAt: bounty.updatedAt.toISOString(),
    };
  }

  async create(
    user: AuthenticatedUser,
    data: {
      title: string;
      shortDescription: string;
      fullInstructions: string;
      category: string;
      rewardType: RewardType;
      rewardValue?: number | null;
      rewardDescription?: string | null;
      maxSubmissions?: number | null;
      startDate?: string | null;
      endDate?: string | null;
      eligibilityRules: string;
      proofRequirements: string;
    },
    ipAddress?: string,
  ) {
    if (!user.organisationId) {
      throw new BadRequestException('You must belong to an organisation to create bounties');
    }

    if (data.rewardType === RewardType.CASH && !data.rewardValue) {
      throw new BadRequestException('Reward value is required for CASH reward type');
    }

    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    const bounty = await this.prisma.bounty.create({
      data: {
        organisationId: user.organisationId,
        createdById: user.sub,
        title: data.title.trim(),
        shortDescription: data.shortDescription.trim(),
        fullInstructions: data.fullInstructions.trim(),
        category: data.category.trim(),
        rewardType: data.rewardType,
        rewardValue: data.rewardValue ?? undefined,
        rewardDescription: data.rewardDescription ?? undefined,
        maxSubmissions: data.maxSubmissions ?? undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        eligibilityRules: data.eligibilityRules.trim(),
        proofRequirements: data.proofRequirements.trim(),
        status: BountyStatus.DRAFT,
      },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_CREATE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: bounty.id,
      afterState: { title: bounty.title, status: bounty.status },
      ipAddress,
    });

    return {
      id: bounty.id,
      title: bounty.title,
      shortDescription: bounty.shortDescription,
      fullInstructions: bounty.fullInstructions,
      category: bounty.category,
      rewardType: bounty.rewardType,
      rewardValue: bounty.rewardValue?.toString() || null,
      rewardDescription: bounty.rewardDescription,
      maxSubmissions: bounty.maxSubmissions,
      startDate: bounty.startDate?.toISOString() || null,
      endDate: bounty.endDate?.toISOString() || null,
      eligibilityRules: bounty.eligibilityRules,
      proofRequirements: bounty.proofRequirements,
      status: bounty.status,
      organisationId: bounty.organisationId,
      createdById: bounty.createdById,
      createdAt: bounty.createdAt.toISOString(),
      updatedAt: bounty.updatedAt.toISOString(),
    };
  }

  async update(
    id: string,
    user: AuthenticatedUser,
    data: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id },
    });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status === BountyStatus.CLOSED) {
      throw new BadRequestException('Cannot edit a closed bounty');
    }

    // Enforce field restrictions for LIVE bounties
    if (bounty.status === BountyStatus.LIVE) {
      const invalidFields = Object.keys(data).filter(
        (key) => !LIVE_EDITABLE_FIELDS.has(key),
      );
      if (invalidFields.length > 0) {
        throw new BadRequestException(
          `Cannot edit these fields on a LIVE bounty: ${invalidFields.join(', ')}`,
        );
      }
    }

    const beforeState = {
      title: bounty.title,
      shortDescription: bounty.shortDescription,
      status: bounty.status,
    };

    // Build update data safely
    const updateData: Prisma.BountyUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title as string;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription as string;
    if (data.fullInstructions !== undefined) updateData.fullInstructions = data.fullInstructions as string;
    if (data.category !== undefined) updateData.category = data.category as string;
    if (data.rewardType !== undefined) updateData.rewardType = data.rewardType as RewardType;
    if (data.rewardValue !== undefined) updateData.rewardValue = data.rewardValue as number | null;
    if (data.rewardDescription !== undefined) updateData.rewardDescription = data.rewardDescription as string | null;
    if (data.maxSubmissions !== undefined) updateData.maxSubmissions = data.maxSubmissions as number | null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate as string) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate as string) : null;
    if (data.eligibilityRules !== undefined) updateData.eligibilityRules = data.eligibilityRules as string;
    if (data.proofRequirements !== undefined) updateData.proofRequirements = data.proofRequirements as string;

    const updated = await this.prisma.bounty.update({
      where: { id },
      data: updateData,
      include: {
        organisation: { select: { id: true, name: true, logo: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { submissions: true } },
      },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_UPDATE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: id,
      beforeState,
      afterState: { title: updated.title, status: updated.status },
      ipAddress,
    });

    return {
      id: updated.id,
      title: updated.title,
      shortDescription: updated.shortDescription,
      fullInstructions: updated.fullInstructions,
      category: updated.category,
      rewardType: updated.rewardType,
      rewardValue: updated.rewardValue?.toString() || null,
      rewardDescription: updated.rewardDescription,
      maxSubmissions: updated.maxSubmissions,
      remainingSubmissions: updated.maxSubmissions != null
        ? updated.maxSubmissions - updated._count.submissions
        : null,
      startDate: updated.startDate?.toISOString() || null,
      endDate: updated.endDate?.toISOString() || null,
      eligibilityRules: updated.eligibilityRules,
      proofRequirements: updated.proofRequirements,
      status: updated.status,
      submissionCount: updated._count.submissions,
      organisation: updated.organisation,
      createdBy: updated.createdBy,
      userSubmission: null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async updateStatus(
    id: string,
    user: AuthenticatedUser,
    newStatus: BountyStatus,
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id } });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    const allowed = VALID_TRANSITIONS[bounty.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${bounty.status} to ${newStatus}`,
      );
    }

    const beforeState = { status: bounty.status };

    const updated = await this.prisma.bounty.update({
      where: { id },
      data: { status: newStatus },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_STATUS_CHANGE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: id,
      beforeState,
      afterState: { status: newStatus },
      ipAddress,
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async delete(id: string, user: AuthenticatedUser, ipAddress?: string) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id } });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status !== BountyStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT bounties can be deleted');
    }

    await this.prisma.bounty.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_DELETE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: id,
      beforeState: { title: bounty.title, status: bounty.status },
      ipAddress,
    });

    return { message: 'Bounty deleted.' };
  }
}
