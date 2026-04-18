'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'desc' },
  { label: 'Oldest First', value: 'asc' },
];

const TYPE_CONFIG: Record<WalletTxType, { label: string; className: string }> = {
  [WalletTxType.CREDIT]: { label: 'Credit', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
  [WalletTxType.DEBIT]: { label: 'Debit', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  [WalletTxType.HOLD]: { label: 'Hold', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
  [WalletTxType.RELEASE]: { label: 'Release', className: 'bg-pink-600/10 text-pink-600 border border-pink-600/30' },
  [WalletTxType.CORRECTION]: { label: 'Correction', className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
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

  const typeTemplate = (row: WalletTransactionListItem) => {
    const { label, className } = TYPE_CONFIG[row.type] ?? { label: row.type, className: 'bg-elevated text-text-muted' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
  };

  const amountTemplate = (row: WalletTransactionListItem) => {
    const isCredit = row.type === WalletTxType.CREDIT || row.type === WalletTxType.RELEASE;
    return (
      <span className={`font-semibold text-sm ${isCredit ? 'text-success-600' : 'text-danger-600'}`}>
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

  const hasActiveFilters = !!(typeFilter || sortOrder !== 'desc');

  return (
    <>
      <PageHeader
        title="Transaction History"
        subtitle="All your earnings and payouts"
        breadcrumbs={[{ label: 'Wallet', url: '/wallet' }, { label: 'Transactions' }]}
        toolbar={{
          filters: [
            { key: 'type', placeholder: 'All Types', options: TX_TYPE_OPTIONS, ariaLabel: 'Filter by type', className: 'w-full sm:w-44' },
            { key: 'sortOrder', placeholder: 'Sort order', options: SORT_OPTIONS, ariaLabel: 'Sort order', className: 'w-full sm:w-44' },
          ],
          filterValues: { type: typeFilter, sortOrder },
          onFilterChange: (key, value) => {
            if (key === 'type') { setTypeFilter(value); resetPage(); }
            else if (key === 'sortOrder') setSortOrder(value as 'asc' | 'desc');
          },
          onClearFilters: () => { setTypeFilter(''); setSortOrder('desc'); resetPage(); },
          hasActiveFilters,
        }}
      />

      {isLoading && <LoadingState type="table" rows={10} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState
          icon="pi-list"
          title="Nothing here yet"
          message="Your earnings history will show up once you start hunting."
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
