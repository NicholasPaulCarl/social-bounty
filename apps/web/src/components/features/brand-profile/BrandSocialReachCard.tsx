'use client';

import { memo, useMemo } from 'react';
import type {
  BrandSocialAnalyticsBlob,
  BrandSocialAnalyticsCounters,
  BrandSocialLinks,
} from '@social-bounty/shared';
import { formatCount, formatRelativeTime } from '@/lib/utils/format';
import {
  MOCK_PLATFORMS,
  getMockBrandSocialAnalytics,
  type MockPlatform,
} from '@/lib/mock/apify';

interface BrandSocialReachCardProps {
  orgId: string;
  socialLinks: BrandSocialLinks | null;
  analytics: BrandSocialAnalyticsBlob | null;
}

const PLATFORM_META: Record<MockPlatform, { label: string; icon: string; color: string; urlPrefix: string }> = {
  instagram: {
    label: 'Instagram',
    icon: 'pi pi-instagram',
    color: 'text-pink-400',
    urlPrefix: 'https://instagram.com/',
  },
  tiktok: {
    label: 'TikTok',
    icon: 'pi pi-tiktok',
    color: 'text-cyan-400',
    urlPrefix: 'https://tiktok.com/@',
  },
  facebook: {
    label: 'Facebook',
    icon: 'pi pi-facebook',
    color: 'text-blue-400',
    urlPrefix: 'https://facebook.com/',
  },
};

interface TileData {
  followers: number;
  postCount: number;
  avgLikes: number;
  engagementRate: number;
  isReal: boolean;
  error: string | null;
}

function counterHasRealData(c: BrandSocialAnalyticsCounters | undefined): boolean {
  if (!c) return false;
  if (c.error && c.error !== 'not connected') return false;
  return (
    c.followersCount !== null ||
    c.followingCount !== null ||
    c.postsCount !== null ||
    c.totalLikes !== null ||
    c.avgLikes !== null
  );
}

function buildTile(orgId: string, platform: MockPlatform, real: BrandSocialAnalyticsCounters | undefined): TileData {
  const mock = getMockBrandSocialAnalytics(orgId, platform);
  if (real && counterHasRealData(real)) {
    return {
      followers: real.followersCount ?? mock.followers,
      postCount: real.postsCount ?? mock.postCount,
      avgLikes: real.avgLikes ?? mock.avgLikes,
      engagementRate: real.engagementRate ?? mock.engagementRate,
      isReal: true,
      error: null,
    };
  }
  return {
    ...mock,
    isReal: false,
    error: real?.error && real.error !== 'not connected' ? real.error : null,
  };
}

function BrandSocialReachCardImpl({ orgId, socialLinks, analytics }: BrandSocialReachCardProps) {
  // Memoize the whole tile set so parent re-renders don't re-hash the mock
  // for each platform. Deps: orgId + the two data blobs.
  const tiles = useMemo(() => {
    const links = socialLinks ?? {};
    return MOCK_PLATFORMS.map((platform) => ({
      platform,
      handle: (links[platform] as string | undefined) ?? null,
      data: buildTile(orgId, platform, analytics?.[platform]),
    }));
  }, [orgId, socialLinks, analytics]);

  const footerText = analytics?.fetchedAt
    ? `Last updated ${formatRelativeTime(analytics.fetchedAt)}`
    : 'No data yet — will update on next login';

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
        Social Reach
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map(({ platform, handle, data }) => {
          const meta = PLATFORM_META[platform];
          const href = handle ? `${meta.urlPrefix}${handle}` : null;
          return (
            <div key={platform} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className={`${meta.icon} ${meta.color} text-lg`} />
                  <span className="text-text-primary font-heading font-semibold text-sm">
                    {meta.label}
                  </span>
                  {!data.isReal && (
                    <span className="text-[10px] uppercase tracking-wider text-text-muted border border-glass-border rounded px-1.5 py-0.5">
                      Sample
                    </span>
                  )}
                  {data.error && (
                    <i
                      className="pi pi-exclamation-circle text-accent-rose text-xs"
                      title={data.error}
                    />
                  )}
                </div>
                {href && handle ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-muted hover:text-accent-cyan transition-colors inline-flex items-center gap-1"
                  >
                    @{handle}
                    <i className="pi pi-external-link text-[10px]" />
                  </a>
                ) : (
                  <span className="text-xs text-text-muted italic">Not connected</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {formatCount(data.followers)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Followers</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {formatCount(data.postCount)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Posts</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {formatCount(data.avgLikes)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Avg Likes</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {data.engagementRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Engagement</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-text-muted italic mt-2">{footerText}</p>
    </div>
  );
}

export const BrandSocialReachCard = memo(BrandSocialReachCardImpl);
