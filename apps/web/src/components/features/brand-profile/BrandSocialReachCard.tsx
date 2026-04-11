'use client';

import type { BrandSocialLinks } from '@social-bounty/shared';
import { formatCount } from '@/lib/utils/format';
import {
  MOCK_PLATFORMS,
  getMockBrandSocialAnalytics,
  type MockPlatform,
} from '@/lib/mock/apify';

interface BrandSocialReachCardProps {
  orgId: string;
  socialLinks: BrandSocialLinks | null;
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

export function BrandSocialReachCard({ orgId, socialLinks }: BrandSocialReachCardProps) {
  const links = socialLinks ?? {};
  const tiles = MOCK_PLATFORMS.filter((p) => !!links[p]).map((platform) => ({
    platform,
    handle: links[platform] as string,
    analytics: getMockBrandSocialAnalytics(orgId, platform),
  }));

  if (tiles.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
        Social Reach
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map(({ platform, handle, analytics }) => {
          const meta = PLATFORM_META[platform];
          const href = `${meta.urlPrefix}${handle}`;
          return (
            <div key={platform} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className={`${meta.icon} ${meta.color} text-lg`} />
                  <span className="text-text-primary font-heading font-semibold text-sm">
                    {meta.label}
                  </span>
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-text-muted hover:text-accent-cyan transition-colors inline-flex items-center gap-1"
                >
                  @{handle}
                  <i className="pi pi-external-link text-[10px]" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {formatCount(analytics.followers)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Followers</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {formatCount(analytics.postCount)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Posts</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {formatCount(analytics.avgLikes)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Avg Likes</p>
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-accent-cyan">
                    {analytics.engagementRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Engagement</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-text-muted italic mt-2">
        Mock data — Apify integration pending.
      </p>
    </div>
  );
}
