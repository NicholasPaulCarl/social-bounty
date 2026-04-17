import { LedgerAccount, LedgerEntryType, Prisma, SubmissionStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { SubscriptionTier, UserRole } from '@social-bounty/shared';
import { ApprovalLedgerService } from './approval-ledger.service';
import { FeeCalculatorService } from '../finance/fee-calculator.service';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

describe('ApprovalLedgerService.postApproval', () => {
  const fees = new FeeCalculatorService();
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let subs: Partial<SubscriptionsService>;
  let service: ApprovalLedgerService;
  let post: jest.Mock;

  const bounty = {
    brandId: 'brand_1',
    id: 'bounty_1',
    faceValueCents: 50000n,
    currency: 'ZAR',
  };
  const submission = {
    id: 'sub_1',
    userId: 'hunter_1',
    status: SubmissionStatus.APPROVED,
    bounty,
    user: { id: 'hunter_1' },
  };

  beforeEach(() => {
    prisma = {
      submission: {
        findUnique: jest.fn().mockResolvedValue(submission),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    post = jest.fn().mockResolvedValue({ transactionGroupId: 'grp_appr_1', idempotent: false });
    ledger = { postTransactionGroup: post };
    subs = { getActiveTier: jest.fn().mockResolvedValue(SubscriptionTier.FREE) };
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    service = new ApprovalLedgerService(
      prisma as PrismaService,
      ledger as LedgerService,
      fees,
      subs as SubscriptionsService,
      config,
    );
  });

  function buildService(envGet: (k: string) => unknown): ApprovalLedgerService {
    const config = { get: jest.fn(envGet) } as unknown as ConfigService;
    return new ApprovalLedgerService(
      prisma as PrismaService,
      ledger as LedgerService,
      fees,
      subs as SubscriptionsService,
      config,
    );
  }

  it('posts a balanced earnings split with Free hunter rates', async () => {
    await service.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [input] = post.mock.calls[0];
    expect(input.actionType).toBe('submission_approved');
    expect(input.referenceId).toBe('sub_1');
    const legs = input.legs as Array<{ account: string; type: string; amountCents: bigint }>;
    const totalDebit = legs
      .filter((l) => l.type === LedgerEntryType.DEBIT)
      .reduce((s, l) => s + l.amountCents, 0n);
    const totalCredit = legs
      .filter((l) => l.type === LedgerEntryType.CREDIT)
      .reduce((s, l) => s + l.amountCents, 0n);
    expect(totalDebit).toBe(totalCredit);

    // Free hunter: 20% commission + 3.5% global on R500 → net 38250.
    const netLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_net_payable && l.type === LedgerEntryType.CREDIT,
    );
    expect(netLeg?.amountCents).toBe(38_250n);
  });

  it('sets clearanceReleaseAt to ~72h for Free hunter and ~now for Pro', async () => {
    (subs.getActiveTier as jest.Mock).mockResolvedValueOnce(SubscriptionTier.PRO);

    await service.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });
    const legs: any[] = post.mock.calls[0][0].legs;
    const creditLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_pending && l.type === LedgerEntryType.CREDIT,
    );
    const releaseDelta = creditLeg.clearanceReleaseAt.getTime() - Date.now();
    expect(releaseDelta).toBeLessThan(60 * 1000); // ~now for Pro
  });

  it('honors CLEARANCE_OVERRIDE_HOURS_FREE when set (Free hunter clears in seconds)', async () => {
    // 0.0083h ≈ 30s — used for local live-testing of approve → clear → payout.
    const overrideService = buildService((k) =>
      k === 'CLEARANCE_OVERRIDE_HOURS_FREE' ? '0.0083' : undefined,
    );

    await overrideService.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });

    const legs: any[] = post.mock.calls[0][0].legs;
    const creditLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_net_payable && l.type === LedgerEntryType.CREDIT,
    );
    const deltaMs = creditLeg.clearanceReleaseAt.getTime() - Date.now();
    // 0.0083h = 29.88s. Allow generous bounds for test jitter.
    expect(deltaMs).toBeGreaterThan(0);
    expect(deltaMs).toBeLessThan(60 * 1000);
  });

  it('honors CLEARANCE_OVERRIDE_HOURS_PRO when set (Pro hunter)', async () => {
    (subs.getActiveTier as jest.Mock).mockResolvedValueOnce(SubscriptionTier.PRO);
    const overrideService = buildService((k) =>
      k === 'CLEARANCE_OVERRIDE_HOURS_PRO' ? '1' : undefined,
    );

    await overrideService.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });

    const legs: any[] = post.mock.calls[0][0].legs;
    const creditLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_net_payable && l.type === LedgerEntryType.CREDIT,
    );
    const deltaMs = creditLeg.clearanceReleaseAt.getTime() - Date.now();
    // 1h override, Pro would normally be 0.
    expect(deltaMs).toBeGreaterThan(55 * 60 * 1000);
    expect(deltaMs).toBeLessThan(65 * 60 * 1000);
  });

  it('ignores invalid override values and falls back to canonical CLEARANCE_HOURS.FREE', async () => {
    const overrideService = buildService((k) =>
      k === 'CLEARANCE_OVERRIDE_HOURS_FREE' ? 'garbage' : undefined,
    );

    await overrideService.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });

    const legs: any[] = post.mock.calls[0][0].legs;
    const creditLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_net_payable && l.type === LedgerEntryType.CREDIT,
    );
    const deltaMs = creditLeg.clearanceReleaseAt.getTime() - Date.now();
    // Canonical FREE = 72h.
    expect(deltaMs).toBeGreaterThan(71 * 60 * 60 * 1000);
    expect(deltaMs).toBeLessThan(73 * 60 * 60 * 1000);
  });

  it('throws in live mode when any clearance override is set', async () => {
    const liveOverrideService = buildService((k) => {
      if (k === 'PAYMENTS_PROVIDER') return 'stitch_live';
      if (k === 'CLEARANCE_OVERRIDE_HOURS_FREE') return '0.0083';
      return undefined;
    });

    await expect(
      liveOverrideService.postApproval({
        submissionId: 'sub_1',
        approverId: 'admin_1',
        approverRole: 'BUSINESS_ADMIN' as any,
      }),
    ).rejects.toThrow(/Refusing to apply clearance override in live mode/);
    // Ledger write must NOT happen if the override check trips.
    expect(post).not.toHaveBeenCalled();
  });

  it('allows clearance override in sandbox mode (uses the overridden value)', async () => {
    const sandboxOverrideService = buildService((k) => {
      if (k === 'PAYMENTS_PROVIDER') return 'stitch_sandbox';
      if (k === 'CLEARANCE_OVERRIDE_HOURS_FREE') return '0.0083';
      return undefined;
    });

    await sandboxOverrideService.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });

    const legs: any[] = post.mock.calls[0][0].legs;
    const creditLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_net_payable && l.type === LedgerEntryType.CREDIT,
    );
    const deltaMs = creditLeg.clearanceReleaseAt.getTime() - Date.now();
    expect(deltaMs).toBeGreaterThan(0);
    expect(deltaMs).toBeLessThan(60 * 1000);
  });

  it('uses canonical CLEARANCE_HOURS.FREE in live mode when no override is set', async () => {
    const liveNoOverrideService = buildService((k) => {
      if (k === 'PAYMENTS_PROVIDER') return 'stitch_live';
      return undefined;
    });

    await liveNoOverrideService.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: 'BUSINESS_ADMIN' as any,
    });

    const legs: any[] = post.mock.calls[0][0].legs;
    const creditLeg = legs.find(
      (l) =>
        l.account === LedgerAccount.hunter_net_payable && l.type === LedgerEntryType.CREDIT,
    );
    const deltaMs = creditLeg.clearanceReleaseAt.getTime() - Date.now();
    expect(deltaMs).toBeGreaterThan(71 * 60 * 60 * 1000);
    expect(deltaMs).toBeLessThan(73 * 60 * 60 * 1000);
  });

  it('rejects submissions not in APPROVED state', async () => {
    (prisma.submission.findUnique as jest.Mock).mockResolvedValueOnce({
      ...submission,
      status: SubmissionStatus.SUBMITTED,
    });
    await expect(
      service.postApproval({
        submissionId: 'sub_1',
        approverId: 'a',
        approverRole: 'BUSINESS_ADMIN' as any,
      }),
    ).rejects.toThrow(/must be APPROVED/);
  });
});

