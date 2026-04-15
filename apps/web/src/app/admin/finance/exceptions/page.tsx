'use client';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useFinanceExceptions } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatDateTime } from '@/lib/utils/format';

const SEVERITY_MAP: Record<string, 'success' | 'warning' | 'danger' | 'info' | undefined> = {
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

export default function FinanceExceptionsPage() {
  const { data, isLoading, error, refetch } = useFinanceExceptions();
  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Exceptions"
        subtitle="Reconciliation findings and recurring issues"
        actions={<Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => refetch()} />}
      />
      <Card>
        <DataTable value={data ?? []} size="small" stripedRows paginator rows={25}>
          <Column
            field="severity"
            header="Severity"
            body={(r) => <Tag value={r.severity} severity={SEVERITY_MAP[r.severity] ?? null} />}
          />
          <Column field="category" header="Category" />
          <Column field="title" header="Title" />
          <Column field="occurrences" header="Hits" />
          <Column
            field="resolved"
            header="Status"
            body={(r) =>
              r.resolved ? (
                <Tag value="resolved" severity="success" />
              ) : (
                <Tag value="open" severity="warning" />
              )
            }
          />
          <Column field="firstSeenAt" header="First seen" body={(r) => formatDateTime(r.firstSeenAt)} />
          <Column field="lastSeenAt" header="Last seen" body={(r) => formatDateTime(r.lastSeenAt)} />
        </DataTable>
      </Card>
    </>
  );
}
