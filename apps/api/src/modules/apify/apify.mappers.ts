import type { BrandSocialAnalyticsCounters } from '@social-bounty/shared';

export function emptyCounters(error: string | null = null): BrandSocialAnalyticsCounters {
  return {
    followersCount: null,
    followingCount: null,
    postsCount: null,
    totalLikes: null,
    avgLikes: null,
    engagementRate: null,
    error,
  };
}

/**
 * Strip any URL prefix, leading @, or trailing slash from a handle input so
 * Apify actors receive a clean username slug.
 */
export function normalizeHandle(platform: 'instagram' | 'facebook' | 'tiktok', raw: string): string {
  let v = raw.trim();
  if (!v) return v;
  // Drop protocol + host
  v = v.replace(/^https?:\/\/[^/]+\//i, '');
  // Drop leading platform path segments like "@"
  v = v.replace(/^@+/, '');
  // Trim trailing slashes
  v = v.replace(/\/+$/, '');
  // For TikTok, users often paste "@name" or "name" — both normalized above
  // For Facebook, users may paste a page URL like facebook.com/NASA — also handled
  return v;
}

// ─── Mappers ───────────────────────────────────────────────────────

/**
 * apify/instagram-profile-scraper dataset item → counters.
 * Field names based on the Apify actor's conventional output schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInstagramItem(item: any): BrandSocialAnalyticsCounters {
  if (!item) return emptyCounters('No data returned from actor');
  const followersCount = numberOrNull(item.followersCount);
  const followingCount = numberOrNull(item.followsCount ?? item.followingCount);
  const postsCount = numberOrNull(item.postsCount);
  // Instagram scrapers sometimes include `latestPosts[]` with `likesCount` — compute avg if present
  let avgLikes: number | null = null;
  if (Array.isArray(item.latestPosts) && item.latestPosts.length > 0) {
    const likes = item.latestPosts
      .map((p: { likesCount?: number }) => numberOrNull(p.likesCount))
      .filter((n: number | null): n is number => n !== null);
    if (likes.length > 0) {
      avgLikes = Math.round(likes.reduce((a: number, b: number) => a + b, 0) / likes.length);
    }
  }
  const engagementRate =
    avgLikes !== null && followersCount && followersCount > 0
      ? Math.round((avgLikes / followersCount) * 1000) / 10 // 1 decimal percent
      : null;
  return {
    followersCount,
    followingCount,
    postsCount,
    totalLikes: null,
    avgLikes,
    engagementRate,
    error: null,
  };
}

/**
 * apify/facebook-pages-scraper dataset item → counters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFacebookItem(item: any): BrandSocialAnalyticsCounters {
  if (!item) return emptyCounters('No data returned from actor');
  // Verified against a live run of apify/facebook-pages-scraper on NASA:
  //   { likes: 28565115, followers: 28565115, followings: 52, ... }
  // `likes` and `followers` are near-identical for most pages; prefer
  // `followers` and fall back to `likes`.
  const followersCount = numberOrNull(item.followers ?? item.likes);
  const followingCount = numberOrNull(item.followings);
  return {
    followersCount,
    followingCount,
    postsCount: null,
    totalLikes: null,
    avgLikes: null,
    engagementRate: null,
    error: null,
  };
}

/**
 * clockworks/tiktok-scraper dataset item → counters.
 * Profile-mode output nests under `authorMeta`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTiktokItem(item: any): BrandSocialAnalyticsCounters {
  if (!item) return emptyCounters('No data returned from actor');
  // Some clockworks responses return the profile fields at the top level
  // (when profileScrapeSections is set), others nest them under authorMeta.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta: any = item.authorMeta ?? item;
  const followersCount = numberOrNull(meta.fans ?? meta.followerCount);
  const followingCount = numberOrNull(meta.following ?? meta.followingCount);
  const totalLikes = numberOrNull(meta.heart ?? meta.heartCount);
  const postsCount = numberOrNull(meta.video ?? meta.videoCount);
  const avgLikes =
    totalLikes !== null && postsCount !== null && postsCount > 0
      ? Math.round(totalLikes / postsCount)
      : null;
  const engagementRate =
    avgLikes !== null && followersCount && followersCount > 0
      ? Math.round((avgLikes / followersCount) * 1000) / 10
      : null;
  return {
    followersCount,
    followingCount,
    postsCount,
    totalLikes,
    avgLikes,
    engagementRate,
    error: null,
  };
}

function numberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
