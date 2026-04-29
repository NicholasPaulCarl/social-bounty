'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paginator } from 'primereact/paginator';
import { Inbox, Plus, Search, X } from 'lucide-react';
import { useBounties, useDeleteBounty } from '@/hooks/useBounties';
import { useManageFilters, mapManageSortToApi } from '@/hooks/useManageFilters';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { bountyApi } from '@/lib/api/bounties';
import { redirectToHostedCheckout } from '@/lib/utils/redirect-to-checkout';
import { BountyManageCard } from '@/components/features/bounty/BountyManageCard';
import { BountyCardSkeleton } from '@/components/features/bounty/BountyCardSkeleton';
import { BusinessBountyListView } from '@/components/features/bounty/BusinessBountyListView';
import { BountyManageActions, type ManageStatusAction } from '@/components/features/bounty/BountyManageActions';
import { ManageHero } from '@/components/features/bounty/ManageHero';
import { BountyStatusPills } from '@/components/features/bounty/BountyStatusPills';
import { BrowseFilterBar } from '@/components/features/bounty/BrowseFilterBar';
import { ActiveFilterChips } from '@/components/features/bounty/ActiveFilterChips';
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
 *   gradient hero (Manage bounties · counts · view toggle · Create CTA)
 *   → quick-create card grid (Blank / Social Exposure / Check-Ins /
 *     Product Sales — each links to /business/bounties/new[?preset=…])
 *   → status pills (All · Draft · Live · Paused · Closed)
 *   → sticky filter bar (search · reward · sort · clear)
 *   → optional active-filter chips
 *   → results: skeleton → grid (manage card + actions footer) →
 *     list (DataTable, ellipsis-menu per row) → empty
 *   → paginator (25 per page)
 *
 * URL contract round-trips through `useManageFilters`: every filter is
 * shareable / bookmarkable / reload-safe at
 * `/business/bounties?status=DRAFT&rewardType=CASH&sortBy=reward-high&view=list`.
 *
 * Per-status counts are fired as four lightweight `limit:1` queries in
 * parallel; each shares the existing `useBounties` cache key so navigating
 * between status tabs reuses the data.
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

  // Per-status counts — four lightweight queries running in parallel.
  // React Query dedupes them by key so re-renders are cheap.
  const live = useBounties({ page: 1, limit: 1, status: BountyStatus.LIVE });
  const draft = useBounties({ page: 1, limit: 1, status: BountyStatus.DRAFT });
  const paused = useBounties({ page: 1, limit: 1, status: BountyStatus.PAUSED });
  const closed = useBounties({ page: 1, limit: 1, status: BountyStatus.CLOSED });

  const statusCounts = {
    live: live.data?.meta.total,
    draft: draft.data?.meta.total,
    paused: paused.data?.meta.total,
    closed: closed.data?.meta.total,
  };

  const deleteBounty = useDeleteBounty();
  const bounties: BountyListItem[] = data?.data ?? [];
  const totalForFilter = data?.meta.total ?? 0;
  const hasActiveFilters = f.activeChips.length > 0;
  const isGrid = f.filters.view === 'grid';

  // ── Action handlers ────────────────────────────────────────────────────

  const refreshAll = () => {
    refetch();
    live.refetch();
    draft.refetch();
    paused.refetch();
    closed.refetch();
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

  // ── Hero meta — single-clause when filtered, full breakdown on All ────
  const filteredLabel = (() => {
    if (f.filters.status === 'all') return null;
    return (
      <span>
        <span
          className="font-mono tabular-nums text-text-primary"
          style={{ fontWeight: 600 }}
        >
          {totalForFilter}
        </span>{' '}
        {f.statusLabel[f.filters.status].toLowerCase()}
      </span>
    );
  })();

  return (
    <>
      <ManageHero
        statusCounts={f.filters.status === 'all' ? statusCounts : undefined}
        extraMeta={filteredLabel}
        viewMode={f.filters.view}
        onViewChange={f.setView}
        onCreate={() => router.push('/business/bounties/new')}
      />

      <QuickCreateGrid />

      <h2 className="mb-2 sm:mb-2.5 text-[10px] font-bold uppercase tracking-[0.10em] text-text-muted">
        All bounties
      </h2>

      <div className="mb-3 sm:mb-4">
        <BountyStatusPills value={f.filters.status} onChange={f.setStatus} />
      </div>

      <BrowseFilterBar
        search={f.searchInput}
        onSearchChange={f.setSearch}
        rewardType={f.filters.rewardType}
        onRewardTypeChange={f.setRewardType}
        sortBy={f.filters.sortBy}
        onSortByChange={f.setSortBy}
        hasActiveFilters={hasActiveFilters}
        onClearAll={f.clearAll}
      />

      {hasActiveFilters && (
        <div className="pt-3 sm:pt-4">
          <ActiveFilterChips chips={f.activeChips} onRemove={f.removeChip} />
        </div>
      )}

      <div className="pb-7 pt-4 sm:pt-5">
        {isLoading && (
          <div
            className={
              isGrid
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'grid grid-cols-1 gap-3'
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <BountyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <ErrorState error={error as Error} onRetry={() => refreshAll()} />
        )}

        {!isLoading && !error && bounties.length === 0 && (
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
        )}

        {!isLoading && !error && bounties.length > 0 && (
          <>
            {isGrid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bounties.map((bounty) => (
                  <BountyManageCard
                    key={bounty.id}
                    bounty={bounty}
                    footer={
                      <BountyManageActions
                        bounty={bounty}
                        onView={handleView}
                        onEdit={handleEdit}
                        onStatusChange={handleStatusActionTap}
                        onDelete={handleDeleteTap}
                        onDuplicate={handleDuplicate}
                        paymentLoading={paymentBountyId === bounty.id}
                      />
                    }
                  />
                ))}
              </div>
            ) : (
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

            {totalForFilter > PAGE_LIMIT && (
              <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <span
                  className="font-mono tabular-nums text-text-muted"
                  style={{ fontSize: 12 }}
                >
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
          </>
        )}
      </div>

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
