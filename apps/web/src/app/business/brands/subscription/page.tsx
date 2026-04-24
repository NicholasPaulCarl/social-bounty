'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import {
  useSubscription,
  useSubscribe,
  useCancelSubscription,
  useReactivateSubscription,
  useSubscriptionPayments,
} from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { ProBadge } from '@/components/common/ProBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import {
  SubscriptionStatus,
  SubscriptionTier,
  SUBSCRIPTION_CONSTANTS,
} from '@social-bounty/shared';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { Percent, Globe, MessageSquare, Lock, Star, History, RefreshCw } from 'lucide-react';
import type { SubscriptionPaymentDto } from '@social-bounty/shared';

type IconComponent = typeof Percent;

// Brand-specific feature sets — copy matches the hunter page structure so
// brand admins see the same shape of info about their subscription.
const BRAND_FEATURES: {
  free: Array<{ label: string; Icon: IconComponent }>;
  pro: Array<{ label: string; Icon: IconComponent }>;
} = {
  free: [
    { label: '15% admin fee on bounties', Icon: Percent },
    { label: 'Public bounties only', Icon: Globe },
    { label: 'Standard support', Icon: MessageSquare },
  ],
  pro: [
    { label: '5% admin fee (save 10%)', Icon: Percent },
    { label: 'Create closed bounties', Icon: Lock },
    { label: 'Priority support', Icon: Star },
  ],
};

// Pro subscriptions are disabled until TradeSafe recurring-billing is wired.
// The upgrade plumbing (webhook handlers, ledger writes, tests) stays intact
// — only this flag hides the CTA. Flip back to `true` in lockstep with the
// backend `SUBSCRIPTION_UPGRADE_ENABLED` env var once the provider enables
// the product.
const LIVE_UPGRADE_ENABLED = false;

