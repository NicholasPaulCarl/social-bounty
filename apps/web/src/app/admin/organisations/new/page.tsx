'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAdminCreateOrg } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';

export default function AdminCreateOrganisationPage() {
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
          toast.showSuccess('Organisation created successfully');
          router.push('/admin/organisations');
        },
        onError: () => setFormError('Failed to create organisation. Please try again.'),
      },
    );
  };

  const breadcrumbs = [
    { label: 'Organisations', url: '/admin/organisations' },
    { label: 'Create' },
  ];

  return (
    <>
      <PageHeader title="Create Organisation" breadcrumbs={breadcrumbs} />

      <Card className="max-w-2xl">
        {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Organisation Name *
            </label>
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              placeholder="Enter organisation name"
              required
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
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
            <label htmlFor="ownerUserId" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
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
            <p className="text-xs text-on-surface-variant mt-1">
              The user ID of the person who will be assigned as organisation owner.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              label="Cancel"
              type="button"
              outlined
              severity="secondary"
              onClick={() => router.push('/admin/organisations')}
            />
            <Button
              label="Create Organisation"
              type="submit"
              icon="pi pi-plus"
              loading={createOrg.isPending}
            />
          </div>
        </form>
      </Card>
    </>
  );
}
