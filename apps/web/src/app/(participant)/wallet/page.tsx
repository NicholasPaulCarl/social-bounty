'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useWalletDashboard } from '@/hooks/useWallet';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { WalletTxType } from '@social-bounty/shared';
import type { WalletTransactionListItem } from '@social-bounty/shared';

function TxTypeLabel({ type }: { type: WalletTxType }) {
  const config: Record<WalletTxType, { label: string; className: string }> = {
    [WalletTxType.CREDIT]: { label: 'Credit', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
    [WalletTxType.DEBIT]: { label: 'Debit', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
    [WalletTxType.HOLD]: { label: 'Hold', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
    [WalletTxType.RELEASE]: { label: 'Release', className: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' },
    [WalletTxType.CORRECTION]: { label: 'Correction', className: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30' },
  };
  const { label, className } = config[type] ?? { label: type, className: 'bg-elevated text-text-muted' };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useWalletDashboard();

  if (isLoading) return <LoadingState type="page" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  if (!data) {
    return (
      <>
        <PageHeader title="Wallet" subtitle="Your earnings — cash out anytime" />
        <div className="glass-card p-12 text-center animate-fade-up">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-emerald/10 mx-auto mb-4">
            <i className="pi pi-wallet text-accent-emerald text-2xl" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No Wallet Yet</h3>
          <p className="text-text-muted">Complete your first bounty to activate your wallet.</p>
        </div>
      </>
    );
  }

  const { balance, recentTransactions } = data;
  const currency = balance.currency;

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="Your earnings — cash out anytime"
        actions={
          <Button
            label="Withdraw"
            icon="pi pi-arrow-up-right"
            className="bg-accent-emerald border-accent-emerald text-background hover:bg-accent-emerald/90"
            onClick={() => router.push('/wallet/withdraw')}
          />
        }
      />

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 animate-fade-up">
        {/* Available balance - primary */}
        <div className="glass-card p-6 border border-accent-emerald/30 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-emerald/10">
              <i className="pi pi-check-circle text-accent-emerald text-lg" />
            </div>
            <span className="text-sm text-text-muted font-medium">Available Balance</span>
          </div>
          <p className="text-4xl font-bold text-accent-emerald tracking-tight">
            {formatCurrency(balance.available, currency)}
          </p>
          <p className="text-xs text-text-muted mt-2">Ready to withdraw</p>
        </div>

        {/* Pending */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-amber/10">
              <i className="pi pi-clock text-accent-amber text-lg" />
            </div>
            <span className="text-sm text-text-muted font-medium">Pending</span>
          </div>
          <p className="text-3xl font-bold text-accent-amber tracking-tight">
            {formatCurrency(balance.pending, currency)}
          </p>
          <p className="text-xs text-text-muted mt-2">Awaiting clearance</p>
        </div>

        {/* Total balance */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-cyan/10">
              <i className="pi pi-wallet text-accent-cyan text-lg" />
            </div>
            <span className="text-sm text-text-muted font-medium">Total Balance</span>
          </div>
          <p className="text-3xl font-bold text-text-primary tracking-tight">
            {formatCurrency(balance.total, currency)}
          </p>
          <p className="text-xs text-text-muted mt-2">Available + Pending</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-fade-up">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent-violet/10 flex-shrink-0">
            <i className="pi pi-arrow-down text-accent-violet text-xl" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Earned</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(balance.totalEarned, currency)}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent-blue/10 flex-shrink-0">
            <i className="pi pi-arrow-up text-accent-blue text-xl" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Withdrawn</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(balance.totalWithdrawn, currency)}</p>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glass-card animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-glass-border">
          <h2 className="text-base font-semibold text-text-primary">Recent Transactions</h2>
          <Link
            href="/wallet/transactions"
            className="text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors flex items-center gap-1"
          >
            View All <i className="pi pi-arrow-right text-xs" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <i className="pi pi-inbox text-text-muted text-3xl mb-3 block" />
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
                    <p className={`text-sm font-semibold ${isCredit ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </p>
                    <p className="text-xs text-text-muted">Balance: {formatCurrency(tx.balanceAfter, currency)}</p>
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
