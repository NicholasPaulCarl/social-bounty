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
});
