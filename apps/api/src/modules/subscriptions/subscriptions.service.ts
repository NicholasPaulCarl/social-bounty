import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
  forwardRef,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LedgerAccount, LedgerEntryType } from '@prisma/client';
import {
  SubscriptionTier,
  SubscriptionEntityType,
  SubscriptionStatus,
  SubscriptionFeature,
  UserRole,
  SUBSCRIPTION_CONSTANTS,
  PAGINATION_DEFAULTS,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { PRICING, FEATURE_MATRIX, buildFeaturesDto } from './subscription.constants';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    // Optional so unit tests don't have to wire the full ledger module.
    @Optional()
    @Inject(forwardRef(() => LedgerService))
    private readonly ledger?: LedgerService,
    @Optional() private readonly config?: ConfigService,
    // Optional so unit tests that don't boot AuditModule still work. Audit
    // writes are still required in production (Hard Rule #3 + #4.6). The
    // AuditModule is @Global() so it's always available when the API runs.
    @Optional() private readonly auditService?: AuditService,
  ) {}

  /**
   * Resolves the system actor for ledger writes from the subscription
   * billing / renewal flow. AuditLog.actorId has a FK to users.id so we must
   * have a real user row. Mirrors PayoutsService / BrandFundingHandler.
   */
  private systemActorId(): string {
    const id = this.config?.get<string>('SYSTEM_ACTOR_ID', '') ?? '';
    if (!id) {
      throw new Error(
        'SYSTEM_ACTOR_ID is not set; subscription billing cannot write AuditLog rows',
      );
    }
    return id;
  }

  /**
   * Post the `subscription_charged` ledger group for a SUCCEEDED
   * SubscriptionPayment (payment-gateway.md §3 + §13).
   *
   * Idempotent on (referenceId=paymentId, actionType='subscription_charged').
   * Balanced: DEBIT gateway_clearing / CREDIT subscription_revenue by priceAmount.
   * Non-Negotiables #1–#6, #9 enforced inside LedgerService.
   *
   * No-op if the ledger service wasn't injected (unit tests that don't mount
   * the ledger module).
   */
  private async postChargeLedger(
    paymentId: string,
    subscriptionId: string,
    userId: string | null,
    brandId: string | null,
    priceAmount: { toString(): string },
    tier: SubscriptionTier,
  ): Promise<void> {
    if (!this.ledger) return;
    // priceAmount is Decimal(10,2) ZAR (major units); convert to integer minor
    // units — Non-Negotiable #4.
    const amountCents = BigInt(
      Math.round(Number(priceAmount.toString()) * 100),
    );
    if (amountCents <= 0n) return;

    const actorId = this.systemActorId();
    await this.ledger.postTransactionGroup({
      actionType: 'subscription_charged',
      referenceId: paymentId,
      referenceType: 'SubscriptionPayment',
      description: `Subscription charged: ${subscriptionId} (${tier})`,
      postedBy: actorId,
      legs: [
        {
          account: LedgerAccount.gateway_clearing,
          type: LedgerEntryType.DEBIT,
          amountCents,
          userId: userId ?? null,
          brandId: brandId ?? null,
          metadata: { subscriptionId, tier },
        },
        {
          account: LedgerAccount.subscription_revenue,
          type: LedgerEntryType.CREDIT,
          amountCents,
          userId: userId ?? null,
          brandId: brandId ?? null,
          metadata: { subscriptionId, tier },
        },
      ],
      audit: {
        actorId,
        actorRole: UserRole.SUPER_ADMIN,
        action: 'SUBSCRIPTION_CHARGED',
        entityType: 'SubscriptionPayment',
        entityId: paymentId,
        afterState: {
          subscriptionId,
          tier,
          amountCents: amountCents.toString(),
        },
      },
    });
  }

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
      gracePeriodEndsAt: sub?.gracePeriodEndsAt?.toISOString() ?? null,
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

    const { subscription, payment } = await this.prisma.$transaction(async (tx) => {
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

      // Create payment record with plan-snapshot (Non-Negotiable #9).
      const payment = await tx.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: price,
          status: 'SUCCEEDED',
          billingPeriodStart: now,
          billingPeriodEnd: periodEnd,
          paidAt: now,
          tierSnapshot: SubscriptionTier.PRO,
        },
      });

      return { subscription, payment };
    });

    // Post the balanced ledger group outside the subscription tx: a ledger
    // failure must not roll back the state change because ledger posting is
    // idempotent on paymentId and can be retried by reconciliation. The
    // subscription_charged group's AuditLog is written inside LedgerService's
    // own tx so audit + ledger are atomic together (Non-Negotiable #6).
    try {
      if (payment?.id) {
        await this.postChargeLedger(
          payment.id,
          subscription.id,
          isHunter ? (userId ?? null) : null,
          isHunter ? null : (brandId ?? null),
          price,
          SubscriptionTier.PRO,
        );
      }
    } catch (err) {
      this.logger.error(
        `Subscription ${subscription.id}: ledger posting failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    this.logger.log(`Subscription created: ${subscription.id} (${entityType} PRO)`);

    return this.getSubscription(userId, role, brandId);
  }

  // ─── Cancel ────────────────────────────────────────────

  /**
   * Cancel the caller's own subscription.
   *
   * Semantics:
   * - Default (`options.immediate` unset/false): schedule cancel — the user
   *   keeps PRO through `currentPeriodEnd`, then auto-drops to FREE. Sets
   *   `status=CANCELLED`, `cancelAtPeriodEnd=true`, `cancelledAt=now()`.
   *   This matches what `getActiveTier`/`getActiveOrgTier` expect: a
   *   CANCELLED row with a future `currentPeriodEnd` still returns PRO.
   * - Immediate (`options.immediate=true`): drop to FREE now. Sets
   *   `tier=FREE`, `status=CANCELLED`, `cancelAtPeriodEnd=false`,
   *   `cancelledAt=now()`. No refund / no ledger compensation here — if
   *   that's ever required, it must be a separate refund flow posted via
   *   LedgerService (payment-gateway.md §8).
   *
   * Non-Negotiable #9: this method NEVER touches `planSnapshotBrand` on
   * Bounty rows or `planSnapshotHunter` on Submission rows. In-flight
   * transactions stay priced at the tier they were created under.
   *
   * Idempotency: a second cancel on an already-cancelled subscription is a
   * no-op — returns the existing state and writes an AuditLog entry noting
   * that the call was a duplicate. This lets the UI retry safely and
   * avoids masking a real "already cancelled, did nothing" signal.
   *
   * AuditLog (Hard Rule #3): every call writes a
   * `SUBSCRIPTION_CANCELLED` entry, even duplicates, so we have a full
   * trail of who-tried-what-when.
   */
  async cancel(
    userId: string,
    role: UserRole,
    brandId?: string,
    options?: { immediate?: boolean; actorId?: string; actorRole?: UserRole; ipAddress?: string | null },
  ) {
    const sub = await this.findActiveSubscription(userId, role, brandId);
    const actorId = options?.actorId ?? userId;
    const actorRole = options?.actorRole ?? role;

    return this.performCancel(sub, {
      immediate: options?.immediate ?? false,
      actorId,
      actorRole,
      ipAddress: options?.ipAddress ?? null,
      returnForUser: { userId, role, brandId },
    });
  }

  /**
   * Admin-triggered cancel by subscription id. SUPER_ADMIN only — the
   * caller (controller layer) is responsible for the RBAC decorator.
   *
   * Routes to `performCancel` with the admin as the audit actor. Returns
   * the affected subscription's public shape so the admin UI can reflect
   * the new state.
   */
  async cancelById(
    subscriptionId: string,
    admin: { actorId: string; actorRole: UserRole; ipAddress?: string | null },
    options?: { immediate?: boolean },
  ) {
    if (admin.actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN may cancel other subscriptions');
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    // Resolve the target's "view" so getSubscription returns the right shape.
    const targetRole =
      sub.entityType === SubscriptionEntityType.HUNTER
        ? UserRole.PARTICIPANT
        : UserRole.BUSINESS_ADMIN;

    return this.performCancel(sub, {
      immediate: options?.immediate ?? false,
      actorId: admin.actorId,
      actorRole: admin.actorRole,
      ipAddress: admin.ipAddress ?? null,
      returnForUser: {
        userId: sub.userId ?? '',
        role: targetRole,
        brandId: sub.brandId ?? undefined,
      },
    });
  }

  private async performCancel(
    sub: { id: string; tier: string; status: string; cancelAtPeriodEnd: boolean },
    ctx: {
      immediate: boolean;
      actorId: string;
      actorRole: UserRole;
      ipAddress: string | null;
      returnForUser: { userId: string; role: UserRole; brandId?: string };
    },
  ) {
    const beforeState = {
      tier: sub.tier,
      status: sub.status,
    };

    // Idempotency: already-cancelled (either scheduled or immediate) — no
    // DB write, log the duplicate, return existing state. Second call is
    // safe to retry.
    const alreadyCancelled =
      sub.status === SubscriptionStatus.CANCELLED ||
      sub.cancelAtPeriodEnd === true;

    if (alreadyCancelled) {
      this.logger.log(
        `Subscription ${sub.id}: cancel called but already cancelled — no-op`,
      );
      this.auditService?.log({
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        action: AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED,
        entityType: ENTITY_TYPES.SUBSCRIPTION,
        entityId: sub.id,
        beforeState,
        afterState: {
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          status: sub.status,
          duplicate: true,
        },
        ipAddress: ctx.ipAddress,
      });
      return this.getSubscription(
        ctx.returnForUser.userId,
        ctx.returnForUser.role,
        ctx.returnForUser.brandId,
      );
    }

    const now = new Date();
    const data = ctx.immediate
      ? {
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.CANCELLED,
          cancelAtPeriodEnd: false,
          cancelledAt: now,
        }
      : {
          status: SubscriptionStatus.CANCELLED,
          cancelAtPeriodEnd: true,
          cancelledAt: now,
        };

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data,
    });

    this.auditService?.log({
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      action: AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED,
      entityType: ENTITY_TYPES.SUBSCRIPTION,
      entityId: sub.id,
      beforeState,
      afterState: {
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        cancelledAt: now.toISOString(),
        status: data.status,
        ...(ctx.immediate ? { tier: SubscriptionTier.FREE } : {}),
      },
      ipAddress: ctx.ipAddress,
    });

    this.logger.log(
      `Subscription ${sub.id}: cancelled (${ctx.immediate ? 'immediate' : 'at_period_end'}) by ${ctx.actorId}`,
    );

    return this.getSubscription(
      ctx.returnForUser.userId,
      ctx.returnForUser.role,
      ctx.returnForUser.brandId,
    );
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

  // ─── Admin listing (Super Admin finance dashboard) ────
  //
  // Returns all Subscription rows paginated, joined with the owning User
  // (HUNTER subs) or Brand (BRAND subs). Read-only; no mutations.
  //
  // Assumption: we project a single `ownerName` / `ownerEmail` that maps to
  // whichever side of the subscription is populated, so the UI can render a
  // uniform table row regardless of entityType.
  async listAll(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: string;
      userId: string | null;
      brandId: string | null;
      entityType: SubscriptionEntityType;
      tier: SubscriptionTier;
      status: SubscriptionStatus;
      priceAmount: number;
      currency: string;
      currentPeriodEnd: string | null;
      gracePeriodEndsAt: string | null;
      failedPaymentCount: number;
      ownerName: string | null;
      ownerEmail: string | null;
      createdAt: string;
    }>;
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = params?.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params?.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          brand: { select: { name: true, contactEmail: true } },
        },
      }),
      this.prisma.subscription.count(),
    ]);

    return {
      data: rows.map((s) => {
        const isHunter = s.entityType === SubscriptionEntityType.HUNTER;
        const ownerName = isHunter
          ? s.user
            ? `${s.user.firstName} ${s.user.lastName}`.trim()
            : null
          : (s.brand?.name ?? null);
        const ownerEmail = isHunter
          ? (s.user?.email ?? null)
          : (s.brand?.contactEmail ?? null);
        return {
          id: s.id,
          userId: s.userId,
          brandId: s.brandId,
          entityType: s.entityType as SubscriptionEntityType,
          tier: s.tier as SubscriptionTier,
          status: s.status as SubscriptionStatus,
          priceAmount: Number(s.priceAmount),
          currency: s.currency,
          currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
          gracePeriodEndsAt: s.gracePeriodEndsAt?.toISOString() ?? null,
          failedPaymentCount: s.failedPaymentCount,
          ownerName,
          ownerEmail,
          createdAt: s.createdAt.toISOString(),
        };
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
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

  /**
   * Auto-downgrade a PAST_DUE subscription whose grace period has ended.
   *
   * Per payment-gateway.md §12: when grace expires, the subscription drops
   * to the active FREE tier (status=FREE, tier=FREE), NOT to EXPIRED. This
   * distinguishes a user who let their card fail (still an active platform
   * user, just on FREE) from one whose subscription was cancelled and let
   * run out (EXPIRED, which implies they have to re-subscribe from scratch).
   *
   * Non-Negotiable #9: we DO NOT re-price any in-flight transactions. The
   * bounty's `planSnapshotBrand` and submission's `planSnapshotHunter` were
   * captured at creation / approval time and remain untouched. This downgrade
   * only affects FUTURE bounties / approvals / feature gates.
   *
   * No ledger posting — there is no money movement on a downgrade. Audit log
   * only (Hard Rule #3).
   *
   * Returns the updated subscription's before/after tier+status for audit.
   */
  async autoDowngradeToFree(subscriptionId: string): Promise<{
    before: { tier: SubscriptionTier; status: SubscriptionStatus };
    after: { tier: SubscriptionTier; status: SubscriptionStatus };
    userId: string | null;
    brandId: string | null;
  }> {
    const existing = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { tier: true, status: true, userId: true, brandId: true },
    });
    if (!existing) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.FREE,
        cancelAtPeriodEnd: false,
        gracePeriodEndsAt: null,
        failedPaymentCount: 0,
      },
    });

    this.logger.log(
      `Subscription auto-downgraded to FREE: ${subscriptionId} (was ${existing.tier}/${existing.status})`,
    );

    return {
      before: {
        tier: existing.tier as SubscriptionTier,
        status: existing.status as SubscriptionStatus,
      },
      after: {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.FREE,
      },
      userId: existing.userId,
      brandId: existing.brandId,
    };
  }

  async renewSubscription(subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) return;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_CONSTANTS.BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000);
    const tierAtCharge = (sub.tier as SubscriptionTier) ?? SubscriptionTier.PRO;

    const { payment } = await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          failedPaymentCount: 0,
          gracePeriodEndsAt: null,
        },
      });

      // Plan-snapshot onto the SubscriptionPayment row (Non-Negotiable #9).
      const payment = await tx.subscriptionPayment.create({
        data: {
          subscriptionId,
          amount: sub.priceAmount,
          status: 'SUCCEEDED',
          billingPeriodStart: now,
          billingPeriodEnd: periodEnd,
          paidAt: now,
          tierSnapshot: tierAtCharge,
        },
      });

      return { payment };
    });

    try {
      if (payment?.id) {
        await this.postChargeLedger(
          payment.id,
          subscriptionId,
          sub.userId ?? null,
          sub.brandId ?? null,
          sub.priceAmount,
          tierAtCharge,
        );
      }
    } catch (err) {
      this.logger.error(
        `Subscription renewal ${subscriptionId}: ledger posting failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }

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
