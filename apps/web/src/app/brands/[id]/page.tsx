'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useBrandPublicProfile } from '@/hooks/useBrand';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { getUploadUrl } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { BrandSocialReachCard } from '@/components/features/brand-profile/BrandSocialReachCard';
import type { BrandSocialLinks } from '@social-bounty/shared';

const SOCIAL_LINK_CONFIG: { key: keyof BrandSocialLinks; icon: string; urlPrefix: string }[] = [
  { key: 'instagram', icon: 'pi pi-instagram', urlPrefix: 'https://instagram.com/' },
  { key: 'tiktok', icon: 'pi pi-tiktok', urlPrefix: 'https://tiktok.com/@' },
  { key: 'facebook', icon: 'pi pi-facebook', urlPrefix: 'https://facebook.com/' },
  { key: 'x', icon: 'pi pi-twitter', urlPrefix: 'https://x.com/' },
  { key: 'website', icon: 'pi pi-globe', urlPrefix: '' },
];

export default function BrandProfilePage() {
  const params = useParams();
  const idOrHandle = params.id as string;
  const { data: brand, isLoading, error, refetch } = useBrandPublicProfile(idOrHandle);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!brand) return null;

  const socialLinks = brand.socialLinks || {};
  const activeSocials = SOCIAL_LINK_CONFIG.filter((s) => socialLinks[s.key]);

  return (
    <div className="animate-fade-up">
      {/* Cover Photo Hero — no border, no breadcrumbs */}
      <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6 bg-gradient-to-r from-accent-cyan/20 to-accent-blue/20">
        {brand.coverPhotoUrl && (
          <Image
            src={getUploadUrl(brand.coverPhotoUrl)!}
            alt={`${brand.name} cover`}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Brand Info */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex items-start gap-4 flex-1">
          {/* Profile picture — no border/ring */}
          {brand.logo ? (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-bg-void">
              <Image
                src={getUploadUrl(brand.logo)!}
                alt={brand.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl shrink-0 bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-heading font-bold text-xl">
              {brand.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">{brand.name}</h1>
            {/* Handle first, then join date — same line, same font size */}
            <p className="text-xs text-text-muted mt-0.5">
              {brand.handle && (
                <span className="mr-2">@{brand.handle}</span>
              )}
              <span>
                <i className="pi pi-calendar text-[10px] mr-1" />
                Joined {formatDate(brand.createdAt)}
              </span>
            </p>
            {/* Bio underneath */}
            {brand.bio && (
              <p className="text-text-secondary mt-2 max-w-2xl text-sm">{brand.bio}</p>
            )}
          </div>
        </div>

        {/* Social Links — grayscale icons only, no button/border */}
        {activeSocials.length > 0 && (
          <div className="flex items-center gap-3">
            {activeSocials.map((social) => {
              const value = socialLinks[social.key]!;
              const href = social.key === 'website' ? value : `${social.urlPrefix}${value}`;
              return (
                <a
                  key={social.key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-text-primary transition-colors"
                  title={social.key}
                >
                  <i className={`${social.icon} text-lg`} />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 text-center">
          <p className="text-2xl font-heading font-bold text-accent-cyan">{brand.stats.bountiesPosted}</p>
          <p className="text-sm text-text-muted mt-1">Bounties Posted</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-2xl font-heading font-bold text-accent-cyan">
            {brand.stats.bountiesPosted > 0
              ? formatCurrency(brand.stats.totalBountyAmount)
              : 'No bounties yet'}
          </p>
          <p className="text-sm text-text-muted mt-1">Total Rewards</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-2xl font-heading font-bold text-accent-cyan">
            {brand.stats.bountiesPosted > 0
              ? `${brand.stats.achievementRate}%`
              : 'No bounties yet'}
          </p>
          <p className="text-sm text-text-muted mt-1">Achievement Rate</p>
        </div>
      </div>

      {/* Social Reach */}
      <BrandSocialReachCard
        orgId={brand.id}
        socialLinks={brand.socialLinks}
        analytics={brand.socialAnalytics}
      />

      {/* Target Interests */}
      {brand.targetInterests && brand.targetInterests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">Target Interests</h3>
          <div className="flex flex-wrap gap-2">
            {brand.targetInterests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1.5 rounded-full text-sm bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Website */}
      {brand.websiteUrl && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">Website</h3>
          <a
            href={brand.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-cyan hover:text-accent-cyan/80 transition-colors inline-flex items-center gap-1.5"
          >
            <i className="pi pi-external-link text-xs" />
            {brand.websiteUrl}
          </a>
        </div>
      )}

      {/* CTA */}
      <div className="glass-card p-6 text-center">
        <p className="text-text-secondary mb-4">Interested in this brand&apos;s bounties?</p>
        <Link
          href={`/bounties?brand=${brand.id}`}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-accent-cyan to-accent-blue shadow-glow-cyan hover:shadow-glow-cyan-intense transition-all duration-normal"
        >
          <i className="pi pi-search" />
          Browse Bounties
        </Link>
      </div>
    </div>
  );
}
