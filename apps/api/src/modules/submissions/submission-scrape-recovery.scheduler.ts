import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SubmissionScraperService } from './submission-scraper.service';

/**
 * Recovery sweep for `SubmissionUrlScrape` rows stuck at PENDING.
 *
 * The verification pipeline triggers `SubmissionScraperService.scrapeAndVerify`
 * fire-and-forget via `setImmediate` after the submission write commits. That
 * trigger does NOT survive a process restart — if the API crashes between the
 * commit and the scrape, the URL rows stay PENDING forever and the brand can
 * never approve. This scheduler closes the gap.
 *
 * Picks up any submission with at least one PENDING row older than five
 * minutes and re-runs the scraper. The scraper is idempotent (per-submission
 * Redis lock + only acts on PENDING/FAILED rows), so a recovered submission
 * that's actually mid-scrape won't double-bill — the lock makes the recovery
 * call return immediately.
 */
const SCHED_LOCK = 'apify:scheduler-lock:scrape-recovery';
const SCHED_LOCK_TTL_SECS = 4 * 60; // shorter than the 5-min cadence
const STUCK_THRESHOLD_MINUTES = 5;
const MAX_PER_RUN = 50;

@Injectable()
export class SubmissionScrapeRecoveryScheduler {
  private readonly logger = new Logger(SubmissionScrapeRecoveryScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly scraper: SubmissionScraperService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep(): Promise<void> {
    const acquired = await this.redis.setNxEx(
      SCHED_LOCK,
      '1',
      SCHED_LOCK_TTL_SECS,
    );
    if (!acquired) return;

    try {
      const cutoff = new Date(
        Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000,
      );
      // Find distinct submission IDs with stuck PENDING rows.
      const stuck = await this.prisma.submissionUrlScrape.findMany({
        where: { scrapeStatus: 'PENDING', createdAt: { lt: cutoff } },
        select: { submissionId: true },
        distinct: ['submissionId'],
        take: MAX_PER_RUN,
        orderBy: { createdAt: 'asc' },
      });

      if (stuck.length === 0) return;

      this.logger.warn(
        `Recovery sweep: ${stuck.length} submissions with stuck PENDING urls`,
      );

      const results = await Promise.allSettled(
        stuck.map((s) => this.scraper.scrapeAndVerify(s.submissionId)),
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        this.logger.error(
          `Recovery sweep: ${failures.length}/${stuck.length} re-scrapes failed`,
        );
      }
    } finally {
      await this.redis.del(SCHED_LOCK).catch((err) => {
        this.logger.warn(
          'Recovery sweep: failed to release scheduler lock',
          err,
        );
      });
    }
  }
}
