'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useAdminRefunds, useApproveRefundBefore } from '@/hooks/useFinanceAdmin';
import { financeAdminApi } from '@/lib/api/finance-admin';
import { useToast } from '@/hooks/useToast';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatCents, formatDateTime, formatEnumLabel } from '@/lib/utils/format';
import { csvFilename, saveBlob } from '@/lib/utils/download';
import { Download, RefreshCw, Check } from 'lucide-react';

const STATE_SEVERITY: Record<string, 'success' | 'warning' | 'danger' | 'info' | undefined> = {
  REQUESTED: 'info',
  APPROVED: 'warning',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
  REVERSED: 'warning',
};

export default function FinanceRefundsPage() {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useAdminRefunds();
  const approve = useApproveRefundBefore();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await financeAdminApi.downloadExport('refunds');
      saveBlob(blob, csvFilename('refunds'));
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : 'Could not download CSV.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const onApprove = async () => {
    if (!confirmId) return;
    try {
      await approve.mutateAsync({ refundId: confirmId });
      toast.showSuccess('Refund approved. Stitch will process and send a webhook on completion.');
      setConfirmId(null);
      refetch();
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : "Couldn't approve refund.");
    }
  };

  return (
    <>
      <PageHeader
        title="Refunds"
        subtitle="Pre-approval, post-approval, and post-payout refund requests"
        actions={
          <div className="flex gap-2">
            <Button
              label="Download CSV"
              icon={<Download size={16} strokeWidth={2} />}
              outlined
              loading={downloading}
              onClick={handleDownload}
            />
            <Button label="Refresh" icon={<RefreshCw size={16} strokeWidth={2} />} outlined onClick={() => refetch()} />
          </div>
        }
      />
      <Card>
        <DataTable value={data ?? []} size="small" stripedRows paginator rows={20}>
          <Column field="scenario" header="Scenario" body={(r) => formatEnumLabel(r.scenario)} />
          <Column
            field="state"
            header="State"
            body={(r) => <Tag value={r.state} severity={STATE_SEVERITY[r.state] ?? null} />}
          />
          <Column
            field="bountyId"
            header="Bounty"
            body={(r) => (
              <Link href={`/admin/bounties/${r.bountyId}`} className="text-primary underline">
                {r.bountyId.slice(0, 8)}…
              </Link>
            )}
          />
          <Column
            field="amountCents"
            header="Amount"
            body={(r) => <span className="font-mono tabular-nums">{formatCents(r.amountCents)}</span>}
          />
          <Column field="reason" header="Reason" />
          <Column field="createdAt" header="Created" body={(r) => <span className="font-mono tabular-nums">{formatDateTime(r.createdAt)}</span>} />
          <Column
            header="Actions"
            body={(r) =>
              r.state === 'REQUESTED' && r.scenario === 'BEFORE_APPROVAL' ? (
                <Button
                  label="Approve"
                  icon={<Check size={14} strokeWidth={2} />}
                  size="small"
                  onClick={() => setConfirmId(r.id)}
                />
              ) : null
            }
          />
        </DataTable>
      </Card>

      <ConfirmAction
        visible={Boolean(confirmId)}
        onHide={() => setConfirmId(null)}
        title="Approve refund"
        message="This will call Stitch to process the refund and post compensating ledger entries when the webhook arrives. Proceed?"
        confirmLabel="Approve refund"
        confirmSeverity="warning"
        onConfirm={onApprove}
        loading={approve.isPending}
      />
    </>
  );
}
