'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useOrganisation } from '@/hooks/useOrganisation';
import { PageHeader } from '@/components/common/PageHeader';
import { CreateBountyForm } from '@/components/bounty-form';
import { bountyApi } from '@/lib/api/bounties';
import type { CreateBountyRequest } from '@social-bounty/shared';
import { useState } from 'react';

export default function CreateBountyPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { data: org } = useOrganisation(user?.organisationId || '');
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
        toast.showError('Couldn\'t upload brand assets. You can re-upload from the edit page.');
      }
    }
  };

  const handleSubmit = (data: CreateBountyRequest) => {
    setIsDraftSave(false);
    setFormError('');
    createBounty.mutate(data, {
      onSuccess: async (res) => {
        await uploadStagedFiles(res.id);
        toast.showSuccess('Bounty created! Ready to go live.');
        router.push(`/business/bounties/${res.id}`);
      },
      onError: () => {
        setFormError('Couldn\'t create bounty. Try again.');
      },
    });
  };

  const handleSaveDraft = (data: CreateBountyRequest) => {
    setIsDraftSave(true);
    setFormError('');
    createBounty.mutate(data, {
      onSuccess: async (res) => {
        await uploadStagedFiles(res.id);
        toast.showSuccess('Draft saved. Pick it up anytime.');
        router.push(`/business/bounties/${res.id}`);
      },
      onError: () => {
        setFormError('Couldn\'t save draft. Try again.');
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

      {org && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 text-sm">
          <i className="pi pi-building text-accent-cyan" />
          <span className="text-text-muted">Creating bounty for:</span>
          <span className="font-medium text-text-primary">{org.name}</span>
        </div>
      )}

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
