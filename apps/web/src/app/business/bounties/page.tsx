'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { useBounties, useDeleteBounty } from '@/hooks/useBounties';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BountyFilters } from '@/components/features/bounty/BountyFilters';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { BountyListParams, BountyListItem } from '@social-bounty/shared';

export default function BusinessBountiesPage() {
  const router = useRouter();
  const toast = useToast();
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<BountyListParams>({ page, limit });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useBounties({ ...filters, page, limit });
  const deleteBounty = useDeleteBounty();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteBounty.mutate(deleteId, {
      onSuccess: () => {
        toast.showSuccess('Bounty deleted successfully');
        setDeleteId(null);
        refetch();
      },
      onError: () => toast.showError('Failed to delete bounty'),
    });
  };

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const statusTemplate = (rowData: BountyListItem) => (
    <StatusBadge type="bounty" value={rowData.status} />
  );

  const rewardTemplate = (rowData: BountyListItem) => (
    <span>{formatCurrency(rowData.rewardValue)}</span>
  );

  const dateTemplate = (rowData: BountyListItem) => (
    <span>{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: BountyListItem) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="info"
        onClick={() => router.push(`/business/bounties/${rowData.id}`)}
        tooltip="View"
      />
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="secondary"
        onClick={() => router.push(`/business/bounties/${rowData.id}/edit`)}
        tooltip="Edit"
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => setDeleteId(rowData.id)}
        tooltip="Delete"
      />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Bounties"
        subtitle="Manage your organisation's bounties"
        actions={
          <Button label="Create Bounty" icon="pi pi-plus" onClick={() => router.push('/business/bounties/new')} />
        }
      />

      <BountyFilters filters={filters} onChange={setFilters} showStatusFilter />

      {data && data.data.length > 0 ? (
        <>
          <DataTable value={data.data} stripedRows>
            <Column field="title" header="Title" sortable />
            <Column header="Status" body={statusTemplate} />
            <Column header="Reward" body={rewardTemplate} />
            <Column field="submissionCount" header="Submissions" />
            <Column header="Created" body={dateTemplate} />
            <Column header="Actions" body={actionsTemplate} style={{ width: '12rem' }} />
          </DataTable>
          <Paginator
            first={first}
            rows={limit}
            totalRecords={data.meta.total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </>
      ) : (
        <EmptyState
          icon="pi-megaphone"
          title="No bounties yet"
          message="Create your first bounty to start attracting participants."
          ctaLabel="Create Bounty"
          ctaAction={() => router.push('/business/bounties/new')}
        />
      )}

      <ConfirmAction
        visible={!!deleteId}
        onHide={() => setDeleteId(null)}
        title="Delete Bounty"
        message="Are you sure you want to delete this bounty? This action cannot be undone."
        confirmLabel="Delete"
        confirmSeverity="danger"
        onConfirm={handleDelete}
        loading={deleteBounty.isPending}
      />
    </>
  );
}
