'use client';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useFinanceAuditTrail } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatDateTime } from '@/lib/utils/format';
import { RefreshCw } from 'lucide-react';

export default function FinanceAuditTrailPage() {
  const { data, isLoading, error, refetch } = useFinanceAuditTrail(200);
  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Finance audit trail"
        subtitle="Refund, payout, override, kill-switch, funding, and approval actions"
        actions={<Button label="Refresh" icon={<RefreshCw size={16} strokeWidth={2} />} outlined onClick={() => refetch()} />}
      />
      <Card>
        <DataTable value={data ?? []} size="small" stripedRows paginator rows={25}>
          <Column field="createdAt" header="When" body={(r) => <span className="font-mono tabular-nums">{formatDateTime(r.createdAt)}</span>} />
          <Column field="action" header="Action" body={(r) => <Tag value={r.action} />} />
          <Column field="entityType" header="Entity" />
          <Column field="entityId" header="Entity ID" body={(r) => <span className="font-mono tabular-nums text-xs">{r.entityId}</span>} />
          <Column field="actorId" header="Actor" body={(r) => <span className="font-mono tabular-nums text-xs">{r.actorId.slice(0, 8)}…</span>} />
          <Column field="reason" header="Reason" body={(r) => r.reason ?? '—'} />
        </DataTable>
      </Card>
    </>
  );
}
