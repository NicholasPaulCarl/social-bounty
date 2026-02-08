'use client';

import { useRouter, useParams } from 'next/navigation';
import { useBounty, useUpdateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { CreateBountyForm } from '@/components/bounty-form';
import type { CreateBountyRequest, UpdateBountyRequest } from '@social-bounty/shared';
import { useState } from 'react';

export default function EditBountyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: bounty, isLoading, error, refetch } = useBounty(id);
  const updateBounty = useUpdateBounty(id);
  const [formError, setFormError] = useState('');
  const [isDraftSave, setIsDraftSave] = useState(false);

  if (isLoading) return <LoadingState type="form" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return null;

  const handleSubmit = (data: CreateBountyRequest | UpdateBountyRequest) => {
    setIsDraftSave(false);
    setFormError('');
    updateBounty.mutate(data as UpdateBountyRequest, {
      onSuccess: () => {
        toast.showSuccess('Bounty updated successfully');
        router.push(`/business/bounties/${id}`);
      },
      onError: () => {
        setFormError('Failed to update bounty. Please try again.');
      },
    });
  };

  const handleSaveDraft = (data: CreateBountyRequest | UpdateBountyRequest) => {
    setIsDraftSave(true);
    setFormError('');
    updateBounty.mutate(data as UpdateBountyRequest, {
      onSuccess: () => {
        toast.showSuccess('Draft saved successfully');
        router.push(`/business/bounties/${id}`);
      },
      onError: () => {
        setFormError('Failed to save draft. Please try again.');
      },
    });
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty.title, url: `/business/bounties/${id}` },
    { label: 'Edit' },
  ];

  return (
    <>
      <PageHeader title="Edit Bounty" breadcrumbs={breadcrumbs} />
      <CreateBountyForm
        initialBounty={bounty}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        isSubmitting={!isDraftSave && updateBounty.isPending}
        isSavingDraft={isDraftSave && updateBounty.isPending}
        formError={formError}
      />
    </>
  );
}
