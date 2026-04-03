'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import Link from 'next/link';

import {
  useProfile,
  useUpdateProfile,
  useUploadProfilePicture,
  useDeleteProfilePicture,
  useSocialLinks,
  useUpsertSocialLink,
  useDeleteSocialLink,
} from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { SocialLinkInput } from '@/components/features/profile/SocialLinkInput';
import { ApiError } from '@/lib/api/client';
import { HUNTER_INTERESTS, PROFILE_LIMITS } from '@social-bounty/shared';
import { SocialChannel } from '@social-bounty/shared';
import type { SocialLinkResponse } from '@social-bounty/shared';

const PLATFORM_OPTIONS = [
  { value: SocialChannel.INSTAGRAM, label: 'Instagram' },
  { value: SocialChannel.TIKTOK, label: 'TikTok' },
  { value: SocialChannel.FACEBOOK, label: 'Facebook' },
];

type LocalSocialLink = {
  id?: string;            // present for existing (persisted) links
  platform: SocialChannel;
  url: string;
  handle: string;
  followerCount: number;
  postCount: number;
};

function toLocalLink(link: SocialLinkResponse): LocalSocialLink {
  return {
    id: link.id,
    platform: link.platform,
    url: link.url,
    handle: link.handle ?? '',
    followerCount: link.followerCount ?? 0,
    postCount: link.postCount ?? 0,
  };
}

