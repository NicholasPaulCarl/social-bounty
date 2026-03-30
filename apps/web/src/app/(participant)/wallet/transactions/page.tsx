'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Paginator } from 'primereact/paginator';
import { useWalletTransactions, useWalletDashboard } from '@/hooks/useWallet';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { WalletTxType } from '@social-bounty/shared';
import type { WalletTransactionListItem } from '@social-bounty/shared';

const TX_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Credit', value: WalletTxType.CREDIT },
  { label: 'Debit', value: WalletTxType.DEBIT },
  { label: 'Hold', value: WalletTxType.HOLD },
  { label: 'Release', value: WalletTxType.RELEASE },
  { label: 'Correction', value: WalletTxType.CORRECTION },
];

const TYPE_CONFIG: Record<WalletTxType, { label: string; className: string }> = {
  [WalletTxType.CREDIT]: { label: 'Credit', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
  [WalletTxType.DEBIT]: { label: 'Debit', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
  [WalletTxType.HOLD]: { label: 'Hold', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
  [WalletTxType.RELEASE]: { label: 'Release', className: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' },
  [WalletTxType.CORRECTION]: { label: 'Correction', className: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30' },
};

export default function TransactionsPage() {
  const { page, limit, first, onPageChange, resetPage } = usePagination();
  const [typeFilter, setTypeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: dashboard } = useWalletDashboard();
  const currency = dashboard?.balance.currency ?? 'ZAR';

  const { data, isLoading, error, refetch } = useWalletTransactions({
    page,
    limit,
    type: (typeFilter as WalletTxType) || undefined,
    sortOrder,
  });

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    resetPage();
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

  const balanceAfterTemplate = (row: WalletTransactionListItem) => (
    <span className="text-sm text-text-secondary">{formatCurrency(row.balanceAfter, currency)}</span>
  );

  const dateTemplate = (row: WalletTransactionListItem) => (
    <span className="text-sm text-text-muted whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
  );

  const descriptionTemplate = (row: WalletTransactionListItem) => (
    <span className="text-sm text-text-primary">{row.description}</span>
  );

  return (
    <>
      <PageHeader
        title="Transaction History"
        subtitle="Full ledger of all wallet activity"
        breadcrumbs={[{ label: 'Wallet', url: '/wallet' }, { label: 'Transactions' }]}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-up">
        <Dropdown
          value={typeFilter}
          options={TX_TYPE_OPTIONS}
          onChange={(e) => handleTypeChange(e.value)}
          placeholder="All Types"
          className="w-44"
          aria-label="Filter by type"
        />
        <Dropdown
          value={sortOrder}
          options={[
            { label: 'Newest First', value: 'desc' },
            { label: 'Oldest First', value: 'asc' },
          ]}
          onChange={(e) => setSortOrder(e.value)}
          className="w-44"
          aria-label="Sort order"
        />
      </div>

      {isLoading && <LoadingState type="table" rows={10} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon="pi-list"
          title="No transactions found"
          message="No transactions match your current filters."
        />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="glass-card overflow-x-auto animate-fade-up">
            <DataTable
              value={data.data}
              stripedRows
              className="min-w-[700px]"
              aria-label="Transaction ledger"
            >
              <Column header="Date" body={dateTemplate} style={{ width: '13rem' }} />
              <Column header="Type" body={typeTemplate} style={{ width: '8rem' }} />
              <Column header="Description" body={descriptionTemplate} />
              <Column header="Amount" body={amountTemplate} style={{ width: '10rem' }} />
              <Column header="Balance After" body={balanceAfterTemplate} style={{ width: '10rem' }} />
            </DataTable>
          </div>

          <Paginator
            first={first}
            rows={limit}
            totalRecords={data.meta.total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </>
      )}
    </>
  );
}
