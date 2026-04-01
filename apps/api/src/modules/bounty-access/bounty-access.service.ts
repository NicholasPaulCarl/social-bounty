import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  UserRole,
  BountyStatus,
  BountyAccessType,
  BountyApplicationStatus,
  BountyInvitationStatus,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  PAGINATION_DEFAULTS,
  BOUNTY_ACCESS_CONSTANTS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Injectable()
export class BountyAccessService {
  private readonly logger = new Logger(BountyAccessService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ── Helpers ────────────────────────────────────────────

  private async getBountyOrThrow(bountyId: string) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
    });
    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }
    return bounty;
  }

  private assertBrandAdmin(
    bounty: { organisationId: string },
    user: AuthenticatedUser,
  ) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }
  }

  // ── Applications ───────────────────────────────────────

  async applyToBounty(
    userId: string,
    bountyId: string,
    dto: { message?: string },
  ) {
    const bounty = await this.getBountyOrThrow(bountyId);

    if (bounty.accessType !== BountyAccessType.CLOSED) {
      throw new BadRequestException(
        'Applications are only available for closed bounties',
      );
    }

    if (bounty.status !== BountyStatus.LIVE) {
      throw new BadRequestException(
        'Bounty is not currently accepting applications',
      );
    }

    const existing = await this.prisma.bountyApplication.findUnique({
      where: { bountyId_userId: { bountyId, userId } },
    });

    if (existing) {
      throw new ConflictException(
        'You already have an application for this bounty',
      );
    }

    const application = await this.prisma.bountyApplication.create({
      data: {
        bountyId,
        userId,
        message: dto.message?.trim() || null,
        status: BountyApplicationStatus.PENDING,
      },
      include: {
        user: { select: { firstName: true, lastName: true, profilePictureUrl: true } },
      },
    });

    return {
      id: application.id,
      bountyId: application.bountyId,
      userId: application.userId,
      userName: `${application.user.firstName} ${application.user.lastName}`,
      userProfilePicture: application.user.profilePictureUrl,
      status: application.status,
      message: application.message,
      reviewNote: application.reviewNote,
      appliedAt: application.appliedAt.toISOString(),
      reviewedAt: application.reviewedAt?.toISOString() ?? null,
    };
  }

  async withdrawApplication(userId: string, bountyId: string) {
    const application = await this.prisma.bountyApplication.findUnique({
      where: { bountyId_userId: { bountyId, userId } },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== BountyApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending applications can be withdrawn',
      );
    }

    await this.prisma.bountyApplication.update({
      where: { id: application.id },
      data: { status: BountyApplicationStatus.WITHDRAWN },
    });

    return { message: 'Application withdrawn successfully' };
  }

  async listApplications(
    bountyId: string,
    user: AuthenticatedUser,
    params: { page?: number; limit?: number; status?: BountyApplicationStatus },
  ) {
    const bounty = await this.getBountyOrThrow(bountyId);
    this.assertBrandAdmin(bounty, user);

    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const where: any = { bountyId };
    if (params.status) {
      where.status = params.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.bountyApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, profilePictureUrl: true } },
        },
      }),
      this.prisma.bountyApplication.count({ where }),
    ]);

    return {
      data: data.map((a) => ({
        id: a.id,
        bountyId: a.bountyId,
        userId: a.userId,
        userName: `${a.user.firstName} ${a.user.lastName}`,
        userProfilePicture: a.user.profilePictureUrl,
        status: a.status,
        message: a.message,
        reviewNote: a.reviewNote,
        appliedAt: a.appliedAt.toISOString(),
        reviewedAt: a.reviewedAt?.toISOString() ?? null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async reviewApplication(
    applicationId: string,
    adminUser: AuthenticatedUser,
    dto: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string },
  ) {
    const application = await this.prisma.bountyApplication.findUnique({
      where: { id: applicationId },
      include: { bounty: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    this.assertBrandAdmin(application.bounty, adminUser);

    if (application.status !== BountyApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be reviewed');
    }

    const updated = await this.prisma.bountyApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status as BountyApplicationStatus,
        reviewedBy: adminUser.sub,
        reviewNote: dto.reviewNote?.trim() || null,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { firstName: true, lastName: true, profilePictureUrl: true } },
      },
    });

    this.auditService.log({
      actorId: adminUser.sub,
      actorRole: adminUser.role as UserRole,
      action: `application.${dto.status.toLowerCase()}`,
      entityType: 'BountyApplication',
      entityId: applicationId,
      afterState: { status: dto.status, reviewNote: dto.reviewNote },
    });

    return {
      id: updated.id,
      bountyId: updated.bountyId,
      userId: updated.userId,
      userName: `${updated.user.firstName} ${updated.user.lastName}`,
      userProfilePicture: updated.user.profilePictureUrl,
      status: updated.status,
      message: updated.message,
      reviewNote: updated.reviewNote,
      appliedAt: updated.appliedAt.toISOString(),
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
    };
  }

  // ── Invitations ────────────────────────────────────────

  async createInvitations(
    bountyId: string,
    adminUser: AuthenticatedUser,
    invitations: Array<{ platform: string; handle: string }>,
  ) {
    const bounty = await this.getBountyOrThrow(bountyId);
    this.assertBrandAdmin(bounty, adminUser);

    const existingCount = await this.prisma.bountyInvitation.count({
      where: { bountyId },
    });

    if (
      existingCount + invitations.length >
      BOUNTY_ACCESS_CONSTANTS.MAX_INVITATIONS_PER_BOUNTY
    ) {
      throw new BadRequestException(
        `Cannot exceed ${BOUNTY_ACCESS_CONSTANTS.MAX_INVITATIONS_PER_BOUNTY} invitations per bounty`,
      );
    }

    const results = [];

    for (const inv of invitations) {
      const normalizedHandle = inv.handle.toLowerCase().replace(/^@/, '');

      // Try to match to an existing user via UserSocialHandle
      const matchedHandle = await this.prisma.userSocialHandle.findUnique({
        where: {
          platform_normalizedHandle: {
            platform: inv.platform as any,
            normalizedHandle,
          },
        },
      });

      // Check for duplicate invitation
      const existing = await this.prisma.bountyInvitation.findUnique({
        where: {
          bountyId_socialPlatform_socialHandle: {
            bountyId,
            socialPlatform: inv.platform as any,
            socialHandle: normalizedHandle,
          },
        },
      });

      if (existing) {
        // Skip duplicates silently
        continue;
      }

      const invitation = await this.prisma.bountyInvitation.create({
        data: {
          bountyId,
          socialPlatform: inv.platform as any,
          socialHandle: normalizedHandle,
          userId: matchedHandle?.userId ?? null,
          invitedBy: adminUser.sub,
          status: BountyInvitationStatus.PENDING,
        },
      });

      results.push(invitation);
    }

    this.auditService.log({
      actorId: adminUser.sub,
      actorRole: adminUser.role as UserRole,
      action: 'invitation.create',
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: bountyId,
      afterState: { count: results.length },
    });

    return {
      created: results.length,
      invitations: results.map((i) => ({
        id: i.id,
        bountyId: i.bountyId,
        socialPlatform: i.socialPlatform,
        socialHandle: i.socialHandle,
        userId: i.userId,
        userName: null,
        status: i.status,
        invitedAt: i.invitedAt.toISOString(),
        respondedAt: i.respondedAt?.toISOString() ?? null,
      })),
    };
  }

  async listInvitations(bountyId: string, user: AuthenticatedUser) {
    const bounty = await this.getBountyOrThrow(bountyId);
    this.assertBrandAdmin(bounty, user);

    const invitations = await this.prisma.bountyInvitation.findMany({
      where: { bountyId },
      orderBy: { invitedAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return invitations.map((i) => ({
      id: i.id,
      bountyId: i.bountyId,
      socialPlatform: i.socialPlatform,
      socialHandle: i.socialHandle,
      userId: i.userId,
      userName: i.user
        ? `${i.user.firstName} ${i.user.lastName}`
        : null,
      status: i.status,
      invitedAt: i.invitedAt.toISOString(),
      respondedAt: i.respondedAt?.toISOString() ?? null,
    }));
  }

  async revokeInvitation(invitationId: string, adminUser: AuthenticatedUser) {
    const invitation = await this.prisma.bountyInvitation.findUnique({
      where: { id: invitationId },
      include: { bounty: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    this.assertBrandAdmin(invitation.bounty, adminUser);

    if (invitation.status !== BountyInvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    await this.prisma.bountyInvitation.delete({
      where: { id: invitationId },
    });

    this.auditService.log({
      actorId: adminUser.sub,
      actorRole: adminUser.role as UserRole,
      action: 'invitation.revoke',
      entityType: 'BountyInvitation',
      entityId: invitationId,
    });

    return { message: 'Invitation revoked successfully' };
  }

  async acceptInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.bountyInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (invitation.status !== BountyInvitationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending invitations can be accepted',
      );
    }

    const updated = await this.prisma.bountyInvitation.update({
      where: { id: invitationId },
      data: {
        status: BountyInvitationStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      bountyId: updated.bountyId,
      socialPlatform: updated.socialPlatform,
      socialHandle: updated.socialHandle,
      userId: updated.userId,
      userName: null,
      status: updated.status,
      invitedAt: updated.invitedAt.toISOString(),
      respondedAt: updated.respondedAt?.toISOString() ?? null,
    };
  }

  async declineInvitation(invitationId: string, userId: string) {
    const invitation = await this.prisma.bountyInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (invitation.status !== BountyInvitationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending invitations can be declined',
      );
    }

    const updated = await this.prisma.bountyInvitation.update({
      where: { id: invitationId },
      data: {
        status: BountyInvitationStatus.DECLINED,
        respondedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      bountyId: updated.bountyId,
      socialPlatform: updated.socialPlatform,
      socialHandle: updated.socialHandle,
      userId: updated.userId,
      userName: null,
      status: updated.status,
      invitedAt: updated.invitedAt.toISOString(),
      respondedAt: updated.respondedAt?.toISOString() ?? null,
    };
  }

  async getMyInvitations(userId: string) {
    const invitations = await this.prisma.bountyInvitation.findMany({
      where: {
        userId,
        status: BountyInvitationStatus.PENDING,
      },
      orderBy: { invitedAt: 'desc' },
      include: {
        bounty: {
          select: { id: true, title: true, shortDescription: true },
        },
      },
    });

    return invitations.map((i) => ({
      id: i.id,
      bountyId: i.bountyId,
      bountyTitle: i.bounty.title,
      bountyDescription: i.bounty.shortDescription,
      socialPlatform: i.socialPlatform,
      socialHandle: i.socialHandle,
      status: i.status,
      invitedAt: i.invitedAt.toISOString(),
    }));
  }

  async canSubmitToBounty(userId: string, bountyId: string): Promise<boolean> {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
      select: { accessType: true },
    });

    if (!bounty) return false;

    // Public bounties: anyone can submit
    if (bounty.accessType === BountyAccessType.PUBLIC) {
      return true;
    }

    // Closed bounties: check for approved application
    const approvedApp = await this.prisma.bountyApplication.findFirst({
      where: {
        bountyId,
        userId,
        status: BountyApplicationStatus.APPROVED,
      },
    });

    if (approvedApp) return true;

    // Check for accepted invitation
    const acceptedInv = await this.prisma.bountyInvitation.findFirst({
      where: {
        bountyId,
        userId,
        status: BountyInvitationStatus.ACCEPTED,
      },
    });

    return !!acceptedInv;
  }
}
