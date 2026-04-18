'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAdminCreateOrg } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Plus } from 'lucide-react';

export default function AdminCreateBrandPage() {
  const router = useRouter();
  const toast = useToast();
  const createOrg = useAdminCreateOrg();

  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !contactEmail.trim() || !ownerUserId.trim()) {
      setFormError('All fields are required.');
      return;
    }

    createOrg.mutate(
      { name: name.trim(), contactEmail: contactEmail.trim(), ownerUserId: ownerUserId.trim() },
      {
        onSuccess: () => {
          toast.showSuccess('Brand created.');
          router.push('/admin/brands');
        },
        onError: () => setFormError("Couldn't create brand. Try again."),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Brands', url: '/admin/brands' },
    { label: 'Create' },
  ];

  return (
    <>
      <PageHeader title="Create brand" breadcrumbs={breadcrumbs} />

      <div className="glass-card p-6 max-w-2xl animate-fade-up">
        {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
              Brand Name *
            </label>
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              placeholder="Enter brand name"
              required
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-text-secondary mb-1">
              Contact Email *
            </label>
            <InputText
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full"
              placeholder="org@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="ownerUserId" className="block text-sm font-medium text-text-secondary mb-1">
              Owner User ID *
            </label>
            <InputText
              id="ownerUserId"
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              className="w-full"
              placeholder="User UUID"
              required
            />
            <p className="text-xs text-text-muted mt-1">
              The user ID of the person who will be assigned as brand owner.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              label="Cancel"
              type="button"
              outlined
              severity="secondary"
              onClick={() => router.push('/admin/brands')}
            />
            <Button
              label="Create brand"
              type="submit"
              icon={<Plus size={16} strokeWidth={2} />}
              loading={createOrg.isPending}
            />
          </div>
        </form>
      </div>
    </>
  );
}
