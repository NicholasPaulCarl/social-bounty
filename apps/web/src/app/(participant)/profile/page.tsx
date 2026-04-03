'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';
import { useProfile, useChangePassword, useSocialLinks } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ApiError } from '@/lib/api/client';
import { SocialChannel } from '@social-bounty/shared';

const PLATFORM_ICONS: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'pi pi-instagram',
  [SocialChannel.TIKTOK]: 'pi pi-tiktok',
  [SocialChannel.FACEBOOK]: 'pi pi-facebook',
};

const PLATFORM_LABELS: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'Instagram',
  [SocialChannel.TIKTOK]: 'TikTok',
  [SocialChannel.FACEBOOK]: 'Facebook',
};

function formatCount(n: number | null): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

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
  const { showSuccess, showError } = useToast();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { data: socialLinks } = useSocialLinks();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!profile) return null;

  const links = socialLinks ?? [];
  const completion = computeCompletion(profile, links.length > 0);
  const initials =
    `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      showSuccess('Password updated. You\'re secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      if (err instanceof ApiError) setPasswordError(err.message);
      else setPasswordError('Failed to change password');
    }
  };

  return (
    <>
      <PageHeader
        title="My Profile"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/hunters/${profile.id}`} target="_blank" rel="noopener noreferrer">
              <Button
                label="View Public Profile"
                icon="pi pi-external-link"
                outlined
                severity="secondary"
                size="small"
              />
            </Link>
            <Link href="/profile/edit">
              <Button label="Edit Profile" icon="pi pi-pencil" size="small" />
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
        <div className="glass-card p-4 mb-6 animate-fade-up border border-accent-amber/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <i className="pi pi-chart-bar text-accent-amber text-sm" />
              <span className="text-text-primary text-sm font-medium">
                Profile {completion}% complete
              </span>
            </div>
            <Link href="/profile/edit">
              <span className="text-accent-cyan text-xs hover:text-accent-cyan/80 font-medium cursor-pointer">
                Complete now
              </span>
            </Link>
          </div>
          <div className="w-full bg-glass-border rounded-full h-1.5">
            <div
              className="bg-accent-amber h-1.5 rounded-full transition-all duration-500"
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
                src={profile.profilePictureUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-glass-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-lg font-heading font-semibold">
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-lg font-heading font-semibold text-text-primary">Account Details</h3>
              {user?.role && <StatusBadge type="role" value={user.role} size="small" />}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Name</p>
              <p className="text-text-primary font-medium">
                {profile.firstName} {profile.lastName}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Email</p>
              <div className="flex items-center gap-2">
                <p className="text-text-primary font-medium">{profile.email}</p>
                {profile.emailVerified ? (
                  <span className="text-accent-emerald text-xs flex items-center gap-1">
                    <i className="pi pi-check-circle text-xs" /> Verified
                  </span>
                ) : (
                  <span className="text-accent-amber text-xs flex items-center gap-1">
                    <i className="pi pi-exclamation-circle text-xs" /> Unverified
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
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
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
              Social Links
            </h3>
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-glass-border/20 border border-glass-border"
                >
                  <div className="flex items-center gap-3">
                    <i
                      className={`${PLATFORM_ICONS[link.platform] ?? 'pi pi-link'} text-text-muted`}
                    />
                    <div>
                      <p className="text-text-primary text-sm font-medium">
                        {PLATFORM_LABELS[link.platform] ?? link.platform}
                        {link.handle && (
                          <span className="text-text-muted ml-1 font-normal">@{link.handle}</span>
                        )}
                      </p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-cyan text-xs hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <div className="text-right text-xs text-text-muted flex gap-4">
                    {link.followerCount !== null && (
                      <div>
                        <p className="text-text-primary font-medium">
                          {formatCount(link.followerCount)}
                        </p>
                        <p>followers</p>
                      </div>
                    )}
                    {link.postCount !== null && (
                      <div>
                        <p className="text-text-primary font-medium">
                          {formatCount(link.postCount)}
                        </p>
                        <p>posts</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Change Password ───────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <div className="flex items-center gap-3">
              <i className="pi pi-lock text-text-muted" />
              <h3 className="text-lg font-heading font-semibold text-text-primary">
                Change Password
              </h3>
            </div>
            <i
              className={`pi ${showPasswordSection ? 'pi-chevron-up' : 'pi-chevron-down'} text-text-muted text-sm`}
            />
          </button>

          {showPasswordSection && (
            <div className="space-y-5 mt-6 pt-6 border-t border-glass-border">
              {passwordError && (
                <Message severity="error" text={passwordError} className="w-full" />
              )}

              <div>
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                  Current Password
                </label>
                <Password
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  feedback={false}
                  toggleMask
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>
              <div>
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                  New Password
                </label>
                <Password
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  toggleMask
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>
              <div>
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                  Confirm New Password
                </label>
                <Password
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  feedback={false}
                  toggleMask
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>
              <Button
                label="Change Password"
                icon="pi pi-lock"
                onClick={handleChangePassword}
                loading={changePassword.isPending}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
