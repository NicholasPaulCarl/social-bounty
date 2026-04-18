import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SubmissionScraperService } from '../submission-scraper.service';
import { SubmissionScrapeRecoveryScheduler } from '../submission-scrape-recovery.scheduler';

/**
 * Covers the recovery sweep documented in the bounty-submission verification
 * plan ("Stuck-row recovery scheduler"). The scraper trigger via setImmediate
 * doesn't survive a process restart — this scheduler picks up rows whose
 * `scrapeStatus = PENDING` is older than the stuck threshold and re-invokes
 * `SubmissionScraperService.scrapeAndVerify` (which is internally idempotent
 * and Redis-locked). The tests below exercise the lock contract, the empty
 * path, the happy path, multi-row dispatch, error containment, and the cutoff
 * filter applied by the Prisma query.
 */
describe('SubmissionScrapeRecoveryScheduler.sweep', () => {
  type ScrapeRow = {
    submissionId: string;
    scrapeStatus: string;
    createdAt: Date;
  };

  function buildHarness(
    rows: ScrapeRow[],
    opts: {
      lockAcquired?: boolean;
      scrapeImpl?: (id: string) => Promise<void>;
    } = {},
  ) {
    const lockAcquired = opts.lockAcquired ?? true;

    const prisma = {
      submissionUrlScrape: {
        findMany: jest.fn(
          async ({
            where,
            distinct,
            take,
          }: {
            where: { scrapeStatus: string; createdAt: { lt: Date } };
            distinct: string[];
            take: number;
            orderBy: unknown;
            select: unknown;
          }) => {
            const filtered = rows.filter(
              (r) =>
                r.scrapeStatus === where.scrapeStatus &&
                r.createdAt < where.createdAt.lt,
            );
            // distinct on submissionId
            if (distinct?.includes('submissionId')) {
              const seen = new Set<string>();
              const out: { submissionId: string }[] = [];
              for (const r of filtered) {
                if (seen.has(r.submissionId)) continue;
                seen.add(r.submissionId);
                out.push({ submissionId: r.submissionId });
                if (out.length >= take) break;
              }
              return out;
            }
            return filtered.slice(0, take).map((r) => ({
              submissionId: r.submissionId,
            }));
          },
        ),
      },
    } as unknown as PrismaService;

    const redis = {
      setNxEx: jest.fn().mockResolvedValue(lockAcquired),
      del: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisService;

    const scrapeImpl = opts.scrapeImpl ?? (() => Promise.resolve());
    const scraper = {
      scrapeAndVerify: jest.fn(scrapeImpl),
    } as unknown as SubmissionScraperService;

    const scheduler = new SubmissionScrapeRecoveryScheduler(
      prisma,
      redis,
      scraper,
    );

    return { scheduler, prisma, redis, scraper };
  }

  const minutesAgo = (n: number) => new Date(Date.now() - n * 60 * 1000);

  it('returns immediately and skips work when the scheduler lock is already held', async () => {
    const { scheduler, prisma, redis, scraper } = buildHarness(
      [{ submissionId: 'sub-1', scrapeStatus: 'PENDING', createdAt: minutesAgo(10) }],
      { lockAcquired: false },
    );

    await scheduler.sweep();

    expect(redis.setNxEx).toHaveBeenCalledTimes(1);
    expect(prisma.submissionUrlScrape.findMany).not.toHaveBeenCalled();
    expect(scraper.scrapeAndVerify).not.toHaveBeenCalled();
    // Lock was never ours — must NOT release someone else's lock.
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('does not invoke the scraper when the query returns no stuck rows, and releases the lock', async () => {
    const { scheduler, prisma, redis, scraper } = buildHarness([]);

    await scheduler.sweep();

    expect(prisma.submissionUrlScrape.findMany).toHaveBeenCalledTimes(1);
    expect(scraper.scrapeAndVerify).not.toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith(
      'apify:scheduler-lock:scrape-recovery',
    );
  });

  it('invokes the scraper exactly once for a single stuck submission and releases the lock', async () => {
    const { scheduler, redis, scraper } = buildHarness([
      { submissionId: 'sub-stuck', scrapeStatus: 'PENDING', createdAt: minutesAgo(10) },
    ]);

    await scheduler.sweep();

    expect(scraper.scrapeAndVerify).toHaveBeenCalledTimes(1);
    expect(scraper.scrapeAndVerify).toHaveBeenCalledWith('sub-stuck');
    expect(redis.del).toHaveBeenCalledWith(
      'apify:scheduler-lock:scrape-recovery',
    );
  });

  it('dispatches one scraper call per distinct stuck submission (and dedupes within a submission)', async () => {
    const { scheduler, scraper } = buildHarness([
      // Two rows on the same submission — distinct collapses to one call.
      { submissionId: 'sub-A', scrapeStatus: 'PENDING', createdAt: minutesAgo(10) },
      { submissionId: 'sub-A', scrapeStatus: 'PENDING', createdAt: minutesAgo(10) },
      { submissionId: 'sub-B', scrapeStatus: 'PENDING', createdAt: minutesAgo(8) },
      { submissionId: 'sub-C', scrapeStatus: 'PENDING', createdAt: minutesAgo(7) },
    ]);

    await scheduler.sweep();

    expect(scraper.scrapeAndVerify).toHaveBeenCalledTimes(3);
    const ids = (scraper.scrapeAndVerify as jest.Mock).mock.calls
      .map((c) => c[0])
      .sort();
    expect(ids).toEqual(['sub-A', 'sub-B', 'sub-C']);
  });

  it('uses Promise.allSettled so a single scraper rejection does not abort the batch or leak the lock', async () => {
    const seen: string[] = [];
    const scrapeImpl = async (id: string) => {
      seen.push(id);
      if (id === 'sub-bad') throw new Error('scraper boom');
    };
    const { scheduler, redis, scraper } = buildHarness(
      [
        { submissionId: 'sub-good-1', scrapeStatus: 'PENDING', createdAt: minutesAgo(10) },
        { submissionId: 'sub-bad', scrapeStatus: 'PENDING', createdAt: minutesAgo(9) },
        { submissionId: 'sub-good-2', scrapeStatus: 'PENDING', createdAt: minutesAgo(8) },
      ],
      { scrapeImpl },
    );

    // Should NOT reject — Promise.allSettled swallows the error.
    await expect(scheduler.sweep()).resolves.toBeUndefined();

    expect(scraper.scrapeAndVerify).toHaveBeenCalledTimes(3);
    expect(seen).toContain('sub-good-1');
    expect(seen).toContain('sub-good-2');
    // Lock was always ours — and must be released even when a scrape rejected.
    expect(redis.del).toHaveBeenCalledWith(
      'apify:scheduler-lock:scrape-recovery',
    );
  });

  it('honours the 5-minute cutoff: rows newer than the threshold are not picked up', async () => {
    const { scheduler, prisma, scraper } = buildHarness([
      // 4 minutes old — must be IGNORED.
      { submissionId: 'sub-fresh', scrapeStatus: 'PENDING', createdAt: minutesAgo(4) },
      // 6 minutes old — qualifies.
      { submissionId: 'sub-stuck', scrapeStatus: 'PENDING', createdAt: minutesAgo(6) },
    ]);

    await scheduler.sweep();

    // The cutoff fed into the query was strictly less than 5 minutes ago.
    const findManyArgs = (prisma.submissionUrlScrape.findMany as jest.Mock).mock
      .calls[0][0];
    const cutoff = findManyArgs.where.createdAt.lt as Date;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    // Allow a small clock-skew window (10ms) for the timing in `Date.now()`
    // between scheduler call and the assertion read here.
    expect(cutoff.getTime()).toBeGreaterThan(fiveMinutesAgo - 1000);
    expect(cutoff.getTime()).toBeLessThanOrEqual(fiveMinutesAgo + 1000);

    expect(scraper.scrapeAndVerify).toHaveBeenCalledTimes(1);
    expect(scraper.scrapeAndVerify).toHaveBeenCalledWith('sub-stuck');
  });
});
