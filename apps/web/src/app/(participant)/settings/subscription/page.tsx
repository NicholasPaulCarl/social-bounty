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
  BadgeCheck,
  Clock,
  Globe,
  History,
  Lock,
  MessageSquare,
  RefreshCw,
  Star,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useSubscription,
  useSubscribe,
  useInitiateUpgrade,
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
  UserRole,
  SUBSCRIPTION_CONSTANTS,
} from '@social-bounty/shared';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { SubscriptionPaymentDto } from '@social-bounty/shared';

// Lucide has no 'percentage' or 'lock-open' glyph; Star + Clock + Globe +
// MessageSquare + BadgeCheck + Lock + Zap cover the semantics, per the DS
// ICONS.md mapping table.
type Feature = { label: string; Icon: LucideIcon };

const HUNTER_FEATURES: { free: Feature[]; pro: Feature[] } = {
  free: [
    { label: '20% commission on bounties', Icon: Star },
    { label: '3-day payout clearance', Icon: Clock },
    { label: 'Public bounties only', Icon: Globe },
    { label: 'Standard support', Icon: MessageSquare },
  ],
  pro: [
    { label: '10% commission (save 10%)', Icon: Star },
    { label: 'Same-day payouts', Icon: Zap },
    { label: 'Apply to any closed bounty', Icon: Lock },
    { label: 'Verified badge on profile', Icon: BadgeCheck },
    { label: 'Priority support', Icon: Star },
  ],
};

const BRAND_FEATURES: { free: Feature[]; pro: Feature[] } = {
  free: [
    { label: '15% admin fee on bounties', Icon: Star },
    { label: 'Public bounties only', Icon: Globe },
    { label: 'Standard support', Icon: MessageSquare },
  ],
  pro: [
    { label: '5% admin fee (save 10%)', Icon: Star },
    { label: 'Create closed bounties', Icon: Lock },
    { label: 'Priority support', Icon: Star },
  ],
};

// Live Stitch card-consent is now wired (batch 10, task B). The Upgrade CTA
// calls `POST /subscription/upgrade`, receives the hosted Stitch URL, and
// redirects the user there for card capture. Webhooks flip the tier to PRO
// asynchronously; the return page refetches the subscription.
const LIVE_UPGRADE_ENABLED = true;

