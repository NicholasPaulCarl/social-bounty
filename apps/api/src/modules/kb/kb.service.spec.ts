import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { KbService } from './kb.service';

const SYSTEM_ACTOR = 'system-actor-1';

function makeConfig(actorId: string | null = SYSTEM_ACTOR): ConfigService {
  return {
    get: (key: string, fallback?: any) =>
      key === 'STITCH_SYSTEM_ACTOR_ID' ? (actorId ?? '') : fallback,
  } as unknown as ConfigService;
}

describe('KbService', () => {
  let prisma: any;
  let service: KbService;

  beforeEach(() => {
    prisma = {
      recurringIssue: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      jobRun: { count: jest.fn().mockResolvedValue(0) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    service = new KbService(prisma as PrismaService, makeConfig());
  });

  it('produces a stable signature for the same inputs', () => {
    const a = service.signature({ category: 'x', system: 'payments', errorCode: 'E1' });
    const b = service.signature({ category: 'x', system: 'payments', errorCode: 'E1' });
    expect(a).toBe(b);
  });

  it('produces different signatures for different categories', () => {
    const a = service.signature({ category: 'x', system: 'payments', errorCode: 'E1' });
    const b = service.signature({ category: 'y', system: 'payments', errorCode: 'E1' });
    expect(a).not.toBe(b);
  });

  it('creates a new stub on first occurrence', async () => {
    prisma.recurringIssue.findUnique.mockResolvedValue(null);
    prisma.recurringIssue.create.mockResolvedValue({ id: 'r1', occurrences: 1 });

    const { isNew } = await service.recordRecurrence({
      category: 'ledger-imbalance',
      system: 'payments',
      title: 'imbalance',
      severity: 'critical',
    });
    expect(isNew).toBe(true);
    expect(prisma.recurringIssue.create).toHaveBeenCalled();
  });

  it('bumps occurrences on recurrence', async () => {
    prisma.recurringIssue.findUnique.mockResolvedValue({
      id: 'r1',
      occurrences: 1,
      resolved: false,
      resolvedAt: null,
      ineffectiveFix: false,
    });
    prisma.recurringIssue.update.mockResolvedValue({ id: 'r1', occurrences: 2 });

    const { isNew, issue } = await service.recordRecurrence({
      category: 'ledger-imbalance',
      system: 'payments',
      title: 'imbalance',
      severity: 'critical',
    });
    expect(isNew).toBe(false);
    expect(issue.occurrences).toBe(2);
  });

  it('computes confidence score clamped to [0,100]', async () => {
    prisma.$queryRaw.mockResolvedValue([{ system: 'payments' }]);
    // 2 critical open → -40; 1 warning open → -10; 1 recurrence → -5; 2 failed recon → -10 = 35
    // new 5th count is ineffectiveFixCount
    prisma.recurringIssue.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0); // ineffectiveFixCount
    prisma.jobRun.count.mockResolvedValueOnce(2);

    const scores = await service.confidenceScores();
    expect(scores[0].score).toBe(35);
    expect(scores[0].ineffectiveFixCount).toBe(0);
  });

  it('clamps negative raw scores to 0', async () => {
    prisma.$queryRaw.mockResolvedValue([{ system: 'payments' }]);
    prisma.recurringIssue.count
      .mockResolvedValueOnce(10) // critical = -200
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prisma.jobRun.count.mockResolvedValueOnce(0);

    const scores = await service.confidenceScores();
    expect(scores[0].score).toBe(0);
  });

  // --- Ineffective Fix auto-flag behaviour (Phase 4 exit criterion) -------

  describe('ineffective-fix auto-flag', () => {
    it('recurrence on an UNRESOLVED signature → no flag, no audit log', async () => {
      prisma.recurringIssue.findUnique.mockResolvedValue({
        id: 'r1',
        occurrences: 1,
        resolved: false,
        resolvedAt: null,
        ineffectiveFix: false,
      });
      prisma.recurringIssue.update.mockResolvedValue({ id: 'r1', occurrences: 2 });

      await service.recordRecurrence({
        category: 'ledger-imbalance',
        system: 'payments',
        title: 'imbalance',
        severity: 'critical',
      });

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      // Only the occurrences-bump update should fire, not a flag update.
      expect(prisma.recurringIssue.update).toHaveBeenCalledTimes(1);
    });

    it('recurrence on a RESOLVED signature within 90d → flag + AuditLog', async () => {
      const resolvedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      // First lookup: existing row (for occurrences bump). Second lookup: flagIneffectiveFix.
      prisma.recurringIssue.findUnique
        .mockResolvedValueOnce({
          id: 'r1',
          occurrences: 1,
          resolved: true,
          resolvedAt,
          ineffectiveFix: false,
        })
        .mockResolvedValueOnce({
          id: 'r1',
          occurrences: 2,
          resolved: true,
          resolvedAt,
          ineffectiveFix: false,
        });
      prisma.recurringIssue.update.mockResolvedValue({ id: 'r1', occurrences: 2 });

      await service.recordRecurrence({
        category: 'ledger-imbalance',
        system: 'payments',
        title: 'imbalance',
        severity: 'critical',
      });

      // 1 update for occurrences bump + 1 update for ineffective flag
      expect(prisma.recurringIssue.update).toHaveBeenCalledTimes(2);
      const flagCall = prisma.recurringIssue.update.mock.calls[1][0];
      expect(flagCall.data.ineffectiveFix).toBe(true);
      expect(flagCall.data.ineffectiveFlaggedBy).toBe(SYSTEM_ACTOR);

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      const auditArg = prisma.auditLog.create.mock.calls[0][0];
      expect(auditArg.data.action).toBe('KB_INEFFECTIVE_FIX_FLAGGED');
      expect(auditArg.data.entityType).toBe('RecurringIssue');
      expect(auditArg.data.entityId).toBe('r1');
      expect(auditArg.data.actorId).toBe(SYSTEM_ACTOR);
    });

    it('recurrence on a RESOLVED signature OLDER than 90d → no flag', async () => {
      const resolvedAt = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000); // 120 days ago
      prisma.recurringIssue.findUnique.mockResolvedValue({
        id: 'r1',
        occurrences: 1,
        resolved: true,
        resolvedAt,
        ineffectiveFix: false,
      });
      prisma.recurringIssue.update.mockResolvedValue({ id: 'r1', occurrences: 2 });

      await service.recordRecurrence({
        category: 'ledger-imbalance',
        system: 'payments',
        title: 'imbalance',
        severity: 'critical',
      });

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      expect(prisma.recurringIssue.update).toHaveBeenCalledTimes(1);
    });

    it('double recurrence (already flagged) → no-op, no duplicate AuditLog', async () => {
      const resolvedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      // Row already flagged → flagIneffectiveFix should short-circuit.
      prisma.recurringIssue.findUnique
        .mockResolvedValueOnce({
          id: 'r1',
          occurrences: 2,
          resolved: true,
          resolvedAt,
          ineffectiveFix: true,
        })
        .mockResolvedValueOnce({
          id: 'r1',
          occurrences: 3,
          resolved: true,
          resolvedAt,
          ineffectiveFix: true,
        });
      prisma.recurringIssue.update.mockResolvedValue({ id: 'r1', occurrences: 3 });

      await service.recordRecurrence({
        category: 'ledger-imbalance',
        system: 'payments',
        title: 'imbalance',
        severity: 'critical',
      });

      // Only the occurrences-bump update — no flag update and no audit log.
      expect(prisma.recurringIssue.update).toHaveBeenCalledTimes(1);
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('info-severity recurrence on a RESOLVED-within-90d row → bump only, NO flag, NO AuditLog (R23)', async () => {
      // R23: info severity is too weak a signal to invalidate a resolved fix.
      // The occurrences bump must still happen, but the Ineffective Fix
      // auto-flag and its AuditLog entry must NOT fire.
      const resolvedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago — well inside 90d window
      prisma.recurringIssue.findUnique.mockResolvedValue({
        id: 'r1',
        occurrences: 1,
        resolved: true,
        resolvedAt,
        ineffectiveFix: false,
      });
      prisma.recurringIssue.update.mockResolvedValue({ id: 'r1', occurrences: 2 });

      const { isNew, issue } = await service.recordRecurrence({
        category: 'ledger-imbalance',
        system: 'payments',
        title: 'imbalance',
        severity: 'info',
      });

      // Bump still happened.
      expect(isNew).toBe(false);
      expect(issue.occurrences).toBe(2);
      // Only the occurrences-bump update — NO second update for the flag.
      expect(prisma.recurringIssue.update).toHaveBeenCalledTimes(1);
      const bumpCall = prisma.recurringIssue.update.mock.calls[0][0];
      expect(bumpCall.data.occurrences).toEqual({ increment: 1 });
      // No audit log.
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('recurrence within the same run as first occurrence → no flag', async () => {
      // First occurrence: findUnique returns null → create path → no auto-flag possible.
      prisma.recurringIssue.findUnique.mockResolvedValue(null);
      prisma.recurringIssue.create.mockResolvedValue({
        id: 'r-new',
        occurrences: 1,
        resolved: false,
        resolvedAt: null,
        ineffectiveFix: false,
      });

      const { isNew } = await service.recordRecurrence({
        category: 'ledger-imbalance',
        system: 'payments',
        title: 'imbalance',
        severity: 'critical',
      });

      expect(isNew).toBe(true);
      // No update and no audit log on the create path.
      expect(prisma.recurringIssue.update).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
