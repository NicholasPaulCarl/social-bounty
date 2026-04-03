'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
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
import { SubscriptionStatus, SubscriptionTier, UserRole } from '@social-bounty/shared';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { SubscriptionPaymentDto } from '@social-bounty/shared';

const HUNTER_FEATURES = {
  free: [
    { label: '20% commission on bounties', icon: 'pi-percentage' },
    { label: '3-day payout clearance', icon: 'pi-clock' },
    { label: 'Public bounties only', icon: 'pi-globe' },
    { label: 'Standard support', icon: 'pi-comment' },
  ],
  pro: [
    { label: '10% commission (save 10%)', icon: 'pi-percentage' },
    { label: 'Same-day payouts', icon: 'pi-bolt' },
    { label: 'Apply to any closed bounty', icon: 'pi-lock-open' },
    { label: 'Verified badge on profile', icon: 'pi-verified' },
    { label: 'Priority support', icon: 'pi-star' },
  ],
};

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

export default function SubscriptionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: sub, isLoading } = useSubscription();
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();
  const reactivate = useReactivateSubscription();
  const [showCancel, setShowCancel] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const { page, limit, first, onPageChange } = usePagination(10);
  const { data: payments } = useSubscriptionPayments(showPayments ? { page, limit } : undefined);

  const isHunter = user?.role === UserRole.PARTICIPANT;
  const features = isHunter ? HUNTER_FEATURES : BRAND_FEATURES;

  if (isLoading) return <LoadingState type="page" />;
  if (!sub) return null;

  const isPro = sub.tier === SubscriptionTier.PRO;
  const isActive = sub.status === SubscriptionStatus.ACTIVE;
  const isCancelled = sub.status === SubscriptionStatus.CANCELLED;
  const isPastDue = sub.status === SubscriptionStatus.PAST_DUE;

  const handleSubscribe = () => {
    subscribe.mutate(undefined, {
      onSuccess: () => toast.showSuccess('Welcome to Pro! Your perks are now active.'),
      onError: (err) => toast.showError((err as Error).message || 'Couldn\'t subscribe. Try again.'),
    });
  };

  const handleCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: () => {
        toast.showSuccess('Subscription cancelled. Pro features active until period end.');
        setShowCancel(false);
      },
      onError: (err) => toast.showError((err as Error).message || 'Couldn\'t cancel. Try again.'),
    });
  };

  const handleReactivate = () => {
    reactivate.mutate(undefined, {
      onSuccess: () => toast.showSuccess('Subscription reactivated! Pro features restored.'),
      onError: (err) => toast.showError((err as Error).message || 'Couldn\'t reactivate. Try again.'),
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
        title="Subscription"
        subtitle="Your plan and perks"
        breadcrumbs={[{ label: 'Settings' }, { label: 'Subscription' }]}
      />

      {/* Current plan status banner */}
      {isPro && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-heading font-bold text-text-primary">Your Plan: Pro</h2>
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
              Your Pro perks are active until <strong>{formatDate(sub.currentPeriodEnd)}</strong>. After that, you'll move to the Free plan.
            </p>
          )}

          {isPastDue && (
            <p className="text-sm text-accent-rose mb-4">
              Your payment failed. Please update your payment method to keep your Pro perks.
            </p>
          )}

          {isActive && sub.currentPeriodEnd && (
            <p className="text-sm text-text-secondary mb-4">
              Next billing date: <strong>{formatDate(sub.currentPeriodEnd)}</strong> &middot; {formatCurrency(sub.priceAmount)}/month
            </p>
          )}

          <div className="space-y-2 mb-6">
            {features.pro.map((f) => (
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
                label="Reactivate Pro"
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

      {/* Tier comparison (shown when on free tier) */}
      {!isPro && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Free tier card */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-bold text-text-primary mb-1">Free</h3>
            <p className="text-sm text-text-muted mb-4">Current plan</p>
            <div className="space-y-3 mb-6">
              {features.free.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <i className={`pi ${f.icon} text-text-muted text-sm`} />
                  <span className="text-sm text-text-secondary">{f.label}</span>
                </div>
              ))}
            </div>
            <Button label="Current Plan" disabled className="w-full" outlined severity="secondary" />
          </div>

          {/* Pro tier card */}
          <div className="glass-card p-6 border border-accent-cyan/30 shadow-glow-cyan">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-heading font-bold text-text-primary">Pro</h3>
              <i className="pi pi-star-fill text-accent-cyan text-sm" />
            </div>
            <p className="text-sm text-accent-cyan mb-4">
              {formatCurrency(sub.priceAmount)}/month
            </p>
            <div className="space-y-3 mb-6">
              {features.pro.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <i className={`pi ${f.icon} text-accent-cyan text-sm`} />
                  <span className="text-sm text-text-primary">{f.label}</span>
                </div>
              ))}
            </div>
            <Button
              label="Upgrade to Pro"
              icon="pi pi-star"
              className="w-full"
              loading={subscribe.isPending}
              onClick={handleSubscribe}
            />
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
        visible={showCancel}
        onHide={() => setShowCancel(false)}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your Pro subscription? You'll keep your Pro features until the end of your current billing period."
        confirmLabel="Yes, Cancel"
        confirmSeverity="danger"
        onConfirm={handleCancel}
        loading={cancel.isPending}
      />
    </div>
  );
}
