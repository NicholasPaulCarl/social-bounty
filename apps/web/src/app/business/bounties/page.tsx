'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { useBounties, useDeleteBounty } from '@/hooks/useBounties';
import { bountyApi } from '@/lib/api/bounties';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { PaymentDialog } from '@/components/payment/PaymentDialog';
import { formatDate, formatCurrency, formatEnumLabel } from '@/lib/utils/format';
import { BountyStatus, PaymentStatus } from '@social-bounty/shared';
import type { BountyListParams, BountyListItem, RewardType } from '@social-bounty/shared';

const statusTabs = [
  { label: 'All', value: undefined as BountyStatus | undefined },
  { label: 'Draft', value: BountyStatus.DRAFT },
  { label: 'Live', value: BountyStatus.LIVE },
  { label: 'Paused', value: BountyStatus.PAUSED },
  { label: 'Closed', value: BountyStatus.CLOSED },
];

const rewardTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Product', value: 'PRODUCT' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Other', value: 'OTHER' },
];

const sortOptions = [
  { label: 'Newest', value: 'createdAt' },
  { label: 'Reward (High)', value: 'rewardValue' },
  { label: 'Ending Soon', value: 'ending_soon' },
  { label: 'Title', value: 'title' },
];

export default function BusinessBountiesPage() {
  const router = useRouter();
  const toast = useToast();
  const { page, limit, first, onPageChange } = usePagination();
  const [filters, setFilters] = useState<BountyListParams>({ page, limit });
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{ id: string; newStatus: string; label: string } | null>(null);
  const [paymentBounty, setPaymentBounty] = useState<BountyListItem | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const statusFilter = statusTabs[activeTabIndex].value;
  const { data, isLoading, error, refetch } = useBounties({ ...filters, page, limit, status: statusFilter });
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

  const handleStatusChange = async (id: string, newStatus: string, bountyItem?: BountyListItem) => {
    // For DRAFT -> LIVE, require payment first if not already paid
    if (bountyItem && bountyItem.status === 'DRAFT' && newStatus === 'LIVE' && bountyItem.paymentStatus !== PaymentStatus.PAID) {
      setStatusAction(null);
      setPaymentBounty(bountyItem);
      setPaymentLoading(true);
      try {
        const { clientSecret: secret } = await bountyApi.createPaymentIntent(id);
        setClientSecret(secret);
        setShowPayment(true);
      } catch {
        toast.showError('Failed to create payment. Please try again.');
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    bountyApi.updateStatus(id, { status: newStatus as BountyStatus })
      .then(() => {
        toast.showSuccess(`Bounty status updated to ${formatEnumLabel(newStatus)}`);
        setStatusAction(null);
        refetch();
      })
      .catch(() => toast.showError('Failed to update status'));
  };

  const handlePaymentSuccess = () => {
    if (!paymentBounty) return;
    setShowPayment(false);
    setClientSecret(null);
    bountyApi.updateStatus(paymentBounty.id, { status: BountyStatus.LIVE })
      .then(() => {
        toast.showSuccess('Payment successful! Bounty is now live.');
        setPaymentBounty(null);
        refetch();
      })
      .catch(() => toast.showError('Payment succeeded but failed to update status. Please try again.'));
  };

  const getStatusActions = (rowData: BountyListItem) => {
    const actions: { label: string; status: string; icon: string; severity: string }[] = [];
    switch (rowData.status) {
      case 'DRAFT':
        actions.push({ label: 'Publish', status: 'LIVE', icon: 'pi pi-play', severity: 'success' });
        break;
      case 'LIVE':
        actions.push({ label: 'Pause', status: 'PAUSED', icon: 'pi pi-pause', severity: 'warning' });
        actions.push({ label: 'Close', status: 'CLOSED', icon: 'pi pi-times-circle', severity: 'danger' });
        break;
      case 'PAUSED':
        actions.push({ label: 'Resume', status: 'LIVE', icon: 'pi pi-play', severity: 'success' });
        actions.push({ label: 'Close', status: 'CLOSED', icon: 'pi pi-times-circle', severity: 'danger' });
        actions.push({ label: 'Revert to Draft', status: 'DRAFT', icon: 'pi pi-undo', severity: 'secondary' });
        break;
    }
    return actions;
  };

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const statusTemplate = (rowData: BountyListItem) => (
    <StatusBadge type="bounty" value={rowData.status} />
  );

  const rewardTemplate = (rowData: BountyListItem) => (
    <span>{formatCurrency(rowData.rewardValue, rowData.currency)}</span>
  );

  const dateTemplate = (rowData: BountyListItem) => (
    <span>{formatDate(rowData.createdAt)}</span>
  );

  const actionsTemplate = (rowData: BountyListItem) => {
    const statusActions = getStatusActions(rowData);
    return (
      <div className="flex gap-1 items-center">
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
        {statusActions.map((action) => (
          <Button
            key={action.status}
            icon={action.icon}
            rounded
            text
            severity={action.severity as 'success' | 'warning' | 'danger' | 'secondary'}
            onClick={() => setStatusAction({ id: rowData.id, newStatus: action.status, label: action.label })}
            tooltip={action.label}
            loading={action.status === 'LIVE' && rowData.status === 'DRAFT' && paymentLoading && paymentBounty?.id === rowData.id}
          />
        ))}
        {rowData.status === 'DRAFT' && (
          <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            onClick={() => setDeleteId(rowData.id)}
            tooltip="Delete"
          />
        )}
      </div>
    );
  };

  const hasActiveFilters = !!(filters.search || filters.rewardType || (filters.sortBy && filters.sortBy !== 'createdAt'));

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Bounties"
        subtitle="Manage your organisation's bounties"
        actions={
          <Button label="Create Bounty" icon="pi pi-plus" onClick={() => router.push('/business/bounties/new')} />
        }
        tabs={{
          items: statusTabs.map((tab) => ({ label: tab.label })),
          activeIndex: activeTabIndex,
          onChange: (index) => setActiveTabIndex(index),
        }}
        toolbar={{
          search: {
            value: filters.search || '',
            onChange: (value) => setFilters({ ...filters, search: value || undefined, page: 1 }),
            placeholder: 'Search bounties...',
          },
          filters: [
            { key: 'rewardType', placeholder: 'Reward Type', options: rewardTypeOptions, ariaLabel: 'Filter by reward type' },
            { key: 'sortBy', placeholder: 'Sort By', options: sortOptions, ariaLabel: 'Sort bounties' },
          ],
          filterValues: {
            rewardType: (filters.rewardType as string) || '',
            sortBy: filters.sortBy || 'createdAt',
          },
          onFilterChange: (key, value) => {
            if (key === 'rewardType') setFilters({ ...filters, rewardType: (value || undefined) as RewardType, page: 1 });
            else setFilters({ ...filters, [key]: value || undefined, page: 1 });
          },
          onClearFilters: () => setFilters({ page: 1, limit }),
          hasActiveFilters,
        }}
      />

      {data && data.data.length > 0 ? (
        <>
          <div className="glass-card p-6 overflow-x-auto">
            <DataTable value={data.data} stripedRows className="min-w-[700px]">
              <Column field="title" header="Title" sortable />
              <Column header="Status" body={statusTemplate} />
              <Column header="Reward" body={rewardTemplate} />
              <Column field="submissionCount" header="Submissions" />
              <Column header="Created" body={dateTemplate} />
              <Column header="Actions" body={actionsTemplate} style={{ width: '18rem' }} />
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

      {statusAction && (
        <ConfirmAction
          visible
          onHide={() => setStatusAction(null)}
          title={`${statusAction.label} Bounty`}
          message={
            statusAction.newStatus === 'CLOSED'
              ? 'Are you sure you want to close this bounty? This action cannot be undone.'
              : `Are you sure you want to ${statusAction.label.toLowerCase()} this bounty?`
          }
          confirmLabel={`Yes, ${statusAction.label}`}
          confirmSeverity={statusAction.newStatus === 'CLOSED' ? 'danger' : statusAction.newStatus === 'PAUSED' ? 'warning' : 'success'}
          onConfirm={() => {
            const bountyItem = data?.data.find((b) => b.id === statusAction.id);
            handleStatusChange(statusAction.id, statusAction.newStatus, bountyItem);
          }}
        />
      )}

      {clientSecret && paymentBounty && (
        <PaymentDialog
          visible={showPayment}
          onHide={() => { setShowPayment(false); setClientSecret(null); setPaymentBounty(null); }}
          clientSecret={clientSecret}
          amount={paymentBounty.rewardValue ?? '0'}
          currency={paymentBounty.currency}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
