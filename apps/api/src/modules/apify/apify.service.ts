import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApifyClient } from 'apify-client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BrandSocialAnalyticsBlob,
  BrandSocialAnalyticsCounters,
  BrandSocialLinks,
} from '@social-bounty/shared';
import {
  emptyCounters,
  mapFacebookItem,
  mapInstagramItem,
  mapTiktokItem,
  normalizeHandle,
} from './apify.mappers';

const INSTAGRAM_ACTOR = 'apify/instagram-profile-scraper';
const FACEBOOK_ACTOR = 'apify/facebook-pages-scraper';
const TIKTOK_ACTOR = 'clockworks/tiktok-scraper';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);
  private readonly client: ApifyClient | null;
  private readonly waitSecs: number;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const token = this.config.get<string>('APIFY_API_TOKEN');
    this.client = token ? new ApifyClient({ token }) : null;
    const timeoutMs = this.config.get<number>('APIFY_ACTOR_TIMEOUT_MS', 60_000);
    // Leave a few seconds of margin under the SDK's 60s waitSecs cap
    this.waitSecs = Math.max(5, Math.min(55, Math.floor(timeoutMs / 1000)));

    if (!this.client) {
      this.logger.warn(
        'APIFY_API_TOKEN not set — Apify social analytics are disabled (mock fallback will render in UI).',
      );
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Fire a refresh only if the existing snapshot is missing or older than
   * STALE_THRESHOLD_MS. Intended for login-triggered background refresh so we
   * don't hammer Apify when a user logs in repeatedly.
   */
  async refreshIfStale(orgId: string): Promise<void> {
    if (!this.client) return;
    try {
      const org = await this.prisma.organisation.findUnique({
        where: { id: orgId },
        select: { socialAnalytics: true },
      });
      if (!org) return;
      const blob = org.socialAnalytics as BrandSocialAnalyticsBlob | null;
      if (blob && blob.fetchedAt) {
        const fetchedAt = new Date(blob.fetchedAt).getTime();
        if (Number.isFinite(fetchedAt) && Date.now() - fetchedAt < STALE_THRESHOLD_MS) {
          this.logger.debug(`Skip refresh for ${orgId} — snapshot is fresh`);
          return;
        }
      }
      await this.refreshForOrganisation(orgId);
    } catch (err) {
      this.logger.error(`refreshIfStale failed for ${orgId}`, err);
    }
  }

  /**
   * Run the three actors in parallel for the given brand's handles and
   * persist the resulting blob on Organisation.socialAnalytics.
   */
  async refreshForOrganisation(orgId: string): Promise<BrandSocialAnalyticsBlob | null> {
    if (!this.client) return null;
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      select: { id: true, socialLinks: true },
    });
    if (!org) {
      this.logger.warn(`refreshForOrganisation: organisation ${orgId} not found`);
      return null;
    }

    const links = (org.socialLinks as BrandSocialLinks | null) ?? {};

    const [instagram, facebook, tiktok] = await Promise.all([
      this.scrapeInstagram(links.instagram),
      this.scrapeFacebook(links.facebook),
      this.scrapeTiktok(links.tiktok),
    ]);

    const blob: BrandSocialAnalyticsBlob = {
      fetchedAt: new Date().toISOString(),
      instagram,
      facebook,
      tiktok,
    };

    await this.prisma.organisation.update({
      where: { id: orgId },
      data: { socialAnalytics: blob as unknown as object },
    });

    this.logger.log(`Refreshed social analytics for brand ${orgId}`);
    return blob;
  }

  // ─── Private scrapers ─────────────────────────────────────────

  private async scrapeInstagram(handle: string | undefined): Promise<BrandSocialAnalyticsCounters> {
    if (!handle) return emptyCounters('not connected');
    if (!this.client) return emptyCounters('Apify not configured');
    const username = normalizeHandle('instagram', handle);
    try {
      const run = await this.client.actor(INSTAGRAM_ACTOR).call(
        { usernames: [username], resultsLimit: 1 },
        { waitSecs: this.waitSecs },
      );
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems({ limit: 1 });
      return mapInstagramItem(items[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Instagram scrape failed for @${username}: ${msg}`);
      return emptyCounters(msg);
    }
  }

  private async scrapeFacebook(handle: string | undefined): Promise<BrandSocialAnalyticsCounters> {
    if (!handle) return emptyCounters('not connected');
    if (!this.client) return emptyCounters('Apify not configured');
    const slug = normalizeHandle('facebook', handle);
    const url = slug.startsWith('http') ? slug : `https://www.facebook.com/${slug}`;
    try {
      const run = await this.client.actor(FACEBOOK_ACTOR).call(
        { startUrls: [{ url }], resultsLimit: 1 },
        { waitSecs: this.waitSecs },
      );
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems({ limit: 1 });
      return mapFacebookItem(items[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Facebook scrape failed for ${slug}: ${msg}`);
      return emptyCounters(msg);
    }
  }

  private async scrapeTiktok(handle: string | undefined): Promise<BrandSocialAnalyticsCounters> {
    if (!handle) return emptyCounters('not connected');
    if (!this.client) return emptyCounters('Apify not configured');
    const username = normalizeHandle('tiktok', handle);
    try {
      const run = await this.client.actor(TIKTOK_ACTOR).call(
        {
          profiles: [username],
          profileScrapeSections: ['about'],
          profileSorting: 'latest',
          resultsPerPage: 1,
        },
        { waitSecs: this.waitSecs },
      );
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems({ limit: 1 });
      return mapTiktokItem(items[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`TikTok scrape failed for @${username}: ${msg}`);
      return emptyCounters(msg);
    }
  }
}
