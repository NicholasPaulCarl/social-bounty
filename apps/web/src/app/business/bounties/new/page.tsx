'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { CreateBountyForm } from '@/components/bounty-form';
import { bountyApi } from '@/lib/api/bounties';
import type { CreateBountyRequest } from '@social-bounty/shared';
import { useState } from 'react';

export default function CreateBountyPage() {
  const router = useRouter();
  const toast = useToast();
  const createBounty = useCreateBounty();
  const [formError, setFormError] = useState('');
  const [isDraftSave, setIsDraftSave] = useState(false);
  const stagedFilesRef = useRef<File[]>([]);

  const uploadStagedFiles = async (bountyId: string) => {
    if (stagedFilesRef.current.length > 0) {
      try {
        await bountyApi.uploadBrandAssets(bountyId, stagedFilesRef.current);
      } catch {
        // Non-blocking: brand asset upload failure shouldn't prevent navigation
        toast.showError('Brand assets failed to upload. You can re-upload from the edit page.');
      }
    }
  };

  const handleSubmit = (data: CreateBountyRequest) => {
    setIsDraftSave(false);
    setFormError('');
    createBounty.mutate(data, {
      onSuccess: async (res) => {
        await uploadStagedFiles(res.id);
        toast.showSuccess('Bounty created successfully');
        router.push(`/business/bounties/${res.id}`);
      },
      onError: () => {
        setFormError('Failed to create bounty. Please try again.');
      },
    });
  };

  const handleSaveDraft = (data: CreateBountyRequest) => {
    setIsDraftSave(true);
    setFormError('');
    createBounty.mutate(data, {
      onSuccess: async (res) => {
        await uploadStagedFiles(res.id);
        toast.showSuccess('Draft saved successfully');
        router.push(`/business/bounties/${res.id}`);
      },
      onError: () => {
        setFormError('Failed to save draft. Please try again.');
      },
    });
  };

  const handleStagedFilesReady = (files: File[]) => {
    stagedFilesRef.current = files;
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: 'Create' },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader title="Create New Bounty" breadcrumbs={breadcrumbs} />
      <CreateBountyForm
        onSubmit={handleSubmit as (data: unknown) => void}
        onSaveDraft={handleSaveDraft as (data: unknown) => void}
        isSubmitting={!isDraftSave && createBounty.isPending}
        isSavingDraft={isDraftSave && createBounty.isPending}
        formError={formError}
        onStagedFilesReady={handleStagedFilesReady}
      />
    </div>
  );
}
