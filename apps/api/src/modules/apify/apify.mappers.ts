import { PostFormat } from '@social-bounty/shared';
import type { BrandSocialAnalyticsCounters, ScrapedPostData } from '@social-bounty/shared';

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

function stringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') return null;
  return v;
}

function isoOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    // Treat number as unix seconds if < 1e12 else millis
    const millis = v < 1e12 ? v * 1000 : v;
    const d = new Date(millis);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function emptyScrapedPost(): ScrapedPostData {
  return {
    likes: null,
    comments: null,
    views: null,
    caption: null,
    taggedUsernames: [],
    ownerUsername: null,
    postedAt: null,
    isVideo: null,
    detectedFormat: null,
  };
}

// ─── Post-level mappers (PR 2: per-URL submission verification) ─────

/**
 * apify/instagram-scraper post item → ScrapedPostData.
 *
 * The actor returns objects with `type` set to 'Video', 'Image', or 'Sidecar'
 * (carousel). `videoViewCount` is only present when `type === 'Video'`. For
 * tagged users the actor exposes `taggedUsers[].username`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInstagramPostItem(item: any, sourceUrl?: string): ScrapedPostData {
  if (!item) return emptyScrapedPost();
  const isVideo = item.type === 'Video' || item.videoUrl != null || item.videoViewCount != null;
  const taggedUsernames: string[] = [];
  if (Array.isArray(item.taggedUsers)) {
    for (const u of item.taggedUsers) {
      const name = stringOrNull(u?.username);
      if (name) taggedUsernames.push(name);
    }
  }
  // Detect format from URL path first (more reliable than item.type — e.g.
  // a Reel and a feed video both come back with type='Video', but only the
  // Reel URL contains /reel/ or /reels/).
  let detectedFormat: PostFormat | null = null;
  const url = stringOrNull(sourceUrl) ?? stringOrNull(item.url);
  if (url) {
    if (/\/reels?\//i.test(url)) detectedFormat = PostFormat.REEL;
    else if (/\/p\//i.test(url)) detectedFormat = PostFormat.FEED_POST;
    else if (/\/stories\//i.test(url)) detectedFormat = PostFormat.STORY;
  }
  return {
    likes: numberOrNull(item.likesCount),
    comments: numberOrNull(item.commentsCount),
    views: numberOrNull(item.videoViewCount ?? item.videoPlayCount),
    caption: stringOrNull(item.caption),
    taggedUsernames,
    ownerUsername: stringOrNull(item.ownerUsername),
    postedAt: isoOrNull(item.timestamp),
    isVideo,
    detectedFormat,
  };
}

/**
 * clockworks/tiktok-scraper post item → ScrapedPostData.
 *
 * Post-mode payload nests text under `text` and metrics under `playCount`,
 * `diggCount`, `commentCount`. Owner is at `authorMeta.name`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTiktokPostItem(item: any, sourceUrl?: string): ScrapedPostData {
  if (!item) return emptyScrapedPost();
  const taggedUsernames: string[] = [];
  // TikTok stores mentions as @-prefixed words inside `text`; the scraper
  // also exposes `mentions[]`. Prefer the structured field if present.
  if (Array.isArray(item.mentions)) {
    for (const m of item.mentions) {
      const name = stringOrNull(m);
      if (name) taggedUsernames.push(name.replace(/^@/, ''));
    }
  } else if (typeof item.text === 'string') {
    const re = /@([a-zA-Z0-9_.-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(item.text)) !== null) {
      taggedUsernames.push(match[1]);
    }
  }
  // TikTok URLs are always video posts.
  let detectedFormat: PostFormat | null = null;
  const url = stringOrNull(sourceUrl) ?? stringOrNull(item.webVideoUrl);
  if (url && /(\/video\/|\/v\/|\/@[^/]+\/video\/)/i.test(url)) {
    detectedFormat = PostFormat.VIDEO_POST;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const author: any = item.authorMeta ?? {};
  return {
    likes: numberOrNull(item.diggCount),
    comments: numberOrNull(item.commentCount),
    views: numberOrNull(item.playCount),
    caption: stringOrNull(item.text),
    taggedUsernames,
    ownerUsername: stringOrNull(author.name ?? author.uniqueId),
    postedAt: isoOrNull(item.createTimeISO ?? item.createTime),
    isVideo: true,
    detectedFormat,
  };
}

/**
 * apify/facebook-posts-scraper post item → ScrapedPostData.
 *
 * Best-effort. Facebook URLs and post payloads do not consistently expose
 * format (REEL vs FEED_POST). `detectedFormat` is left null so the
 * `formatMatch` check skips silently for FB submissions.
 *
 * Field names differ across the actor's output shapes; we read the most
 * common ones and tolerate missing values.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFacebookPostItem(item: any, _sourceUrl?: string): ScrapedPostData {
  if (!item) return emptyScrapedPost();
  const taggedUsernames: string[] = [];
  if (Array.isArray(item.taggedUsers)) {
    for (const u of item.taggedUsers) {
      const name = stringOrNull(u?.name ?? u?.username);
      if (name) taggedUsernames.push(name);
    }
  }
  const isVideo =
    item.type === 'Video' || item.media?.type === 'Video' || item.videoUrl != null;
  return {
    likes: numberOrNull(item.likesCount ?? item.likes ?? item.reactionsCount),
    comments: numberOrNull(item.commentsCount ?? item.comments),
    views: numberOrNull(item.viewsCount ?? item.videoViewCount),
    caption: stringOrNull(item.text ?? item.caption ?? item.message),
    taggedUsernames,
    ownerUsername: stringOrNull(item.user?.name ?? item.author?.name ?? item.pageName),
    postedAt: isoOrNull(item.time ?? item.timestamp ?? item.publishedTime),
    isVideo,
    // Facebook URLs don't expose format reliably — leave null so
    // the formatMatch check skips silently.
    detectedFormat: null,
  };
}