export default function SubscriptionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: sub, isLoading } = useSubscription();
  const subscribe = useSubscribe();
  const initiateUpgrade = useInitiateUpgrade();
  const cancel = useCancelSubscription();
  const reactivate = useReactivateSubscription();
  const [showCancel, setShowCancel] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const { page, limit, first, onPageChange } = usePagination(10);
  const { data: payments } = useSubscriptionPayments(showPayments ? { page, limit } : undefined);

  // Return handler: Stitch redirects the user back here with
  // `?upgrade=return` after card consent. The webhook may or may not have
  // fired yet — we always refetch on mount so whichever happens first
  // resolves correctly. Handles both "webhook-before-return" (subscription
  // is already ACTIVE) and "return-before-webhook" (still FREE, will flip
  // on next invalidation cycle). Non-Negotiable #7: the webhook is
  // idempotent, so extra refetches are cheap.
  const upgradeReturnMode = searchParams.get('upgrade');
  useEffect(() => {
    if (upgradeReturnMode === 'return') {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  }, [upgradeReturnMode, queryClient]);

  const isHunter = user?.role === UserRole.PARTICIPANT;
  const features = isHunter ? HUNTER_FEATURES : BRAND_FEATURES;
  // Hard Rule #6: confirm dialog copy must reference the canonical price from
  // @social-bounty/shared so UI and billing stay in sync.
  const proPrice = isHunter
    ? SUBSCRIPTION_CONSTANTS.HUNTER_PRO_PRICE_ZAR
    : SUBSCRIPTION_CONSTANTS.BRAND_PRO_PRICE_ZAR;

  if (isLoading) return <LoadingState type="page" />;
  if (!sub) return null;

  const isPro = sub.tier === SubscriptionTier.PRO;
  const isActive = sub.status === SubscriptionStatus.ACTIVE;
  const isCancelled = sub.status === SubscriptionStatus.CANCELLED;
  const isPastDue = sub.status === SubscriptionStatus.PAST_DUE;

  const handleSubscribe = () => {
    // Live upgrade path: POST /subscription/upgrade → Stitch hosted URL.
    // Fallback to legacy `subscribe()` only if LIVE_UPGRADE_ENABLED is off
    // (for dev/local where card billing isn't provisioned).
    if (LIVE_UPGRADE_ENABLED) {
      initiateUpgrade.mutate(SubscriptionTier.PRO, {
        onSuccess: (data) => {
          setShowUpgrade(false);
          toast.showSuccess('Redirecting to secure card capture…');
          // Use window.location so we leave the SPA and hand off to Stitch.
          window.location.href = data.authorizationUrl;
        },
        onError: (err) => {
          toast.showError((err as Error).message || "Couldn't start upgrade. Try again.");
          setShowUpgrade(false);
        },
      });
      return;
    }
    subscribe.mutate(undefined, {
      onSuccess: () => {
        toast.showSuccess('Welcome to Pro! Your perks are now active.');
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
        toast.showSuccess('Subscription cancelled. Pro features active until period end.');
        setShowCancel(false);
      },
      onError: (err) => toast.showError((err as Error).message || "Couldn't cancel. Try again."),
    });
  };

  const handleReactivate = () => {
    reactivate.mutate(undefined, {
      onSuccess: () => toast.showSuccess('Subscription reactivated! Pro features restored.'),
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
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[row.status] || ''}`}>
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

      {/* Current tier badge — PrimeReact Tag, per spec. */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-text-muted">Current tier:</span>
        <Tag
          value={isPro ? 'PRO' : 'FREE'}
          severity={isPro ? 'success' : 'info'}
          rounded
        />
      </div>

      {/* Return from Stitch: webhook-before-return vs return-before-webhook. */}
      {upgradeReturnMode === 'return' && (
        <Message
          severity={isPro ? 'success' : 'info'}
          className="w-full mb-6"
          data-testid="upgrade-return-banner"
          text={
            isPro
              ? 'Upgrade confirmed — your Pro perks are now active.'
              : 'Card capture complete. Your Pro upgrade will activate shortly; this page will refresh automatically.'
          }
        />
      )}

      {/* PAST_DUE warning — show grace period end if available. */}
      {isPastDue && (
        <Message
          severity="warn"
          className="w-full mb-6"
          text={
            sub.gracePeriodEndsAt
              ? `Your last payment failed. Pro perks continue until ${formatDate(sub.gracePeriodEndsAt)} — update your payment method before then to avoid reverting to Free.`
              : 'Your last payment failed. Update your payment method to keep your Pro perks.'
          }
        />
      )}

      {/* Current plan status banner */}
      {isPro && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-heading font-bold text-text-primary">Your plan: Pro</h2>
              <ProBadge size="md" />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-success-600/10 text-success-600' :
              isCancelled ? 'bg-warning-600/10 text-warning-600' :
              isPastDue ? 'bg-danger-600/10 text-danger-600' : ''
            }`}>
              {isActive ? 'Active' : isCancelled ? 'Cancelling' : isPastDue ? 'Past due' : sub.status}
            </span>
          </div>

          {isCancelled && sub.currentPeriodEnd && (
            <p className="text-sm text-text-secondary mb-4">
              Pro perks active until <strong>{formatDate(sub.currentPeriodEnd)}</strong>. Then you move to Free.
            </p>
          )}

          {isActive && sub.currentPeriodEnd && (
            <p className="text-sm text-text-secondary mb-4">
              Next bill: <strong>{formatDate(sub.currentPeriodEnd)}</strong> &middot; <span className="font-mono tabular-nums">{formatCurrency(sub.priceAmount)}</span>/month
            </p>
          )}

          <div className="space-y-2 mb-6">
            {features.pro.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <f.Icon size={16} strokeWidth={2} className="text-pink-600" />
                <span className="text-sm text-text-primary">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              label={showPayments ? 'Hide history' : 'View history'}
              icon={<History size={14} strokeWidth={2} />}
              outlined
              severity="secondary"
              size="small"
              onClick={() => setShowPayments(!showPayments)}
            />
            {isCancelled ? (
              <Button
                label="Reactivate"
                icon={<RefreshCw size={14} strokeWidth={2} />}
                size="small"
                loading={reactivate.isPending}
                onClick={handleReactivate}
              />
            ) : (
              <Button
                label="Cancel"
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
                  <f.Icon size={16} strokeWidth={2} className="text-text-muted" />
                  <span className="text-sm text-text-secondary">{f.label}</span>
                </div>
              ))}
            </div>
            <Button label="Current plan" disabled className="w-full" outlined severity="secondary" />
          </div>

          {/* Pro tier card */}
          <div className="glass-card p-6 border border-pink-600/30 shadow-glow-brand">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-heading font-bold text-text-primary">Pro</h3>
              <Star size={16} strokeWidth={2} className="text-pink-600 fill-current" />
            </div>
            <p className="text-sm text-pink-600 mb-4 font-mono tabular-nums">
              R{proPrice}/month
            </p>
            <div className="space-y-3 mb-6">
              {features.pro.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <f.Icon size={16} strokeWidth={2} className="text-pink-600" />
                  <span className="text-sm text-text-primary">{f.label}</span>
                </div>
              ))}
            </div>

            {/* Hard Rule #6 — wrap upgrade in ConfirmAction. Disabled until
                live Stitch card-consent is wired; native title tooltip explains
                why so we don't silently fake-upgrade the user. */}
            <span
              className="inline-block w-full"
              title={
                LIVE_UPGRADE_ENABLED
                  ? `Start your Pro subscription at R${proPrice}/month`
                  : 'Pro upgrade coming soon — card billing is not yet live.'
              }
            >
              <Button
                label={LIVE_UPGRADE_ENABLED ? 'Upgrade' : 'Pro upgrade coming soon'}
                icon={<Star size={16} strokeWidth={2} />}
                className="w-full"
                disabled={!LIVE_UPGRADE_ENABLED}
                loading={subscribe.isPending || initiateUpgrade.isPending}
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
              body={(row: SubscriptionPaymentDto) => (
                <span className="font-mono tabular-nums">{formatCurrency(row.amount)}</span>
              )}
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
        title="Upgrade to Pro?"
        message={`Starts a monthly billing cycle at R${proPrice}. We'll redirect you to Stitch to save a card — cancel anytime.`}
        confirmLabel="Upgrade"
        confirmSeverity="warning"
        onConfirm={handleSubscribe}
        loading={subscribe.isPending || initiateUpgrade.isPending}
      />

      <ConfirmAction
        visible={showCancel}
        onHide={() => setShowCancel(false)}
        title="Cancel subscription?"
        message="Pro benefits stay active until the end of this billing period, then revert to Free."
        confirmLabel="Cancel"
        confirmSeverity="warning"
        onConfirm={handleCancel}
        loading={cancel.isPending}
      />
    </div>
  );
}
