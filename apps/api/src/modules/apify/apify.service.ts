import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApifyClient } from 'apify-client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type {
  BrandSocialAnalyticsBlob,
  BrandSocialAnalyticsCounters,
  BrandSocialLinks,
  ScrapedPostData,
} from '@social-bounty/shared';
import {
  emptyCounters,
  mapFacebookItem,
  mapFacebookPostItem,
  mapInstagramItem,
  mapInstagramPostItem,
  mapTiktokItem,
  mapTiktokPostItem,
  normalizeHandle,
} from './apify.mappers';

const INSTAGRAM_ACTOR = 'apify/instagram-profile-scraper';
const FACEBOOK_ACTOR = 'apify/facebook-pages-scraper';
const TIKTOK_ACTOR = 'clockworks/tiktok-scraper';

const INSTAGRAM_POST_ACTOR = 'apify/instagram-scraper';
const FACEBOOK_POST_ACTOR = 'apify/facebook-posts-scraper';
const TIKTOK_POST_ACTOR = 'clockworks/tiktok-scraper';

export type PostScrapeResult = ScrapedPostData | { error: string };

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
// How long a refresh lock is valid before auto-expiring. Sized to be longer
// than three actor runs + DB writes but short enough that a crashed process
// doesn't block the next refresh indefinitely.
const REFRESH_LOCK_TTL_SECS = 5 * 60; // 5 minutes

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);
  private readonly client: ApifyClient | null;
  private readonly waitSecs: number;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private redis: RedisService,
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
   * don't hammer Apify when a user logs in repeatedly. Merges the staleness
   * check + refresh into a single Prisma round-trip by selecting both
   * socialAnalytics and socialLinks up front.
   */
  async refreshIfStale(brandId: string): Promise<void> {
    if (!this.client) return;
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { id: true, socialLinks: true, socialAnalytics: true },
      });
      if (!brand) return;
      const blob = brand.socialAnalytics as BrandSocialAnalyticsBlob | null;
      if (blob?.fetchedAt) {
        const fetchedAt = new Date(blob.fetchedAt).getTime();
        // Reject NaN / future timestamps — a corrupted / spoofed blob would
        // otherwise skip refresh indefinitely.
        if (
          Number.isFinite(fetchedAt) &&
          fetchedAt <= Date.now() &&
          Date.now() - fetchedAt < STALE_THRESHOLD_MS
        ) {
          this.logger.debug(`Skip refresh for ${brandId} — snapshot is fresh`);
          return;
        }
      }
      await this.refreshForBrand(brandId, (brand.socialLinks as BrandSocialLinks | null) ?? {});
    } catch (err) {
      this.logger.error(`refreshIfStale failed for ${brandId}`, err);
    }
  }

  /**
   * Run the three actors in parallel for the given brand's handles and
   * persist the resulting blob on Brand.socialAnalytics.
   *
   * Protected by a per-brand Redis lock so two concurrent triggers (e.g. a
   * login + an overlapping cron pass) don't waste actor credits or race on
   * the final DB write.
   */
  async refreshForBrand(
    brandId: string,
    preloadedLinks?: BrandSocialLinks,
  ): Promise<BrandSocialAnalyticsBlob | null> {
    if (!this.client) return null;

    const lockKey = `apify:refresh-lock:${brandId}`;
    // Atomic SET NX EX — the key exists iff a refresh is already in flight.
    const acquired = await this.redis.setNxEx(lockKey, '1', REFRESH_LOCK_TTL_SECS);
    if (!acquired) {
      this.logger.debug(`Skip refresh for ${brandId} — lock held by another run`);
      return null;
    }

    try {
      let links: BrandSocialLinks;
      if (preloadedLinks) {
        links = preloadedLinks;
      } else {
        const brand = await this.prisma.brand.findUnique({
          where: { id: brandId },
          select: { socialLinks: true },
        });
        if (!brand) {
          this.logger.warn(`refreshForBrand: brand ${brandId} not found`);
          return null;
        }
        links = (brand.socialLinks as BrandSocialLinks | null) ?? {};
      }

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

      await this.prisma.brand.update({
        where: { id: brandId },
        data: { socialAnalytics: blob as unknown as object },
      });

      this.logger.log(`Refreshed social analytics for brand ${brandId}`);
      return blob;
    } finally {
      await this.redis.del(lockKey).catch((err) => {
        this.logger.warn(`Failed to release refresh lock for ${brandId}`, err);
      });
    }
  }

  // ─── Private scrapers ─────────────────────────────────────────

  private async scrapeInstagram(handle: string | undefined): Promise<BrandSocialAnalyticsCounters> {
    if (!handle) return emptyCounters('not connected');
    if (!this.client) return emptyCounters('Apify not configured');
    const username = normalizeHandle('instagram', handle);
    if (!username) return emptyCounters('invalid handle');
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
    if (!slug) return emptyCounters('invalid handle');
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
    if (!username) return emptyCounters('invalid handle');
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

  // ─── Post-level scrapers (PR 2: per-URL submission verification) ────
  //
  // Each accepts an array of URLs, batches them into a SINGLE actor run
  // (one billable invocation per channel per submission), and returns a
  // Map keyed by the original input URL. On per-URL failure we record an
  // `{ error }` entry rather than throwing — the caller persists those
  // alongside successful scrapes so brands see a partial verification
  // report instead of a 500.

  /**
   * Scrape Instagram posts. Accepts the URLs to pass via `directUrls`.
   * Returns a Map keyed by the input URL → ScrapedPostData OR `{ error }`.
   */
  async scrapeInstagramPosts(
    urls: string[],
  ): Promise<Map<string, PostScrapeResult>> {
    const out = new Map<string, PostScrapeResult>();
    if (urls.length === 0) return out;
    if (!this.client) {
      for (const u of urls) out.set(u, { error: 'Apify not configured' });
      return out;
    }
    try {
      const run = await this.client.actor(INSTAGRAM_POST_ACTOR).call(
        {
          directUrls: urls,
          resultsType: 'posts',
          resultsLimit: urls.length,
        },
        { waitSecs: this.waitSecs },
      );
      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems({ limit: Math.max(urls.length, 50) });
      // Build URL → item index. Apify items expose the source URL as `url`
      // (sometimes `inputUrl` for batch runs); match either.
      for (const url of urls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = items.find((it: any) => it.url === url || it.inputUrl === url);
        if (!item) {
          out.set(url, { error: 'No data returned from actor' });
          continue;
        }
        out.set(url, mapInstagramPostItem(item, url));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Instagram post scrape failed for ${urls.length} URL(s): ${msg}`);
      for (const u of urls) out.set(u, { error: msg });
    }
    return out;
  }

  /**
   * Scrape TikTok posts. Uses the same `clockworks/tiktok-scraper` actor
   * as the profile scraper, but in post mode (`postURLs`).
   */
  async scrapeTiktokPosts(
    urls: string[],
  ): Promise<Map<string, PostScrapeResult>> {
    const out = new Map<string, PostScrapeResult>();
    if (urls.length === 0) return out;
    if (!this.client) {
      for (const u of urls) out.set(u, { error: 'Apify not configured' });
      return out;
    }
    try {
      const run = await this.client.actor(TIKTOK_POST_ACTOR).call(
        {
          postURLs: urls,
          resultsPerPage: Math.max(urls.length, 1),
        },
        { waitSecs: this.waitSecs },
      );
      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems({ limit: Math.max(urls.length, 50) });
      for (const url of urls) {
        // TikTok actor surfaces the post URL as `webVideoUrl` (sometimes
        // also `videoUrl`). Match either.
        const item = items.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (it: any) => it.webVideoUrl === url || it.videoUrl === url || it.url === url,
        );
        if (!item) {
          out.set(url, { error: 'No data returned from actor' });
          continue;
        }
        out.set(url, mapTiktokPostItem(item, url));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`TikTok post scrape failed for ${urls.length} URL(s): ${msg}`);
      for (const u of urls) out.set(u, { error: msg });
    }
    return out;
  }

  /**
   * Scrape Facebook posts. Known to be flaky on private/limited posts —
   * we surface per-URL errors but never throw.
   */
  async scrapeFacebookPosts(
    urls: string[],
  ): Promise<Map<string, PostScrapeResult>> {
    const out = new Map<string, PostScrapeResult>();
    if (urls.length === 0) return out;
    if (!this.client) {
      for (const u of urls) out.set(u, { error: 'Apify not configured' });
      return out;
    }
    try {
      const run = await this.client.actor(FACEBOOK_POST_ACTOR).call(
        {
          startUrls: urls.map((url) => ({ url })),
          resultsLimit: urls.length,
        },
        { waitSecs: this.waitSecs },
      );
      const { items } = await this.client
        .dataset(run.defaultDatasetId)
        .listItems({ limit: Math.max(urls.length, 50) });
      for (const url of urls) {
        const item = items.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (it: any) => it.url === url || it.postUrl === url || it.facebookUrl === url,
        );
        if (!item) {
          out.set(url, { error: 'Facebook scrape unavailable' });
          continue;
        }
        out.set(url, mapFacebookPostItem(item, url));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Facebook post scrape failed for ${urls.length} URL(s): ${msg}`);
      for (const u of urls) out.set(u, { error: 'Facebook scrape unavailable' });
    }
    return out;
  }
}
