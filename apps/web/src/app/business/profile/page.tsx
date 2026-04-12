'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useAuth } from '@/hooks/useAuth';
import { useBrandPublicProfile } from '@/hooks/useBrand';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { BrandSocialReachCard } from '@/components/features/brand-profile/BrandSocialReachCard';
import { getUploadUrl } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { BrandSocialLinks } from '@social-bounty/shared';

const SOCIAL_LINK_CONFIG: {
  key: keyof BrandSocialLinks;
  icon: string;
  urlPrefix: string;
}[] = [
  { key: 'instagram', icon: 'pi pi-instagram', urlPrefix: 'https://instagram.com/' },
  { key: 'tiktok', icon: 'pi pi-tiktok', urlPrefix: 'https://tiktok.com/@' },
  { key: 'facebook', icon: 'pi pi-facebook', urlPrefix: 'https://facebook.com/' },
  { key: 'x', icon: 'pi pi-twitter', urlPrefix: 'https://x.com/' },
  { key: 'website', icon: 'pi pi-globe', urlPrefix: '' },
];

export default function BusinessProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const brandId = user?.brandId ?? '';

  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const {
    data: brand,
    isLoading: brandLoading,
    error: brandError,
    refetch: refetchBrand,
  } = useBrandPublicProfile(brandId);

  // Account-info edit dialog state
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
    }
  }, [profile]);

  // No brand associated with this user → empty state pointing to create flow.
  if (!brandId) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="My Brand Profile" />
        <EmptyState
          icon="pi-building"
          title="No brand yet"
          message="Create your first brand to start posting bounties and managing your profile."
          ctaLabel="Create Brand"
          ctaIcon="pi-plus"
          ctaAction={() => router.push('/business/brands/create')}
        />
      </div>
    );
  }

  if (brandLoading || profileLoading) return <LoadingState type="detail" />;
  if (brandError) return <ErrorState error={brandError} onRetry={() => refetchBrand()} />;
  if (!brand || !profile) return null;

  const socialLinks = brand.socialLinks || {};
  const activeSocials = SOCIAL_LINK_CONFIG.filter((s) => socialLinks[s.key]);

  const handleSaveAccount = () => {
    setAccountError('');
    updateProfile.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim() },
      {
        onSuccess: () => {
          toast.showSuccess('Account info updated');
          setShowAccountDialog(false);
        },
        onError: () => setAccountError("Couldn't update account info. Try again."),
      },
    );
  };

  const openAccountDialog = () => {
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setAccountError('');
    setShowAccountDialog(true);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My Brand Profile"
        actions={
          <div className="flex items-center gap-2">
            <Button
              label="View Public Page"
              icon="pi pi-external-link"
              outlined
              severity="secondary"
              size="small"
              onClick={() => router.push(`/brands/${brand.handle ?? brand.id}`)}
            />
            <Button
              label="Edit Brand"
              icon="pi pi-pencil"
              size="small"
              onClick={() => router.push(`/business/brands/${brand.id}/edit`)}
            />
          </div>
        }
      />

      {/* Cover Photo Hero — no border */}
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
            {/* Handle first, then join date — same line, same font */}
            <p className="text-xs text-text-muted mt-0.5">
              {brand.handle && <span className="mr-2">@{brand.handle}</span>}
              <span>
                <i className="pi pi-calendar text-[10px] mr-1" />
                Joined {formatDate(brand.createdAt)}
              </span>
            </p>
            {brand.bio && (
              <p className="text-text-secondary mt-2 max-w-2xl text-sm">{brand.bio}</p>
            )}
          </div>
        </div>

        {/* Social Links — grayscale icons only */}
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
          <p className="text-2xl font-heading font-bold text-accent-cyan">
            {brand.stats.bountiesPosted}
          </p>
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

      {/* Social Reach (real Apify analytics with mock fallback) */}
      <BrandSocialReachCard
        orgId={brand.id}
        socialLinks={brand.socialLinks}
        analytics={brand.socialAnalytics}
      />

      {/* Target Interests */}
      {brand.targetInterests && brand.targetInterests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
            Target Interests
          </h3>
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
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
            Website
          </h3>
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

      {/* Account Info (User-level fields from signup) */}
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary">Account Info</h3>
          <Button
            icon="pi pi-pencil"
            text
            rounded
            size="small"
            aria-label="Edit account info"
            onClick={openAccountDialog}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">First Name</p>
            <p className="text-text-primary font-medium">{profile.firstName || '—'}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Last Name</p>
            <p className="text-text-primary font-medium">{profile.lastName || '—'}</p>
          </div>
          <div className="sm:col-span-2">
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

      {/* Edit Account Info Dialog */}
      <Dialog
        header="Edit Account Info"
        visible={showAccountDialog}
        style={{ width: '90vw', maxWidth: '480px' }}
        onHide={() => setShowAccountDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              outlined
              severity="secondary"
              onClick={() => setShowAccountDialog(false)}
            />
            <Button
              label="Save"
              icon="pi pi-check"
              loading={updateProfile.isPending}
              onClick={handleSaveAccount}
            />
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          {accountError && <Message severity="error" text={accountError} className="w-full" />}
          <div>
            <label
              htmlFor="dialogFirstName"
              className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
            >
              First Name
            </label>
            <InputText
              id="dialogFirstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label
              htmlFor="dialogLastName"
              className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
            >
              Last Name
            </label>
            <InputText
              id="dialogLastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full"
            />
          </div>
          <p className="text-xs text-text-muted">
            Looking to edit brand details like name, bio, logo, or social handles? Use the{' '}
            <strong>Edit Brand</strong> button at the top of the page.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
