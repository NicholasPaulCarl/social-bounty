/**
 * ReconciliationService fault-injection tests.
 *
 * These tests prove ReconciliationService catches the deliberate ledger bugs
 * the platform must defend against: unbalanced transaction groups, duplicate
 * (referenceId, actionType) pairs, and reserve drift on paid bounties.
 *
 * The pattern here is different from reconciliation.service.spec.ts — rather
 * than stubbing out the internal check methods, we mock at the Prisma method
 * boundary ($queryRaw, bounty.findMany, ledgerEntry.aggregate) so the real
 * check methods execute against malformed query results. This is the closest
 * we can get to "the DB returned a fault" without standing up Postgres.
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
 * Routes $queryRaw calls to either the balance or duplicate handler based on
 * a substring match against the raw SQL string. Prisma template-tag calls pass
 * the strings array as the first arg; we concatenate it to one searchable blob.
 */
function makeQueryRawRouter(handlers: {
  balance?: () => unknown[];
  duplicate?: () => unknown[];
}): jest.Mock {
  return jest.fn((strings: TemplateStringsArray | string[] | string, ..._vals: unknown[]) => {
    const sql = Array.isArray(strings) ? strings.join(' ') : String(strings);
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
      // checkReserveVsBounty calls aggregate three times per bounty:
      //   1. total (_sum only)
      //   2. DEBIT sum
      //   3. CREDIT sum
      // We identify which call by inspecting the args (.where.type).
      const aggregate = jest.fn(async ({ where }: { where: { type?: string } }) => {
        if (where.type === 'DEBIT') return { _sum: { amount: 0n } };
        if (where.type === 'CREDIT') return { _sum: { amount: 30000n } };
        // Top-level aggregate (no type filter) — not consulted for drift math,
        // just echoed into the finding detail.
        return { _sum: { amount: 30000n } };
      });
      const bountyFindMany = jest.fn().mockResolvedValue([
        { id: 'b_drift', faceValueCents: 50000n },
      ]);

      const { service, ledger, kb } = buildService({
        queryRaw: makeQueryRawRouter({}),
        bountyFindMany,
        aggregate,
      });

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
