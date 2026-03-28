'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '@/hooks/useAuth';
import { useOrganisation, useUpdateOrganisation } from '@/hooks/useOrganisation';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function EditOrganisationPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const orgId = user?.organisationId || '';
  const { data: org, isLoading, error, refetch } = useOrganisation(orgId);
  const updateOrg = useUpdateOrganisation(orgId);

  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (org) {
      setName(org.name);
      setContactEmail(org.contactEmail);
    }
  }, [org]);

  if (isLoading) return <LoadingState type="form" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!org) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !contactEmail.trim()) {
      setFormError('Name and contact email are required.');
      return;
    }

    updateOrg.mutate(
      { data: { name: name.trim(), contactEmail: contactEmail.trim() }, logo },
      {
        onSuccess: () => {
          toast.showSuccess('Organisation updated successfully');
          router.push('/business/organisation');
        },
        onError: () => setFormError('Failed to update organisation. Please try again.'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Organisation', url: '/business/organisation' },
    { label: 'Edit' },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Edit Organisation" breadcrumbs={breadcrumbs} />

      <div className="glass-card p-6">
        {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Organisation Name *
            </label>
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Contact Email *
            </label>
            <InputText
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Logo
            </label>
            {org.logo && (
              <img src={org.logo} alt="Current logo" className="w-16 h-16 rounded-lg object-cover mb-2" />
            )}
            <FileUpload
              mode="basic"
              accept="image/*"
              maxFileSize={5000000}
              chooseLabel="Upload Logo"
              auto={false}
              onSelect={(e) => setLogo(e.files[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
            <Button
              label="Cancel"
              type="button"
              outlined
              severity="secondary"
              onClick={() => router.push('/business/organisation')}
            />
            <Button
              label="Save Changes"
              type="submit"
              icon="pi pi-save"
              loading={updateOrg.isPending}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
