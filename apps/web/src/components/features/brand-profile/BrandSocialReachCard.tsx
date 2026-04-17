'use client';

import { memo, useMemo } from 'react';
import type {
  BrandSocialAnalyticsBlob,
  BrandSocialAnalyticsCounters,
  BrandSocialLinks,
} from '@social-bounty/shared';
import { formatCount, formatRelativeTime } from '@/lib/utils/format';

interface BrandSocialReachCardProps {
  brandId: string;
  socialLinks: BrandSocialLinks | null;
  analytics: BrandSocialAnalyticsBlob | null;
}

type Platform = 'instagram' | 'tiktok' | 'facebook';

const PLATFORMS: Platform[] = ['instagram', 'tiktok', 'facebook'];

const PLATFORM_META: Record<Platform, { label: string; icon: string; color: string; urlPrefix: string }> = {
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

function hasRealCounters(c: BrandSocialAnalyticsCounters | undefined): boolean {
  if (!c) return false;
  if (c.error && c.error !== 'not connected') return false;
  return (
    c.followersCount !== null ||
    c.postsCount !== null ||
    c.avgLikes !== null
  );
}

function display(n: number | null | undefined): string {
  if (n === null || n === undefined) return '--';
  return formatCount(n);
}

function BrandSocialReachCardImpl({ socialLinks, analytics }: BrandSocialReachCardProps) {
  const tiles = useMemo(() => {
    const links = socialLinks ?? {};
    return PLATFORMS.map((platform) => {
      const handle = (links[platform] as string | undefined) ?? null;
      const counters = analytics?.[platform];
      const real = hasRealCounters(counters);
      return { platform, handle, counters, real };
    });
  }, [socialLinks, analytics]);

  const footerText = analytics?.fetchedAt
    ? `Last updated ${formatRelativeTime(analytics.fetchedAt)}`
    : 'No data yet — will update on next login';

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
        Social Reach
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map(({ platform, handle, counters, real }) => {
          const meta = PLATFORM_META[platform];
          const href = handle ? `${meta.urlPrefix}${handle}` : null;
          return (
            <div key={platform} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* Icon is clickable if handle exists — links to the social profile */}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${meta.color} hover:opacity-70 transition-opacity`}
                      title={`View ${meta.label} profile`}
                    >
                      <i className={`${meta.icon} text-lg`} />
                    </a>
                  ) : (
                    <i className={`${meta.icon} text-text-muted text-lg`} />
                  )}
                  <span className="text-text-primary font-heading font-semibold text-sm">
                    {meta.label}
                  </span>
                  {counters?.error && counters.error !== 'not connected' && (
                    <i
                      className="pi pi-exclamation-circle text-accent-rose text-xs"
                      title={counters.error}
                    />
                  )}
                </div>
                {!handle && (
                  <span className="text-xs text-text-muted italic">Not connected</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {real ? display(counters?.followersCount) : '--'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Followers</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {real ? display(counters?.postsCount) : '--'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Posts</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {real ? display(counters?.avgLikes) : '--'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Avg Likes</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {real && counters?.engagementRate != null
                      ? `${counters.engagementRate.toFixed(1)}%`
                      : '--'}
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
