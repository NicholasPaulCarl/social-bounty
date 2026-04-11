import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  UserRole,
  UserStatus,
  OrgStatus,
  OrgMemberRole,
  BountyStatus,
  SubmissionStatus,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  PAGINATION_DEFAULTS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { SettingsService } from '../settings/settings.service';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService,
    private settingsService: SettingsService,
  ) {}

  // ── Users ──────────────────────────

  async listUsers(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(params.limit || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);

    const where: Prisma.UserWhereInput = {};
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { id: params.search },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          organisationMemberships: {
            include: {
              organisation: { select: { id: true, name: true } },
            },
            take: 1,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        organisation: u.organisationMemberships[0]
          ? {
              id: u.organisationMemberships[0].organisation.id,
              name: u.organisationMemberships[0].organisation.name,
            }
          : null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organisationMemberships: {
          include: {
            organisation: { select: { id: true, name: true } },
          },
          take: 1,
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const approvedCount = await this.prisma.submission.count({
      where: { userId: id, status: SubmissionStatus.APPROVED },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      organisation: user.organisationMemberships[0]
        ? {
            id: user.organisationMemberships[0].organisation.id,
            name: user.organisationMemberships[0].organisation.name,
          }
        : null,
      submissionCount: user._count.submissions,
      approvedSubmissionCount: approvedCount,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateUserStatus(
    id: string,
    actor: AuthenticatedUser,
    status: UserStatus,
    reason: string,
    ipAddress?: string,
  ) {
    if (id === actor.sub) {
      throw new BadRequestException('Cannot change your own status');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot change status of another Super Admin');
    }

    const beforeState = { status: user.status };

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    this.auditService.log({
      actorId: actor.sub,
      actorRole: actor.role as UserRole,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGE,
      entityType: ENTITY_TYPES.USER,
      entityId: id,
      beforeState,
      afterState: { status },
      reason,
      ipAddress,
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Organisations ──────────────────

  async listOrganisations(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: OrgStatus;
    search?: string;
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(params.limit || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);

    const where: Prisma.OrganisationWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { contactEmail: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [orgs, total] = await Promise.all([
      this.prisma.organisation.findMany({
        where,
        include: {
          _count: { select: { members: true, bounties: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      }),
      this.prisma.organisation.count({ where }),
    ]);

    return {
      data: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        logo: o.logo,
        contactEmail: o.contactEmail,
        status: o.status,
        memberCount: o._count.members,
        bountyCount: o._count.bounties,
        createdAt: o.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrgDetail(id: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, bounties: true } },
      },
    });

    if (!org) {
      throw new NotFoundException('Brand not found');
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
    };
  }

  async createOrganisation(
    actor: AuthenticatedUser,
    data: {
      name: string;
      contactEmail: string;
      logo?: string | null;
      ownerUserId: string;
    },
    ipAddress?: string,
  ) {
    const ownerUser = await this.prisma.user.findUnique({
      where: { id: data.ownerUserId },
    });

    if (!ownerUser) {
      throw new BadRequestException('Owner user not found');
    }

    const existingMembership = await this.prisma.organisationMember.findFirst({
      where: { userId: data.ownerUserId },
    });

    if (existingMembership) {
      throw new BadRequestException('User already belongs to an organisation');
    }

    const org = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          name: data.name.trim(),
          contactEmail: data.contactEmail.toLowerCase().trim(),
          logo: data.logo || null,
        },
      });

      await tx.organisationMember.create({
        data: {
          userId: data.ownerUserId,
          organisationId: organisation.id,
          role: OrgMemberRole.OWNER,
        },
      });

      await tx.user.update({
        where: { id: data.ownerUserId },
        data: { role: UserRole.BUSINESS_ADMIN },
      });

      return organisation;
    });

    this.auditService.log({
      actorId: actor.sub,
      actorRole: actor.role as UserRole,
      action: AUDIT_ACTIONS.ORGANISATION_CREATE,
      entityType: ENTITY_TYPES.ORGANISATION,
      entityId: org.id,
      afterState: { name: org.name, ownerUserId: data.ownerUserId },
      ipAddress,
    });

    return {
      id: org.id,
      name: org.name,
      contactEmail: org.contactEmail,
      logo: org.logo,
      status: org.status,
      owner: {
        id: ownerUser.id,
        email: ownerUser.email,
        firstName: ownerUser.firstName,
        lastName: ownerUser.lastName,
      },
      createdAt: org.createdAt.toISOString(),
    };
  }

  async updateOrgStatus(
    id: string,
    actor: AuthenticatedUser,
    status: OrgStatus,
    reason: string,
    ipAddress?: string,
  ) {
    const org = await this.prisma.organisation.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organisation not found');

    const beforeState = { status: org.status };

    const updated = await this.prisma.organisation.update({
      where: { id },
      data: { status },
    });

    // If suspending, pause all LIVE bounties
    if (status === OrgStatus.SUSPENDED) {
      await this.prisma.bounty.updateMany({
        where: { organisationId: id, status: BountyStatus.LIVE },
        data: { status: BountyStatus.PAUSED },
      });
    }

    this.auditService.log({
      actorId: actor.sub,
      actorRole: actor.role as UserRole,
      action: AUDIT_ACTIONS.ORGANISATION_STATUS_CHANGE,
      entityType: ENTITY_TYPES.ORGANISATION,
      entityId: id,
      beforeState,
      afterState: { status },
      reason,
      ipAddress,
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Submissions ──────────────────────

  async listSubmissions(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: SubmissionStatus;
    payoutStatus?: string;
    userId?: string;
    organisationId?: string;
    search?: string;
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(params.limit || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);

    const where: Prisma.SubmissionWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.payoutStatus) where.payoutStatus = params.payoutStatus as any;
    if (params.userId) where.userId = params.userId;
    if (params.organisationId) {
      where.bounty = { organisationId: params.organisationId };
    }
    if (params.search) {
      where.OR = [
        { bounty: { title: { contains: params.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          bounty: { select: { id: true, title: true, organisationId: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true } },
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
        bounty: s.bounty,
        user: s.user,
        status: s.status,
        payoutStatus: s.payoutStatus,
        reviewedBy: s.reviewedBy,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Overrides ──────────────────────

  async overrideBounty(
    id: string,
    actor: AuthenticatedUser,
    status: BountyStatus,
    reason: string,
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id } });
    if (!bounty) throw new NotFoundException('Bounty not found');

    const beforeState = { status: bounty.status };

    const updated = await this.prisma.bounty.update({
      where: { id },
      data: { status },
    });

    this.auditService.log({
      actorId: actor.sub,
      actorRole: actor.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_OVERRIDE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: id,
      beforeState,
      afterState: { status },
      reason,
      ipAddress,
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async overrideSubmission(
    id: string,
    actor: AuthenticatedUser,
    status: SubmissionStatus,
    reason: string,
    ipAddress?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found');

    const beforeState = { status: submission.status };

    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        status,
        reviewedById: actor.sub,
      },
      include: {
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    this.auditService.log({
      actorId: actor.sub,
      actorRole: actor.role as UserRole,
      action: AUDIT_ACTIONS.SUBMISSION_OVERRIDE,
      entityType: ENTITY_TYPES.SUBMISSION,
      entityId: id,
      beforeState,
      afterState: { status },
      reason,
      ipAddress,
    });

    return {
      id: updated.id,
      status: updated.status,
      reviewedBy: updated.reviewedBy,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Audit Logs ─────────────────────

  async listAuditLogs(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    actorId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(params.limit || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);

    const where: Prisma.AuditLogWhereInput = {};
    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate)
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(params.startDate);
      if (params.endDate)
        (where.createdAt as Prisma.DateTimeFilter).lte = new Date(params.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        actor: l.actor,
        actorRole: l.actorRole,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        beforeState: l.beforeState,
        afterState: l.afterState,
        reason: l.reason,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAuditLog(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!log) throw new NotFoundException('Audit log entry not found');

    return {
      id: log.id,
      actorId: log.actorId,
      actor: log.actor,
      actorRole: log.actorRole,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      beforeState: log.beforeState,
      afterState: log.afterState,
      reason: log.reason,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    };
  }

  // ── Dashboard ──────────────────────

  async getDashboard() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      participantCount,
      businessAdminCount,
      superAdminCount,
      totalOrgs,
      activeOrgs,
      suspendedOrgs,
      totalBounties,
      draftBounties,
      liveBounties,
      pausedBounties,
      closedBounties,
      totalSubmissions,
      submittedCount,
      inReviewCount,
      needsMoreInfoCount,
      approvedCount,
      rejectedCount,
      notPaidCount,
      pendingPayoutCount,
      paidCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      this.prisma.user.count({ where: { role: UserRole.PARTICIPANT } }),
      this.prisma.user.count({ where: { role: UserRole.BUSINESS_ADMIN } }),
      this.prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } }),
      this.prisma.organisation.count(),
      this.prisma.organisation.count({ where: { status: OrgStatus.ACTIVE } }),
      this.prisma.organisation.count({ where: { status: OrgStatus.SUSPENDED } }),
      this.prisma.bounty.count(),
      this.prisma.bounty.count({ where: { status: BountyStatus.DRAFT } }),
      this.prisma.bounty.count({ where: { status: BountyStatus.LIVE } }),
      this.prisma.bounty.count({ where: { status: BountyStatus.PAUSED } }),
      this.prisma.bounty.count({ where: { status: BountyStatus.CLOSED } }),
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { status: SubmissionStatus.SUBMITTED } }),
      this.prisma.submission.count({ where: { status: SubmissionStatus.IN_REVIEW } }),
      this.prisma.submission.count({ where: { status: SubmissionStatus.NEEDS_MORE_INFO } }),
      this.prisma.submission.count({ where: { status: SubmissionStatus.APPROVED } }),
      this.prisma.submission.count({ where: { status: SubmissionStatus.REJECTED } }),
      this.prisma.submission.count({ where: { payoutStatus: 'NOT_PAID' } }),
      this.prisma.submission.count({ where: { payoutStatus: 'PENDING' } }),
      this.prisma.submission.count({ where: { payoutStatus: 'PAID' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        byRole: {
          PARTICIPANT: participantCount,
          BUSINESS_ADMIN: businessAdminCount,
          SUPER_ADMIN: superAdminCount,
        },
      },
      organisations: {
        total: totalOrgs,
        active: activeOrgs,
        suspended: suspendedOrgs,
      },
      bounties: {
        total: totalBounties,
        byStatus: {
          DRAFT: draftBounties,
          LIVE: liveBounties,
          PAUSED: pausedBounties,
          CLOSED: closedBounties,
        },
      },
      submissions: {
        total: totalSubmissions,
        byStatus: {
          SUBMITTED: submittedCount,
          IN_REVIEW: inReviewCount,
          NEEDS_MORE_INFO: needsMoreInfoCount,
          APPROVED: approvedCount,
          REJECTED: rejectedCount,
        },
        byPayoutStatus: {
          NOT_PAID: notPaidCount,
          PENDING: pendingPayoutCount,
          PAID: paidCount,
        },
      },
    };
  }

  // ── Settings ─────────────────────

  async isSignupEnabled(): Promise<boolean> {
    return this.settingsService.isSignupEnabled();
  }

  async isSubmissionEnabled(): Promise<boolean> {
    return this.settingsService.isSubmissionEnabled();
  }

  async getSettings() {
    const settings = await this.settingsService.getSettings();
    let updatedBy = null;
    if (settings.updatedById) {
      const user = await this.prisma.user.findUnique({
        where: { id: settings.updatedById },
        select: { id: true, email: true },
      });
      if (user) {
        updatedBy = { id: user.id, email: user.email };
      }
    }

    return {
      signupsEnabled: settings.signupsEnabled,
      submissionsEnabled: settings.submissionsEnabled,
      updatedAt: settings.updatedAt.toISOString(),
      updatedBy,
    };
  }

  async updateSettings(
    actor: AuthenticatedUser,
    data: { signupsEnabled?: boolean; submissionsEnabled?: boolean },
    ipAddress?: string,
  ) {
    const current = await this.settingsService.getSettings();
    const beforeState = {
      signupsEnabled: current.signupsEnabled,
      submissionsEnabled: current.submissionsEnabled,
    };

    await this.settingsService.updateSettings({
      signupsEnabled: data.signupsEnabled,
      submissionsEnabled: data.submissionsEnabled,
      updatedById: actor.sub,
    });

    const updated = await this.settingsService.getSettings();
    const afterState = {
      signupsEnabled: updated.signupsEnabled,
      submissionsEnabled: updated.submissionsEnabled,
    };

    this.auditService.log({
      actorId: actor.sub,
      actorRole: actor.role as UserRole,
      action: AUDIT_ACTIONS.SETTINGS_UPDATE,
      entityType: ENTITY_TYPES.SETTINGS,
      entityId: 'global',
      beforeState,
      afterState,
      ipAddress,
    });

    return this.getSettings();
  }

  // ── Recent Errors ───────────────────

  // In-memory error store for MVP (use Sentry in production)
  private recentErrors: Array<{
    id: string;
    timestamp: Date;
    message: string;
    stackTrace: string;
    endpoint: string;
    userId: string | null;
    severity: string;
  }> = [];

  recordError(error: {
    message: string;
    stackTrace: string;
    endpoint: string;
    userId?: string | null;
    severity?: string;
  }) {
    this.recentErrors.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message: error.message,
      stackTrace: error.stackTrace,
      endpoint: error.endpoint,
      userId: error.userId || null,
      severity: error.severity || 'error',
    });

    // Keep only the last 1000 errors in memory
    if (this.recentErrors.length > 1000) {
      this.recentErrors = this.recentErrors.slice(0, 1000);
    }
  }

  async getRecentErrors(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(params.limit || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);

    let filtered = [...this.recentErrors];

    if (params.startDate) {
      const start = new Date(params.startDate);
      filtered = filtered.filter((e) => e.timestamp >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      filtered = filtered.filter((e) => e.timestamp <= end);
    }

    const total = filtered.length;
    const data = filtered.slice((page - 1) * limit, page * limit);

    return {
      data: data.map((e) => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        message: e.message,
        stackTrace: e.stackTrace,
        endpoint: e.endpoint,
        userId: e.userId,
        severity: e.severity,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── System Health ──────────────────

  async getSystemHealth() {
    const start = Date.now();

    let dbStatus: 'ok' | 'error' = 'ok';
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch {
      dbStatus = 'error';
    }

    const overallStatus = dbStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        database: { status: dbStatus, responseTime: dbResponseTime },
        fileStorage: { status: 'ok' as const, responseTime: 0 },
        email: { status: 'ok' as const, responseTime: 0 },
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
    };
  }
}
