'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { useAdminWallet, useAdminAdjustWallet } from '@/hooks/useWallet';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { WalletTxType } from '@social-bounty/shared';
import type { WalletTransactionListItem } from '@social-bounty/shared';

const TYPE_CONFIG: Record<WalletTxType, { label: string; className: string }> = {
  [WalletTxType.CREDIT]: { label: 'Credit', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
  [WalletTxType.DEBIT]: { label: 'Debit', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
  [WalletTxType.HOLD]: { label: 'Hold', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
  [WalletTxType.RELEASE]: { label: 'Release', className: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' },
  [WalletTxType.CORRECTION]: { label: 'Correction', className: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30' },
};

interface Props {
  params: { userId: string };
}

export default function AdminWalletDetailPage({ params }: Props) {
  const { userId } = params;
  const { data, isLoading, error, refetch } = useAdminWallet(userId);
  const { mutate: adjustWallet, isPending: isAdjusting } = useAdminAdjustWallet(userId);

  const [adjAmount, setAdjAmount] = useState<number | null>(null);
  const [adjReason, setAdjReason] = useState('');
  const [adjError, setAdjError] = useState('');
  const [adjSuccess, setAdjSuccess] = useState('');

  if (isLoading) return <LoadingState type="page" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const { balance, recentTransactions } = data;
  const currency = balance.currency;
  const userName = (data as { userName?: string }).userName ?? 'Hunter';
  const userEmail = (data as { userEmail?: string }).userEmail ?? '';

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError('');
    setAdjSuccess('');
    if (!adjAmount) { setAdjError('Please enter a non-zero amount.'); return; }
    if (!adjReason.trim() || adjReason.trim().length < 10) { setAdjError('Reason must be at least 10 characters.'); return; }
    adjustWallet(
      { amount: adjAmount, reason: adjReason.trim() },
      {
        onSuccess: () => {
          setAdjSuccess('Balance adjusted successfully.');
          setAdjAmount(null);
          setAdjReason('');
        },
        onError: (err: unknown) => {
          setAdjError(err instanceof Error ? err.message : 'Failed to adjust balance.');
        },
      }
    );
  };

  const typeTemplate = (row: WalletTransactionListItem) => {
    const { label, className } = TYPE_CONFIG[row.type] ?? { label: row.type, className: 'bg-elevated text-text-muted' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
  };

  const amountTemplate = (row: WalletTransactionListItem) => {
    const isCredit = row.type === WalletTxType.CREDIT || row.type === WalletTxType.RELEASE;
    return (
      <span className={`font-semibold text-sm ${isCredit ? 'text-accent-emerald' : 'text-accent-rose'}`}>
        {isCredit ? '+' : '-'}{formatCurrency(row.amount, currency)}
      </span>
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={userName}
        subtitle={userEmail}
        breadcrumbs={[{ label: 'Wallets', url: '/admin/wallets' }, { label: userName }]}
      />

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 border border-accent-emerald/30">
          <p className="text-xs text-text-muted mb-1">Available</p>
          <p className="text-2xl font-bold text-accent-emerald">{formatCurrency(balance.available, currency)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-text-muted mb-1">Pending</p>
          <p className="text-2xl font-bold text-accent-amber">{formatCurrency(balance.pending, currency)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-text-muted mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-accent-violet">{formatCurrency(balance.totalEarned, currency)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-text-muted mb-1">Total Withdrawn</p>
          <p className="text-2xl font-bold text-accent-blue">{formatCurrency(balance.totalWithdrawn, currency)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction ledger */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-text-primary mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <EmptyState icon="pi-list" title="No transactions" message="This wallet has no transactions yet." />
          ) : (
            <div className="glass-card overflow-x-auto">
              <DataTable
                value={recentTransactions}
                stripedRows
                className="min-w-[500px]"
                aria-label="Transaction ledger"
              >
                <Column
                  header="Date"
                  body={(row: WalletTransactionListItem) => (
                    <span className="text-xs text-text-muted whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
                  )}
                  style={{ width: '11rem' }}
                />
                <Column header="Type" body={typeTemplate} style={{ width: '7rem' }} />
                <Column
                  header="Description"
                  body={(row: WalletTransactionListItem) => (
                    <span className="text-sm text-text-primary">{row.description}</span>
                  )}
                />
                <Column header="Amount" body={amountTemplate} style={{ width: '8rem' }} />
                <Column
                  header="Balance After"
                  body={(row: WalletTransactionListItem) => (
                    <span className="text-sm text-text-secondary">{formatCurrency(row.balanceAfter, currency)}</span>
                  )}
                  style={{ width: '9rem' }}
                />
              </DataTable>
            </div>
          )}
        </div>

        {/* Adjust balance form */}
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-4">Adjust Balance</h2>
          <div className="glass-card p-5">
            <p className="text-xs text-text-muted mb-4">
              Enter a positive amount to credit or negative to debit. An audit record will be created.
            </p>
            <form onSubmit={handleAdjust} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Amount <span className="text-accent-rose">*</span>
                </label>
                <InputNumber
                  value={adjAmount}
                  onValueChange={(e) => setAdjAmount(e.value ?? null)}
                  mode="currency"
                  currency={currency}
                  locale="en-ZA"
                  className="w-full"
                  placeholder="e.g. 100 or -50"
                  showButtons
                  min={-999999}
                  max={999999}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Reason <span className="text-accent-rose">*</span>
                </label>
                <InputTextarea
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  rows={3}
                  className="w-full"
                  placeholder="Describe the reason for this adjustment..."
                />
                <p className="text-xs text-text-muted">{adjReason.trim().length}/10 minimum characters</p>
              </div>

              {adjError && (
                <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30 text-accent-rose text-sm">
                  <i className="pi pi-exclamation-triangle mr-2" />
                  {adjError}
                </div>
              )}
              {adjSuccess && (
                <div className="p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald text-sm">
                  <i className="pi pi-check mr-2" />
                  {adjSuccess}
                </div>
              )}

              <Button
                type="submit"
                label="Apply Adjustment"
                icon="pi pi-pencil"
                className="w-full"
                loading={isAdjusting}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
