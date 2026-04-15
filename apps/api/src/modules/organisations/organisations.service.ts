import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  UserRole,
  BrandMemberRole,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApifyService } from '../apify/apify.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const UUID_REGEX = /^[0-9a-f]{8}-/;

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private apify: ApifyService,
  ) {}

  async create(
    user: AuthenticatedUser,
    data: {
      name: string;
      contactEmail: string;
      handle?: string;
      bio?: string;
      websiteUrl?: string;
      socialLinks?: object;
      targetInterests?: string[];
    },
    ipAddress?: string,
    logoFile?: Express.Multer.File,
  ) {
    // If handle is provided, check uniqueness
    if (data.handle) {
      const existing = await this.prisma.brand.findUnique({
        where: { handle: data.handle },
      });
      if (existing) {
        throw new ConflictException('Handle is already taken');
      }
    }

    const org = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.brand.create({
        data: {
          name: data.name.trim(),
          contactEmail: data.contactEmail.toLowerCase().trim(),
          handle: data.handle || null,
          bio: data.bio || null,
          websiteUrl: data.websiteUrl || null,
          ...(data.socialLinks ? { socialLinks: data.socialLinks } : {}),
          ...(data.targetInterests ? { targetInterests: data.targetInterests } : {}),
          ...(logoFile ? { logo: `/uploads/${logoFile.filename}` } : {}),
        },
      });

      await tx.brandMember.create({
        data: {
          userId: user.sub,
          brandId: organisation.id,
          role: BrandMemberRole.OWNER,
        },
      });

      // Only promote to BUSINESS_ADMIN if user's current role is PARTICIPANT
      const currentUser = await tx.user.findUnique({
        where: { id: user.sub },
      });
      if (currentUser && currentUser.role === UserRole.PARTICIPANT) {
        await tx.user.update({
          where: { id: user.sub },
          data: { role: UserRole.BUSINESS_ADMIN },
        });
      }

      return organisation;
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: UserRole.PARTICIPANT,
      action: AUDIT_ACTIONS.BRAND_CREATE,
      entityType: ENTITY_TYPES.BRAND,
      entityId: org.id,
      afterState: { name: org.name, contactEmail: org.contactEmail },
      ipAddress,
    });

    // Fire-and-forget: pull social analytics for the new brand if handles were provided
    setImmediate(() => {
      this.apify.refreshIfStale(org.id).catch((err) => {
        this.logger.error(`Background refresh after brand create failed for ${org.id}`, err);
      });
    });

    return {
      id: org.id,
      name: org.name,
      handle: org.handle,
      logo: org.logo,
      coverPhotoUrl: org.coverPhotoUrl,
      contactEmail: org.contactEmail,
      bio: org.bio,
      websiteUrl: org.websiteUrl,
      socialLinks: org.socialLinks,
      targetInterests: org.targetInterests,
      messagingEnabled: org.messagingEnabled,
      status: org.status,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async findById(orgId: string, user: AuthenticatedUser) {
    const org = await this.prisma.brand.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { members: true, bounties: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Brand not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.brandId !== orgId
    ) {
      throw new ForbiddenException('Not authorized to view this brand');
    }

    return {
      id: org.id,
      name: org.name,
      handle: org.handle,
      logo: org.logo,
      coverPhotoUrl: org.coverPhotoUrl,
      contactEmail: org.contactEmail,
      bio: org.bio,
      websiteUrl: org.websiteUrl,
      socialLinks: org.socialLinks,
      targetInterests: org.targetInterests,
      messagingEnabled: org.messagingEnabled,
      status: org.status,
      kybStatus: org.kybStatus,
      kybSubmittedAt: org.kybSubmittedAt ? org.kybSubmittedAt.toISOString() : null,
      kybApprovedAt: org.kybApprovedAt ? org.kybApprovedAt.toISOString() : null,
      memberCount: org._count.members,
      bountyCount: org._count.bounties,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async update(
    orgId: string,
    user: AuthenticatedUser,
    data: {
      name?: string;
      contactEmail?: string;
      handle?: string;
      bio?: string;
      websiteUrl?: string;
      socialLinks?: object;
      targetInterests?: string[];
      messagingEnabled?: boolean;
    },
    ipAddress?: string,
    logoFile?: Express.Multer.File,
  ) {
    const org = await this.prisma.brand.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Brand not found');
    }

    // Check ownership
    if (user.role !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.brandMember.findFirst({
        where: {
          userId: user.sub,
          brandId: orgId,
          role: BrandMemberRole.OWNER,
        },
      });

      if (!membership) {
        throw new ForbiddenException('Only org owner or Super Admin can update');
      }
    }

    // If handle is being changed, check uniqueness
    if (data.handle && data.handle !== org.handle) {
      const existingHandle = await this.prisma.brand.findUnique({
        where: { handle: data.handle },
      });
      if (existingHandle) {
        throw new ConflictException('Handle is already taken');
      }
    }

    const beforeState = {
      name: org.name,
      contactEmail: org.contactEmail,
    };

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.contactEmail)
      updateData.contactEmail = data.contactEmail.toLowerCase().trim();
    if (data.handle !== undefined) updateData.handle = data.handle || null;
    if (data.bio !== undefined) updateData.bio = data.bio || null;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl || null;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks || null;
    if (data.targetInterests !== undefined) updateData.targetInterests = data.targetInterests || null;
    if (data.messagingEnabled !== undefined) updateData.messagingEnabled = data.messagingEnabled;
    if (logoFile) updateData.logo = `/uploads/${logoFile.filename}`;

    const updated = await this.prisma.brand.update({
      where: { id: orgId },
      data: updateData,
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BRAND_UPDATE,
      entityType: ENTITY_TYPES.BRAND,
      entityId: orgId,
      beforeState,
      afterState: { name: updated.name, contactEmail: updated.contactEmail },
      ipAddress,
    });

    // Fire-and-forget: refresh social analytics when social handles may have changed
    setImmediate(() => {
      this.apify.refreshIfStale(orgId).catch((err) => {
        this.logger.error(`Background refresh after brand update failed for ${orgId}`, err);
      });
    });

    return {
      id: updated.id,
      name: updated.name,
      handle: updated.handle,
      logo: updated.logo,
      coverPhotoUrl: updated.coverPhotoUrl,
      contactEmail: updated.contactEmail,
      bio: updated.bio,
      websiteUrl: updated.websiteUrl,
      socialLinks: updated.socialLinks,
      targetInterests: updated.targetInterests,
      messagingEnabled: updated.messagingEnabled,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async findPublicProfile(idOrHandle: string) {
    let org;

    if (UUID_REGEX.test(idOrHandle)) {
      org = await this.prisma.brand.findUnique({
        where: { id: idOrHandle },
      });
    } else {
      org = await this.prisma.brand.findFirst({
        where: { handle: idOrHandle, status: 'ACTIVE' },
      });
    }

    if (!org || org.status !== 'ACTIVE') {
      throw new NotFoundException('Brand not found');
    }

    // Compute stats — only count bounties that were actually published (LIVE or CLOSED).
    // DRAFT and PAUSED bounties are not visible to hunters and shouldn't inflate the count.
    const [bountiesPosted, amountResult] = await Promise.all([
      this.prisma.bounty.count({
        where: {
          brandId: org.id,
          status: { in: ['LIVE', 'CLOSED'] },
        },
      }),
      this.prisma.bounty.aggregate({
        where: {
          brandId: org.id,
          status: { in: ['LIVE', 'CLOSED'] },
        },
        _sum: {
          rewardValue: true,
        },
      }),
    ]);
    const totalBountyAmount = amountResult._sum.rewardValue
      ? Number(amountResult._sum.rewardValue)
      : 0;

    // Achievement rate: percentage of CLOSED bounties with at least one APPROVED submission
    const closedBounties = await this.prisma.bounty.count({
      where: {
        brandId: org.id,
        status: 'CLOSED',
      },
    });

    let achievementRate = 0;
    if (closedBounties > 0) {
      const bountiesWithApprovedSubmissions = await this.prisma.bounty.count({
        where: {
          brandId: org.id,
          status: 'CLOSED',
          submissions: {
            some: {
              status: 'APPROVED',
            },
          },
        },
      });
      achievementRate = Math.round(
        (bountiesWithApprovedSubmissions / closedBounties) * 100,
      );
    }

    return {
      id: org.id,
      name: org.name,
      handle: org.handle,
      logo: org.logo,
      coverPhotoUrl: org.coverPhotoUrl,
      bio: org.bio,
      websiteUrl: org.websiteUrl,
      socialLinks: org.socialLinks,
      socialAnalytics: org.socialAnalytics,
      targetInterests: org.targetInterests,
      messagingEnabled: org.messagingEnabled,
      stats: {
        bountiesPosted,
        totalBountyAmount,
        achievementRate,
      },
      createdAt: org.createdAt.toISOString(),
    };
  }

  async listPublic(params: {
    page?: number;
    limit?: number;
    search?: string;
    interest?: string;
  }) {
    const page = params.page && params.page > 0 ? Number(params.page) : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(Number(params.limit), 100) : 20;

    const where: Record<string, unknown> = {
      status: 'ACTIVE' as const,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { handle: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.interest) {
      where.targetInterests = {
        array_contains: [params.interest],
      };
    }

    const [orgs, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        include: {
          _count: {
            select: { bounties: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data: orgs.map((org) => ({
        id: org.id,
        name: org.name,
        handle: org.handle,
        logo: org.logo,
        bio: org.bio,
        targetInterests: org.targetInterests,
        bountiesPosted: org._count.bounties,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listMyBrands(userId: string) {
    const memberships = await this.prisma.brandMember.findMany({
      where: { userId },
      include: {
        brand: {
          include: {
            _count: {
              select: { bounties: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.brand.id,
      name: m.brand.name,
      handle: m.brand.handle,
      logo: m.brand.logo,
      contactEmail: m.brand.contactEmail,
      status: m.brand.status,
      role: m.role,
      bountiesPosted: m.brand._count.bounties,
    }));
  }

  async checkHandleAvailability(handle: string) {
    const existing = await this.prisma.brand.findUnique({
      where: { handle },
    });

    return {
      available: !existing,
      handle,
    };
  }

  async uploadCoverPhoto(
    orgId: string,
    user: AuthenticatedUser,
    file: Express.Multer.File,
  ) {
    const org = await this.prisma.brand.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Brand not found');
    }

    // Check ownership (same as update)
    if (user.role !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.brandMember.findFirst({
        where: {
          userId: user.sub,
          brandId: orgId,
          role: BrandMemberRole.OWNER,
        },
      });

      if (!membership) {
        throw new ForbiddenException('Only org owner or Super Admin can update');
      }
    }

    const updated = await this.prisma.brand.update({
      where: { id: orgId },
      data: { coverPhotoUrl: `/uploads/${file.filename}` },
    });

    return {
      id: updated.id,
      name: updated.name,
      handle: updated.handle,
      logo: updated.logo,
      coverPhotoUrl: updated.coverPhotoUrl,
      contactEmail: updated.contactEmail,
      bio: updated.bio,
      websiteUrl: updated.websiteUrl,
      socialLinks: updated.socialLinks,
      targetInterests: updated.targetInterests,
      messagingEnabled: updated.messagingEnabled,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async listMembers(
    orgId: string,
    user: AuthenticatedUser,
    page = 1,
    limit = 20,
  ) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.brandId !== orgId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    const [members, total] = await Promise.all([
      this.prisma.brandMember.findMany({
        where: { brandId: orgId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: 'desc' },
      }),
      this.prisma.brandMember.count({
        where: { brandId: orgId },
      }),
    ]);

    return {
      data: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        user: m.user,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async inviteMember(
    orgId: string,
    email: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ) {
    // Check authorization: must be org owner or SA
    if (user.role !== UserRole.SUPER_ADMIN) {
      const ownerMembership = await this.prisma.brandMember.findFirst({
        where: {
          userId: user.sub,
          brandId: orgId,
          role: BrandMemberRole.OWNER,
        },
      });

      if (!ownerMembership) {
        throw new ForbiddenException('Only org owner or Super Admin can invite members');
      }
    }

    // Find the organisation
    const org = await this.prisma.brand.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Brand not found');
    }

    // Find user by email
    const normalizedEmail = email.toLowerCase().trim();
    const targetUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    // Add user to org (check + create in transaction to prevent race condition)
    const member = await this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.brandMember.findFirst({
        where: { userId: targetUser.id },
      });

      if (existingMembership) {
        throw new ConflictException('User already belongs to a brand');
      }

      const newMember = await tx.brandMember.create({
        data: {
          userId: targetUser.id,
          brandId: orgId,
          role: BrandMemberRole.MEMBER,
        },
      });

      // Promote user to BUSINESS_ADMIN
      await tx.user.update({
        where: { id: targetUser.id },
        data: { role: UserRole.BUSINESS_ADMIN },
      });

      return newMember;
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BRAND_MEMBER_ADD,
      entityType: ENTITY_TYPES.BRAND,
      entityId: orgId,
      afterState: { addedUserId: targetUser.id, email: normalizedEmail },
      ipAddress,
    });

    return {
      message: `Invitation sent to ${normalizedEmail}.`,
      invitation: {
        id: member.id,
        email: normalizedEmail,
        brandId: orgId,
        status: 'PENDING',
        createdAt: member.joinedAt.toISOString(),
      },
    };
  }

  async removeMember(
    orgId: string,
    targetUserId: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ) {
    if (
      user.role !== UserRole.SUPER_ADMIN
    ) {
      const ownerMembership = await this.prisma.brandMember.findFirst({
        where: {
          userId: user.sub,
          brandId: orgId,
          role: BrandMemberRole.OWNER,
        },
      });

      if (!ownerMembership) {
        throw new ForbiddenException('Only org owner or Super Admin can remove members');
      }
    }

    const membership = await this.prisma.brandMember.findFirst({
      where: { userId: targetUserId, brandId: orgId },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === BrandMemberRole.OWNER) {
      throw new BadRequestException('Cannot remove the brand owner');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.brandMember.delete({
        where: { id: membership.id },
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { role: UserRole.PARTICIPANT },
      });
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BRAND_MEMBER_REMOVE,
      entityType: ENTITY_TYPES.BRAND,
      entityId: orgId,
      afterState: { removedUserId: targetUserId },
      ipAddress,
    });

    return { message: 'Member removed from brand.' };
  }
}
