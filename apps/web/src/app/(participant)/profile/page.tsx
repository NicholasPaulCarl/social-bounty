'use client';

import Link from 'next/link';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Link2,
  Music2,
  Pencil,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProfile, useSocialLinks } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { getUploadUrl } from '@/lib/api/client';
import { formatCount } from '@/lib/utils/format';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { SocialChannel } from '@social-bounty/shared';

// Lucide's installed 1.8.0 has no TikTok / Instagram / Facebook brand
// glyphs. Using Link2 as a generic channel chain-link + Music2 for
// TikTok (the one brand mark this version does ship), per the DS
// ICONS.md §Social brand marks guidance (Link2 is the closest
// uncoloured placeholder until we commission branded SVGs).
const PLATFORM_ICONS: Record<SocialChannel, LucideIcon> = {
  [SocialChannel.INSTAGRAM]: Link2,
  [SocialChannel.TIKTOK]: Music2,
  [SocialChannel.FACEBOOK]: Link2,
};

const PLATFORM_LABELS: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'Instagram',
  [SocialChannel.TIKTOK]: 'TikTok',
  [SocialChannel.FACEBOOK]: 'Facebook',
};

function computeCompletion(profile: {
  bio: string | null;
  profilePictureUrl: string | null;
  interests: string[];
}, hasSocialLinks: boolean): number {
  let score = 0;
  if (profile.bio) score++;
  if (profile.profilePictureUrl) score++;
  if (profile.interests.length > 0) score++;
  if (hasSocialLinks) score++;
  return Math.round((score / 4) * 100);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { data: socialLinks } = useSocialLinks();
  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!profile) return null;

  const links = socialLinks ?? [];
  const completion = computeCompletion(profile, links.length > 0);
  const initials =
    `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <>
      <PageHeader
        title="My profile"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/hunters/${profile.id}`} target="_blank" rel="noopener noreferrer">
              <Button
                label="View public"
                icon={<ExternalLink size={14} strokeWidth={2} />}
                outlined
                severity="secondary"
                size="small"
              />
            </Link>
            <Link href="/profile/edit">
              <Button
                label="Edit"
                icon={<Pencil size={14} strokeWidth={2} />}
                size="small"
              />
            </Link>
          </div>
        }
      />

      {!profile.emailVerified && (
        <Message
          severity="warn"
          text="Your email is not verified. Please check your inbox for a verification link."
          className="w-full mb-6"
        />
      )}

      {/* Profile completion banner */}
      {completion < 100 && (
        <div className="glass-card p-4 mb-6 animate-fade-up border border-warning-600/30">
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} strokeWidth={2} className="text-warning-600" />
              <span className="text-text-primary text-sm font-medium">
                Profile <span className="font-mono tabular-nums">{completion}%</span> complete
              </span>
            </div>
            <Link href="/profile/edit">
              <span className="text-pink-600 text-xs hover:text-pink-700 font-medium cursor-pointer">
                Complete now
              </span>
            </Link>
          </div>
          <div className="w-full bg-glass-border rounded-full h-1.5">
            <div
              className="bg-warning-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-text-muted text-xs mt-2">
            Add your {[
              !profile.bio && 'bio',
              !profile.profilePictureUrl && 'profile picture',
              profile.interests.length === 0 && 'interests',
              links.length === 0 && 'social links',
            ]
              .filter(Boolean)
              .join(', ')} to get noticed by brands.
          </p>
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* ── Account Details ──────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            {profile.profilePictureUrl ? (
              <img
                src={getUploadUrl(profile.profilePictureUrl)!}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-glass-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-pink-600/20 text-pink-600 flex items-center justify-center text-lg font-heading font-semibold">
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-lg font-heading font-semibold text-text-primary">Account details</h3>
              {user?.role && <StatusBadge type="role" value={user.role} size="small" />}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="eyebrow !text-text-muted !text-[11px]">Name</p>
              <p className="text-text-primary font-medium mt-0.5">
                {profile.firstName} {profile.lastName}
              </p>
            </div>
            <div>
              <p className="eyebrow !text-text-muted !text-[11px]">Email</p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-text-primary font-medium">{profile.email}</p>
                {profile.emailVerified ? (
                  <span className="text-success-600 text-xs flex items-center gap-1">
                    <CheckCircle2 size={12} strokeWidth={2} /> Verified
                  </span>
                ) : (
                  <span className="text-warning-600 text-xs flex items-center gap-1">
                    <AlertCircle size={12} strokeWidth={2} /> Unverified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bio ──────────────────────────────────────────────────────── */}
        {profile.bio && (
          <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '50ms' }}>
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Bio</h3>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* ── Interests ────────────────────────────────────────────────── */}
        {profile.interests.length > 0 && (
          <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-pink-600/10 text-pink-600 border border-pink-600/30"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Social Links ─────────────────────────────────────────────── */}
        {links.length > 0 && (
          <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Social links
            </h3>
            <div className="space-y-3">
              {links.map((link) => {
                const PlatformIcon = PLATFORM_ICONS[link.platform] ?? Link2;
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-glass-border/20 border border-glass-border gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlatformIcon size={20} strokeWidth={2} className="text-text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate">
                          {PLATFORM_LABELS[link.platform] ?? link.platform}
                          {link.handle && (
                            <span className="text-text-muted ml-1 font-normal">@{link.handle}</span>
                          )}
                        </p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 text-xs hover:underline truncate block"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                    <div className="text-right text-xs text-text-muted flex gap-4 shrink-0">
                      {link.followerCount !== null && (
                        <div>
                          <p className="text-text-primary font-medium font-mono tabular-nums">
                            {formatCount(link.followerCount)}
                          </p>
                          <p>followers</p>
                        </div>
                      )}
                      {link.postCount !== null && (
                        <div>
                          <p className="text-text-primary font-medium font-mono tabular-nums">
                            {formatCount(link.postCount)}
                          </p>
                          <p>posts</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
