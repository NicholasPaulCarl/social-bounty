'use client';

import { useRouter } from 'next/navigation';
import { useCreateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { CreateBountyForm } from '@/components/bounty-form';
import type { CreateBountyRequest } from '@social-bounty/shared';
import { useState } from 'react';

export default function CreateBountyPage() {
  const router = useRouter();
  const toast = useToast();
  const createBounty = useCreateBounty();
  const [formError, setFormError] = useState('');

  const handleSubmit = (data: CreateBountyRequest) => {
    setFormError('');
    createBounty.mutate(data, {
      onSuccess: (res) => {
        toast.showSuccess('Bounty created successfully');
        router.push(`/business/bounties/${res.id}`);
      },
      onError: () => {
        setFormError('Failed to create bounty. Please try again.');
      },
    });
  };

  const handleSaveDraft = (data: CreateBountyRequest) => {
    setFormError('');
    createBounty.mutate(data, {
      onSuccess: (res) => {
        toast.showSuccess('Draft saved successfully');
        router.push(`/business/bounties/${res.id}`);
      },
      onError: () => {
        setFormError('Failed to save draft. Please try again.');
      },
    });
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: 'Create' },
  ];

  return (
    <>
      <PageHeader title="Create New Bounty" breadcrumbs={breadcrumbs} />
      <CreateBountyForm
        onSubmit={handleSubmit as (data: unknown) => void}
        onSaveDraft={handleSaveDraft as (data: unknown) => void}
        isSubmitting={createBounty.isPending}
        isSavingDraft={false}
        formError={formError}
      />
    </>
  );
}
