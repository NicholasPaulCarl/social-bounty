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

@Injectable()
export class OrganisationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    user: AuthenticatedUser,
    name: string,
    contactEmail: string,
    ipAddress?: string,
  ) {
    // Check user doesn't already belong to an org
    const existing = await this.prisma.organisationMember.findFirst({
      where: { userId: user.sub },
    });

    if (existing) {
      throw new ConflictException('User already belongs to an organisation');
    }

    const org = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          name: name.trim(),
          contactEmail: contactEmail.toLowerCase().trim(),
        },
      });

      await tx.organisationMember.create({
        data: {
          userId: user.sub,
          organisationId: organisation.id,
          role: OrgMemberRole.OWNER,
        },
      });

      // Promote user to BUSINESS_ADMIN
      await tx.user.update({
        where: { id: user.sub },
        data: { role: UserRole.BUSINESS_ADMIN },
      });

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
      logo: org.logo,
      contactEmail: org.contactEmail,
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
      logo: org.logo,
      contactEmail: org.contactEmail,
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
    data: { name?: string; contactEmail?: string },
    ipAddress?: string,
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

    const beforeState = {
      name: org.name,
      contactEmail: org.contactEmail,
    };

    const updateData: Record<string, string> = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.contactEmail)
      updateData.contactEmail = data.contactEmail.toLowerCase().trim();

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
      logo: updated.logo,
      contactEmail: updated.contactEmail,
      status: updated.status,
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
