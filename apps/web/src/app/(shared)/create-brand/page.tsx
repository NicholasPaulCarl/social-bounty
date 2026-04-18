'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useCreateBrand } from '@/hooks/useBrand';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { ApiError } from '@/lib/api/client';

export default function CreateBrandPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const createBrand = useCreateBrand();

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
      await createBrand.mutateAsync({
        data: { name: name.trim(), contactEmail: contactEmail.trim() },
        logo,
      });
      showSuccess('Brand created! You are now a Business Admin.');
      router.push('/business/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        showError(err.message);
      } else {
        showError("Couldn't create brand. Try again.");
      }
    }
  };

  return (
    <>
      <PageHeader title="Create Brand" subtitle="Set up your business to start creating bounties" />

      <div className="glass-card p-8 max-w-2xl animate-fade-up">
        {error && <Message severity="error" text={error} className="w-full mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Brand Name <span className="text-danger-600">*</span>
            </label>
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              required
              placeholder="Your company name"
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Contact Email <span className="text-danger-600">*</span>
            </label>
            <InputText
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full"
              required
              placeholder="contact@company.com"
            />
          </div>
          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Logo <span className="text-text-disabled">(optional)</span>
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
              label="Create Brand"
              icon="pi pi-check"
              loading={createBrand.isPending}
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
      </div>
    </>
  );
}
