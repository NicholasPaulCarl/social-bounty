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
import { AlertTriangle, Info, Undo2 } from 'lucide-react';
import { bountyApi } from '@/lib/api/bounties';
import { redirectToHostedCheckout } from '@/lib/utils/redirect-to-checkout';
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
  // and the TradeSafe hosted redirect firing — keeps the Create Bounty
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
        // DRAFT + unpaid → chain straight into the TradeSafe hosted checkout.
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
      <PageHeader title="Edit bounty" breadcrumbs={breadcrumbs} />

      {isLive && (
        <div className="mb-6 rounded-lg border border-warning-500/30 bg-warning-500/10 p-4 flex items-start gap-3">
          <AlertTriangle size={18} strokeWidth={2} className="text-warning-600 mt-0.5 flex-shrink-0" />
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
        <div className="mb-6 rounded-lg border border-slate-300 bg-slate-50 p-4 flex items-start gap-3">
          <Info size={18} strokeWidth={2} className="text-slate-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-text-primary">This bounty is paused.</p>
            <p className="text-sm text-text-secondary mt-1">
              Editing is limited while in paused state. To make full edits, revert the bounty to draft status first.
            </p>
            <Button
              label="Revert to draft"
              icon={<Undo2 size={14} strokeWidth={2} />}
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
        // Edit-mode discard returns to the detail page (the saved bounty
        // remains untouched — discard only drops in-progress local edits).
        onDiscard={() => router.push(`/business/bounties/${id}`)}
        isSubmitting={!isDraftSave && (updateBounty.isPending || isFunding)}
        isSavingDraft={isDraftSave && updateBounty.isPending}
        formError={formError}
        readOnlyMode={isLive ? 'live' : isPaused ? 'paused' : undefined}
      />
    </div>
  );
}
