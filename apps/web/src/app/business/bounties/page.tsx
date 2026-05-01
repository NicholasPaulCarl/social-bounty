'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paginator } from 'primereact/paginator';
import { Inbox, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useBounties, useDeleteBounty } from '@/hooks/useBounties';
import { useManageFilters, mapManageSortToApi } from '@/hooks/useManageFilters';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { bountyApi } from '@/lib/api/bounties';
import { redirectToHostedCheckout } from '@/lib/utils/redirect-to-checkout';
import { BountyCardSkeleton } from '@/components/features/bounty/BountyCardSkeleton';
import { BusinessBountyListView } from '@/components/features/bounty/BusinessBountyListView';
import type { ManageStatusAction } from '@/components/features/bounty/BountyManageActions';
import { BountyHubHeader } from '@/components/features/bounty/BountyHubHeader';
import { BountyStatusSegmented } from '@/components/features/bounty/BountyStatusSegmented';
import { QuickCreateGrid } from '@/components/features/bounty/QuickCreateGrid';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatEnumLabel } from '@/lib/utils/format';
import { BountyStatus, FIELD_LIMITS, PaymentStatus, type BountyListItem } from '@social-bounty/shared';

const PAGE_LIMIT = 25;

/**
 * Manage Bounties page — `/business/bounties`.
 *
 * Sibling of the hunter `/bounties` Browse page, sharing the visual
 * language but tuned for the brand workflow:
 *
 *   simple header (H1 Bounties · subtitle · "+ New bounty" CTA)
 *   → quick-create card grid (Blank / Social Exposure / Check-Ins /
 *     Product Sales — each links to /business/bounties/new[?preset=…])
 *   → "All bounties" eyebrow
 *   → filter card: segmented status (All · Live · Drafts · Ended) +
 *     search input + Filter button stub
 *   → results: skeleton → list (DataTable, ellipsis-menu per row) → empty
 *   → paginator (25 per page)
 *
 * URL contract round-trips through `useManageFilters`: every filter is
 * shareable / bookmarkable / reload-safe at
 * `/business/bounties?status=DRAFT&rewardType=CASH&sortBy=reward-high&view=list`.
 */
