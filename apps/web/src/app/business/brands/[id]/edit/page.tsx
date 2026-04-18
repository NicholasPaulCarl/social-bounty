'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { useBrand, useUpdateBrand } from '@/hooks/useBrand';
import { brandsApi } from '@/lib/api/brands';
import { useToast } from '@/hooks/useToast';
import { queryKeys } from '@/lib/query-keys';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { HUNTER_INTERESTS, BRAND_PROFILE_LIMITS } from '@social-bounty/shared';
import type { BrandSocialLinks } from '@social-bounty/shared';
import { ImageCropDialog } from '@/components/common/ImageCropDialog';

export default function EditBrandPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: org, isLoading, error, refetch } = useBrand(id);
  const updateOrg = useUpdateBrand(id);

  const [form, setForm] = useState({
    name: '',
    contactEmail: '',
    handle: '',
    bio: '',
    websiteUrl: '',
    messagingEnabled: true,
    socialLinks: { instagram: '', tiktok: '', facebook: '', x: '' } as BrandSocialLinks,
    targetInterests: [] as string[],
  });
  const [logo, setLogo] = useState<File | null | undefined>(undefined);
  const [coverPhoto, setCoverPhoto] = useState<File | undefined>();
  const [logoPending, setLogoPending] = useState<File | null>(null);
  const [coverPending, setCoverPending] = useState<File | null>(null);
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  // Populate form when org loads
  useEffect(() => {
    if (org && !initialized) {
      const sl = (org.socialLinks || {}) as BrandSocialLinks;
      setForm({
        name: org.name,
        contactEmail: org.contactEmail,
        handle: org.handle || '',
        bio: org.bio || '',
        websiteUrl: org.websiteUrl || '',
        messagingEnabled: org.messagingEnabled,
        socialLinks: {
          instagram: sl.instagram || '',
          tiktok: sl.tiktok || '',
          facebook: sl.facebook || '',
          x: sl.x || '',
        },
        targetInterests: (org.targetInterests as string[]) || [],
      });
      setInitialized(true);
    }
  }, [org, initialized]);

  // Debounced handle check
  useEffect(() => {
    if (!form.handle || form.handle.length < BRAND_PROFILE_LIMITS.HANDLE_MIN) {
      setHandleStatus('idle');
      return;
    }
    // Skip check if handle hasn't changed
    if (org?.handle === form.handle) {
      setHandleStatus('available');
      return;
    }
    setHandleStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await brandsApi.checkHandle(form.handle);
        setHandleStatus(result.available ? 'available' : 'taken');
      } catch {
        setHandleStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.handle, org?.handle]);

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updateSocialLink = (key: keyof BrandSocialLinks, value: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  const toggleInterest = useCallback((interest: string) => {
    setForm((prev) => ({
      ...prev,
      targetInterests: prev.targetInterests.includes(interest)
        ? prev.targetInterests.filter((i) => i !== interest)
        : [...prev.targetInterests, interest],
    }));
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Brand name is required';
    if (!form.contactEmail.trim()) errs.contactEmail = 'Contact email is required';
    if (form.handle && !/^[a-zA-Z0-9_-]+$/.test(form.handle)) {
      errs.handle = 'Only letters, numbers, hyphens, and underscores';
    }
    if (handleStatus === 'taken') errs.handle = 'Handle already taken';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const socialLinks: BrandSocialLinks = {};
    if (form.socialLinks.instagram) socialLinks.instagram = form.socialLinks.instagram;
    if (form.socialLinks.tiktok) socialLinks.tiktok = form.socialLinks.tiktok;
    if (form.socialLinks.facebook) socialLinks.facebook = form.socialLinks.facebook;
    if (form.socialLinks.x) socialLinks.x = form.socialLinks.x;

    updateOrg.mutate(
      {
        data: {
          name: form.name,
          contactEmail: form.contactEmail,
          handle: form.handle || undefined,
          bio: form.bio || undefined,
          websiteUrl: form.websiteUrl || undefined,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
          targetInterests: form.targetInterests.length > 0 ? form.targetInterests : undefined,
          messagingEnabled: form.messagingEnabled,
        },
        logo: logo === null ? null : logo,
      },
      {
        onSuccess: async () => {
          // Upload cover photo separately if provided
          if (coverPhoto) {
            try {
              await brandsApi.uploadCoverPhoto(id, coverPhoto);
              // Invalidate so the profile page shows the new image immediately
              queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
            } catch {
              toast.showError('Cover photo upload failed. You can try again.');
            }
          }
          toast.showSuccess('Brand updated successfully!');
          router.push('/business/brands');
        },
        onError: () => {
          toast.showError('Failed to update brand.');
        },
      },
    );
  };

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!org) return null;

  const breadcrumbs = [
    { label: 'Brands', url: '/business/brands' },
    { label: org.name, url: `/brands/${org.handle || org.id}` },
    { label: 'Edit' },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Edit Brand" breadcrumbs={breadcrumbs} />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary">Basic Info</h3>

          <div>
            <label htmlFor="name" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Brand Name *
            </label>
            <InputText
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`w-full ${errors.name ? 'p-invalid' : ''}`}
            />
            {errors.name && <small className="text-danger-600 text-xs mt-1 block">{errors.name}</small>}
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Contact Email *
            </label>
            <InputText
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              className={`w-full ${errors.contactEmail ? 'p-invalid' : ''}`}
            />
            {errors.contactEmail && <small className="text-danger-600 text-xs mt-1 block">{errors.contactEmail}</small>}
          </div>

          <div>
            <label htmlFor="handle" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Handle
            </label>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">@</span>
              <InputText
                id="handle"
                value={form.handle}
                onChange={(e) => updateField('handle', e.target.value.toLowerCase())}
                className={`flex-1 ${errors.handle ? 'p-invalid' : ''}`}
                placeholder="your-brand"
                maxLength={BRAND_PROFILE_LIMITS.HANDLE_MAX}
              />
              {handleStatus === 'checking' && <i className="pi pi-spinner pi-spin text-text-muted" />}
              {handleStatus === 'available' && <i className="pi pi-check-circle text-green-400" />}
              {handleStatus === 'taken' && <i className="pi pi-times-circle text-danger-600" />}
            </div>
            {errors.handle && <small className="text-danger-600 text-xs mt-1 block">{errors.handle}</small>}
          </div>

          <div>
            <label htmlFor="bio" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Bio
            </label>
            <InputTextarea
              id="bio"
              value={form.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={3}
              className="w-full"
              maxLength={BRAND_PROFILE_LIMITS.BIO_MAX}
            />
            <small className="text-text-muted text-xs">{form.bio.length}/{BRAND_PROFILE_LIMITS.BIO_MAX}</small>
          </div>

          <div>
            <label htmlFor="logo" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Logo
            </label>
            <input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setLogoPending(file);
                e.target.value = '';
              }}
              className="text-sm text-text-secondary"
            />
            {logo && <small className="text-success-600 text-xs mt-1 block">Cropped logo ready</small>}
            <small className="text-text-muted text-xs mt-1 block">Recommended: 200 x 200px, square. Max 2MB.</small>
          </div>

          <div>
            <label htmlFor="coverPhoto" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Cover Photo
            </label>
            <input
              id="coverPhoto"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setCoverPending(file);
                e.target.value = '';
              }}
              className="text-sm text-text-secondary"
            />
            {coverPhoto && <small className="text-success-600 text-xs mt-1 block">Cropped cover ready</small>}
            <small className="text-text-muted text-xs mt-1 block">Recommended: 1200 x 400px (3:1 ratio). Max 5MB.</small>
          </div>

          {/* Logo crop dialog — 1:1 square */}
          <ImageCropDialog
            visible={!!logoPending}
            onHide={() => setLogoPending(null)}
            file={logoPending}
            aspect={1}
            title="Crop Logo"
            onCropComplete={(cropped) => setLogo(cropped)}
          />

          {/* Cover photo crop dialog — 3:1 banner */}
          <ImageCropDialog
            visible={!!coverPending}
            onHide={() => setCoverPending(null)}
            file={coverPending}
            aspect={3}
            title="Crop Cover Photo"
            onCropComplete={(cropped) => setCoverPhoto(cropped)}
          />
        </div>

        {/* Online Presence */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-lg font-heading font-semibold text-text-primary">Online Presence</h3>

          <div>
            <label htmlFor="websiteUrl" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Website URL
            </label>
            <InputText
              id="websiteUrl"
              value={form.websiteUrl}
              onChange={(e) => updateField('websiteUrl', e.target.value)}
              className="w-full"
              placeholder="https://your-brand.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Instagram</label>
              <InputText
                value={form.socialLinks.instagram || ''}
                onChange={(e) => updateSocialLink('instagram', e.target.value)}
                className="w-full"
                placeholder="handle"
              />
            </div>
            <div>
              <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">TikTok</label>
              <InputText
                value={form.socialLinks.tiktok || ''}
                onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                className="w-full"
                placeholder="handle"
              />
            </div>
            <div>
              <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">Facebook</label>
              <InputText
                value={form.socialLinks.facebook || ''}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                className="w-full"
                placeholder="handle"
              />
            </div>
            <div>
              <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">X (Twitter)</label>
              <InputText
                value={form.socialLinks.x || ''}
                onChange={(e) => updateSocialLink('x', e.target.value)}
                className="w-full"
                placeholder="handle"
              />
            </div>
          </div>
        </div>

        {/* Target Interests */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-heading font-semibold text-text-primary">Target Interests</h3>
          <div className="flex flex-wrap gap-2">
            {HUNTER_INTERESTS.map((interest) => {
              const selected = form.targetInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-fast ${
                    selected
                      ? 'bg-pink-600 text-bg-void border-pink-600 font-medium shadow-glow-brand'
                      : 'bg-glass-bg text-text-secondary border-glass-border hover:border-pink-600/50 hover:text-pink-600'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-heading font-semibold text-text-primary">Settings</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Messaging</p>
              <p className="text-sm text-text-muted">Allow hunters to send you direct messages</p>
            </div>
            <InputSwitch
              checked={form.messagingEnabled}
              onChange={(e) => updateField('messagingEnabled', e.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            label="Cancel"
            outlined
            onClick={() => router.push('/business/brands')}
          />
          <Button
            type="submit"
            label="Save Changes"
            icon="pi pi-check"
            loading={updateOrg.isPending}
          />
        </div>
      </form>
    </div>
  );
}
