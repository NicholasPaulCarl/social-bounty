'use client';

import { use } from 'react';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { usePublicProfile } from '@/hooks/useHunters';
import { SocialChannel } from '@social-bounty/shared';
import type { PublicHunterProfile, SocialLinkResponse } from '@social-bounty/shared';
import { formatDate } from '@/lib/utils/format';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatFollowers(count: number | null): string {
  if (count === null || count === undefined) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M followers`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K followers`;
  return `${count} followers`;
}

function formatPostCount(count: number | null): string {
  if (count === null || count === undefined) return '';
  return new Intl.NumberFormat('en-US').format(count) + ' posts';
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ─── Platform config ──────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  SocialChannel,
  { label: string; icon: string; iconClass: string; borderClass: string; bgClass: string }
> = {
  [SocialChannel.INSTAGRAM]: {
    label: 'Instagram',
    icon: 'pi pi-instagram',
    iconClass: 'text-pink-400',
    borderClass: 'border-pink-400/30',
    bgClass: 'bg-pink-400/10',
  },
  [SocialChannel.TIKTOK]: {
    label: 'TikTok',
    icon: 'pi pi-tiktok',
    iconClass: 'text-cyan-400',
    borderClass: 'border-cyan-400/30',
    bgClass: 'bg-cyan-400/10',
  },
  [SocialChannel.FACEBOOK]: {
    label: 'Facebook',
    icon: 'pi pi-facebook',
    iconClass: 'text-blue-400',
    borderClass: 'border-blue-400/30',
    bgClass: 'bg-blue-400/10',
  },
};

// ─── Mock fallback data ───────────────────────────────────────────────────

const MOCK_PROFILE: PublicHunterProfile = {
  id: 'mock-1',
  firstName: 'Jordan',
  lastName: 'Blake',
  bio: 'Lifestyle and fitness content creator with a passion for authentic storytelling. I create content that resonates and drives real engagement.',
  profilePictureUrl: null,
  interests: ['Fitness & Wellness', 'Lifestyle & Home', 'Food & Cooking', 'Photography & Art'],
  socialLinks: [
    {
      id: 'sl-1',
      platform: SocialChannel.INSTAGRAM,
      url: 'https://instagram.com/jordanblake',
      handle: '@jordanblake',
      followerCount: 45200,
      postCount: 1234,
      isVerified: true,
      verifiedAt: '2024-06-01T00:00:00Z',
    },
    {
      id: 'sl-2',
      platform: SocialChannel.TIKTOK,
      url: 'https://tiktok.com/@jordanblake',
      handle: '@jordanblake',
      followerCount: 128000,
      postCount: 89,
      isVerified: false,
      verifiedAt: null,
    },
  ],
  role: 'PARTICIPANT',
  emailVerified: true,
  createdAt: '2024-01-15T00:00:00Z',
  stats: {
    totalSubmissions: 24,
    approvedSubmissions: 20,
    completedBounties: 18,
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────

function SocialLinkRow({ link }: { link: SocialLinkResponse }) {
  const config = PLATFORM_CONFIG[link.platform];
  if (!config) return null;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card p-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-glow-cyan transition-all duration-normal group"
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bgClass} border ${config.borderClass}`}
      >
        <i className={`${config.icon} ${config.iconClass} text-lg`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-text-primary text-sm">{config.label}</p>
          {link.handle && (
            <span className="text-text-muted text-sm">{link.handle}</span>
          )}
          {link.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs text-accent-emerald">
              <i className="pi pi-verified text-xs" />
              Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {link.followerCount !== null && (
            <span className="text-xs text-text-secondary">{formatFollowers(link.followerCount)}</span>
          )}
          {link.postCount !== null && (
            <span className="text-xs text-text-muted">{formatPostCount(link.postCount)}</span>
          )}
        </div>
      </div>

      {/* External link icon */}
      <i className="pi pi-external-link text-text-muted text-xs group-hover:text-accent-cyan transition-colors shrink-0" />
    </a>
  );
}

function StatCard({ label, value, icon, iconClass }: { label: string; value: number; icon: string; iconClass: string }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-glass-border bg-glass-bg`}>
        <i className={`pi ${icon} ${iconClass} text-lg`} />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Profile content ─────────────────────────────────────────────────────

function HunterProfileContent({ profile }: { profile: PublicHunterProfile }) {
  return (
    <div className="animate-fade-up">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Left column (2/3) ── */}
        <div className="flex-1 flex flex-col gap-6 lg:w-2/3">

          {/* Profile card */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              {profile.profilePictureUrl ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 ring-2 ring-accent-cyan/30">
                  <Image
                    src={profile.profilePictureUrl}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full shrink-0 bg-accent-cyan/10 border-2 border-accent-cyan/30 flex items-center justify-center text-accent-cyan font-heading font-bold text-2xl">
                  {getInitials(profile.firstName, profile.lastName)}
                </div>
              )}

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-heading font-bold text-text-primary">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.emailVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30">
                      <i className="pi pi-verified text-xs" />
                      Verified
                    </span>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-text-secondary mt-2 text-sm leading-relaxed">{profile.bio}</p>
                )}

                <div className="flex items-center gap-1.5 mt-3 text-xs text-text-muted">
                  <i className="pi pi-calendar text-xs" />
                  <span>Member since {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social links */}
          {profile.socialLinks.length > 0 && (
            <div>
              <h2 className="text-sm font-heading font-semibold text-text-muted uppercase tracking-wider mb-3">
                Social Channels
              </h2>
              <div className="flex flex-col gap-3">
                {profile.socialLinks.map((link) => (
                  <SocialLinkRow key={link.id} link={link} />
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div>
              <h2 className="text-sm font-heading font-semibold text-text-muted uppercase tracking-wider mb-3">
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
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
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="flex flex-col gap-6 lg:w-1/3">

          {/* Stats */}
          <div>
            <h2 className="text-sm font-heading font-semibold text-text-muted uppercase tracking-wider mb-3">
              Statistics
            </h2>
            <div className="flex flex-col gap-3">
              <StatCard
                label="Total Submissions"
                value={profile.stats.totalSubmissions}
                icon="pi-file"
                iconClass="text-accent-cyan"
              />
              <StatCard
                label="Approved Submissions"
                value={profile.stats.approvedSubmissions}
                icon="pi-check-circle"
                iconClass="text-accent-emerald"
              />
              <StatCard
                label="Completed Bounties"
                value={profile.stats.completedBounties}
                icon="pi-star"
                iconClass="text-accent-amber"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <p className="text-sm font-heading font-semibold text-text-primary">Work with this hunter</p>
            <p className="text-xs text-text-secondary">
              Invite this creator to one of your active bounties.
            </p>
            <Button
              label="Invite to Bounty"
              icon="pi pi-send"
              className="w-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicHunterProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = usePublicProfile(id);

  if (isLoading) return <LoadingState type="detail" />;

  if (error) {
    // Render mock data as fallback while API isn't ready
    return <HunterProfileContent profile={MOCK_PROFILE} />;
  }

  if (!data) return <HunterProfileContent profile={MOCK_PROFILE} />;

  return <HunterProfileContent profile={data} />;
}
