/**
 * Subscription cancel — focused coverage.
 *
 * Covers:
 *  - Owner cancel (default / scheduled): state flips, AuditLog written,
 *    cancelAtPeriodEnd=true, planSnapshotBrand/Hunter UNTOUCHED (enforced
 *    by never calling any bounty / submission update).
 *  - Owner cancel (immediate): tier=FREE, status=CANCELLED now,
 *    cancelAtPeriodEnd=false.
 *  - Idempotency: second cancel on an already-cancelled subscription is a
 *    no-op — the service does NOT call prisma.subscription.update a second
 *    time. An AuditLog is still written (we always log who tried what, even
 *    duplicates — documented behaviour).
 *  - Non-owner PARTICIPANT attempting cancelById → ForbiddenException.
 *  - SUPER_ADMIN cancelById → succeeds.
 *
 * The service accepts optional AuditService injection; here we inject a
 * mock so we can assert log shape. The prisma client is fully mocked.
 */
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SubscriptionTier,
  SubscriptionEntityType,
  SubscriptionStatus,
  UserRole,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService.cancel', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let audit: { log: jest.Mock };

  // Factory so each test starts from a fresh "active subscription" row.
  const makeActiveSub = (overrides: Record<string, unknown> = {}) => ({
    id: 'sub-1',
    userId: 'user-1',
    brandId: null,
    entityType: SubscriptionEntityType.HUNTER,
    tier: SubscriptionTier.PRO,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      subscription: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      // Tests assert we DON'T touch bounty / submission plan snapshots.
      bounty: { update: jest.fn(), updateMany: jest.fn() },
      submission: { update: jest.fn(), updateMany: jest.fn() },
    };
    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
  });

  // ── Owner cancel (scheduled, default) ─────────────────────────────

  it('owner cancel (default) — sets CANCELLED + cancelAtPeriodEnd=true, writes AuditLog, leaves plan snapshots untouched', async () => {
    const active = makeActiveSub();

    // First findFirst (findActiveSubscription) → active sub.
    // Second findFirst (getSubscription at return) → the updated sub.
    prisma.subscription.findFirst
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce({
        ...active,
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      });

    const result = await service.cancel('user-1', UserRole.PARTICIPANT);

    // prisma update called with scheduled-cancel fields only (no tier mutation).
    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    const updateArg = prisma.subscription.update.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: active.id });
    expect(updateArg.data.status).toBe(SubscriptionStatus.CANCELLED);
    expect(updateArg.data.cancelAtPeriodEnd).toBe(true);
    expect(updateArg.data.cancelledAt).toBeInstanceOf(Date);
    expect(updateArg.data.tier).toBeUndefined(); // scheduled: don't touch tier

    // AuditLog shape (Hard Rule #3).
    expect(audit.log).toHaveBeenCalledTimes(1);
    const logArg = audit.log.mock.calls[0][0];
    expect(logArg.action).toBe(AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED);
    expect(logArg.entityType).toBe(ENTITY_TYPES.SUBSCRIPTION);
    expect(logArg.entityId).toBe(active.id);
    expect(logArg.beforeState).toEqual({
      tier: SubscriptionTier.PRO,
      status: SubscriptionStatus.ACTIVE,
    });
    expect(logArg.afterState.cancelAtPeriodEnd).toBe(true);
    expect(logArg.afterState.status).toBe(SubscriptionStatus.CANCELLED);
    expect(logArg.actorId).toBe('user-1');
    expect(logArg.actorRole).toBe(UserRole.PARTICIPANT);

    // Non-Negotiable #9: no bounty or submission plan-snapshot writes.
    expect(prisma.bounty.update).not.toHaveBeenCalled();
    expect(prisma.bounty.updateMany).not.toHaveBeenCalled();
    expect(prisma.submission.update).not.toHaveBeenCalled();
    expect(prisma.submission.updateMany).not.toHaveBeenCalled();

    // Returned shape comes from getSubscription — tier should still be PRO
    // because currentPeriodEnd is in the future.
    expect(result.cancelAtPeriodEnd).toBe(true);
  });

  it('owner cancel (default) — keeps tier=PRO with future currentPeriodEnd', async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    const active = makeActiveSub({ currentPeriodEnd: future });

    prisma.subscription.findFirst
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce({
        ...active,
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: true,
      });

    const result = await service.cancel('user-1', UserRole.PARTICIPANT);

    // Schedule cancel: tier is unchanged, and currentPeriodEnd still in future.
    expect(result.tier).toBe(SubscriptionTier.PRO);
    expect(new Date(result.currentPeriodEnd!).getTime()).toBe(future.getTime());
  });

  // ── Owner cancel (immediate) ──────────────────────────────────────

  it('immediate cancel — flips tier=FREE, status=CANCELLED, cancelAtPeriodEnd=false', async () => {
    const active = makeActiveSub();
    prisma.subscription.findFirst
      .mockResolvedValueOnce(active)
      .mockResolvedValueOnce({
        ...active,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: false,
      });

    await service.cancel('user-1', UserRole.PARTICIPANT, undefined, {
      immediate: true,
    });

    const updateArg = prisma.subscription.update.mock.calls[0][0];
    expect(updateArg.data.tier).toBe(SubscriptionTier.FREE);
    expect(updateArg.data.status).toBe(SubscriptionStatus.CANCELLED);
    expect(updateArg.data.cancelAtPeriodEnd).toBe(false);

    const logArg = audit.log.mock.calls[0][0];
    expect(logArg.afterState.tier).toBe(SubscriptionTier.FREE);
    expect(logArg.afterState.cancelAtPeriodEnd).toBe(false);

    // Still no plan-snapshot writes.
    expect(prisma.bounty.update).not.toHaveBeenCalled();
    expect(prisma.submission.update).not.toHaveBeenCalled();
  });

  // ── Idempotency ───────────────────────────────────────────────────

  it('second cancel on an already-cancelled subscription is a no-op (idempotent)', async () => {
    const alreadyCancelled = makeActiveSub({
      status: SubscriptionStatus.CANCELLED,
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
    });

    prisma.subscription.findFirst
      .mockResolvedValueOnce(alreadyCancelled)
      .mockResolvedValueOnce(alreadyCancelled);

    const result = await service.cancel('user-1', UserRole.PARTICIPANT);

    // No duplicate state mutation.
    expect(prisma.subscription.update).not.toHaveBeenCalled();

    // Documented behaviour: we DO still write an AuditLog for the duplicate
    // call (so ops can see retry storms / client loops), flagged duplicate=true.
    expect(audit.log).toHaveBeenCalledTimes(1);
    expect(audit.log.mock.calls[0][0].afterState.duplicate).toBe(true);

    expect(result.cancelAtPeriodEnd).toBe(true);
  });

  // ── RBAC: non-owner PARTICIPANT cannot cancel someone else's sub ──

  it('non-owner PARTICIPANT cannot cancel another subscription via cancelById', async () => {
    prisma.subscription.findUnique.mockResolvedValue(makeActiveSub());

    await expect(
      service.cancelById('sub-1', {
        actorId: 'rando-1',
        actorRole: UserRole.PARTICIPANT,
      }),
    ).rejects.toThrow(ForbiddenException);

    // Guard fires before any DB mutation.
    expect(prisma.subscription.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  // ── SUPER_ADMIN cancels anyone's subscription ─────────────────────

  it('SUPER_ADMIN cancelById — succeeds, AuditLog actor = admin id', async () => {
    const active = makeActiveSub({ userId: 'target-user' });
    prisma.subscription.findUnique.mockResolvedValue(active);

    // getSubscription call after cancel.
    prisma.subscription.findFirst.mockResolvedValueOnce({
      ...active,
      status: SubscriptionStatus.CANCELLED,
      cancelAtPeriodEnd: true,
    });

    await service.cancelById('sub-1', {
      actorId: 'admin-1',
      actorRole: UserRole.SUPER_ADMIN,
    });

    expect(prisma.subscription.update).toHaveBeenCalledTimes(1);
    expect(audit.log).toHaveBeenCalledTimes(1);
    const logArg = audit.log.mock.calls[0][0];
    expect(logArg.actorId).toBe('admin-1');
    expect(logArg.actorRole).toBe(UserRole.SUPER_ADMIN);
    expect(logArg.entityId).toBe('sub-1');
  });

  it('SUPER_ADMIN cancelById — immediate flag drops tier to FREE', async () => {
    prisma.subscription.findUnique.mockResolvedValue(makeActiveSub());
    prisma.subscription.findFirst.mockResolvedValueOnce(
      makeActiveSub({
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.CANCELLED,
        cancelAtPeriodEnd: false,
      }),
    );

    await service.cancelById(
      'sub-1',
      { actorId: 'admin-1', actorRole: UserRole.SUPER_ADMIN },
      { immediate: true },
    );

    const updateArg = prisma.subscription.update.mock.calls[0][0];
    expect(updateArg.data.tier).toBe(SubscriptionTier.FREE);
    expect(updateArg.data.cancelAtPeriodEnd).toBe(false);
  });

  it('cancelById on unknown subscription throws NotFound', async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);

    await expect(
      service.cancelById('missing', {
        actorId: 'admin-1',
        actorRole: UserRole.SUPER_ADMIN,
      }),
    ).rejects.toThrow(/not found/i);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