/**
 * Non-Negotiable #9 regression test: once a ledger group has been posted for
 * a submission approval, a second `postApproval` call for the same submission
 * must be a no-op at the ledger level even if the hunter's plan has changed
 * since. The fees snapshotted at first call must not be recomputed on replay.
 *
 * Strategy: wire a REAL LedgerService against a mocked PrismaClient whose
 * outer `ledgerTransactionGroup.findUnique` acts as the fast-path idempotency
 * check (ADR 0005 — the pre-check that runs before any tx is opened).
 *   1. On first call, the pre-check returns null, the tx runs, FREE fees are
 *      posted.
 *   2. On second call, the pre-check returns the previously-posted group and
 *      LedgerService short-circuits → no tx is opened, no re-pricing.
 */
describe('ApprovalLedgerService idempotency — plan snapshot (Non-Negotiable #9)', () => {
  const fees = new FeeCalculatorService();

  const bounty = {
    brandId: 'brand_1',
    id: 'bounty_1',
    faceValueCents: 50_000n,
    currency: 'ZAR',
  };
  const submission = {
    id: 'sub_1',
    userId: 'hunter_1',
    status: SubmissionStatus.APPROVED,
    bounty,
    user: { id: 'hunter_1' },
  };

  it('second approval call on the same submission is idempotent and does not re-price with the new plan', async () => {
    // --- First call (FREE plan) ---
    const firstTx = {
      ledgerTransactionGroup: {
        create: jest.fn().mockResolvedValue({ id: 'grp_appr_1' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit_1' }) },
      ledgerEntry: { createMany: jest.fn().mockResolvedValue({ count: 6 }) },
      systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    // --- Second call (simulating hunter has moved to PRO since) ---
    // Outer pre-check returns the previously-posted group → LedgerService
    // short-circuits before ever opening a tx. The secondTx below is a
    // safety net that MUST NOT be reached.
    const secondTx = {
      ledgerTransactionGroup: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
      ledgerEntry: { createMany: jest.fn() },
      systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    let txCall = 0;
    let findUniqueCall = 0;
    const prisma: any = {
      submission: {
        findUnique: jest.fn().mockResolvedValue(submission),
        update: jest.fn().mockResolvedValue({}),
      },
      systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
      ledgerTransactionGroup: {
        // 1st call: pre-check before the FIRST approval → not posted yet
        // 2nd call: pre-check before the SECOND approval → already posted
        findUnique: jest.fn(async () => {
          findUniqueCall += 1;
          return findUniqueCall === 1 ? null : { id: 'grp_appr_1' };
        }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        txCall += 1;
        return fn(txCall === 1 ? firstTx : secondTx);
      }),
    };

    // Real LedgerService — exercises the idempotency path end-to-end.
    const ledger = new LedgerService(prisma as PrismaService);

    // getActiveTier: FREE on the first approval, PRO on the second.
    const getActiveTier = jest
      .fn()
      .mockResolvedValueOnce(SubscriptionTier.FREE)
      .mockResolvedValueOnce(SubscriptionTier.PRO);
    const subs = { getActiveTier } as unknown as SubscriptionsService;
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;

    const service = new ApprovalLedgerService(
      prisma as PrismaService,
      ledger,
      fees,
      subs,
      config,
    );

    // ---- First approval: writes FREE-rate ledger entries ----
    await service.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_1',
      approverRole: UserRole.BUSINESS_ADMIN,
    });

    expect(firstTx.ledgerTransactionGroup.create).toHaveBeenCalledTimes(1);
    expect(firstTx.ledgerEntry.createMany).toHaveBeenCalledTimes(1);

    // Verify the FREE-rate split was posted (20% commission + 3.5% global on R500 → net 38250c).
    const firstEntries = firstTx.ledgerEntry.createMany.mock.calls[0][0].data as Array<{
      account: LedgerAccount;
      type: LedgerEntryType;
      amount: bigint;
    }>;
    const netLeg = firstEntries.find(
      (e) =>
        e.account === LedgerAccount.hunter_net_payable && e.type === LedgerEntryType.CREDIT,
    );
    expect(netLeg?.amount).toBe(38_250n);
    const commissionLeg = firstEntries.find(
      (e) => e.account === LedgerAccount.commission_revenue,
    );
    // FREE commission = 20% of 50_000 = 10_000c.
    expect(commissionLeg?.amount).toBe(10_000n);

    // ---- Second approval: idempotent — no new entries, no re-pricing ----
    await service.postApproval({
      submissionId: 'sub_1',
      approverId: 'admin_2',
      approverRole: UserRole.BUSINESS_ADMIN,
    });

    // Hit the idempotency path: the outer pre-check found the group, so no
    // second tx was opened at all.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.ledgerTransactionGroup.findUnique).toHaveBeenCalledTimes(2);
    expect(secondTx.ledgerTransactionGroup.create).not.toHaveBeenCalled();
    expect(secondTx.ledgerTransactionGroup.findUnique).not.toHaveBeenCalled();

    // Critical: the second call must NOT have written any new ledger entries,
    // audit logs, or group updates — nothing is repriced with the PRO plan.
    expect(secondTx.ledgerEntry.createMany).not.toHaveBeenCalled();
    expect(secondTx.auditLog.create).not.toHaveBeenCalled();
    expect(secondTx.ledgerTransactionGroup.update).not.toHaveBeenCalled();
  });
});
