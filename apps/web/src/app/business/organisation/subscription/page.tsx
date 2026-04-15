'use client';

import { useState } from 'react';
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
import type { SubscriptionPaymentDto } from '@social-bounty/shared';

// Brand-specific feature sets — copy matches the hunter page structure so
// brand admins see the same shape of info about their subscription.
const BRAND_FEATURES = {
  free: [
    { label: '15% admin fee on bounties', icon: 'pi-percentage' },
    { label: 'Public bounties only', icon: 'pi-globe' },
    { label: 'Standard support', icon: 'pi-comment' },
  ],
  pro: [
    { label: '5% admin fee (save 10%)', icon: 'pi-percentage' },
    { label: 'Create closed bounties', icon: 'pi-lock' },
    { label: 'Priority support', icon: 'pi-star' },
  ],
};

// Live Stitch card-consent isn't integrated yet, so the Upgrade CTA would
// otherwise fake-upgrade the brand. Keep disabled until the real billing
// flow lands — flip to true once the Stitch card consent UX is wired.
const LIVE_UPGRADE_ENABLED = false;

export default function BrandSubscriptionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: sub, isLoading } = useSubscription();
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();
  const reactivate = useReactivateSubscription();
  const [showCancel, setShowCancel] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const { page, limit, first, onPageChange } = usePagination(10);
  const { data: payments } = useSubscriptionPayments(showPayments ? { page, limit } : undefined);

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
      SUCCEEDED: 'text-accent-emerald bg-accent-emerald/10',
      FAILED: 'text-accent-rose bg-accent-rose/10',
      PENDING: 'text-accent-amber bg-accent-amber/10',
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
        breadcrumbs={[{ label: 'Organisation' }, { label: 'Subscription' }]}
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
              isActive ? 'bg-accent-emerald/10 text-accent-emerald' :
              isCancelled ? 'bg-accent-amber/10 text-accent-amber' :
              isPastDue ? 'bg-accent-rose/10 text-accent-rose' : ''
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
                <i className={`pi ${f.icon} text-accent-cyan text-sm`} />
                <span className="text-sm text-text-primary">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              label={showPayments ? 'Hide Payment History' : 'View Payment History'}
              icon="pi pi-history"
              outlined
              severity="secondary"
              size="small"
              onClick={() => setShowPayments(!showPayments)}
            />
            {isCancelled ? (
              <Button
                label="Reactivate Pro Brand"
                icon="pi pi-refresh"
                size="small"
                loading={reactivate.isPending}
                onClick={handleReactivate}
              />
            ) : (
              <Button
                label="Cancel Subscription"
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
                  <i className={`pi ${f.icon} text-text-muted text-sm`} />
                  <span className="text-sm text-text-secondary">{f.label}</span>
                </div>
              ))}
            </div>
            <Button label="Current Plan" disabled className="w-full" outlined severity="secondary" />
          </div>

          <div className="glass-card p-6 border border-accent-cyan/30 shadow-glow-cyan">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-heading font-bold text-text-primary">Pro Brand</h3>
              <i className="pi pi-star-fill text-accent-cyan text-sm" />
            </div>
            <p className="text-sm text-accent-cyan mb-4">
              R{proPrice}/month
            </p>
            <div className="space-y-3 mb-6">
              {BRAND_FEATURES.pro.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <i className={`pi ${f.icon} text-accent-cyan text-sm`} />
                  <span className="text-sm text-text-primary">{f.label}</span>
                </div>
              ))}
            </div>

            {/* Hard Rule #6 — confirm upgrade in ConfirmAction. Disabled
                until live Stitch card-consent is wired so we don't silently
                fake-upgrade the brand. */}
            <span
              className="inline-block w-full"
              title={
                LIVE_UPGRADE_ENABLED
                  ? `Start the brand's Pro subscription at R${proPrice}/month`
                  : 'Pro upgrade coming soon — card billing is not yet live.'
              }
            >
              <Button
                label={LIVE_UPGRADE_ENABLED ? 'Upgrade to Pro Brand' : 'Pro upgrade coming soon'}
                icon="pi pi-star"
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
        message={`Upgrading to Pro starts a monthly billing cycle at R${proPrice}. You can cancel anytime. Continue?`}
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
