import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  SubscriptionStatus,
  SUBSCRIPTION_CONSTANTS,
  UserRole,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from './subscriptions.service';
import { NotificationsService } from '../inbox/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SubscriptionLifecycleScheduler {
  private readonly logger = new Logger(SubscriptionLifecycleScheduler.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  // ─── Auto-renew active subscriptions past period end ───

  @Cron(CronExpression.EVERY_HOUR)
  async processRenewals() {
    const now = new Date();
    const subsToRenew = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: { lt: now },
      },
      take: 100,
    });

    for (const sub of subsToRenew) {
      try {
        await this.subscriptionsService.renewSubscription(sub.id);

        const userId = sub.userId;
        if (userId) {
          await this.notificationsService.createNotification(
            userId,
            'SUBSCRIPTION_RENEWED' as any,
            'Pro renewed!',
            'Your Pro subscription just renewed. Another month of perks — go make it count.',
          );
        }
      } catch (err) {
        this.logger.error(`Failed to renew subscription ${sub.id}:`, err);
      }
    }

    if (subsToRenew.length > 0) {
      this.logger.log(`Processed ${subsToRenew.length} subscription renewals`);
    }
  }

  // ─── Expire cancelled subscriptions past period end ────

  @Cron(CronExpression.EVERY_HOUR)
  async processExpiries() {
    const now = new Date();
    const subsToExpire = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: { lt: now },
      },
      take: 100,
    });

    for (const sub of subsToExpire) {
      try {
        await this.subscriptionsService.expireSubscription(sub.id);

        const userId = sub.userId;
        if (userId) {
          await this.notificationsService.createNotification(
            userId,
            'SUBSCRIPTION_EXPIRED' as any,
            'Back to basics',
            'Your Pro subscription has ended. Upgrade again anytime to get those perks back.',
          );
        }
      } catch (err) {
        this.logger.error(`Failed to expire subscription ${sub.id}:`, err);
      }
    }

    if (subsToExpire.length > 0) {
      this.logger.log(`Processed ${subsToExpire.length} subscription expiries`);
    }
  }

  // ─── Grace period: auto-downgrade PAST_DUE subs once grace has expired ──
  //
  // Per payment-gateway.md §12: once `gracePeriodEndsAt < now()`, the
  // subscription drops to active FREE (tier=FREE, status=FREE). No ledger
  // posting — there is no money movement. Audit log via AuditService.
  //
  // Non-Negotiable #9: in-flight transactions keep their captured
  // planSnapshotBrand / planSnapshotHunter — downgrade only affects
  // FUTURE bounties / approvals.

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processGracePeriod() {
    const now = new Date();

    // Find PAST_DUE subscriptions whose grace window has elapsed.
    const pastDueSubs = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.PAST_DUE,
        gracePeriodEndsAt: { lt: now, not: null },
      },
      take: 100,
    });

    const systemActorId = process.env.SYSTEM_ACTOR_ID ?? '';

    for (const sub of pastDueSubs) {
      try {
        const result = await this.subscriptionsService.autoDowngradeToFree(sub.id);

        // AuditLog entry (Hard Rule #3). actorId FK requires a real user —
        // fall back silently if system actor isn't configured; we still log
        // an error so ops can fix the env.
        if (systemActorId) {
          await this.auditService.log({
            actorId: systemActorId,
            actorRole: UserRole.SUPER_ADMIN,
            action: AUDIT_ACTIONS.SUBSCRIPTION_AUTO_DOWNGRADE,
            entityType: ENTITY_TYPES.SUBSCRIPTION,
            entityId: sub.id,
            beforeState: {
              tier: result.before.tier,
              status: result.before.status,
              gracePeriodEndsAt: sub.gracePeriodEndsAt?.toISOString() ?? null,
            },
            afterState: {
              tier: result.after.tier,
              status: result.after.status,
            },
            reason: 'Grace period expired after failed subscription payment',
          });
        } else {
          this.logger.warn(
            `SYSTEM_ACTOR_ID not set — skipping AuditLog row for auto-downgrade of ${sub.id}`,
          );
        }

        const userId = result.userId;
        if (userId) {
          await this.notificationsService.createNotification(
            userId,
            'SUBSCRIPTION_EXPIRED' as any,
            'Back to basics',
            'Your Pro subscription has ended after payment failures. Upgrade again anytime.',
          );
        }
      } catch (err) {
        this.logger.error(`Failed to auto-downgrade past-due subscription ${sub.id}:`, err);
      }
    }

    if (pastDueSubs.length > 0) {
      this.logger.log(
        `Auto-downgraded ${pastDueSubs.length} past-due subscriptions to FREE`,
      );
    }
  }

  // ─── Send expiry reminders 3 days before period end ────

  @Cron('0 9 * * *') // Daily at 09:00
  async sendExpiryReminders() {
    const now = new Date();
    const reminderDate = new Date(
      now.getTime() + SUBSCRIPTION_CONSTANTS.EXPIRY_REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000,
    );

    const subsDueToExpire = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: {
          gte: now,
          lte: reminderDate,
        },
      },
      take: 100,
    });

    for (const sub of subsDueToExpire) {
      const userId = sub.userId;
      if (userId) {
        const endDate = sub.currentPeriodEnd?.toLocaleDateString('en-ZA') ?? 'soon';
        await this.notificationsService.createNotification(
          userId,
          'SUBSCRIPTION_EXPIRING' as any,
          'Heads up — Pro ending soon',
          `Your Pro subscription ends in 3 days (${endDate}). Reactivate to keep your perks.`,
        );
      }
    }

    if (subsDueToExpire.length > 0) {
      this.logger.log(`Sent ${subsDueToExpire.length} expiry reminders`);
    }
  }
}
