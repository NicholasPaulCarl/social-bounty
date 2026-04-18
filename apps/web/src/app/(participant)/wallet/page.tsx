'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Hourglass,
  Inbox,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWalletDashboard, useWalletLedgerSnapshot } from '@/hooks/useWallet';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatCents, formatDate } from '@/lib/utils/format';
import { WalletTxType } from '@social-bounty/shared';
import type { WalletTransactionListItem, LedgerWalletSnapshot } from '@social-bounty/shared';

// Ledger journey stage descriptor — drives the 4-column panel.
interface LedgerJourneyStage {
  key: 'pending' | 'clearing' | 'available' | 'paid';
  label: string;
  description: string;
  cents: string;
  severity: 'warning' | 'info' | 'success' | 'secondary';
  Icon: LucideIcon;
  colorClass: string;
}

function buildJourneyStages(snapshot: LedgerWalletSnapshot | undefined): LedgerJourneyStage[] {
  // TODO: split pending vs clearing once the projection exposes finer-grained
  // accounts (hunter_pending vs hunter_clearing vs hunter_net_payable).
  // For now pendingCents aggregates all three; surface it under "Clearing" and
  // show "Pending" as zero until the approval writer lands.
  const pending = '0';
  const clearing = snapshot?.pendingCents ?? '0';
  const available = snapshot?.availableCents ?? '0';
  const paid = snapshot?.paidCents ?? '0';

  return [
    {
      key: 'pending',
      label: 'Pending',
      description: 'Awaiting business approval',
      cents: pending,
      severity: 'warning',
      Icon: Hourglass,
      colorClass: 'text-warning-600',
    },
    {
      key: 'clearing',
      label: 'Clearing',
      description: 'Approved, in clearance window',
      cents: clearing,
      severity: 'info',
      Icon: Clock,
      colorClass: 'text-pink-600',
    },
    {
      key: 'available',
      label: 'Available',
      description: 'Ready for payout',
      cents: available,
      severity: 'success',
      Icon: CheckCircle2,
      colorClass: 'text-success-600',
    },
    {
      key: 'paid',
      label: 'Paid',
      description: 'Settled to your bank',
      cents: paid,
      severity: 'secondary',
      Icon: Wallet,
      colorClass: 'text-text-primary',
    },
  ];
}

