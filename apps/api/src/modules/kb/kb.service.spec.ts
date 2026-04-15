import { PrismaService } from '../prisma/prisma.service';
import { KbService } from './kb.service';

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
      jobRun: { count: jest.fn().mockResolvedValue(0) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    service = new KbService(prisma as PrismaService);
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
    prisma.recurringIssue.findUnique.mockResolvedValue({ id: 'r1', occurrences: 1 });
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
    prisma.recurringIssue.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    prisma.jobRun.count.mockResolvedValueOnce(2);

    const scores = await service.confidenceScores();
    expect(scores[0].score).toBe(35);
  });

  it('clamps negative raw scores to 0', async () => {
    prisma.$queryRaw.mockResolvedValue([{ system: 'payments' }]);
    prisma.recurringIssue.count
      .mockResolvedValueOnce(10) // critical = -200
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prisma.jobRun.count.mockResolvedValueOnce(0);

    const scores = await service.confidenceScores();
    expect(scores[0].score).toBe(0);
  });
});
