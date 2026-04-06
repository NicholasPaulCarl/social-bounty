'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { useCreateOrganisation } from '@/hooks/useOrganisation';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { ApiError } from '@/lib/api/client';

export default function CreateOrganisationPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const createOrg = useCreateOrganisation();

  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logo, setLogo] = useState<File | undefined>(undefined);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim()) {
      setError('Name and contact email are required');
      return;
    }

    setError('');
    try {
      await createOrg.mutateAsync({
        data: { name: name.trim(), contactEmail: contactEmail.trim() },
        logo,
      });
      showSuccess('Organisation created! You are now a Business Admin.');
      router.push('/business/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        showError(err.message);
      } else {
        showError('Failed to create organisation');
      }
    }
  };

  return (
    <>
      <PageHeader title="Create Organisation" />

      <Card className="max-w-2xl">
        {error && <Message severity="error" text={error} className="w-full mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Organisation Name <span className="text-error">*</span>
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
            <label htmlFor="contactEmail" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Contact Email <span className="text-error">*</span>
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
            <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Logo (optional)
            </label>
            <FileUpload
              mode="basic"
              name="logo"
              accept="image/*"
              maxFileSize={2000000}
              auto={false}
              chooseLabel="Choose Logo"
              onSelect={(e) => setLogo(e.files[0] as File)}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              label="Create Organisation"
              icon="pi pi-check"
              loading={createOrg.isPending}
            />
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => router.back()}
            />
          </div>
        </form>
      </Card>
    </>
  );
}
