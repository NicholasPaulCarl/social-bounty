'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useAdminWithdrawals, useAdminProcessWithdrawal, useAdminCompleteWithdrawal, useAdminFailWithdrawal } from '@/hooks/useWallet';
import { usePagination } from '@/hooks/usePagination';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatDate, formatPayoutMethod, formatEnumLabel } from '@/lib/utils/format';
import { WithdrawalStatus } from '@social-bounty/shared';
import type { AdminWithdrawalListItem } from '@social-bounty/shared';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: WithdrawalStatus.REQUESTED, label: 'Requested' },
  { id: WithdrawalStatus.PROCESSING, label: 'Processing' },
  { id: WithdrawalStatus.COMPLETED, label: 'Completed' },
  { id: WithdrawalStatus.FAILED, label: 'Failed' },
  { id: WithdrawalStatus.CANCELLED, label: 'Cancelled' },
];

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; className: string }> = {
  [WithdrawalStatus.REQUESTED]: { label: 'Requested', className: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30' },
  [WithdrawalStatus.PROCESSING]: { label: 'Processing', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
  [WithdrawalStatus.COMPLETED]: { label: 'Completed', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
  [WithdrawalStatus.FAILED]: { label: 'Failed', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
  [WithdrawalStatus.CANCELLED]: { label: 'Cancelled', className: 'bg-elevated text-text-muted border border-glass-border' },
};

export default function AdminWithdrawalsPage() {
  const { page, limit, first, onPageChange, resetPage } = usePagination();
  const [statusFilter, setStatusFilter] = useState('all');

  // Action state
  const [processTarget, setProcessTarget] = useState<AdminWithdrawalListItem | null>(null);
  const [completeTarget, setCompleteTarget] = useState<AdminWithdrawalListItem | null>(null);
  const [failTarget, setFailTarget] = useState<AdminWithdrawalListItem | null>(null);
  const [proofUrl, setProofUrl] = useState('');

  const { data, isLoading, error, refetch } = useAdminWithdrawals({
    page,
    limit,
    status: (statusFilter !== 'all' ? statusFilter as WithdrawalStatus : undefined),
  });

  const { mutate: processWithdrawal, isPending: isProcessing } = useAdminProcessWithdrawal();
  const { mutate: completeWithdrawal, isPending: isCompleting } = useAdminCompleteWithdrawal();
  const { mutate: failWithdrawal, isPending: isFailing } = useAdminFailWithdrawal();

  const withdrawals = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handleProcess = () => {
    if (!processTarget) return;
    processWithdrawal(processTarget.id, {
      onSuccess: () => { setProcessTarget(null); refetch(); },
    });
  };

  const handleComplete = () => {
    if (!completeTarget) return;
    completeWithdrawal(
      { id: completeTarget.id, data: { proofUrl: proofUrl.trim() || undefined } },
      { onSuccess: () => { setCompleteTarget(null); setProofUrl(''); refetch(); } }
    );
  };

  const handleFail = (reason?: string) => {
    if (!failTarget || !reason) return;
    failWithdrawal(
      { id: failTarget.id, data: { reason } },
      { onSuccess: () => { setFailTarget(null); refetch(); } }
    );
  };

  const userTemplate = (row: AdminWithdrawalListItem) => (
    <div>
      <p className="text-sm font-medium text-text-primary">{row.userName}</p>
      <p className="text-xs text-text-muted">{row.userEmail}</p>
    </div>
  );

  const amountTemplate = (row: AdminWithdrawalListItem) => (
    <span className="font-semibold text-sm text-text-primary">
      {formatCurrency(row.amount, row.currency)}
    </span>
  );

  const methodTemplate = (row: AdminWithdrawalListItem) => (
    <span className="text-sm text-text-secondary">{formatPayoutMethod(row.method)}</span>
  );

  const statusTemplate = (row: AdminWithdrawalListItem) => {
    const { label, className } = STATUS_CONFIG[row.status] ?? { label: row.status, className: 'bg-elevated text-text-muted' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>{label}</span>;
  };

  const dateTemplate = (row: AdminWithdrawalListItem) => (
    <span className="text-sm text-text-muted whitespace-nowrap">{formatDate(row.createdAt)}</span>
  );

  const actionsTemplate = (row: AdminWithdrawalListItem) => (
    <div className="flex gap-2">
      {row.status === WithdrawalStatus.REQUESTED && (
        <Button
          label="Process"
          size="small"
          severity="warning"
          outlined
          onClick={(e) => { e.stopPropagation(); setProcessTarget(row); }}
          className="text-xs"
        />
      )}
      {row.status === WithdrawalStatus.PROCESSING && (
        <>
          <Button
            label="Complete"
            size="small"
            severity="success"
            outlined
            onClick={(e) => { e.stopPropagation(); setCompleteTarget(row); setProofUrl(''); }}
            className="text-xs"
          />
          <Button
            label="Fail"
            size="small"
            severity="danger"
            outlined
            onClick={(e) => { e.stopPropagation(); setFailTarget(row); }}
            className="text-xs"
          />
        </>
      )}
    </div>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Withdrawals"
        subtitle="Review and process withdrawal requests"
        pills={{
          items: STATUS_FILTERS,
          activeId: statusFilter,
          onChange: (id) => { setStatusFilter(id); resetPage(); },
        }}
      />

      {isLoading && <LoadingState type="table" rows={10} columns={6} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && !error && withdrawals.length === 0 && (
        <EmptyState icon="pi-money-bill" title="No withdrawals found" message="No withdrawal requests match the current filter." />
      )}

      {!isLoading && !error && withdrawals.length > 0 && (
        <>
          <div className="glass-card p-6 overflow-x-auto">
            <DataTable
              value={withdrawals}
              stripedRows
              className="min-w-[800px]"
              aria-label="Withdrawals table"
            >
              <Column header="User" body={userTemplate} />
              <Column header="Amount" body={amountTemplate} style={{ width: '9rem' }} />
              <Column header="Method" body={methodTemplate} style={{ width: '10rem' }} />
              <Column header="Status" body={statusTemplate} style={{ width: '9rem' }} />
              <Column header="Requested" body={dateTemplate} style={{ width: '9rem' }} />
              <Column header="Actions" body={actionsTemplate} style={{ width: '13rem' }} />
            </DataTable>
          </div>

          <Paginator
            first={first}
            rows={limit}
            totalRecords={total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </>
      )}

      {/* Process confirmation */}
      <ConfirmAction
        visible={!!processTarget}
        onHide={() => setProcessTarget(null)}
        title="Mark as Processing"
        message={`Mark ${processTarget?.userName}'s withdrawal of ${processTarget ? formatCurrency(processTarget.amount, processTarget.currency) : ''} as processing?`}
        confirmLabel="Mark Processing"
        confirmSeverity="warning"
        onConfirm={handleProcess}
        loading={isProcessing}
      />

      {/* Complete dialog (with optional proof URL) */}
      <Dialog
        visible={!!completeTarget}
        onHide={() => { setCompleteTarget(null); setProofUrl(''); }}
        header="Complete Withdrawal"
        modal
        closable
        className="w-full max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button label="Cancel" outlined onClick={() => { setCompleteTarget(null); setProofUrl(''); }} disabled={isCompleting} />
            <Button label="Complete" severity="success" onClick={handleComplete} loading={isCompleting} />
          </div>
        }
      >
        <p className="text-text-secondary mb-4">
          Mark this withdrawal of{' '}
          <strong>{completeTarget ? formatCurrency(completeTarget.amount, completeTarget.currency) : ''}</strong> for{' '}
          <strong>{completeTarget?.userName}</strong> as completed.
        </p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">Proof URL (optional)</label>
          <InputText
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://..."
            className="w-full"
          />
        </div>
      </Dialog>

      {/* Fail confirmation (requires reason) */}
      <ConfirmAction
        visible={!!failTarget}
        onHide={() => setFailTarget(null)}
        title="Fail Withdrawal"
        message={`Mark ${failTarget?.userName}'s withdrawal of ${failTarget ? formatCurrency(failTarget.amount, failTarget.currency) : ''} as failed?`}
        confirmLabel="Mark Failed"
        confirmSeverity="danger"
        onConfirm={handleFail}
        requireReason
        reasonMinLength={10}
        loading={isFailing}
      />
    </div>
  );
}