export default function ProfileEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';

  const { showSuccess, showError } = useToast();

  const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useProfile();
  const { data: savedLinks, isLoading: linksLoading } = useSocialLinks();

  const updateProfile = useUpdateProfile();
  const uploadPicture = useUploadProfilePicture();
  const deletePicture = useDeleteProfilePicture();
  const upsertLink = useUpsertSocialLink();
  const deleteLink = useDeleteSocialLink();

  // Basic info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Bio
  const [bio, setBio] = useState('');

  // Interests
  const [interests, setInterests] = useState<string[]>([]);

  // Social links (local working state)
  const [socialLinks, setSocialLinks] = useState<LocalSocialLink[]>([]);

  // Platform selector dropdown
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);

  // File input ref for picture upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed form when data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setBio(profile.bio ?? '');
      setInterests(profile.interests ?? []);
    }
  }, [profile]);

  useEffect(() => {
    if (savedLinks) {
      setSocialLinks(savedLinks.map(toLocalLink));
    }
  }, [savedLinks]);

  if (profileLoading || linksLoading) return <LoadingState type="detail" />;
  if (profileError) return <ErrorState error={profileError} onRetry={() => refetch()} />;
  if (!profile) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const addSocialLink = (platform: SocialChannel) => {
    setSocialLinks((prev) => [
      ...prev,
      { platform, url: '', handle: '', followerCount: 0, postCount: 0 },
    ]);
    setShowPlatformPicker(false);
  };

  const updateSocialLink = (idx: number, data: Omit<LocalSocialLink, 'id'>) => {
    setSocialLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, ...data } : l)));
  };

  const removeSocialLink = async (idx: number) => {
    const link = socialLinks[idx];
    if (link?.id) {
      try {
        await deleteLink.mutateAsync(link.id);
      } catch {
        // swallow — will be cleaned up on save anyway
      }
    }
    setSocialLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Picture handlers ──────────────────────────────────────────────────────

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > PROFILE_LIMITS.PROFILE_PICTURE_MAX_SIZE) {
      showError('Image must be under 2 MB.');
      return;
    }
    if (!PROFILE_LIMITS.PROFILE_PICTURE_MIME_TYPES.includes(file.type as any)) {
      showError('Only JPEG, PNG, GIF, or WebP images are accepted.');
      return;
    }

    try {
      await uploadPicture.mutateAsync(file);
      showSuccess('Looking fresh!');
    } catch (err) {
      if (err instanceof ApiError) showError(err.message);
      else showError('Couldn\'t upload picture. Try again.');
    }
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleDeletePicture = async () => {
    try {
      await deletePicture.mutateAsync();
      showSuccess('Profile pic removed.');
    } catch (err) {
      if (err instanceof ApiError) showError(err.message);
      else showError('Couldn\'t remove picture. Try again.');
    }
  };

  // ── Save all ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      // 1. Basic info + bio + interests
      await updateProfile.mutateAsync({ firstName, lastName, bio, interests });

      // 2. Social links — upsert each
      await Promise.all(
        socialLinks.map((link) =>
          upsertLink.mutateAsync({
            platform: link.platform,
            url: link.url,
            handle: link.handle || undefined,
            followerCount: link.followerCount || undefined,
            postCount: link.postCount || undefined,
          }),
        ),
      );

      showSuccess('Profile locked in.');

      if (isWelcome) {
        router.push('/profile');
      }
    } catch (err) {
      if (err instanceof ApiError) showError(err.message);
      else showError('Couldn\'t save profile. Try again.');
    }
  };

  const isSaving =
    updateProfile.isPending ||
    upsertLink.isPending ||
    uploadPicture.isPending;

  // Platforms already added
  const usedPlatforms = new Set(socialLinks.map((l) => l.platform));
  const availablePlatforms = PLATFORM_OPTIONS.filter((p) => !usedPlatforms.has(p.value));

  // Initials fallback
  const initials =
    `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <>
      <PageHeader
        title="Edit Profile"
        actions={
          <Link href="/profile">
            <Button label="Back to Profile" icon="pi pi-arrow-left" outlined severity="secondary" />
          </Link>
        }
      />

      {isWelcome && (
        <Message
          severity="info"
          text="Welcome to Social Bounty! Complete your profile to get noticed by brands."
          className="w-full mb-6"
        />
      )}

      <div className="space-y-6 max-w-2xl">
        {/* ── Profile Picture ─────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-up">
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
            Profile Picture
          </h3>
          <div className="flex items-center gap-5">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-glass-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-2xl font-heading font-semibold border-2 border-glass-border">
                {initials}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />
              <Button
                label="Upload Picture"
                icon="pi pi-upload"
                size="small"
                loading={uploadPicture.isPending}
                onClick={() => fileInputRef.current?.click()}
              />
              {profile.profilePictureUrl && (
                <Button
                  label="Remove Picture"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  outlined
                  loading={deletePicture.isPending}
                  onClick={handleDeletePicture}
                />
              )}
              <p className="text-text-muted text-xs">JPEG, PNG, GIF or WebP · max 2 MB</p>
            </div>
          </div>
        </div>

        {/* ── Basic Info ──────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Basic Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                First Name
              </label>
              <InputText
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                Last Name
              </label>
              <InputText
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* ── Bio ─────────────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Bio</h3>
          <div>
            <InputTextarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= PROFILE_LIMITS.BIO_MAX) setBio(e.target.value);
              }}
              rows={4}
              autoResize
              className="w-full"
              placeholder="Tell brands about yourself..."
            />
            <p className="text-right text-text-muted text-xs mt-1">
              {bio.length} / {PROFILE_LIMITS.BIO_MAX}
            </p>
          </div>
        </div>

        {/* ── Interests ───────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {HUNTER_INTERESTS.map((interest) => {
              const active = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 ${
                    active
                      ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/50'
                      : 'bg-transparent text-text-secondary border-glass-border hover:border-accent-cyan/40 hover:text-text-primary'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          {interests.length > 0 && (
            <p className="text-text-muted text-xs mt-3">
              {interests.length} interest{interests.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* ── Social Links ─────────────────────────────────────────────── */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
            Social Links
          </h3>

          {socialLinks.length === 0 && (
            <p className="text-text-muted text-sm mb-4">
              Add your social profiles so brands can see your reach.
            </p>
          )}

          <div className="space-y-3 mb-4">
            {socialLinks.map((link, idx) => (
              <SocialLinkInput
                key={`${link.platform}-${idx}`}
                platform={link.platform}
                url={link.url}
                handle={link.handle}
                followerCount={link.followerCount}
                postCount={link.postCount}
                onChange={(data) => updateSocialLink(idx, data)}
                onRemove={() => removeSocialLink(idx)}
              />
            ))}
          </div>

          {/* Add new social link */}
          {availablePlatforms.length > 0 && (
            <div className="relative">
              <Button
                label="Add Social Link"
                icon="pi pi-plus"
                outlined
                severity="secondary"
                size="small"
                onClick={() => setShowPlatformPicker((v) => !v)}
              />
              {showPlatformPicker && (
                <div className="absolute left-0 top-full mt-1 z-10 glass-card p-1 min-w-[160px] shadow-lg">
                  {availablePlatforms.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-glass-border/30 rounded transition-colors"
                      onClick={() => addSocialLink(p.value)}
                    >
                      <i
                        className={`pi pi-${p.label.toLowerCase()} text-text-muted text-sm`}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Save ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pb-8">
          <Button
            label="Save Profile"
            icon="pi pi-check"
            onClick={handleSave}
            loading={isSaving}
          />
          <Link href="/profile">
            <Button label="Cancel" outlined severity="secondary" />
          </Link>
        </div>
      </div>
    </>
  );
}
