'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { useAdminWallets } from '@/hooks/useWallet';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/utils/format';
import type { AdminWalletListItem } from '@social-bounty/shared';

export default function AdminWalletsPage() {
  const router = useRouter();
  const { page, limit, first, onPageChange, resetPage } = usePagination();
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useAdminWallets({
    page,
    limit,
    search: search || undefined,
  });

  const userTemplate = (row: AdminWalletListItem) => (
    <div>
      <p className="text-sm font-medium text-text-primary">{row.userName}</p>
      <p className="text-xs text-text-muted">{row.userEmail}</p>
    </div>
  );

  const balanceTemplate = (row: AdminWalletListItem) => (
    <span className="font-semibold text-success-600 text-sm">
      {formatCurrency(row.balance, row.currency)}
    </span>
  );

  const pendingTemplate = (row: AdminWalletListItem) => (
    <span className="text-sm text-warning-600">
      {formatCurrency(row.pendingBalance, row.currency)}
    </span>
  );

  const totalEarnedTemplate = (row: AdminWalletListItem) => (
    <span className="text-sm text-text-secondary">{formatCurrency(row.totalEarned, row.currency)}</span>
  );

  const totalWithdrawnTemplate = (row: AdminWalletListItem) => (
    <span className="text-sm text-text-secondary">{formatCurrency(row.totalWithdrawn, row.currency)}</span>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Wallets"
        subtitle="View and manage hunter wallet balances"
        toolbar={{
          search: {
            value: search,
            onChange: (value) => { setSearch(value); resetPage(); },
            placeholder: 'Search by name or email...',
          },
          onClearFilters: () => { setSearch(''); resetPage(); },
          hasActiveFilters: !!search,
        }}
      />

      {isLoading && <LoadingState type="table" rows={10} columns={5} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && data && data.data.length === 0 && (
        <EmptyState icon="pi-wallet" title="No wallets found" message="Try adjusting your search." />
      )}

      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="glass-card p-6 overflow-x-auto">
            <DataTable
              value={data.data}
              stripedRows
              onRowClick={(e) => router.push(`/admin/wallets/${(e.data as AdminWalletListItem).userId}`)}
              rowClassName={() => 'cursor-pointer'}
              className="min-w-[700px]"
              aria-label="Wallets table"
            >
              <Column header="User" body={userTemplate} />
              <Column header="Balance" body={balanceTemplate} style={{ width: '10rem' }} />
              <Column header="Pending" body={pendingTemplate} style={{ width: '9rem' }} />
              <Column header="Total Earned" body={totalEarnedTemplate} style={{ width: '10rem' }} />
              <Column header="Total Withdrawn" body={totalWithdrawnTemplate} style={{ width: '11rem' }} />
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
    </div>
  );
}
