'use client';

import { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import type { AdminPayoutRow } from '@social-bounty/shared';
import { usePayoutsAdmin, useRetryPayoutAdmin } from '@/hooks/useFinanceAdmin';
import { useToast } from '@/hooks/useToast';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatCents, formatDateTime, truncate } from '@/lib/utils/format';
import { RefreshCw } from 'lucide-react';

/**
 * Map StitchPayout status to a PrimeReact Tag severity.
 * - SETTLED = success (terminal, good)
 * - INITIATED / CREATED = info (in-flight, nothing to act on)
 * - FAILED = danger (needs operator attention — Retry button shown)
 * - RETRY_PENDING = warning (manual nudge needed — Retry button shown)
 * - CANCELLED = null (muted; terminal bad)
 */
const STATUS_SEVERITY: Record<
  AdminPayoutRow['status'],
  'success' | 'warning' | 'danger' | 'info' | null
> = {
  SETTLED: 'success',
  INITIATED: 'info',
  CREATED: 'info',
  FAILED: 'danger',
  RETRY_PENDING: 'warning',
  CANCELLED: null,
};

export default function FinancePayoutsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const { data, isLoading, error, refetch } = usePayoutsAdmin(page, limit);
  const retry = useRetryPayoutAdmin();
  const [confirmRow, setConfirmRow] = useState<AdminPayoutRow | null>(null);

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const first = (page - 1) * limit;

  const handleRetry = async () => {
    if (!confirmRow) return;
    try {
      await retry.mutateAsync(confirmRow.id);
      toast.showSuccess('Retry queued. The payout will be picked up on the next batch.');
      setConfirmRow(null);
      refetch();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : 'Could not retry payout.');
    }
  };

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle="All hunter payouts platform-wide (StitchPayout)"
        actions={
          <Button
            label="Refresh"
            icon={<RefreshCw size={16} strokeWidth={2} />}
            outlined
            onClick={() => refetch()}
          />
        }
      />

      <Message
        severity="info"
        className="w-full mb-4"
        text="Hunter payouts to TradeSafe are pending (ADR 0009). PAYOUTS_ENABLED is currently false; retry will log an intent but no funds will move."
      />

      <Card>
        <DataTable
          value={rows}
          size="small"
          stripedRows
          lazy
          paginator
          rows={limit}
          totalRecords={total}
          first={first}
          onPage={(e) => setPage(Math.floor((e.first ?? 0) / limit) + 1)}
        >
          <Column
            field="status"
            header="Status"
            body={(r: AdminPayoutRow) => (
              <Tag value={r.status} severity={STATUS_SEVERITY[r.status] ?? null} />
            )}
          />
          <Column
            field="amountCents"
            header="Amount"
            body={(r: AdminPayoutRow) => (
              <span className="font-mono tabular-nums">{formatCents(r.amountCents, r.currency)}</span>
            )}
          />
          <Column
            header="Hunter"
            body={(r: AdminPayoutRow) => (
              <div className="flex flex-col">
                <span className="font-medium">
                  {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                </span>
                <span className="text-xs text-text-muted">{r.email}</span>
              </div>
            )}
          />
          <Column field="attempts" header="Attempts" />
          <Column
            field="lastError"
            header="Last error"
            body={(r: AdminPayoutRow) =>
              r.lastError ? (
                <span className="text-xs text-danger-600" title={r.lastError}>
                  {truncate(r.lastError, 60)}
                </span>
              ) : (
                <span className="text-xs text-text-muted">—</span>
              )
            }
          />
          <Column
            field="nextRetryAt"
            header="Next retry"
            body={(r: AdminPayoutRow) =>
              r.nextRetryAt ? <span className="font-mono tabular-nums">{formatDateTime(r.nextRetryAt)}</span> : '—'
            }
          />
          <Column
            field="createdAt"
            header="Created"
            body={(r: AdminPayoutRow) => <span className="font-mono tabular-nums">{formatDateTime(r.createdAt)}</span>}
          />
          <Column
            header=""
            body={(r: AdminPayoutRow) =>
              r.status === 'FAILED' || r.status === 'RETRY_PENDING' ? (
                <Button
                  label="Retry"
                  icon={<RefreshCw size={16} strokeWidth={2} />}
                  size="small"
                  severity="warning"
                  outlined
                  onClick={() => setConfirmRow(r)}
                />
              ) : null
            }
          />
        </DataTable>
      </Card>

      <ConfirmAction
        visible={Boolean(confirmRow)}
        onHide={() => setConfirmRow(null)}
        title="Retry payout?"
        message={
          confirmRow
            ? `This will reset attempts=0 and requeue payout ${confirmRow.id} for the next batch. PAYOUTS_ENABLED is currently false so no funds will move.`
            : ''
        }
        confirmLabel="Retry"
        confirmSeverity="warning"
        onConfirm={handleRetry}
        loading={retry.isPending}
      />
    </>
  );
}