function BusinessBountiesContent() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const f = useManageFilters();
  const apiSort = mapManageSortToApi(f.filters.sortBy);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{
    bounty: BountyListItem;
    action: ManageStatusAction;
  } | null>(null);
  const [paymentBountyId, setPaymentBountyId] = useState<string | null>(null);

  const statusParam = f.filters.status === 'all' ? undefined : f.filters.status;

  const { data, isLoading, error, refetch } = useBounties({
    page: f.filters.page,
    limit: PAGE_LIMIT,
    status: statusParam,
    rewardType: f.filters.rewardType === 'all' ? undefined : f.filters.rewardType,
    sortBy: apiSort.sortBy,
    sortOrder: apiSort.sortOrder,
    search: f.filters.search || undefined,
  });

  const deleteBounty = useDeleteBounty();
  const bounties: BountyListItem[] = data?.data ?? [];
  const totalForFilter = data?.meta.total ?? 0;
  const hasActiveFilters = f.activeChips.length > 0;

  // ── Action handlers ────────────────────────────────────────────────────

  const refreshAll = () => {
    refetch();
  };

  const handleView = (bounty: BountyListItem) =>
    router.push(`/business/bounties/${bounty.id}`);

  const handleEdit = (bounty: BountyListItem) =>
    router.push(`/business/bounties/${bounty.id}/edit`);

  const handleStatusActionTap = (bounty: BountyListItem, action: ManageStatusAction) =>
    setStatusAction({ bounty, action });

  const handleDeleteTap = (bounty: BountyListItem) => setDeleteId(bounty.id);

  const handleDuplicate = async (bounty: BountyListItem) => {
    try {
      const detail = await bountyApi.getById(bounty.id);
      const prefix = 'Copy of ';
      const maxLen = FIELD_LIMITS.BOUNTY_TITLE_MAX - prefix.length;
      const title = prefix + detail.title.slice(0, maxLen);
      const newBounty = await bountyApi.create({
        title,
        shortDescription: detail.shortDescription || undefined,
        contentFormat: detail.contentFormat,
        fullInstructions: detail.fullInstructions || undefined,
        instructionSteps: detail.instructionSteps,
        category: detail.category || undefined,
        proofRequirements: detail.proofRequirements || undefined,
        maxSubmissions: detail.maxSubmissions,
        startDate: null,
        endDate: detail.endDate,
        channels: detail.channels ?? undefined,
        rewards: detail.rewards.map((r) => ({
          rewardType: r.rewardType,
          name: r.name,
          monetaryValue: parseFloat(r.monetaryValue),
        })),
        postVisibility: detail.postVisibility ?? undefined,
        structuredEligibility: detail.structuredEligibility ?? undefined,
        currency: detail.currency,
        aiContentPermitted: detail.aiContentPermitted,
        engagementRequirements: detail.engagementRequirements ?? undefined,
        payoutMetrics: detail.payoutMetrics ?? undefined,
        payoutMethod: detail.payoutMethod ?? undefined,
        eligibilityRules: detail.eligibilityRules || undefined,
        // Not carried over: invitations, selectedHunters, brand assets,
        // submissions, status (implicitly DRAFT), paymentStatus.
      });
      toast.showSuccess('Bounty duplicated as draft.');
      router.push(`/business/bounties/${newBounty.id}/edit`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't duplicate bounty. Try again.";
      toast.showError(message);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    deleteBounty.mutate(deleteId, {
      onSuccess: () => {
        toast.showSuccess('Bounty removed.');
        setDeleteId(null);
        refreshAll();
      },
      onError: () => toast.showError("Couldn't delete bounty. Try again."),
    });
  };

  const handleStatusConfirm = async () => {
    if (!statusAction) return;
    const { bounty, action } = statusAction;

    // DRAFT → LIVE requires payment first; route through TradeSafe hosted checkout.
    if (
      bounty.status === BountyStatus.DRAFT &&
      action.status === BountyStatus.LIVE &&
      bounty.paymentStatus !== PaymentStatus.PAID
    ) {
      setStatusAction(null);
      setPaymentBountyId(bounty.id);
      try {
        const payerName =
          `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim().slice(0, 40) || 'Brand Admin';
        const { hostedUrl } = await bountyApi.fundBounty(bounty.id, {
          payerName,
          payerEmail: user?.email,
        });
        redirectToHostedCheckout(hostedUrl, bounty.id, {
          onDevNotice: (msg) => toast.showInfo(msg),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Couldn't start funding. Try again.";
        toast.showError(message);
      } finally {
        setPaymentBountyId(null);
      }
      return;
    }

    bountyApi
      .updateStatus(bounty.id, { status: action.status })
      .then(() => {
        toast.showSuccess(`Bounty is now ${formatEnumLabel(action.status)}.`);
        setStatusAction(null);
        refreshAll();
      })
      .catch(() => toast.showError("Couldn't update status. Try again."));
  };

  return (
    <>
      <BountyHubHeader onCreate={() => router.push('/business/bounties/new')} />

      <QuickCreateGrid />

      {/* Eyebrow row — "All bounties" label (pink) + "{N} of {M}" count (right, mono).
          Hide row entirely when resolved to zero results (no awkward "0 of 0").
          During loading, totalForFilter is 0 but isLoading is true — show label only. */}
      {(isLoading || totalForFilter > 0) && (
        <div
          className="flex items-baseline justify-between"
          style={{ marginTop: 32, marginBottom: 8 }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.10em] text-pink-600">
            All bounties
          </span>
          {totalForFilter > 0 && (
            <span
              className="font-mono tabular-nums text-text-muted"
              style={{ fontSize: 12 }}
              aria-live="polite"
            >
              {bounties.length + (f.filters.page - 1) * PAGE_LIMIT} of {totalForFilter}
            </span>
          )}
        </div>
      )}

      {/* Single list-card shell — toolbar + listview body + pagination footer */}
      <div
        className="bg-surface overflow-hidden"
        style={{
          border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Single-row toolbar */}
        <div
          className="flex flex-wrap items-center gap-3"
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--slate-100)',
          }}
        >
          {/* Search input */}
          <div
            className="relative flex-1 sm:flex-none"
            style={{ minWidth: 0, maxWidth: 380 }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                pointerEvents: 'none',
              }}
            >
              <Search size={14} strokeWidth={2} />
            </span>
            <input
              type="text"
              value={f.searchInput}
              onChange={(e) => f.setSearch(e.target.value)}
              placeholder="Search by name or ID"
              aria-label="Search bounties"
              className="w-full bg-surface text-text-primary sm:w-80"
              style={{
                boxSizing: 'border-box',
                padding: '7px 12px 7px 30px',
                border: '1px solid var(--slate-200)',
                borderRadius: 8,
                fontSize: 13,
                height: 36,
                fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
            />
          </div>

          {/* Status segmented control */}
          <BountyStatusSegmented value={f.filters.status} onChange={f.setStatus} />

          {/* Spacer — pushes Filter button to the right */}
          <div style={{ flex: 1 }} />

          {/* Filter button — stub, no-op until filter panel designed */}
          <button
            type="button"
            className="cursor-pointer inline-flex items-center gap-1.5 transition-all"
            style={{
              padding: '7px 12px',
              border: '1px solid var(--slate-200)',
              borderRadius: 8,
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              height: 36,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            aria-label="Open filters"
          >
            <SlidersHorizontal size={13} strokeWidth={2} aria-hidden="true" />
            Filter
          </button>
        </div>

        {/* List body — loading / error / empty / data */}
        <div className="py-0">
          {isLoading && (
            <div className="grid grid-cols-1 gap-3 px-4 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <BountyCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="px-4 py-6">
              <ErrorState error={error as Error} onRetry={() => refreshAll()} />
            </div>
          )}

          {!isLoading && !error && bounties.length === 0 && (
            <div className="px-4 py-8">
              <EmptyState
                Icon={hasActiveFilters || f.filters.status !== 'all' ? Search : Inbox}
                title={
                  hasActiveFilters || f.filters.status !== 'all'
                    ? 'No bounties match'
                    : 'No bounties yet'
                }
                message={
                  hasActiveFilters || f.filters.status !== 'all'
                    ? 'Try a wider status or different reward type.'
                    : "Drop your first bounty and watch the Hunters roll in."
                }
                ctaLabel={
                  hasActiveFilters || f.filters.status !== 'all'
                    ? 'Clear filters'
                    : 'Create bounty'
                }
                ctaAction={
                  hasActiveFilters || f.filters.status !== 'all'
                    ? () => {
                        f.clearAll();
                        if (f.filters.status !== 'all') f.setStatus('all');
                      }
                    : () => router.push('/business/bounties/new')
                }
                CtaIcon={
                  hasActiveFilters || f.filters.status !== 'all' ? X : Plus
                }
              />
            </div>
          )}

          {!isLoading && !error && bounties.length > 0 && (
            <BusinessBountyListView
              bounties={bounties}
              onView={handleView}
              onEdit={handleEdit}
              onStatusChange={handleStatusActionTap}
              onDelete={handleDeleteTap}
              onDuplicate={handleDuplicate}
              paymentBountyId={paymentBountyId}
            />
          )}
        </div>

        {/* Pagination footer band — only when there are multiple pages */}
        {!isLoading && !error && totalForFilter > PAGE_LIMIT && (
          <div
            className="flex flex-wrap items-center justify-between gap-2"
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--slate-100)',
            }}
          >
            <span
              className="font-mono tabular-nums text-text-muted"
              style={{ fontSize: 12 }}
            >
              Showing{' '}
              {Math.min(
                bounties.length + (f.filters.page - 1) * PAGE_LIMIT,
                totalForFilter,
              )}{' '}
              of {totalForFilter} results
            </span>
            <Paginator
              first={(f.filters.page - 1) * PAGE_LIMIT}
              rows={PAGE_LIMIT}
              totalRecords={totalForFilter}
              onPageChange={(e) => f.setPage(e.page + 1)}
            />
          </div>
        )}
      </div>

      {/* Bottom breathing room */}
      <div className="pb-7" />

      <ConfirmAction
        visible={!!deleteId}
        onHide={() => setDeleteId(null)}
        title="Delete bounty"
        message="Are you sure you want to delete this bounty? This action cannot be undone."
        confirmLabel="Delete"
        confirmSeverity="danger"
        onConfirm={handleDeleteConfirm}
        loading={deleteBounty.isPending}
      />

      {statusAction && (
        <ConfirmAction
          visible
          onHide={() => setStatusAction(null)}
          title={`${statusAction.action.label} bounty`}
          message={
            statusAction.action.status === BountyStatus.CLOSED
              ? 'Are you sure you want to close this bounty? This action cannot be undone.'
              : `Are you sure you want to ${statusAction.action.label.toLowerCase()} this bounty?`
          }
          confirmLabel={`Yes, ${statusAction.action.label.toLowerCase()}`}
          confirmSeverity={
            statusAction.action.status === BountyStatus.CLOSED
              ? 'danger'
              : statusAction.action.status === BountyStatus.PAUSED
                ? 'warning'
                : 'success'
          }
          onConfirm={handleStatusConfirm}
        />
      )}

    </>
  );
}

export default function BusinessBountiesPage() {
  // `useSearchParams` requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <BusinessBountiesContent />
    </Suspense>
  );
}
