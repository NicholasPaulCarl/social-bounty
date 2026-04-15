import {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  SubscriptionStatus,
  SubscriptionTier,
  UserRole,
} from '@social-bounty/shared';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../inbox/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionLifecycleScheduler } from './subscription-lifecycle.scheduler';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Covers payment-gateway.md §12 — when a Subscription has
 * status=PAST_DUE and gracePeriodEndsAt < now(), the scheduler's
 * processGracePeriod() must downgrade the subscription to active FREE
 * (tier=FREE, status=FREE).
 *
 * Non-Negotiable #9 guard: this is NOT exercised here because the
 * downgrade only affects future writes — there's no ledger or snapshot
 * mutation. We only assert tier/status + audit log.
 */
describe('SubscriptionLifecycleScheduler.processGracePeriod — auto-downgrade on grace expiry', () => {
  const originalEnv = process.env.STITCH_SYSTEM_ACTOR_ID;

  beforeAll(() => {
    process.env.STITCH_SYSTEM_ACTOR_ID = 'system-actor-1';
  });

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.STITCH_SYSTEM_ACTOR_ID;
    } else {
      process.env.STITCH_SYSTEM_ACTOR_ID = originalEnv;
    }
  });

  function buildHarness(subs: Array<{
    id: string;
    status: SubscriptionStatus;
    gracePeriodEndsAt: Date | null;
    tier?: SubscriptionTier;
    userId?: string | null;
    brandId?: string | null;
  }>) {
    const store = new Map(
      subs.map((s) => [
        s.id,
        {
          id: s.id,
          status: s.status,
          tier: s.tier ?? SubscriptionTier.PRO,
          gracePeriodEndsAt: s.gracePeriodEndsAt,
          userId: s.userId ?? null,
          brandId: s.brandId ?? null,
          failedPaymentCount: 0,
          cancelAtPeriodEnd: false,
        },
      ]),
    );

    const prisma = {
      subscription: {
        findMany: jest.fn(async ({ where }: any) => {
          const now: Date = where?.gracePeriodEndsAt?.lt ?? new Date();
          return Array.from(store.values()).filter((s) => {
            if (s.status !== where.status) return false;
            if (!s.gracePeriodEndsAt) return false;
            return s.gracePeriodEndsAt < now;
          });
        }),
        findUnique: jest.fn(async ({ where }: any) => store.get(where.id) ?? null),
        update: jest.fn(async ({ where, data }: any) => {
          const existing = store.get(where.id);
          if (!existing) throw new Error(`no sub ${where.id}`);
          const updated = { ...existing, ...data };
          store.set(where.id, updated);
          return updated;
        }),
      },
    } as unknown as PrismaService;

    const subscriptionsService = new SubscriptionsService(prisma);

    const notificationsService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationsService;

    const auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;

    const scheduler = new SubscriptionLifecycleScheduler(
      prisma,
      subscriptionsService,
      notificationsService,
      auditService,
    );

    return { scheduler, prisma, notificationsService, auditService, store };
  }

  it('downgrades PAST_DUE with gracePeriodEndsAt in the past to FREE/FREE', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { scheduler, store, auditService } = buildHarness([
      {
        id: 'sub-expired',
        status: SubscriptionStatus.PAST_DUE,
        gracePeriodEndsAt: yesterday,
        tier: SubscriptionTier.PRO,
        userId: 'user-1',
      },
    ]);

    await scheduler.processGracePeriod();

    const after = store.get('sub-expired')!;
    expect(after.tier).toBe(SubscriptionTier.FREE);
    expect(after.status).toBe(SubscriptionStatus.FREE);
    expect(after.gracePeriodEndsAt).toBeNull();
    expect(after.failedPaymentCount).toBe(0);

    // Audit log row was written.
    expect(auditService.log).toHaveBeenCalledTimes(1);
    const entry = (auditService.log as jest.Mock).mock.calls[0][0];
    expect(entry.action).toBe(AUDIT_ACTIONS.SUBSCRIPTION_AUTO_DOWNGRADE);
    expect(entry.entityType).toBe(ENTITY_TYPES.SUBSCRIPTION);
    expect(entry.entityId).toBe('sub-expired');
    expect(entry.actorRole).toBe(UserRole.SUPER_ADMIN);
    expect(entry.beforeState).toMatchObject({
      tier: SubscriptionTier.PRO,
      status: SubscriptionStatus.PAST_DUE,
    });
    expect(entry.afterState).toMatchObject({
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.FREE,
    });
  });

  it('does NOT downgrade PAST_DUE when gracePeriodEndsAt is in the future', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { scheduler, store, auditService } = buildHarness([
      {
        id: 'sub-in-grace',
        status: SubscriptionStatus.PAST_DUE,
        gracePeriodEndsAt: tomorrow,
        tier: SubscriptionTier.PRO,
        userId: 'user-2',
      },
    ]);

    await scheduler.processGracePeriod();

    const after = store.get('sub-in-grace')!;
    expect(after.tier).toBe(SubscriptionTier.PRO);
    expect(after.status).toBe(SubscriptionStatus.PAST_DUE);
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('does NOT downgrade ACTIVE subscriptions even if gracePeriodEndsAt somehow set in the past', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { scheduler, store, auditService } = buildHarness([
      {
        id: 'sub-active',
        status: SubscriptionStatus.ACTIVE,
        gracePeriodEndsAt: yesterday,
        tier: SubscriptionTier.PRO,
        userId: 'user-3',
      },
    ]);

    await scheduler.processGracePeriod();

    const after = store.get('sub-active')!;
    expect(after.tier).toBe(SubscriptionTier.PRO);
    expect(after.status).toBe(SubscriptionStatus.ACTIVE);
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('does NOT downgrade PAST_DUE with gracePeriodEndsAt=null', async () => {
    const { scheduler, store, auditService } = buildHarness([
      {
        id: 'sub-no-grace',
        status: SubscriptionStatus.PAST_DUE,
        gracePeriodEndsAt: null,
        tier: SubscriptionTier.PRO,
        userId: 'user-4',
      },
    ]);

    await scheduler.processGracePeriod();

    const after = store.get('sub-no-grace')!;
    expect(after.status).toBe(SubscriptionStatus.PAST_DUE);
    expect(auditService.log).not.toHaveBeenCalled();
  });
});
