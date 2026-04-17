/**
 * ReconciliationService unit tests — KB auto-feed path.
 *
 * The pre-Phase-4 service wrote RecurringIssue rows directly via prisma.upsert.
 * After Phase 4, all KB writes route through KbService.recordRecurrence so that
 *   (a) the signature is hashed consistently with webhook failures,
 *   (b) repeat findings bump occurrences on the existing row instead of
 *       creating a duplicate, and
 *   (c) metadata.system is populated so the dashboard's confidence-score
 *       grouping works.
 *
 * These tests lock all three behaviours in.
 */
import { ReconciliationService } from './reconciliation.service';
import { KbService } from '../kb/kb.service';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

describe('ReconciliationService KB auto-feed', () => {
  let service: ReconciliationService;
  let prisma: any;
  let ledger: any;
  let kb: any;

  beforeEach(() => {
    // minimal prisma mock — findings queries are stubbed per-test via
    // service method overrides, so only the bookkeeping calls need real mocks.
    prisma = {
      jobRun: {
        create: jest.fn().mockResolvedValue({ id: 'run_1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      // The 11A checks (4–7) all use $queryRaw; every test in this suite
      // stubs the public check methods to inject a deterministic finding,
      // so $queryRaw should never actually be hit. Provide a benign default
      // anyway in case a future test forgets to stub one of the new checks.
      $queryRaw: jest.fn().mockResolvedValue([]),
      // NOTE: recurringIssue is intentionally absent here — a failure to
      // delegate to KbService would surface as a TypeError.
      recurringIssue: undefined,
    };
    ledger = {
      isKillSwitchActive: jest.fn().mockResolvedValue(true), // skip kill-switch side effects
      setKillSwitch: jest.fn(),
    };
    kb = {
      recordRecurrence: jest.fn().mockResolvedValue({ isNew: true, issue: {} }),
    };
    service = new ReconciliationService(
      prisma as unknown as PrismaService,
      ledger as unknown as LedgerService,
      kb as unknown as KbService,
    );
  });

  it('routes a critical finding through KbService.recordRecurrence (not prisma directly)', async () => {
    // Inject a single critical finding by stubbing the internal checks.
    const finding = {
      category: 'ledger-imbalance',
      signature: 'imbalance:grp-1',
      system: 'ledger',
      errorCode: 'imbalance:grp-1',
      severity: 'critical' as const,
      title: 'Ledger group grp-1 is unbalanced',
      detail: { transactionGroupId: 'grp-1', debitCents: '100', creditCents: '90' },
    };
    (service as any).checkGroupBalance = jest.fn().mockResolvedValue([finding]);
    (service as any).checkDuplicateGroups = jest.fn().mockResolvedValue([]);
    (service as any).checkReserveVsBounty = jest.fn().mockResolvedValue([]);

    const report = await service.run();

    expect(report.findings).toHaveLength(1);
    expect(kb.recordRecurrence).toHaveBeenCalledTimes(1);
    const arg = kb.recordRecurrence.mock.calls[0][0];
    expect(arg).toEqual(
      expect.objectContaining({
        category: 'ledger-imbalance',
        system: 'ledger',
        errorCode: 'imbalance:grp-1',
        severity: 'critical',
        title: 'Ledger group grp-1 is unbalanced',
      }),
    );
    // metadata must carry `system` so KbService.confidenceScores can group.
    expect(arg.metadata).toEqual(expect.objectContaining({ system: 'ledger' }));
  });

  it('re-running with the same finding calls KbService with identical signature inputs (bump, not duplicate)', async () => {
    const finding = {
      category: 'ledger-imbalance',
      signature: 'imbalance:grp-1',
      system: 'ledger',
      errorCode: 'imbalance:grp-1',
      severity: 'critical' as const,
      title: 'Ledger group grp-1 is unbalanced',
      detail: { transactionGroupId: 'grp-1' },
    };
    (service as any).checkGroupBalance = jest.fn().mockResolvedValue([finding]);
    (service as any).checkDuplicateGroups = jest.fn().mockResolvedValue([]);
    (service as any).checkReserveVsBounty = jest.fn().mockResolvedValue([]);

    // second pass returns bump
    kb.recordRecurrence
      .mockResolvedValueOnce({ isNew: true, issue: { id: 'ri_1', occurrences: 1 } })
      .mockResolvedValueOnce({ isNew: false, issue: { id: 'ri_1', occurrences: 2 } });

    await service.run();
    await service.run();

    expect(kb.recordRecurrence).toHaveBeenCalledTimes(2);
    const [firstArg, secondArg] = kb.recordRecurrence.mock.calls.map((c: any[]) => c[0]);
    // Same triple → KbService will hash to the same signature and bump the row.
    expect(firstArg.category).toBe(secondArg.category);
    expect(firstArg.system).toBe(secondArg.system);
    expect(firstArg.errorCode).toBe(secondArg.errorCode);
  });

  it('does not call prisma.recurringIssue.upsert (single-writer invariant)', async () => {
    prisma.recurringIssue = { upsert: jest.fn(), create: jest.fn(), update: jest.fn() };
    (service as any).checkGroupBalance = jest.fn().mockResolvedValue([
      {
        category: 'ledger-imbalance',
        signature: 'imbalance:grp-x',
        system: 'ledger',
        errorCode: 'imbalance:grp-x',
        severity: 'critical',
        title: 't',
        detail: {},
      },
    ]);
    (service as any).checkDuplicateGroups = jest.fn().mockResolvedValue([]);
    (service as any).checkReserveVsBounty = jest.fn().mockResolvedValue([]);

    await service.run();

    expect(prisma.recurringIssue.upsert).not.toHaveBeenCalled();
    expect(prisma.recurringIssue.create).not.toHaveBeenCalled();
    expect(prisma.recurringIssue.update).not.toHaveBeenCalled();
    expect(kb.recordRecurrence).toHaveBeenCalled();
  });
});