function TxTypeLabel({ type }: { type: WalletTxType }) {
  const config: Record<WalletTxType, { label: string; className: string }> = {
    [WalletTxType.CREDIT]: { label: 'Credit', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    [WalletTxType.DEBIT]: { label: 'Debit', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
    [WalletTxType.HOLD]: { label: 'Hold', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    [WalletTxType.RELEASE]: { label: 'Release', className: 'bg-pink-600/10 text-pink-600 border border-pink-600/30' },
    [WalletTxType.CORRECTION]: { label: 'Correction', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
  };
  const { label, className } = config[type] ?? { label: type, className: 'bg-elevated text-text-muted' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useWalletDashboard();
  const { data: ledgerSnapshot, isLoading: isLedgerLoading } = useWalletLedgerSnapshot();

  if (isLoading) return <LoadingState type="page" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  if (!data) {
    return (
      <>
        <PageHeader title="Wallet" subtitle="Your earnings — cash out anytime" />
        <div className="glass-card p-12 text-center animate-fade-up">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success-600/10 mx-auto mb-4">
            <Wallet size={24} strokeWidth={2} className="text-success-600" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No wallet yet</h3>
          <p className="text-text-muted">Complete a bounty to activate your wallet.</p>
        </div>
      </>
    );
  }

  const { balance, recentTransactions } = data;
  const currency = balance.currency;
  const journeyStages = buildJourneyStages(ledgerSnapshot);

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Your earnings — cash out anytime"
        actions={
          <Button
            label="Withdraw"
            icon={<ArrowUpRight size={16} strokeWidth={2} />}
            className="bg-success-600 border-success-600 text-background hover:bg-success-600/90"
            onClick={() => router.push('/wallet/withdraw')}
          />
        }
      />

      {/* Ledger journey — ledger-projected lifecycle of each earning */}
      <div className="glass-card p-6 mb-6 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Ledger journey</h2>
            <p className="text-xs text-text-muted mt-0.5">Every earning, submission to bank settlement.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {journeyStages.map((stage) => (
            <div
              key={stage.key}
              className="rounded-lg border border-glass-border bg-elevated/40 p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <Tag value={stage.label} severity={stage.severity} />
                <stage.Icon size={16} strokeWidth={2} className="text-text-muted" />
              </div>
              {isLedgerLoading ? (
                <div className="h-7 w-24 rounded bg-elevated animate-pulse" />
              ) : (
                <p className={`metric !text-2xl ${stage.colorClass}`}>
                  {formatCents(stage.cents, currency)}
                </p>
              )}
              <p className="text-xs text-text-muted leading-snug">{stage.description}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-muted mt-4">
          Free hunters: 72-hour clearance after approval. Pro hunters: instant. Payouts run every 10 minutes.
        </p>
      </div>

      {/* Balance cards — the highest-impact metrics on the app */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 animate-fade-up">
        {/* Available balance - primary, the money you can withdraw now */}
        <div className="glass-card p-6 border border-success-600/30 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-600/10">
              <CheckCircle2 size={20} strokeWidth={2} className="text-success-600" />
            </div>
            <span className="eyebrow">Available</span>
          </div>
          <p className="metric !text-4xl text-success-600">
            {formatCurrency(balance.available, currency)}
          </p>
          <p className="text-xs text-text-muted mt-2">Ready to withdraw</p>
        </div>

        {/* Pending */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-600/10">
              <Clock size={20} strokeWidth={2} className="text-warning-600" />
            </div>
            <span className="eyebrow !text-text-muted">Pending</span>
          </div>
          <p className="metric !text-3xl text-warning-600">
            {formatCurrency(balance.pending, currency)}
          </p>
          <p className="text-xs text-text-muted mt-2">Awaiting clearance</p>
        </div>

        {/* Total balance */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-600/10">
              <Wallet size={20} strokeWidth={2} className="text-pink-600" />
            </div>
            <span className="eyebrow !text-text-muted">Total</span>
          </div>
          <p className="metric !text-3xl text-text-primary">
            {formatCurrency(balance.total, currency)}
          </p>
          <p className="text-xs text-text-muted mt-2">Available + pending</p>
        </div>
      </div>

      {/* Stats row — historical totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-fade-up">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-pink-600/10 flex-shrink-0">
            <ArrowDown size={24} strokeWidth={2} className="text-pink-600" />
          </div>
          <div>
            <p className="eyebrow !text-text-muted">Total earned</p>
            <p className="metric !text-2xl text-text-primary">{formatCurrency(balance.totalEarned, currency)}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0">
            <ArrowUp size={24} strokeWidth={2} className="text-slate-600" />
          </div>
          <div>
            <p className="eyebrow !text-text-muted">Total withdrawn</p>
            <p className="metric !text-2xl text-text-primary">{formatCurrency(balance.totalWithdrawn, currency)}</p>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glass-card animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-glass-border">
          <h2 className="text-base font-semibold text-text-primary">Recent transactions</h2>
          <Link
            href="/wallet/transactions"
            className="text-sm text-pink-600 hover:text-pink-700 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <Inbox size={32} strokeWidth={2} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-glass-border">
            {recentTransactions.slice(0, 10).map((tx: WalletTransactionListItem) => {
              const isCredit = tx.type === WalletTxType.CREDIT || tx.type === WalletTxType.RELEASE;
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-elevated/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <TxTypeLabel type={tx.type} />
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate">{tx.description}</p>
                      <p className="text-xs text-text-muted">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-sm font-semibold font-mono tabular-nums ${isCredit ? 'text-success-600' : 'text-danger-600'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </p>
                    <p className="text-xs text-text-muted font-mono tabular-nums">Balance: {formatCurrency(tx.balanceAfter, currency)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
