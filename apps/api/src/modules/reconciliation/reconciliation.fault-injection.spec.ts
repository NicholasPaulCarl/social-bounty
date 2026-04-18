/**
 * ReconciliationService fault-injection tests.
 *
 * These tests prove ReconciliationService catches the deliberate ledger bugs
 * the platform must defend against: unbalanced transaction groups, duplicate
 * (referenceId, actionType) pairs, and reserve drift on paid bounties.
 *
 * The pattern here is different from reconciliation.service.spec.ts — rather
 * than stubbing out the internal check methods, we mock at the Prisma method
 * boundary ($queryRaw) so the real check methods execute against malformed
 * query results. This is the closest we can get to "the DB returned a fault"
 * without standing up Postgres.
 *
 * As of batch 11B, checkReserveVsBounty issues a single $queryRaw GROUP BY
 * (collapsing the prior 2×B aggregate round-trips). The ledgerEntry.aggregate
 * + bounty.findMany mocks remain in `buildService` as harmless defaults — the
 * reserve check no longer hits either Prisma method.
 *
 * Mandatory invariants exercised:
 *   - Critical findings trip the Kill Switch via LedgerService.setKillSwitch
 *   - KbService.recordRecurrence is called with stable (category, system,
 *     errorCode) across runs so KB row collapsing works
 *   - Non-critical findings (reserve-drift) never trip the Kill Switch
 *   - Every run writes a JobRun row (create + update lifecycle)
 */
import { JobRunStatus } from '@prisma/client';
import { ReconciliationService } from './reconciliation.service';
import { KbService } from '../kb/kb.service';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

type PrismaMock = {
  jobRun: { create: jest.Mock; update: jest.Mock };
  $queryRaw: jest.Mock;
  bounty: { findMany: jest.Mock };
  ledgerEntry: { aggregate: jest.Mock };
  auditLog: { create: jest.Mock };
  recurringIssue?: unknown;
};

type LedgerMock = {
  isKillSwitchActive: jest.Mock;
  setKillSwitch: jest.Mock;
};

type KbMock = {
  recordRecurrence: jest.Mock;
};

/**
 * Routes $queryRaw calls to the appropriate handler by inspecting the raw SQL
 * for a discriminator marker. Prisma template-tag calls pass the strings array
 * as the first arg; we concatenate it to one searchable blob.
 *
 * Order matters — the more specific marker MUST come first because several
 * checks share the same base table:
 *
 *   reserve         → `brand_reserve`
 *   missing-legs    → `leg_count`        (only in checkMissingLegs)
 *   status          → `paymentStatus` or `SubmissionStatus`
 *   wallet drift    → `hunter_available` and `wallets`
 *   payments gap    → `stitch_payment_links` (Stitch inbound, unchanged)
 *   payouts gap     → `stitch_payouts` filtered by `PayoutRail` literal
 *                     (`STITCH` vs `TRADESAFE` branch — R32)
 *   balance         → `ledger_entries`   (catch-all for the ledger-entries scan)
 *   duplicate       → `ledger_transaction_groups`
 */