export default function BrandSubscriptionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: sub, isLoading } = useSubscription();
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();
  const reactivate = useReactivateSubscription();
  const [showCancel, setShowCancel] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const { page, limit, first, onPageChange } = usePagination(10);
  const { data: payments } = useSubscriptionPayments(showPayments ? { page, limit } : undefined);

  // Return handler: same dual-case logic as the hunter page. Refetch on
  // mount; show a "pending / confirmed" banner based on current tier.
  const upgradeReturnMode = searchParams.get('upgrade');
  useEffect(() => {
    if (upgradeReturnMode === 'return') {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  }, [upgradeReturnMode, queryClient]);

  const brandId = user?.brandId;
  // Hard Rule #6: dialog copy must reference the canonical price from
  // @social-bounty/shared so the confirm copy can't drift from billing.
  const proPrice = SUBSCRIPTION_CONSTANTS.BRAND_PRO_PRICE_ZAR;

  if (!brandId) {
    return (
      <Message
        severity="warn"
        text="No brand is selected. Create or switch to a brand to manage its subscription."
        className="w-full"
      />
    );
  }

  if (isLoading) return <LoadingState type="page" />;
  if (!sub) return null;

  const isPro = sub.tier === SubscriptionTier.PRO;
  const isActive = sub.status === SubscriptionStatus.ACTIVE;
  const isCancelled = sub.status === SubscriptionStatus.CANCELLED;
  const isPastDue = sub.status === SubscriptionStatus.PAST_DUE;

  const handleSubscribe = () => {
    // Live upgrade path is parked until TradeSafe recurring-billing is wired
    // (LIVE_UPGRADE_ENABLED=false). Fallback calls the local `subscribe`
    // endpoint which simply flips the tier for staging / dev without
    // moving money.
    subscribe.mutate(undefined, {
      onSuccess: () => {
        toast.showSuccess('Welcome to Pro Brand! Your perks are now active.');
        setShowUpgrade(false);
      },
      onError: (err) => {
        toast.showError((err as Error).message || "Couldn't subscribe. Try again.");
        setShowUpgrade(false);
      },
    });
  };

  const handleCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast.showSuccess('Subscription cancelled. Pro benefits active until period end.');
        setShowCancel(false);
      },
      onError: (err) => toast.showError((err as Error).message || "Couldn't cancel. Try again."),
    });
  };

  const handleReactivate = () => {
    reactivate.mutate(undefined, {
      onSuccess: () => toast.showSuccess('Subscription reactivated! Pro benefits restored.'),
      onError: (err) => toast.showError((err as Error).message || "Couldn't reactivate. Try again."),
    });
  };

  const statusTemplate = (row: SubscriptionPaymentDto) => {
    const colors: Record<string, string> = {
      SUCCEEDED: 'text-success-600 bg-success-600/10',
      FAILED: 'text-danger-600 bg-danger-600/10',
      PENDING: 'text-warning-600 bg-warning-600/10',
      REFUNDED: 'text-text-muted bg-elevated',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[row.status] || ''}`}>
        {row.status}
      </span>
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Brand Subscription"
        subtitle="Your brand's plan and billing"
        breadcrumbs={[{ label: 'Brands', url: '/business/brands' }, { label: 'Subscription' }]}
      />

      {/* Current tier badge — PrimeReact Tag with brand-tier label. */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-text-muted">Current tier:</span>
        <Tag
          value={isPro ? 'PRO BRAND' : 'FREE BRAND'}
          severity={isPro ? 'success' : 'info'}
          rounded
        />
      </div>

      {/* Return from checkout: webhook-before-return vs return-before-webhook. */}
      {upgradeReturnMode === 'return' && (
        <Message
          severity={isPro ? 'success' : 'info'}
          className="w-full mb-6"
          data-testid="upgrade-return-banner"
          text={
            isPro
              ? 'Upgrade confirmed — Pro Brand perks are now active.'
              : 'Card capture complete. The brand will move to Pro shortly; this page will refresh automatically.'
          }
        />
      )}

      {/* PAST_DUE warning — surface the grace-period end date when present. */}
      {isPastDue && (
        <Message
          severity="warn"
          className="w-full mb-6"
          text={
            sub.gracePeriodEndsAt
              ? `The last payment for this brand failed. Pro Brand benefits continue until ${formatDate(sub.gracePeriodEndsAt)} — update the payment method before then to avoid reverting to Free Brand.`
              : 'The last payment for this brand failed. Update the payment method to keep Pro Brand benefits.'
          }
        />
      )}

      {/* Current plan status banner (Pro brand). */}
      {isPro && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-heading font-bold text-text-primary">Brand Plan: Pro</h2>
              <ProBadge size="md" />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-success-600/10 text-success-600' :
              isCancelled ? 'bg-warning-600/10 text-warning-600' :
              isPastDue ? 'bg-danger-600/10 text-danger-600' : ''
            }`}>
              {isActive ? 'Active' : isCancelled ? 'Cancelling' : isPastDue ? 'Past Due' : sub.status}
            </span>
          </div>

          {isCancelled && sub.currentPeriodEnd && (
            <p className="text-sm text-text-secondary mb-4">
              Pro Brand benefits remain active until <strong>{formatDate(sub.currentPeriodEnd)}</strong>. After that, the brand moves to the Free Brand plan.
            </p>
          )}

          {isActive && sub.currentPeriodEnd && (
            <p className="text-sm text-text-secondary mb-4">
              Next billing date: <strong>{formatDate(sub.currentPeriodEnd)}</strong> &middot; {formatCurrency(sub.priceAmount)}/month
            </p>
          )}

          <div className="space-y-2 mb-6">
            {BRAND_FEATURES.pro.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <f.Icon size={16} strokeWidth={2} className="text-pink-600" />
                <span className="text-sm text-text-primary">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              label={showPayments ? 'Hide payment history' : 'View payment history'}
              icon={<History size={14} strokeWidth={2} />}
              outlined
              severity="secondary"
              size="small"
              onClick={() => setShowPayments(!showPayments)}
            />
            {isCancelled ? (
              <Button
                label="Reactivate pro brand"
                icon={<RefreshCw size={14} strokeWidth={2} />}
                size="small"
                loading={reactivate.isPending}
                onClick={handleReactivate}
              />
            ) : (
              <Button
                label="Cancel subscription"
                outlined
                severity="danger"
                size="small"
                onClick={() => setShowCancel(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Tier comparison (Free Brand). */}
      {!isPro && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-bold text-text-primary mb-1">Free Brand</h3>
            <p className="text-sm text-text-muted mb-4">Current plan</p>
            <div className="space-y-3 mb-6">
              {BRAND_FEATURES.free.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <f.Icon size={16} strokeWidth={2} className="text-text-muted" />
                  <span className="text-sm text-text-secondary">{f.label}</span>
                </div>
              ))}
            </div>
            <Button label="Current plan" disabled className="w-full" outlined severity="secondary" />
          </div>

          <div className="glass-card p-6 border border-pink-600/30 shadow-glow-brand">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-heading font-bold text-text-primary">Pro Brand</h3>
              <Star size={16} strokeWidth={2} className="text-pink-600" fill="currentColor" />
            </div>
            <p className="text-sm text-pink-600 mb-4 font-mono tabular-nums">
              R{proPrice}/month
            </p>
            <div className="space-y-3 mb-6">
              {BRAND_FEATURES.pro.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <f.Icon size={16} strokeWidth={2} className="text-pink-600" />
                  <span className="text-sm text-text-primary">{f.label}</span>
                </div>
              ))}
            </div>

            {/* Hard Rule #6 — confirm upgrade in ConfirmAction. Disabled
                until live TradeSafe card-consent is wired so we don't
                silently fake-upgrade the brand. */}
            <span
              className="inline-block w-full"
              title={
                LIVE_UPGRADE_ENABLED
                  ? `Start the brand's Pro subscription at R${proPrice}/month`
                  : 'Pro upgrade coming soon — card billing is not yet live.'
              }
            >
              <Button
                label={LIVE_UPGRADE_ENABLED ? 'Upgrade to pro brand' : 'Pro upgrade coming soon'}
                icon={<Star size={16} strokeWidth={2} />}
                className="w-full"
                disabled={!LIVE_UPGRADE_ENABLED}
                loading={subscribe.isPending}
                onClick={() => setShowUpgrade(true)}
              />
            </span>
          </div>
        </div>
      )}

      {/* Payment history */}
      {showPayments && payments && payments.data.length > 0 && (
        <div className="glass-card overflow-x-auto">
          <DataTable value={payments.data} stripedRows className="min-w-[500px]">
            <Column
              header="Date"
              body={(row: SubscriptionPaymentDto) => formatDate(row.createdAt)}
            />
            <Column
              header="Amount"
              body={(row: SubscriptionPaymentDto) => formatCurrency(row.amount)}
            />
            <Column header="Status" body={statusTemplate} />
            <Column
              header="Period"
              body={(row: SubscriptionPaymentDto) =>
                `${formatDate(row.billingPeriodStart)} - ${formatDate(row.billingPeriodEnd)}`
              }
            />
          </DataTable>
          <Paginator
            first={first}
            rows={limit}
            totalRecords={payments.meta.total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </div>
      )}

      <ConfirmAction
        visible={showUpgrade}
        onHide={() => setShowUpgrade(false)}
        title="Upgrade brand to Pro?"
        message={`Upgrading to Pro starts a monthly billing cycle at R${proPrice}. You'll be redirected to checkout to save your card — you can cancel anytime. Continue?`}
        confirmLabel="Upgrade"
        confirmSeverity="warning"
        onConfirm={handleSubscribe}
        loading={subscribe.isPending}
      />

      <ConfirmAction
        visible={showCancel}
        onHide={() => setShowCancel(false)}
        title="Cancel brand subscription?"
        message="Cancelling will keep your Pro benefits until the end of the current billing period, then revert to Free. Continue?"
        confirmLabel="Cancel Subscription"
        confirmSeverity="warning"
        onConfirm={handleCancel}
        loading={cancel.isPending}
      />
    </div>
  );
}
