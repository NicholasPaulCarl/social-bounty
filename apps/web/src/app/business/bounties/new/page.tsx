'use client';

import { useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCreateBounty } from '@/hooks/useBounties';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useBrand } from '@/hooks/useBrand';
import { CreateBountyForm } from '@/components/bounty-form';
import { BOUNTY_PRESETS, getPresetFormState, isBountyPresetId } from '@/components/bounty-form/bounty-presets';
import { Building2, ChevronRight } from 'lucide-react';
import { bountyApi } from '@/lib/api/bounties';
import { redirectToHostedCheckout } from '@/lib/utils/redirect-to-checkout';
import type { CreateBountyRequest } from '@social-bounty/shared';
import { useState } from 'react';

export default function CreateBountyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const { data: org } = useBrand(user?.brandId || '');
  const createBounty = useCreateBounty();
  const [formError, setFormError] = useState('');
  const [isDraftSave, setIsDraftSave] = useState(false);
  // isFunding covers the gap between the create-bounty mutation settling
  // and the TradeSafe hosted redirect firing — keeps the Create Bounty
  // button in its loading state across both steps.
  const [isFunding, setIsFunding] = useState(false);
  const stagedFilesRef = useRef<File[]>([]);

  // Resolve the preset query param (?preset=blank|social-exposure|...)
  // Computed once via useMemo so the partial form state is referentially
  // stable across renders — useCreateBountyForm only consumes it in the
  // reducer initializer (first render only), so the stability is mostly
  // defensive. Wave A's bounty-presets.ts replaces the {} stub with real
  // partial states.
  const presetRaw = searchParams?.get('preset');
  const initialFormOverride = useMemo(() => {
    if (!isBountyPresetId(presetRaw)) return undefined;
    if (presetRaw === 'blank') return undefined;
    const preset = getPresetFormState(presetRaw);
    return Object.keys(preset).length > 0 ? preset : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetRaw]);

  // Derive the breadcrumb current-segment label.
  // "blank" and unrecognised presets both show "New bounty".
  // All other valid presets show "New: <preset.label>".
  const currentCrumbLabel = useMemo(() => {
    if (!isBountyPresetId(presetRaw) || presetRaw === 'blank') return 'New bounty';
    const preset = BOUNTY_PRESETS.find((p) => p.id === presetRaw);
    return preset ? `New: ${preset.label}` : 'New bounty';
  }, [presetRaw]);

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
        // Go straight to the TradeSafe hosted checkout — no detour through
        // the detail page. Mirrors the "Go Live" flow on the detail page
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

  // Discard for the new-bounty path: nothing's been persisted, so we
  // just navigate back to the bounty hub. Edit mode wires onDiscard
  // differently (back to detail page) — see /business/bounties/[id]/edit.
  const handleDiscard = () => {
    router.push('/business/bounties');
  };

  return (
    <div className="animate-fade-up">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs">
        <ol className="flex items-center gap-1 text-slate-500">
          <li>
            <Link
              href="/business/bounties"
              className="text-pink-600 hover:underline transition-colors"
            >
              Bounties
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={12} className="text-slate-400" />
          </li>
          <li className="text-text-primary font-medium" aria-current="page">
            {currentCrumbLabel}
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Create new bounty</h1>

      {org && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-pink-600/20 bg-pink-600/5 text-sm">
          <Building2 size={16} strokeWidth={2} className="text-pink-600" />
          <span className="text-text-muted">Creating bounty for:</span>
          <span className="font-medium text-text-primary">{org.name}</span>
        </div>
      )}

      <CreateBountyForm
        initialFormOverride={initialFormOverride}
        onSubmit={handleSubmit as (data: unknown) => void}
        onSaveDraft={handleSaveDraft as (data: unknown) => void}
        onDiscard={handleDiscard}
        isSubmitting={!isDraftSave && (createBounty.isPending || isFunding)}
        isSavingDraft={isDraftSave && createBounty.isPending}
        formError={formError}
        onStagedFilesReady={handleStagedFilesReady}
      />
    </div>
  );
}
