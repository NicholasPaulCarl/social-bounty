'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { useAuth } from '@/hooks/useAuth';
import { useCreateOrganisation } from '@/hooks/useOrganisation';
import { organisationApi } from '@/lib/api/organisations';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { HUNTER_INTERESTS, BRAND_PROFILE_LIMITS } from '@social-bounty/shared';
import type { BrandSocialLinks } from '@social-bounty/shared';

export default function CreateBrandPage() {
  const router = useRouter();
  const { switchOrganisation } = useAuth();
  const toast = useToast();
  const createOrg = useCreateOrganisation();

  const [form, setForm] = useState({
    name: '',
    contactEmail: '',
    handle: '',
    bio: '',
    websiteUrl: '',
    socialLinks: { instagram: '', tiktok: '', facebook: '', x: '' } as BrandSocialLinks,
    targetInterests: [] as string[],
  });
  const [logo, setLogo] = useState<File | undefined>();
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debounced handle check
  useEffect(() => {
    if (!form.handle || form.handle.length < BRAND_PROFILE_LIMITS.HANDLE_MIN) {
      setHandleStatus('idle');
      return;
    }
    setHandleStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await organisationApi.checkHandle(form.handle);
        setHandleStatus(result.available ? 'available' : 'taken');
      } catch {
        setHandleStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.handle]);

  const updateField = (key: string, value: string) => {
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogo(file);
  };

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

    // Filter empty social links
    const socialLinks: BrandSocialLinks = {};
    if (form.socialLinks.instagram) socialLinks.instagram = form.socialLinks.instagram;
    if (form.socialLinks.tiktok) socialLinks.tiktok = form.socialLinks.tiktok;
    if (form.socialLinks.facebook) socialLinks.facebook = form.socialLinks.facebook;
    if (form.socialLinks.x) socialLinks.x = form.socialLinks.x;

    createOrg.mutate(
      {
        data: {
          name: form.name,
          contactEmail: form.contactEmail,
          ...(form.handle ? { handle: form.handle } : {}),
          ...(form.bio ? { bio: form.bio } : {}),
          ...(form.websiteUrl ? { websiteUrl: form.websiteUrl } : {}),
          ...(Object.keys(socialLinks).length > 0 ? { socialLinks } : {}),
          ...(form.targetInterests.length > 0 ? { targetInterests: form.targetInterests } : {}),
        },
        logo,
      },
      {
        onSuccess: async (org) => {
          try {
            await switchOrganisation(org.id);
          } catch {
            // Non-blocking — user can switch manually
          }
          toast.showSuccess('Brand created successfully!');
          router.push('/business/brands');
        },
        onError: () => {
          toast.showError('Failed to create brand. Please try again.');
        },
      },
    );
  };

  const breadcrumbs = [
    { label: 'Brands', url: '/business/brands' },
    { label: 'Create' },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Create Brand" breadcrumbs={breadcrumbs} />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Name */}
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
            {errors.name && <small className="text-accent-rose text-xs mt-1 block">{errors.name}</small>}
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
            {errors.contactEmail && <small className="text-accent-rose text-xs mt-1 block">{errors.contactEmail}</small>}
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
              {handleStatus === 'taken' && <i className="pi pi-times-circle text-accent-rose" />}
            </div>
            {errors.handle && <small className="text-accent-rose text-xs mt-1 block">{errors.handle}</small>}
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
              onChange={handleLogoChange}
              className="text-sm text-text-secondary"
            />
            <small className="text-text-muted text-xs mt-1 block">Recommended: 200 x 200px, square. Max 2MB.</small>
          </div>
        </div>

        {/* Website & Social */}
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
          <p className="text-sm text-text-secondary">Select the interests that best describe your target audience.</p>
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
                      ? 'bg-accent-cyan text-bg-void border-accent-cyan font-medium shadow-glow-cyan'
                      : 'bg-glass-bg text-text-secondary border-glass-border hover:border-accent-cyan/50 hover:text-accent-cyan'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
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
            label="Create Brand"
            icon="pi pi-check"
            loading={createOrg.isPending}
          />
        </div>
      </form>
    </div>
  );
}
