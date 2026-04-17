'use client';

import { useRouter, useParams } from 'next/navigation';
import { useBounty, useUpdateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { CreateBountyForm } from '@/components/bounty-form';
import { bountyApi } from '@/lib/api/bounties';
import { redirectToHostedCheckout } from '@/lib/utils/redirect-to-hosted-checkout';
import { BountyStatus, PaymentStatus } from '@social-bounty/shared';
import type { CreateBountyRequest, UpdateBountyRequest } from '@social-bounty/shared';
import { useState } from 'react';

export default function EditBountyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const { user } = useAuth();

  const { data: bounty, isLoading, error, refetch } = useBounty(id);
  const updateBounty = useUpdateBounty(id);
  const [formError, setFormError] = useState('');
  const [isDraftSave, setIsDraftSave] = useState(false);
  // isFunding bridges the gap between the update-bounty mutation settling
  // and the Stitch hosted redirect firing — keeps the Create Bounty
  // button in its loading state across both steps.
  const [isFunding, setIsFunding] = useState(false);

  if (isLoading) return <LoadingState type="form" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!bounty) return null;

  const handleSubmit = (data: CreateBountyRequest | UpdateBountyRequest) => {
    setIsDraftSave(false);
    setFormError('');
    updateBounty.mutate(data as UpdateBountyRequest, {
      onSuccess: async () => {
        // DRAFT + unpaid → chain straight into the Stitch hosted checkout.
        // Same flow the new-bounty page uses (commit bd2480b) and the
        // detail-page "Go Live" button (handleStatusChange DRAFT→LIVE).
        // LIVE / PAUSED / already-PAID bounties skip this and just save.
        const needsPayment =
          bounty.status === BountyStatus.DRAFT &&
          bounty.paymentStatus !== PaymentStatus.PAID;

        if (!needsPayment) {
          toast.showSuccess('Bounty updated.');
          router.push(`/business/bounties/${id}`);
          return;
        }

        setIsFunding(true);
        try {
          const payerName =
            `${user?.firstName ?? ''} ${user?.lastName ?? ''}`
              .trim()
              .slice(0, 40) || 'Brand Admin';
          const { hostedUrl } = await bountyApi.fundBounty(id, {
            payerName,
            payerEmail: user?.email,
          });
          redirectToHostedCheckout(hostedUrl, id, {
            onDevNotice: (msg) => toast.showInfo(msg),
            onDevSettled: () => setIsFunding(false),
          });
          // Production: page unloads. Dev: helper opens a new tab + clears
          // isFunding via onDevSettled so the brand can keep using the form.
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          toast.showError(
            `Saved, but couldn't start payment: ${message}. Try "Go Live" on the bounty detail page.`,
          );
          setIsFunding(false);
          router.push(`/business/bounties/${id}`);
        }
      },
      onError: () => {
        setFormError('Couldn\'t update bounty. Try again.');
      },
    });
  };

  const handleSaveDraft = (data: CreateBountyRequest | UpdateBountyRequest) => {
    setIsDraftSave(true);
    setFormError('');
    updateBounty.mutate(data as UpdateBountyRequest, {
      onSuccess: () => {
        toast.showSuccess('Draft saved. Pick it up anytime.');
        router.push(`/business/bounties/${id}`);
      },
      onError: () => {
        setFormError('Couldn\'t save draft. Try again.');
      },
    });
  };

  const breadcrumbs = [
    { label: 'Bounties', url: '/business/bounties' },
    { label: bounty.title, url: `/business/bounties/${id}` },
    { label: 'Edit' },
  ];

  const isLive = bounty.status === BountyStatus.LIVE;
  const isPaused = bounty.status === BountyStatus.PAUSED;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Edit Bounty" breadcrumbs={breadcrumbs} />

      {isLive && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <i className="pi pi-exclamation-triangle text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">This bounty is live.</p>
            <p className="text-sm text-text-secondary mt-1">
              Only eligibility rules, proof requirements, max submissions, and end date can be edited.
              All other fields are locked while the bounty is live. To make full edits, pause the bounty first, then revert it to draft.
            </p>
          </div>
        </div>
      )}

      {isPaused && (
        <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 flex items-start gap-3">
          <i className="pi pi-info-circle text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">This bounty is paused.</p>
            <p className="text-sm text-text-secondary mt-1">
              Editing is limited while in paused state. To make full edits, revert the bounty to draft status first.
            </p>
            <Button
              label="Revert to Draft"
              icon="pi pi-undo"
              severity="secondary"
              outlined
              size="small"
              className="mt-2"
              onClick={() => router.push(`/business/bounties/${id}`)}
            />
          </div>
        </div>
      )}

      <CreateBountyForm
        initialBounty={bounty}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        isSubmitting={!isDraftSave && (updateBounty.isPending || isFunding)}
        isSavingDraft={isDraftSave && updateBounty.isPending}
        formError={formError}
        readOnlyMode={isLive ? 'live' : isPaused ? 'paused' : undefined}
      />
    </div>
  );
}
