import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { BrandSocialAnalyticsBlob } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApifyService } from './apify.service';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 50;

@Injectable()
export class ApifySocialScheduler {
  private readonly logger = new Logger(ApifySocialScheduler.name);

  constructor(
    private prisma: PrismaService,
    private apify: ApifyService,
  ) {}

  /**
   * Daily at 03:00 — refresh any ACTIVE brand whose social analytics are
   * missing or older than 14 days. Cap each run at 50 brands to respect
   * Apify rate limits. Individual failures are logged but don't abort
   * the batch.
   */
  @Cron('0 3 * * *')
  async refreshStaleBrands(): Promise<void> {
    if (!this.apify.isEnabled()) return;

    const cutoff = Date.now() - FOURTEEN_DAYS_MS;
    // Fetch active brands + their current blob; filter for staleness in JS
    // (Prisma JSON path filtering is fiddly across versions, and this list
    // is bounded by the number of active brands which is small for MVP).
    const candidates = await this.prisma.organisation.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, socialAnalytics: true },
      orderBy: { updatedAt: 'asc' },
    });

    const stale = candidates.filter((c) => {
      const blob = c.socialAnalytics as BrandSocialAnalyticsBlob | null;
      if (!blob?.fetchedAt) return true;
      const fetchedAt = new Date(blob.fetchedAt).getTime();
      return !Number.isFinite(fetchedAt) || fetchedAt < cutoff;
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
        await this.apify.refreshForOrganisation(brand.id);
        okCount++;
      } catch (err) {
        failCount++;
        this.logger.error(`Biweekly refresh failed for ${brand.id}`, err);
      }
    }

    this.logger.log(
      `Biweekly refresh pass done: ${okCount} ok, ${failCount} failed (batch ${batch.length}/${stale.length})`,
    );
  }
}
