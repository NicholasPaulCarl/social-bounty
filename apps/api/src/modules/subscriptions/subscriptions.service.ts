import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  SubscriptionTier,
  SubscriptionEntityType,
  SubscriptionStatus,
  SubscriptionFeature,
  UserRole,
  SUBSCRIPTION_CONSTANTS,
  PAGINATION_DEFAULTS,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PRICING, FEATURE_MATRIX, buildFeaturesDto } from './subscription.constants';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Tier Lookups (used by other services) ─────────────

  async getActiveTier(userId: string): Promise<SubscriptionTier> {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        entityType: SubscriptionEntityType.HUNTER,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELLED] },
      },
      select: { tier: true, status: true, currentPeriodEnd: true },
    });

    if (!sub) return SubscriptionTier.FREE;

    // CANCELLED still has PRO until period end
    if (sub.status === SubscriptionStatus.CANCELLED && sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()) {
      return sub.tier as SubscriptionTier;
    }

    if (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.PAST_DUE) {
      return sub.tier as SubscriptionTier;
    }

    return SubscriptionTier.FREE;
  }

  async getActiveOrgTier(brandId: string): Promise<SubscriptionTier> {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        brandId,
        entityType: SubscriptionEntityType.BRAND,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELLED] },
      },
      select: { tier: true, status: true, currentPeriodEnd: true },
    });

    if (!sub) return SubscriptionTier.FREE;

    if (sub.status === SubscriptionStatus.CANCELLED && sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()) {
      return sub.tier as SubscriptionTier;
    }

    if (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.PAST_DUE) {
      return sub.tier as SubscriptionTier;
    }

    return SubscriptionTier.FREE;
  }

  async isFeatureEnabled(userId: string, feature: SubscriptionFeature): Promise<boolean> {
    const tier = await this.getActiveTier(userId);
    return FEATURE_MATRIX[feature](tier);
  }

  // ─── Get Subscription (user-facing) ────────────────────

  async getSubscription(userId: string, role: UserRole, brandId?: string) {
    const isHunter = role === UserRole.PARTICIPANT;
    const entityType = isHunter ? SubscriptionEntityType.HUNTER : SubscriptionEntityType.BRAND;

    let sub;
    if (isHunter) {
      sub = await this.prisma.subscription.findFirst({
        where: { userId, entityType },
      });
    } else if (brandId) {
      sub = await this.prisma.subscription.findFirst({
        where: { brandId, entityType },
      });
    }

    const tier = (sub?.tier as SubscriptionTier) ?? SubscriptionTier.FREE;
    const status = (sub?.status as SubscriptionStatus) ?? SubscriptionStatus.FREE;
    const price = PRICING[entityType];

    return {
      id: sub?.id ?? null,
      tier,
      status,
      entityType,
      priceAmount: price,
      currency: 'ZAR',
      currentPeriodStart: sub?.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      features: buildFeaturesDto(entityType, tier),
    };
  }

  // ─── Subscribe ─────────────────────────────────────────

  async subscribe(userId: string, role: UserRole, brandId?: string) {
    const isHunter = role === UserRole.PARTICIPANT;
    const entityType = isHunter ? SubscriptionEntityType.HUNTER : SubscriptionEntityType.BRAND;
    const price = PRICING[entityType];

    // Check for existing active subscription
    const existing = isHunter
      ? await this.prisma.subscription.findFirst({ where: { userId, entityType } })
      : await this.prisma.subscription.findFirst({ where: { brandId, entityType } });

    if (existing && [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE].includes(existing.status as SubscriptionStatus)) {
      throw new BadRequestException('Already have an active subscription');
    }

    // If cancelled but still in period, just reactivate
    if (existing?.status === SubscriptionStatus.CANCELLED && existing.currentPeriodEnd && existing.currentPeriodEnd > new Date()) {
      return this.reactivate(userId, role, brandId);
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_CONSTANTS.BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000);

    const sub = await this.prisma.$transaction(async (tx) => {
      // Upsert subscription
      const subscription = existing
        ? await tx.subscription.update({
            where: { id: existing.id },
            data: {
              tier: SubscriptionTier.PRO,
              status: SubscriptionStatus.ACTIVE,
              priceAmount: price,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelledAt: null,
              cancelAtPeriodEnd: false,
              gracePeriodEndsAt: null,
              failedPaymentCount: 0,
            },
          })
        : await tx.subscription.create({
            data: {
              ...(isHunter ? { userId } : { brandId }),
              entityType,
              tier: SubscriptionTier.PRO,
              status: SubscriptionStatus.ACTIVE,
              priceAmount: price,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });

      // Create payment record
      await tx.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: price,
          status: 'SUCCEEDED',
          billingPeriodStart: now,
          billingPeriodEnd: periodEnd,
          paidAt: now,
        },
      });

      return subscription;
    });

    this.logger.log(`Subscription created: ${sub.id} (${entityType} PRO)`);

    return this.getSubscription(userId, role, brandId);
  }

  // ─── Cancel ────────────────────────────────────────────

  async cancel(userId: string, role: UserRole, brandId?: string) {
    const sub = await this.findActiveSubscription(userId, role, brandId);

    if (sub.cancelAtPeriodEnd) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    });

    return this.getSubscription(userId, role, brandId);
  }

  // ─── Reactivate ────────────────────────────────────────

  async reactivate(userId: string, role: UserRole, brandId?: string) {
    const isHunter = role === UserRole.PARTICIPANT;
    const entityType = isHunter ? SubscriptionEntityType.HUNTER : SubscriptionEntityType.BRAND;

    const sub = isHunter
      ? await this.prisma.subscription.findFirst({ where: { userId, entityType } })
      : await this.prisma.subscription.findFirst({ where: { brandId, entityType } });

    if (!sub) throw new NotFoundException('No subscription found');

    if (sub.status !== SubscriptionStatus.CANCELLED || !sub.cancelAtPeriodEnd) {
      throw new BadRequestException('Subscription is not in a cancelled state');
    }

    if (sub.currentPeriodEnd && sub.currentPeriodEnd <= new Date()) {
      throw new BadRequestException('Subscription period has already ended. Please subscribe again.');
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      },
    });

    return this.getSubscription(userId, role, brandId);
  }

  // ─── Payment History ───────────────────────────────────

  async getPaymentHistory(userId: string, role: UserRole, brandId?: string, params?: { page?: number; limit?: number }) {
    const sub = await this.findSubscriptionRecord(userId, role, brandId);
    if (!sub) {
      return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const page = params?.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(params?.limit || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.subscriptionPayment.findMany({
        where: { subscriptionId: sub.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscriptionPayment.count({ where: { subscriptionId: sub.id } }),
    ]);

    return {
      data: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        billingPeriodStart: p.billingPeriodStart.toISOString(),
        billingPeriodEnd: p.billingPeriodEnd.toISOString(),
        attemptNumber: p.attemptNumber,
        paidAt: p.paidAt?.toISOString() ?? null,
        failureReason: p.failureReason,
        createdAt: p.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Lifecycle (used by scheduler) ─────────────────────

  async expireSubscription(subscriptionId: string) {
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.EXPIRED,
        cancelAtPeriodEnd: false,
      },
    });
    this.logger.log(`Subscription expired: ${subscriptionId}`);
  }

  async renewSubscription(subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) return;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_CONSTANTS.BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          failedPaymentCount: 0,
          gracePeriodEndsAt: null,
        },
      });

      await tx.subscriptionPayment.create({
        data: {
          subscriptionId,
          amount: sub.priceAmount,
          status: 'SUCCEEDED',
          billingPeriodStart: now,
          billingPeriodEnd: periodEnd,
          paidAt: now,
        },
      });
    });

    this.logger.log(`Subscription renewed: ${subscriptionId}`);
  }

  // ─── Helpers ───────────────────────────────────────────

  private async findActiveSubscription(userId: string, role: UserRole, brandId?: string) {
    const sub = await this.findSubscriptionRecord(userId, role, brandId);
    if (!sub || ![SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELLED].includes(sub.status as SubscriptionStatus)) {
      throw new NotFoundException('No active subscription found');
    }
    return sub;
  }

  private async findSubscriptionRecord(userId: string, role: UserRole, brandId?: string) {
    const isHunter = role === UserRole.PARTICIPANT;
    const entityType = isHunter ? SubscriptionEntityType.HUNTER : SubscriptionEntityType.BRAND;

    return isHunter
      ? this.prisma.subscription.findFirst({ where: { userId, entityType } })
      : this.prisma.subscription.findFirst({ where: { brandId, entityType } });
  }
}
