'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/hooks/useBrand';
import { CreateBountyForm } from '@/components/bounty-form';
import { bountyApi } from '@/lib/api/bounties';
import { redirectToHostedCheckout } from '@/lib/utils/redirect-to-hosted-checkout';
import type { CreateBountyRequest } from '@social-bounty/shared';
import { useState } from 'react';

export default function CreateBountyPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { data: org } = useBrand(user?.brandId || '');
  const createBounty = useCreateBounty();
  const [formError, setFormError] = useState('');
  const [isDraftSave, setIsDraftSave] = useState(false);
  // isFunding covers the gap between the create-bounty mutation settling
  // and the Stitch hosted redirect firing — keeps the Create Bounty
  // button in its loading state across both steps.
  const [isFunding, setIsFunding] = useState(false);
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

  const extractErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const apiErr = err as { message?: string; details?: Array<{ field: string; message: string }> };
      if (apiErr.details && apiErr.details.length > 0) {
        return apiErr.details.map((d) => `${d.field}: ${d.message}`).join('; ');
      }
      if (apiErr.message) return apiErr.message;
    }
    return 'Please try again.';
  };

  const handleSubmit = (data: CreateBountyRequest) => {
    setIsDraftSave(false);
    setFormError('');
    createBounty.mutate(data, {
      onSuccess: async (res) => {
        await uploadStagedFiles(res.id);
        // Go straight to the Stitch hosted checkout — no detour through the
        // detail page. Mirrors the "Go Live" flow on the detail page
        // (/business/bounties/[id] handleStatusChange DRAFT→LIVE).
        setIsFunding(true);
        try {
          const payerName =
            `${user?.firstName ?? ''} ${user?.lastName ?? ''}`
              .trim()
              .slice(0, 40) || 'Brand Admin';
          const { hostedUrl } = await bountyApi.fundBounty(res.id, {
            payerName,
            payerEmail: user?.email,
          });
          // Helper handles the same-page redirect in production and the
          // new-tab open in dev (preview iframes block external nav).
          // It also stashes bountyId in sessionStorage either way so the
          // /funded page can resolve the bounty on return.
          redirectToHostedCheckout(hostedUrl, res.id, {
            onDevNotice: (msg) => toast.showInfo(msg),
            onDevSettled: () => setIsFunding(false),
          });
          // In production the page unloads here; in dev the helper opens
          // a new tab and the brand stays on the form (isFunding cleared
          // by onDevSettled).
        } catch (err) {
          // Bounty is already created as DRAFT; payment setup failed. Take
          // the brand to the detail page so they can retry via "Go Live".
          const message = err instanceof Error ? err.message : 'Unknown error';
          toast.showError(
            `Bounty saved as draft, but we couldn't start payment: ${message}. Try "Go Live" on the bounty detail page.`,
          );
          setIsFunding(false);
          router.push(`/business/bounties/${res.id}`);
        }
      },
      onError: (err) => {
        setFormError(`Couldn't create bounty: ${extractErrorMessage(err)}`);
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
      onError: (err) => {
        setFormError(`Couldn't save draft: ${extractErrorMessage(err)}`);
      },
    });
  };

  const handleStagedFilesReady = (files: File[]) => {
    stagedFilesRef.current = files;
  };

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Create New Bounty</h1>

      {org && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-pink-600/20 bg-pink-600/5 text-sm">
          <i className="pi pi-building text-pink-600" />
          <span className="text-text-muted">Creating bounty for:</span>
          <span className="font-medium text-text-primary">{org.name}</span>
        </div>
      )}

      <CreateBountyForm
        onSubmit={handleSubmit as (data: unknown) => void}
        onSaveDraft={handleSaveDraft as (data: unknown) => void}
        isSubmitting={!isDraftSave && (createBounty.isPending || isFunding)}
        isSavingDraft={isDraftSave && createBounty.isPending}
        formError={formError}
        onStagedFilesReady={handleStagedFilesReady}
      />
    </div>
  );
}
