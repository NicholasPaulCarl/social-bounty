import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  UserRole,
  OrgMemberRole,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const UUID_REGEX = /^[0-9a-f]{8}-/;

@Injectable()
export class OrganisationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
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
      const existing = await this.prisma.organisation.findUnique({
        where: { handle: data.handle },
      });
      if (existing) {
        throw new ConflictException('Handle is already taken');
      }
    }

    const org = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
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

      await tx.organisationMember.create({
        data: {
          userId: user.sub,
          organisationId: organisation.id,
          role: OrgMemberRole.OWNER,
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
      action: AUDIT_ACTIONS.ORGANISATION_CREATE,
      entityType: ENTITY_TYPES.ORGANISATION,
      entityId: org.id,
      afterState: { name: org.name, contactEmail: org.contactEmail },
      ipAddress,
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
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { members: true, bounties: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.organisationId !== orgId
    ) {
      throw new ForbiddenException('Not authorized to view this organisation');
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
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    // Check ownership
    if (user.role !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.organisationMember.findFirst({
        where: {
          userId: user.sub,
          organisationId: orgId,
          role: OrgMemberRole.OWNER,
        },
      });

      if (!membership) {
        throw new ForbiddenException('Only org owner or Super Admin can update');
      }
    }

    // If handle is being changed, check uniqueness
    if (data.handle && data.handle !== org.handle) {
      const existingHandle = await this.prisma.organisation.findUnique({
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

    const updated = await this.prisma.organisation.update({
      where: { id: orgId },
      data: updateData,
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.ORGANISATION_UPDATE,
      entityType: ENTITY_TYPES.ORGANISATION,
      entityId: orgId,
      beforeState,
      afterState: { name: updated.name, contactEmail: updated.contactEmail },
      ipAddress,
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
      org = await this.prisma.organisation.findUnique({
        where: { id: idOrHandle },
        include: {
          _count: {
            select: { bounties: true },
          },
        },
      });
    } else {
      org = await this.prisma.organisation.findFirst({
        where: { handle: idOrHandle, status: 'ACTIVE' },
        include: {
          _count: {
            select: { bounties: true },
          },
        },
      });
    }

    if (!org || org.status !== 'ACTIVE') {
      throw new NotFoundException('Organisation not found');
    }

    // Compute stats
    const bountiesPosted = org._count.bounties;

    // Total bounty amount for LIVE or CLOSED bounties
    const amountResult = await this.prisma.bounty.aggregate({
      where: {
        organisationId: org.id,
        status: { in: ['LIVE', 'CLOSED'] },
      },
      _sum: {
        rewardValue: true,
      },
    });
    const totalBountyAmount = amountResult._sum.rewardValue
      ? Number(amountResult._sum.rewardValue)
      : 0;

    // Achievement rate: percentage of CLOSED bounties with at least one APPROVED submission
    const closedBounties = await this.prisma.bounty.count({
      where: {
        organisationId: org.id,
        status: 'CLOSED',
      },
    });

    let achievementRate = 0;
    if (closedBounties > 0) {
      const bountiesWithApprovedSubmissions = await this.prisma.bounty.count({
        where: {
          organisationId: org.id,
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
      this.prisma.organisation.findMany({
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
      this.prisma.organisation.count({ where }),
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

  async listMyOrganisations(userId: string) {
    const memberships = await this.prisma.organisationMember.findMany({
      where: { userId },
      include: {
        organisation: {
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
      id: m.organisation.id,
      name: m.organisation.name,
      handle: m.organisation.handle,
      logo: m.organisation.logo,
      contactEmail: m.organisation.contactEmail,
      status: m.organisation.status,
      role: m.role,
      bountiesPosted: m.organisation._count.bounties,
    }));
  }

  async checkHandleAvailability(handle: string) {
    const existing = await this.prisma.organisation.findUnique({
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
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    // Check ownership (same as update)
    if (user.role !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.organisationMember.findFirst({
        where: {
          userId: user.sub,
          organisationId: orgId,
          role: OrgMemberRole.OWNER,
        },
      });

      if (!membership) {
        throw new ForbiddenException('Only org owner or Super Admin can update');
      }
    }

    const updated = await this.prisma.organisation.update({
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
      user.organisationId !== orgId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    const [members, total] = await Promise.all([
      this.prisma.organisationMember.findMany({
        where: { organisationId: orgId },
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
      this.prisma.organisationMember.count({
        where: { organisationId: orgId },
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
      const ownerMembership = await this.prisma.organisationMember.findFirst({
        where: {
          userId: user.sub,
          organisationId: orgId,
          role: OrgMemberRole.OWNER,
        },
      });

      if (!ownerMembership) {
        throw new ForbiddenException('Only org owner or Super Admin can invite members');
      }
    }

    // Find the organisation
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organisation not found');
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
      const existingMembership = await tx.organisationMember.findFirst({
        where: { userId: targetUser.id },
      });

      if (existingMembership) {
        throw new ConflictException('User already belongs to an organisation');
      }

      const newMember = await tx.organisationMember.create({
        data: {
          userId: targetUser.id,
          organisationId: orgId,
          role: OrgMemberRole.MEMBER,
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
      action: AUDIT_ACTIONS.ORGANISATION_MEMBER_ADD,
      entityType: ENTITY_TYPES.ORGANISATION,
      entityId: orgId,
      afterState: { addedUserId: targetUser.id, email: normalizedEmail },
      ipAddress,
    });

    return {
      message: `Invitation sent to ${normalizedEmail}.`,
      invitation: {
        id: member.id,
        email: normalizedEmail,
        organisationId: orgId,
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
      const ownerMembership = await this.prisma.organisationMember.findFirst({
        where: {
          userId: user.sub,
          organisationId: orgId,
          role: OrgMemberRole.OWNER,
        },
      });

      if (!ownerMembership) {
        throw new ForbiddenException('Only org owner or Super Admin can remove members');
      }
    }

    const membership = await this.prisma.organisationMember.findFirst({
      where: { userId: targetUserId, organisationId: orgId },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role === OrgMemberRole.OWNER) {
      throw new BadRequestException('Cannot remove the organisation owner');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.organisationMember.delete({
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
      action: AUDIT_ACTIONS.ORGANISATION_MEMBER_REMOVE,
      entityType: ENTITY_TYPES.ORGANISATION,
      entityId: orgId,
      afterState: { removedUserId: targetUserId },
      ipAddress,
    });

    return { message: 'Member removed from organisation.' };
  }
}
