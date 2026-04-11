// MOCK DATA — replace with real Apify results when integration lands.
// See DevApify skill for the eventual integration contract.
//
// Each metric is a deterministic djb2 hash of `${orgId}:${platform}:${metric}`
// bucketed into a plausible per-platform range, so any brand always renders
// the same numbers across page refreshes, viewers, and routes.

export interface BrandSocialAnalytics {
  followers: number;
  postCount: number;
  avgLikes: number;
  engagementRate: number; // percent, 1 decimal
}

export type MockPlatform = 'instagram' | 'tiktok' | 'facebook';

export const MOCK_PLATFORMS: MockPlatform[] = ['instagram', 'tiktok', 'facebook'];

interface PlatformRanges {
  followers: [number, number];
  posts: [number, number];
  // engagement expressed in tenths-of-percent so we can keep integer math
  // (e.g. [15, 60] → 1.5 %–6.0 %)
  engagementTenths: [number, number];
}

const RANGES: Record<MockPlatform, PlatformRanges> = {
  instagram: {
    followers: [500, 250_000],
    posts: [30, 800],
    engagementTenths: [15, 60], // 1.5 %–6.0 %
  },
  tiktok: {
    followers: [1_000, 2_000_000],
    posts: [20, 400],
    engagementTenths: [40, 120], // 4.0 %–12.0 %
  },
  facebook: {
    followers: [200, 500_000],
    posts: [50, 2_000],
    engagementTenths: [5, 30], // 0.5 %–3.0 %
  },
};

// djb2 string hash → stable unsigned 32-bit integer
function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function pickInRange(seed: string, [min, max]: [number, number]): number {
  const span = max - min + 1;
  return min + (djb2(seed) % span);
}

export function getMockBrandSocialAnalytics(
  orgId: string,
  platform: MockPlatform,
): BrandSocialAnalytics {
  const ranges = RANGES[platform];
  const followers = pickInRange(`${orgId}:${platform}:followers`, ranges.followers);
  const postCount = pickInRange(`${orgId}:${platform}:posts`, ranges.posts);
  const engagementTenths = pickInRange(
    `${orgId}:${platform}:engagement`,
    ranges.engagementTenths,
  );
  const engagementRate = engagementTenths / 10;
  const avgLikes = Math.round((followers * engagementRate) / 100);

  return {
    followers,
    postCount,
    avgLikes,
    engagementRate,
  };
}