function makeQueryRawRouter(handlers: {
  balance?: () => unknown[];
  duplicate?: () => unknown[];
  reserve?: () => unknown[];
  missingLegs?: () => unknown[];
  statusBountyMissing?: () => unknown[];
  statusBountyOrphan?: () => unknown[];
  statusSubmissionMissing?: () => unknown[];
  statusSubmissionOrphan?: () => unknown[];
  walletDrift?: () => unknown[];
  stitchPaymentGap?: () => unknown[];
  stitchPayoutGap?: () => unknown[];
  tradesafePayoutGap?: () => unknown[];
}): jest.Mock {
  return jest.fn((strings: TemplateStringsArray | string[] | string, ..._vals: unknown[]) => {
    const sql = Array.isArray(strings) ? strings.join(' ') : String(strings);
    // Most specific markers first. Each query has multiple table references;
    // we discriminate by the OUTERMOST FROM clause in the query text.
    //
    // Status-missing checks (bounty + submission) start with the business
    // table; they MUST be matched before anything that mentions Stitch,
    // because their NOT EXISTS subquery includes `FROM stitch_payment_links`.
    if (sql.includes('FROM bounties b') && sql.includes('NOT EXISTS')) {
      return Promise.resolve(handlers.statusBountyMissing ? handlers.statusBountyMissing() : []);
    }
    if (sql.includes('FROM submissions s') && sql.includes('NOT EXISTS')) {
      return Promise.resolve(
        handlers.statusSubmissionMissing ? handlers.statusSubmissionMissing() : [],
      );
    }
    // Status-orphan checks start FROM ledger_transaction_groups with a LEFT
    // JOIN to the business table.
    if (
      sql.includes('FROM ledger_transaction_groups g') &&
      sql.includes('LEFT JOIN stitch_payment_links')
    ) {
      return Promise.resolve(handlers.statusBountyOrphan ? handlers.statusBountyOrphan() : []);
    }
    if (
      sql.includes('FROM ledger_transaction_groups g') &&
      sql.includes('LEFT JOIN submissions')
    ) {
      return Promise.resolve(
        handlers.statusSubmissionOrphan ? handlers.statusSubmissionOrphan() : [],
      );
    }
    // Payment-link (Stitch inbound) gap check.
    if (sql.includes('FROM stitch_payment_links spl')) {
      return Promise.resolve(handlers.stitchPaymentGap ? handlers.stitchPaymentGap() : []);
    }
    // Payout gap checks: both arms are `FROM stitch_payouts sp` but filter on
    // different PayoutRail values. Distinguish by the literal in the WHERE
    // clause so tests can target each rail independently (R32).
    if (sql.includes('FROM stitch_payouts sp') && sql.includes(`'TRADESAFE'`)) {
      return Promise.resolve(handlers.tradesafePayoutGap ? handlers.tradesafePayoutGap() : []);
    }
    if (sql.includes('FROM stitch_payouts sp') && sql.includes(`'STITCH'`)) {
      return Promise.resolve(handlers.stitchPayoutGap ? handlers.stitchPayoutGap() : []);
    }
    if (sql.includes('brand_reserve')) {
      return Promise.resolve(handlers.reserve ? handlers.reserve() : []);
    }
    if (sql.includes('leg_count')) {
      return Promise.resolve(handlers.missingLegs ? handlers.missingLegs() : []);
    }
    if (sql.includes('hunter_available')) {
      return Promise.resolve(handlers.walletDrift ? handlers.walletDrift() : []);
    }
    if (sql.includes('ledger_entries')) {
      return Promise.resolve(handlers.balance ? handlers.balance() : []);
    }
    if (sql.includes('ledger_transaction_groups')) {
      return Promise.resolve(handlers.duplicate ? handlers.duplicate() : []);
    }
    return Promise.resolve([]);
  });
}

