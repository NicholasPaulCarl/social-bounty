import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { BrandSocialAnalyticsBlob } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ApifyService } from './apify.service';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 50;
// Pass-level lock so a slow run can't overlap the next cron tick.
// Size to slightly under a full day so a stuck run clears itself before
// the next scheduled pass.
const PASS_LOCK_KEY = 'apify:scheduler:biweekly-pass';
const PASS_LOCK_TTL_SECS = 23 * 60 * 60; // 23 hours

@Injectable()
export class ApifySocialScheduler {
  private readonly logger = new Logger(ApifySocialScheduler.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private apify: ApifyService,
  ) {}

  /**
   * Daily at 03:00 — refresh any ACTIVE brand whose social analytics are
   * missing or older than 14 days. Cap each run at 50 brands to respect
   * Apify rate limits. Individual failures are logged but don't abort
   * the batch.
   *
   * Protected by a Redis pass-lock so a long-running refresh can't overlap
   * with the next tick.
   */
  @Cron('0 3 * * *')
  async refreshStaleBrands(): Promise<void> {
    if (!this.apify.isEnabled()) return;

    const acquired = await this.redis.setNxEx(PASS_LOCK_KEY, '1', PASS_LOCK_TTL_SECS);
    if (!acquired) {
      this.logger.warn('Biweekly refresh already in progress — skipping this tick');
      return;
    }

    try {
      const cutoff = Date.now() - FOURTEEN_DAYS_MS;
      // Fetch active brands + their current blob; filter for staleness in JS
      // (Prisma JSON path filtering is fiddly across versions, and this list
      // is bounded by the number of active brands which is small for MVP).
      const candidates = await this.prisma.brand.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, socialAnalytics: true },
        orderBy: { updatedAt: 'asc' },
      });

      const stale = candidates.filter((c) => {
        const blob = c.socialAnalytics as BrandSocialAnalyticsBlob | null;
        if (!blob?.fetchedAt) return true;
        const fetchedAt = new Date(blob.fetchedAt).getTime();
        if (!Number.isFinite(fetchedAt) || fetchedAt > Date.now()) return true;
        return fetchedAt < cutoff;
      });

      if (stale.length === 0) {
        this.logger.debug('Biweekly refresh pass: nothing stale');
        return;
      }

      const batch = stale.slice(0, MAX_PER_RUN);
      let okCount = 0;
      let failCount = 0;

      for (const brand of batch) {
        try {
          await this.apify.refreshForBrand(brand.id);
          okCount++;
        } catch (err) {
          failCount++;
          this.logger.error(`Biweekly refresh failed for ${brand.id}`, err);
        }
      }

      this.logger.log(
        `Biweekly refresh pass done: ${okCount} ok, ${failCount} failed (batch ${batch.length}/${stale.length})`,
      );
    } finally {
      await this.redis.del(PASS_LOCK_KEY).catch((err) => {
        this.logger.warn('Failed to release scheduler pass lock', err);
      });
    }
  }
}
