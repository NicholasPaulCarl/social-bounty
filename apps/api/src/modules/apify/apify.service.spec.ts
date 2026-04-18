import { ConfigService } from '@nestjs/config';
import type { BrandSocialAnalyticsBlob } from '@social-bounty/shared';
import { ApifyService } from './apify.service';

type MockPrisma = {
  brand: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

type MockRedis = {
  setNxEx: jest.Mock;
  del: jest.Mock;
};

function makeConfig(token: string | null): ConfigService {
  const map: Record<string, unknown> = {
    APIFY_API_TOKEN: token,
    APIFY_ACTOR_TIMEOUT_MS: 60_000,
  };
  return {
    get: jest.fn((k: string, def?: unknown) => {
      const v = map[k];
      return v === undefined || v === null ? def : v;
    }),
  } as unknown as ConfigService;
}

function makePrisma(): MockPrisma {
  return {
    brand: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

function makeRedis(acquired = true): MockRedis {
  return {
    setNxEx: jest.fn().mockResolvedValue(acquired),
    del: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ApifyService', () => {
  describe('when APIFY_API_TOKEN is missing', () => {
    it('reports disabled and no-ops on refresh calls', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig(null),
        prisma as never,
        redis as never,
      );

      expect(service.isEnabled()).toBe(false);
      await service.refreshIfStale('brand-1');
      await service.refreshForBrand('brand-1');

      expect(prisma.brand.findUnique).not.toHaveBeenCalled();
      expect(prisma.brand.update).not.toHaveBeenCalled();
    });
  });

  describe('refreshIfStale staleness guard', () => {
    it('skips refresh when snapshot is < 24h old', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const freshBlob: BrandSocialAnalyticsBlob = {
        fetchedAt: new Date(Date.now() - 60_000).toISOString(), // 1 minute ago
        instagram: { followersCount: 1, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: null },
        facebook: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: 'not connected' },
        tiktok: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: 'not connected' },
      };
      prisma.brand.findUnique.mockResolvedValue({
        id: 'brand-1',
        socialLinks: { instagram: 'nasa' },
        socialAnalytics: freshBlob,
      });
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      await service.refreshIfStale('brand-1');

      // Should only read once for staleness check, never write
      expect(prisma.brand.update).not.toHaveBeenCalled();
      expect(redis.setNxEx).not.toHaveBeenCalled();
    });

    it('refreshes when snapshot is older than 24h', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const staleBlob: BrandSocialAnalyticsBlob = {
        fetchedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25h ago
        instagram: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: null },
        facebook: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: null },
        tiktok: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: null },
      };
      prisma.brand.findUnique.mockResolvedValue({
        id: 'brand-1',
        socialLinks: {}, // no handles → no real actor calls needed
        socialAnalytics: staleBlob,
      });
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      await service.refreshIfStale('brand-1');

      expect(redis.setNxEx).toHaveBeenCalled();
      expect(prisma.brand.update).toHaveBeenCalledTimes(1);
    });

    it('refreshes when fetchedAt is in the future (corrupt / spoofed)', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const futureBlob: BrandSocialAnalyticsBlob = {
        fetchedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        instagram: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: null },
        facebook: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: null },
        tiktok: { followersCount: null, followingCount: null, postsCount: null, totalLikes: null, avgLikes: null, engagementRate: null, error: null },
      };
      prisma.brand.findUnique.mockResolvedValue({
        id: 'brand-1',
        socialLinks: {},
        socialAnalytics: futureBlob,
      });
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      await service.refreshIfStale('brand-1');

      // Future timestamps should not be trusted; we should proceed to refresh
      expect(redis.setNxEx).toHaveBeenCalled();
      expect(prisma.brand.update).toHaveBeenCalledTimes(1);
    });

    it('swallows errors so a failed scrape does not crash the caller', async () => {
      const prisma = makePrisma();
      prisma.brand.findUnique.mockRejectedValue(new Error('boom'));
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      await expect(service.refreshIfStale('brand-1')).resolves.toBeUndefined();
    });
  });

  describe('refreshForBrand lock behavior', () => {
    it('bails out when the refresh lock is already held', async () => {
      const prisma = makePrisma();
      const redis = makeRedis(false); // lock not acquired
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      const result = await service.refreshForBrand('brand-1');

      expect(result).toBeNull();
      expect(prisma.brand.findUnique).not.toHaveBeenCalled();
      expect(prisma.brand.update).not.toHaveBeenCalled();
    });

    it('releases the lock on success', async () => {
      const prisma = makePrisma();
      prisma.brand.findUnique.mockResolvedValue({
        id: 'brand-1',
        socialLinks: {},
      });
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      await service.refreshForBrand('brand-1');

      expect(redis.del).toHaveBeenCalledWith('apify:refresh-lock:brand-1');
    });

    it('still releases the lock when the DB update throws', async () => {
      const prisma = makePrisma();
      prisma.brand.findUnique.mockResolvedValue({
        id: 'brand-1',
        socialLinks: {},
      });
      prisma.brand.update.mockRejectedValue(new Error('db down'));
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      await expect(service.refreshForBrand('brand-1')).rejects.toThrow('db down');
      expect(redis.del).toHaveBeenCalledWith('apify:refresh-lock:brand-1');
    });
  });

  describe('handle normalization (empty / unconnected)', () => {
    it('produces "not connected" counters when a brand has no handles', async () => {
      const prisma = makePrisma();
      prisma.brand.findUnique.mockResolvedValue({
        id: 'brand-1',
        socialLinks: {},
      });
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );

      const blob = await service.refreshForBrand('brand-1');

      expect(blob).not.toBeNull();
      expect(blob!.instagram.error).toBe('not connected');
      expect(blob!.facebook.error).toBe('not connected');
      expect(blob!.tiktok.error).toBe('not connected');
      expect(blob!.instagram.followersCount).toBeNull();
    });
  });

  // ─── Post-level scrapers (PR 2: per-URL submission verification) ───
  //
  // Token absent → returns Map with `{ error: 'Apify not configured' }`
  // entries per URL. Token present → batches all URLs into ONE actor call
  // and merges results back to the input URL. Per-URL failures (e.g. one
  // URL's data missing from the dataset) surface as `{ error }` rather than
  // throwing.

  function buildClientCapture() {
    const calls: Array<{ actor: string; input: unknown }> = [];
    let listItems: unknown[] = [];
    const apifyClient = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actor: jest.fn((name: string) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call: jest.fn(async (input: any) => {
          calls.push({ actor: name, input });
          return { defaultDatasetId: 'ds-1' };
        }),
      })),
      dataset: jest.fn(() => ({
        listItems: jest.fn(async () => ({ items: listItems })),
      })),
    };
    return {
      apifyClient,
      calls,
      setItems(items: unknown[]) {
        listItems = items;
      },
    };
  }

  function withClient(svc: ApifyService, client: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (svc as any).client = client;
  }

  describe('scrapeInstagramPosts', () => {
    it('returns error map when token is missing', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig(null),
        prisma as never,
        redis as never,
      );

      const result = await service.scrapeInstagramPosts([
        'https://instagram.com/reels/AAA',
      ]);
      expect(result.size).toBe(1);
      const value = result.get('https://instagram.com/reels/AAA') as {
        error: string;
      };
      expect(value.error).toContain('Apify');
    });

    it('batches multiple URLs into a single actor call', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );
      const cap = buildClientCapture();
      cap.setItems([
        {
          url: 'https://instagram.com/reels/AAA',
          likesCount: 10,
          commentsCount: 1,
          videoViewCount: 100,
          caption: '@brand cool',
          taggedUsers: [{ username: 'brand' }],
          ownerUsername: 'me',
          timestamp: '2026-04-17T00:00:00Z',
          type: 'Video',
        },
        {
          url: 'https://instagram.com/reels/BBB',
          likesCount: 22,
          commentsCount: 2,
          videoViewCount: 222,
          caption: '@brand nicer',
          taggedUsers: [{ username: 'brand' }],
          ownerUsername: 'me',
          timestamp: '2026-04-17T01:00:00Z',
          type: 'Video',
        },
      ]);
      withClient(service, cap.apifyClient);

      const out = await service.scrapeInstagramPosts([
        'https://instagram.com/reels/AAA',
        'https://instagram.com/reels/BBB',
      ]);

      expect(cap.calls).toHaveLength(1);
      expect(cap.calls[0].actor).toBe('apify/instagram-scraper');
      expect((cap.calls[0].input as { directUrls: string[] }).directUrls).toEqual([
        'https://instagram.com/reels/AAA',
        'https://instagram.com/reels/BBB',
      ]);
      expect(out.size).toBe(2);
      // First URL got mapped to ScrapedPostData
      const a = out.get('https://instagram.com/reels/AAA') as { likes: number };
      expect(a.likes).toBe(10);
    });

    it('returns per-URL error when actor throws', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );
      withClient(service, {
        actor: jest.fn(() => ({
          call: jest.fn().mockRejectedValue(new Error('actor timeout')),
        })),
        dataset: jest.fn(),
      });

      const out = await service.scrapeInstagramPosts([
        'https://instagram.com/reels/AAA',
      ]);
      const v = out.get('https://instagram.com/reels/AAA') as { error: string };
      expect(v.error).toBe('actor timeout');
    });
  });

  describe('scrapeTiktokPosts', () => {
    it('returns error map when token is missing', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig(null),
        prisma as never,
        redis as never,
      );
      const out = await service.scrapeTiktokPosts([
        'https://tiktok.com/@u/video/1',
      ]);
      expect(out.size).toBe(1);
      const v = out.get('https://tiktok.com/@u/video/1') as { error: string };
      expect(v.error).toContain('Apify');
    });

    it('batches URLs and uses postURLs input shape', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );
      const cap = buildClientCapture();
      cap.setItems([
        {
          webVideoUrl: 'https://tiktok.com/@u/video/1',
          diggCount: 50,
          commentCount: 5,
          playCount: 5000,
          text: 'shout out @brand',
          mentions: ['@brand'],
          authorMeta: { name: 'me', uniqueId: 'me' },
          createTimeISO: '2026-04-17T00:00:00Z',
        },
        {
          webVideoUrl: 'https://tiktok.com/@u/video/2',
          diggCount: 80,
          commentCount: 8,
          playCount: 6000,
          text: 'shout out @brand again',
          mentions: ['@brand'],
          authorMeta: { name: 'me', uniqueId: 'me' },
          createTimeISO: '2026-04-17T01:00:00Z',
        },
      ]);
      withClient(service, cap.apifyClient);

      const out = await service.scrapeTiktokPosts([
        'https://tiktok.com/@u/video/1',
        'https://tiktok.com/@u/video/2',
      ]);

      expect(cap.calls).toHaveLength(1);
      expect(cap.calls[0].actor).toBe('clockworks/tiktok-scraper');
      expect((cap.calls[0].input as { postURLs: string[] }).postURLs).toEqual([
        'https://tiktok.com/@u/video/1',
        'https://tiktok.com/@u/video/2',
      ]);
      expect(out.size).toBe(2);
      const a = out.get('https://tiktok.com/@u/video/1') as { likes: number };
      expect(a.likes).toBe(50);
    });

    it('returns per-URL error when the actor throws', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );
      withClient(service, {
        actor: jest.fn(() => ({
          call: jest.fn().mockRejectedValue(new Error('rate limited')),
        })),
        dataset: jest.fn(),
      });

      const out = await service.scrapeTiktokPosts([
        'https://tiktok.com/@u/video/1',
      ]);
      const v = out.get('https://tiktok.com/@u/video/1') as { error: string };
      expect(v.error).toBe('rate limited');
    });
  });

  describe('scrapeFacebookPosts', () => {
    it('returns error map when token is missing', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig(null),
        prisma as never,
        redis as never,
      );
      const out = await service.scrapeFacebookPosts([
        'https://facebook.com/x/posts/1',
      ]);
      expect(out.size).toBe(1);
      const v = out.get('https://facebook.com/x/posts/1') as { error: string };
      expect(v.error).toContain('Apify');
    });

    it('batches URLs into one call and falls back to "Facebook scrape unavailable" on missing items', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );
      const cap = buildClientCapture();
      // Only one of the URLs has data — second URL must surface as
      // "Facebook scrape unavailable"
      cap.setItems([
        {
          url: 'https://facebook.com/x/posts/1',
          likesCount: 9,
          commentsCount: 1,
          text: 'shout out @brand',
        },
      ]);
      withClient(service, cap.apifyClient);

      const out = await service.scrapeFacebookPosts([
        'https://facebook.com/x/posts/1',
        'https://facebook.com/x/posts/2',
      ]);

      expect(cap.calls).toHaveLength(1);
      expect(cap.calls[0].actor).toBe('apify/facebook-posts-scraper');
      expect(
        (cap.calls[0].input as { startUrls: Array<{ url: string }> }).startUrls,
      ).toEqual([
        { url: 'https://facebook.com/x/posts/1' },
        { url: 'https://facebook.com/x/posts/2' },
      ]);
      expect(out.size).toBe(2);
      const ok = out.get('https://facebook.com/x/posts/1') as { likes: number };
      expect(ok.likes).toBe(9);
      const missing = out.get('https://facebook.com/x/posts/2') as { error: string };
      expect(missing.error).toBe('Facebook scrape unavailable');
    });

    it('returns "Facebook scrape unavailable" for every URL when actor throws', async () => {
      const prisma = makePrisma();
      const redis = makeRedis();
      const service = new ApifyService(
        makeConfig('apify_api_test'),
        prisma as never,
        redis as never,
      );
      withClient(service, {
        actor: jest.fn(() => ({
          call: jest.fn().mockRejectedValue(new Error('boom')),
        })),
        dataset: jest.fn(),
      });

      const out = await service.scrapeFacebookPosts([
        'https://facebook.com/x/posts/1',
      ]);
      const v = out.get('https://facebook.com/x/posts/1') as { error: string };
      expect(v.error).toBe('Facebook scrape unavailable');
    });
  });
});