function buildService(overrides: {
  queryRaw?: jest.Mock;
  bountyFindMany?: jest.Mock;
  aggregate?: jest.Mock;
  isKillSwitchActive?: boolean;
}): {
  service: ReconciliationService;
  prisma: PrismaMock;
  ledger: LedgerMock;
  kb: KbMock;
} {
  const prisma: PrismaMock = {
    jobRun: {
      create: jest.fn().mockResolvedValue({ id: 'run_fi_1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    $queryRaw: overrides.queryRaw ?? makeQueryRawRouter({}),
    bounty: {
      findMany: overrides.bountyFindMany ?? jest.fn().mockResolvedValue([]),
    },
    ledgerEntry: {
      aggregate: overrides.aggregate ?? jest.fn().mockResolvedValue({ _sum: { amount: 0n } }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
  const ledger: LedgerMock = {
    isKillSwitchActive: jest.fn().mockResolvedValue(overrides.isKillSwitchActive ?? false),
    setKillSwitch: jest.fn().mockResolvedValue(undefined),
  };
  const kb: KbMock = {
    recordRecurrence: jest.fn().mockResolvedValue({ isNew: true, issue: {} }),
  };
  const service = new ReconciliationService(
    prisma as unknown as PrismaService,
    ledger as unknown as LedgerService,
    kb as unknown as KbService,
  );
  return { service, prisma, ledger, kb };
}

describe('ReconciliationService fault injection', () => {
  describe('scenario 1: imbalanced ledger group', () => {
    it('emits a critical ledger-imbalance finding, records KB recurrence, and trips the Kill Switch', async () => {
      const queryRaw = makeQueryRawRouter({
        balance: () => [
          { transactionGroupId: 'grp_bad', debit_sum: 100n, credit_sum: 99n },
        ],
        duplicate: () => [],
      });
      const { service, ledger, kb } = buildService({ queryRaw });

      const report = await service.run();

      // exactly one critical imbalance finding
      expect(report.findings).toHaveLength(1);
      expect(report.findings[0].category).toBe('ledger-imbalance');
      expect(report.findings[0].severity).toBe('critical');
      expect(report.findings[0].detail).toEqual(
        expect.objectContaining({
          transactionGroupId: 'grp_bad',
          debitCents: '100',
          creditCents: '99',
        }),
      );

      // KB recurrence recorded once, with the bad group id in the signature input
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
      const kbArg = kb.recordRecurrence.mock.calls[0][0];
      expect(kbArg.system).toBe('ledger');
      expect(kbArg.category).toBe('ledger-imbalance');
      expect(kbArg.errorCode).toContain('grp_bad');
      expect(kbArg.severity).toBe('critical');

      // Kill Switch flipped ON (was OFF → goes to true)
      expect(ledger.setKillSwitch).toHaveBeenCalledTimes(1);
      expect(ledger.setKillSwitch).toHaveBeenCalledWith(true, expect.any(String));
      expect(report.killSwitchActivated).toBe(true);
    });
  });

  describe('scenario 2: duplicate (referenceId, actionType)', () => {
    it('emits a critical duplicate-group finding', async () => {
      const queryRaw = makeQueryRawRouter({
        balance: () => [],
        duplicate: () => [
          { referenceId: 'r_dup', actionType: 'stitch_payment_settled', n: 2n },
        ],
      });
      const { service, kb } = buildService({ queryRaw });

      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [finding] = report.findings;
      expect(finding.category).toBe('duplicate-group');
      expect(finding.severity).toBe('critical');
      expect(finding.detail).toEqual(
        expect.objectContaining({
          referenceId: 'r_dup',
          actionType: 'stitch_payment_settled',
          count: 2,
        }),
      );

      // KB received the duplicate signature input
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
      const kbArg = kb.recordRecurrence.mock.calls[0][0];
      expect(kbArg.category).toBe('duplicate-group');
      expect(kbArg.errorCode).toContain('r_dup');
      expect(kbArg.errorCode).toContain('stitch_payment_settled');
    });
  });

  describe('scenario 3: reserve drift on paid bounty', () => {
    it('emits a warning finding and does NOT trip the Kill Switch', async () => {
      // checkReserveVsBounty now executes a single $queryRaw GROUP BY (see
      // reconciliation.service.ts) that returns one row per drifted bounty
      // already filtered by the HAVING clause. We mock that single row.
      const queryRaw = makeQueryRawRouter({
        reserve: () => [
          { id: 'b_drift', faceValueCents: 50000n, reserve_balance: 30000n },
        ],
      });

      const { service, ledger, kb } = buildService({ queryRaw });

      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [finding] = report.findings;
      expect(finding.category).toBe('reserve-drift');
      expect(finding.severity).toBe('warning');
      expect(finding.detail).toEqual(
        expect.objectContaining({
          bountyId: 'b_drift',
          faceValueCents: '50000',
          reserveBalanceCents: '30000',
        }),
      );

      // No critical → Kill Switch must NOT be flipped
      expect(ledger.setKillSwitch).not.toHaveBeenCalled();
      expect(report.killSwitchActivated).toBe(false);

      // KB still records the warning
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
      expect(kb.recordRecurrence.mock.calls[0][0].severity).toBe('warning');
    });
  });

  describe('scenario 4: signature stability across runs', () => {
    it('produces identical (category, system, errorCode) inputs for KB on repeat faults', async () => {
      // Same fault injected for both runs.
      const queryRaw = makeQueryRawRouter({
        balance: () => [
          { transactionGroupId: 'grp_bad', debit_sum: 100n, credit_sum: 99n },
        ],
        duplicate: () => [],
      });
      const { service, ledger, kb } = buildService({ queryRaw });
      // After the first run flips the switch, simulate it already being ON for
      // the second run so we exercise the "already active" short-circuit and
      // avoid double-activation noise in the assertion surface.
      ledger.isKillSwitchActive
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await service.run();
      await service.run();

      expect(kb.recordRecurrence).toHaveBeenCalledTimes(2);
      const [first, second] = kb.recordRecurrence.mock.calls.map((c) => c[0]);
      // KbService itself hashes (category, system, errorCode) → signature, so
      // ReconciliationService only has to produce the same triple each run.
      expect(first.category).toBe(second.category);
      expect(first.system).toBe(second.system);
      expect(first.errorCode).toBe(second.errorCode);
    });
  });

  describe('scenario 4b: post-mitigation reserve drift (batch 11B regression guard)', () => {
    // Locks in the post-batch-11B query pattern: a single $queryRaw GROUP BY
    // returns one pre-filtered row per drifted bounty. This test simulates a
    // compensating-entry that was posted with one leg missing (e.g. the
    // hunter_payable credit landed but the matching brand_reserve debit was
    // dropped in flight) — the row reaches reconciliation with a non-zero,
    // non-faceValue reserve_balance and must surface a `reserve-drift` finding.
    //
    // The point of this test is to prove the new collapsed query still detects
    // manually-injected drift exactly as the prior O(B) loop did.
    it('detects a compensating-entry-with-missing-leg as reserve-drift', async () => {
      // Drift scenario: faceValue = 100_000, but the brand_reserve account is
      // sitting at +25_000 (a 75_000 debit leg was lost). Neither value equals
      // 0 nor faceValue, so the HAVING clause includes this row.
      const queryRaw = makeQueryRawRouter({
        reserve: () => [
          {
            id: 'b_missing_leg',
            faceValueCents: 100000n,
            reserve_balance: 25000n,
          },
        ],
      });

      const { service, ledger, kb } = buildService({ queryRaw });

      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [finding] = report.findings;
      expect(finding.category).toBe('reserve-drift');
      expect(finding.severity).toBe('warning');
      expect(finding.errorCode).toBe('reserve:b_missing_leg');
      expect(finding.detail).toEqual(
        expect.objectContaining({
          bountyId: 'b_missing_leg',
          faceValueCents: '100000',
          reserveBalanceCents: '25000',
        }),
      );

      // warning-only — no kill switch
      expect(ledger.setKillSwitch).not.toHaveBeenCalled();
      expect(report.killSwitchActivated).toBe(false);

      // KB still records the warning with the bounty-id-stable errorCode so
      // repeats bump the same RecurringIssue row.
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
      const kbArg = kb.recordRecurrence.mock.calls[0][0];
      expect(kbArg.errorCode).toBe('reserve:b_missing_leg');
      expect(kbArg.severity).toBe('warning');
    });
  });

  // ─── Checks 4–7 (batch 11A) ────────────────────────────────────────────────
  describe('scenario 6: missing legs (check 4)', () => {
    it('emits a critical missing-legs finding and trips the Kill Switch', async () => {
      const queryRaw = makeQueryRawRouter({
        missingLegs: () => [
          {
            transactionGroupId: 'grp_orphan',
            leg_count: 1n,
            actionType: 'submission_approved',
            referenceId: 'sub_x',
          },
        ],
      });
      const { service, ledger, kb } = buildService({ queryRaw });

      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [f] = report.findings;
      expect(f.category).toBe('missing-legs');
      expect(f.severity).toBe('critical');
      expect(f.errorCode).toBe('missing-legs:grp_orphan');
      expect(f.detail).toEqual(
        expect.objectContaining({
          transactionGroupId: 'grp_orphan',
          legCount: 1,
          actionType: 'submission_approved',
        }),
      );
      expect(ledger.setKillSwitch).toHaveBeenCalledTimes(1);
      expect(report.killSwitchActivated).toBe(true);
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
      expect(kb.recordRecurrence.mock.calls[0][0].system).toBe('ledger');
    });

    it('clean state: no missing-legs row → zero findings, no kill switch', async () => {
      const { service, ledger, kb } = buildService({
        queryRaw: makeQueryRawRouter({}),
      });
      const report = await service.run();
      expect(report.findings).toHaveLength(0);
      expect(ledger.setKillSwitch).not.toHaveBeenCalled();
      expect(kb.recordRecurrence).not.toHaveBeenCalled();
    });
  });

  describe('scenario 7: status consistency (check 5)', () => {
    it('emits a warning per direction (PAID without group, group without PAID, etc.)', async () => {
      const queryRaw = makeQueryRawRouter({
        statusBountyMissing: () => [{ id: 'b_paid_no_grp' }],
        statusBountyOrphan: () => [
          { groupId: 'g_orphan', referenceId: 'pay_xyz', bountyId: null },
        ],
        statusSubmissionMissing: () => [{ id: 'sub_appr_no_grp' }],
        statusSubmissionOrphan: () => [
          { groupId: 'g_sub_orphan', submissionId: 'sub_old' },
        ],
      });
      const { service, ledger, kb } = buildService({ queryRaw });
      const report = await service.run();

      // Four warnings — one per direction.
      expect(report.findings).toHaveLength(4);
      const cats = report.findings.map((f) => f.category);
      expect(cats.every((c) => c === 'status-mismatch')).toBe(true);
      const sevs = report.findings.map((f) => f.severity);
      expect(sevs.every((s) => s === 'warning')).toBe(true);

      // Warnings only → kill switch must NOT trip
      expect(ledger.setKillSwitch).not.toHaveBeenCalled();
      expect(report.killSwitchActivated).toBe(false);

      // Each finding is recorded in KB
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(4);
    });

    it('clean state: zero findings', async () => {
      const { service } = buildService({ queryRaw: makeQueryRawRouter({}) });
      const report = await service.run();
      expect(report.findings).toHaveLength(0);
    });
  });

  describe('scenario 8: wallet projection drift (check 6)', () => {
    it('emits a warning when cached Wallet.balance differs from ledger projection', async () => {
      const queryRaw = makeQueryRawRouter({
        walletDrift: () => [
          {
            userId: 'u_drift',
            cached_balance_cents: 12000n,
            projected_balance_cents: 10000n,
            wallet_id: 'wallet_1',
          },
        ],
      });
      const { service, ledger, kb } = buildService({ queryRaw });
      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [f] = report.findings;
      expect(f.category).toBe('wallet-projection-drift');
      expect(f.severity).toBe('warning');
      expect(f.errorCode).toBe('wallet-drift:u_drift');
      expect(f.detail).toEqual(
        expect.objectContaining({
          userId: 'u_drift',
          cachedBalanceCents: '12000',
          projectedBalanceCents: '10000',
          driftCents: '2000',
        }),
      );
      expect(ledger.setKillSwitch).not.toHaveBeenCalled();
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
    });

    it('skips rows with null wallet_id (no cached Wallet to drift from per ADR 0002)', async () => {
      const queryRaw = makeQueryRawRouter({
        walletDrift: () => [
          {
            userId: 'u_no_cache',
            cached_balance_cents: null,
            projected_balance_cents: 5000n,
            wallet_id: null,
          },
        ],
      });
      const { service } = buildService({ queryRaw });
      const report = await service.run();
      expect(report.findings).toHaveLength(0);
    });
  });

  describe('scenario 9: payouts vs ledger gap (check 7 — R32)', () => {
    it('emits a critical finding when a SETTLED StitchPaymentLink has no ledger group', async () => {
      const queryRaw = makeQueryRawRouter({
        stitchPaymentGap: () => [
          {
            id: 'spl_1',
            stitchPaymentId: 'pay_external_1',
            bountyId: 'b_1',
          },
        ],
      });
      const { service, ledger, kb } = buildService({ queryRaw });
      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [f] = report.findings;
      expect(f.category).toBe('stitch-ledger-gap');
      expect(f.severity).toBe('critical');
      expect(f.errorCode).toBe('stitch-ledger-gap:pay_external_1');
      expect(f.detail).toEqual(
        expect.objectContaining({
          stitchPaymentLinkId: 'spl_1',
          stitchPaymentId: 'pay_external_1',
          bountyId: 'b_1',
          kind: 'payment',
          provider: 'stitch',
        }),
      );
      expect(ledger.setKillSwitch).toHaveBeenCalledTimes(1);
      expect(report.killSwitchActivated).toBe(true);
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
    });

    it('emits a critical finding when a SETTLED Stitch-rail StitchPayout has no stitch_payout_settled group', async () => {
      const queryRaw = makeQueryRawRouter({
        stitchPayoutGap: () => [
          {
            id: 'sp_1',
            stitchPayoutId: 'payout_external_99',
            userId: 'u_1',
          },
        ],
      });
      const { service, ledger } = buildService({ queryRaw });
      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [f] = report.findings;
      expect(f.category).toBe('stitch-ledger-gap');
      expect(f.severity).toBe('critical');
      expect(f.detail).toEqual(
        expect.objectContaining({ kind: 'payout', provider: 'stitch' }),
      );
      expect(ledger.setKillSwitch).toHaveBeenCalledTimes(1);
    });

    it('emits NO finding when a SETTLED TradeSafe-rail StitchPayout has a matching tradesafe_payout_settled group', async () => {
      // A TradeSafe payout row exists and is SETTLED, but the reconciliation
      // query's NOT EXISTS clause filters it out because the corresponding
      // ledger group does exist. The DB-level anti-join returns an empty
      // result set; we model that by leaving `tradesafePayoutGap` unset.
      const queryRaw = makeQueryRawRouter({});
      const { service, ledger, kb } = buildService({ queryRaw });
      const report = await service.run();

      expect(report.findings).toHaveLength(0);
      expect(ledger.setKillSwitch).not.toHaveBeenCalled();
      expect(kb.recordRecurrence).not.toHaveBeenCalled();
    });

    it('emits a critical finding when a SETTLED TradeSafe-rail StitchPayout has no tradesafe_payout_settled group', async () => {
      const queryRaw = makeQueryRawRouter({
        tradesafePayoutGap: () => [
          {
            id: 'sp_ts_1',
            stitchPayoutId: 'payout_ts_external_42',
            userId: 'u_ts_1',
          },
        ],
      });
      const { service, ledger, kb } = buildService({ queryRaw });
      const report = await service.run();

      expect(report.findings).toHaveLength(1);
      const [f] = report.findings;
      expect(f.category).toBe('tradesafe-ledger-gap');
      expect(f.severity).toBe('critical');
      expect(f.errorCode).toBe('tradesafe-ledger-gap:payout_ts_external_42');
      expect(f.title).toContain('TradeSafe payout');
      expect(f.title).toContain('tradesafe_payout_settled');
      expect(f.detail).toEqual(
        expect.objectContaining({
          stitchPayoutDbId: 'sp_ts_1',
          stitchPayoutId: 'payout_ts_external_42',
          userId: 'u_ts_1',
          kind: 'payout',
          provider: 'tradesafe',
        }),
      );
      expect(ledger.setKillSwitch).toHaveBeenCalledTimes(1);
      expect(report.killSwitchActivated).toBe(true);
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
      // KB metadata carries the provider tag so dashboards can attribute
      // per-rail drift without re-parsing the errorCode.
      expect(kb.recordRecurrence.mock.calls[0][0].metadata).toEqual(
        expect.objectContaining({ system: 'ledger' }),
      );
    });

    it('mixed drift: one Stitch + one TradeSafe settled payout, each missing its own ledger group → two critical findings', async () => {
      const queryRaw = makeQueryRawRouter({
        stitchPayoutGap: () => [
          {
            id: 'sp_stitch_1',
            stitchPayoutId: 'payout_stitch_7',
            userId: 'u_a',
          },
        ],
        tradesafePayoutGap: () => [
          {
            id: 'sp_ts_1',
            stitchPayoutId: 'payout_ts_9',
            userId: 'u_b',
          },
        ],
      });
      const { service, ledger, kb } = buildService({ queryRaw });
      const report = await service.run();

      expect(report.findings).toHaveLength(2);
      const byProvider = new Map(
        report.findings.map((f) => [f.detail.provider, f]),
      );
      expect(byProvider.get('stitch')?.category).toBe('stitch-ledger-gap');
      expect(byProvider.get('stitch')?.detail).toEqual(
        expect.objectContaining({ stitchPayoutId: 'payout_stitch_7' }),
      );
      expect(byProvider.get('tradesafe')?.category).toBe(
        'tradesafe-ledger-gap',
      );
      expect(byProvider.get('tradesafe')?.detail).toEqual(
        expect.objectContaining({ stitchPayoutId: 'payout_ts_9' }),
      );
      // Kill switch trips exactly once (both criticals in one run).
      expect(ledger.setKillSwitch).toHaveBeenCalledTimes(1);
      expect(report.killSwitchActivated).toBe(true);
      // Each finding routed to KB with its own signature — categories differ
      // so the rows do not collapse.
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(2);
      const categories = kb.recordRecurrence.mock.calls.map(
        (c) => c[0].category,
      );
      expect(categories.sort()).toEqual(
        ['stitch-ledger-gap', 'tradesafe-ledger-gap'].sort(),
      );
    });

    it('clean state: zero findings', async () => {
      const { service } = buildService({ queryRaw: makeQueryRawRouter({}) });
      const report = await service.run();
      expect(report.findings).toHaveLength(0);
    });
  });

  describe('scenario 10: signature stability for new checks across runs', () => {
    it('check-4 missing-legs hashes stably across re-runs', async () => {
      const queryRaw = makeQueryRawRouter({
        missingLegs: () => [
          {
            transactionGroupId: 'grp_orphan',
            leg_count: 0n,
            actionType: 'submission_approved',
            referenceId: 'sub_x',
          },
        ],
      });
      const { service, ledger, kb } = buildService({ queryRaw });
      ledger.isKillSwitchActive
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      await service.run();
      await service.run();
      expect(kb.recordRecurrence).toHaveBeenCalledTimes(2);
      const [a, b] = kb.recordRecurrence.mock.calls.map((c) => c[0]);
      expect(a.category).toBe(b.category);
      expect(a.system).toBe(b.system);
      expect(a.errorCode).toBe(b.errorCode);
    });
  });

  describe('scenario 5: JobRun lifecycle', () => {
    it('writes jobRun.create followed by jobRun.update on a clean run (SUCCEEDED)', async () => {
      const { service, prisma } = buildService({});

      await service.run();

      expect(prisma.jobRun.create).toHaveBeenCalledTimes(1);
      expect(prisma.jobRun.update).toHaveBeenCalledTimes(1);
      const updateArgs = prisma.jobRun.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: 'run_fi_1' });
      expect(updateArgs.data.status).toBe(JobRunStatus.SUCCEEDED);
      expect(updateArgs.data.finishedAt).toBeInstanceOf(Date);
    });

    it('writes jobRun.update with status=PARTIAL when findings are present', async () => {
      const queryRaw = makeQueryRawRouter({
        balance: () => [
          { transactionGroupId: 'grp_bad', debit_sum: 100n, credit_sum: 99n },
        ],
        duplicate: () => [],
      });
      const { service, prisma } = buildService({ queryRaw });

      await service.run();

      expect(prisma.jobRun.create).toHaveBeenCalledTimes(1);
      expect(prisma.jobRun.update).toHaveBeenCalledTimes(1);
      const updateArgs = prisma.jobRun.update.mock.calls[0][0];
      expect(updateArgs.data.status).toBe(JobRunStatus.PARTIAL);
      expect(updateArgs.data.itemsSeen).toBe(1);
      expect(updateArgs.data.itemsFailed).toBe(1);
    });
  });
});
