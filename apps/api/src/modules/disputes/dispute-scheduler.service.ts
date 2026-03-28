import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DisputeStatus,
  UserRole,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  DISPUTE_LIMITS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DisputeSchedulerService {
  private readonly logger = new Logger(DisputeSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Auto-escalate disputes in AWAITING_RESPONSE where the responseDeadline has passed.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoEscalateStaleDisputes() {
    const now = new Date();

    try {
      // Find disputes that need auto-escalation
      const staleDisputes = await this.prisma.dispute.findMany({
        where: {
          status: DisputeStatus.AWAITING_RESPONSE,
          responseDeadline: { lte: now },
        },
        select: { id: true, disputeNumber: true, status: true },
      });

      if (staleDisputes.length === 0) return;

      // Update all stale disputes to ESCALATED
      await this.prisma.dispute.updateMany({
        where: {
          status: DisputeStatus.AWAITING_RESPONSE,
          responseDeadline: { lte: now },
        },
        data: {
          status: DisputeStatus.ESCALATED,
          escalatedAt: now,
        },
      });

      // Create status history entries for each escalated dispute
      for (const dispute of staleDisputes) {
        await this.prisma.disputeStatusHistory.create({
          data: {
            disputeId: dispute.id,
            fromStatus: DisputeStatus.AWAITING_RESPONSE,
            toStatus: DisputeStatus.ESCALATED,
            changedByUserId: 'SYSTEM',
            changedByRole: UserRole.SUPER_ADMIN,
            note: 'Auto-escalated: response deadline exceeded',
          },
        });

        this.auditService.log({
          actorId: 'SYSTEM',
          actorRole: UserRole.SUPER_ADMIN,
          action: AUDIT_ACTIONS.DISPUTE_AUTO_ESCALATE,
          entityType: ENTITY_TYPES.DISPUTE,
          entityId: dispute.id,
          beforeState: { status: DisputeStatus.AWAITING_RESPONSE },
          afterState: { status: DisputeStatus.ESCALATED },
        });
      }

      this.logger.log(
        `Auto-escalated ${staleDisputes.length} stale disputes`,
      );
    } catch (error) {
      this.logger.error('Failed to auto-escalate stale disputes', error);
    }
  }

  /**
   * Auto-close disputes that have been resolved for more than 90 days.
   * Runs daily at 3:00 AM.
   */
  @Cron('0 3 * * *')
  async autoCloseResolvedDisputes() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DISPUTE_LIMITS.AUTO_CLOSE_DAYS);

    try {
      // Find disputes that need auto-closing
      const resolvedDisputes = await this.prisma.dispute.findMany({
        where: {
          status: DisputeStatus.RESOLVED,
          resolvedAt: { lte: cutoffDate },
        },
        select: { id: true, disputeNumber: true },
      });

      if (resolvedDisputes.length === 0) return;

      // Update all resolved disputes to CLOSED
      await this.prisma.dispute.updateMany({
        where: {
          status: DisputeStatus.RESOLVED,
          resolvedAt: { lte: cutoffDate },
        },
        data: {
          status: DisputeStatus.CLOSED,
        },
      });

      // Create status history entries for each closed dispute
      for (const dispute of resolvedDisputes) {
        await this.prisma.disputeStatusHistory.create({
          data: {
            disputeId: dispute.id,
            fromStatus: DisputeStatus.RESOLVED,
            toStatus: DisputeStatus.CLOSED,
            changedByUserId: 'SYSTEM',
            changedByRole: UserRole.SUPER_ADMIN,
            note: `Auto-closed: resolved more than ${DISPUTE_LIMITS.AUTO_CLOSE_DAYS} days ago`,
          },
        });

        this.auditService.log({
          actorId: 'SYSTEM',
          actorRole: UserRole.SUPER_ADMIN,
          action: AUDIT_ACTIONS.DISPUTE_AUTO_CLOSE,
          entityType: ENTITY_TYPES.DISPUTE,
          entityId: dispute.id,
          beforeState: { status: DisputeStatus.RESOLVED },
          afterState: { status: DisputeStatus.CLOSED },
        });
      }

      this.logger.log(
        `Auto-closed ${resolvedDisputes.length} resolved disputes`,
      );
    } catch (error) {
      this.logger.error('Failed to auto-close resolved disputes', error);
    }
  }
}
