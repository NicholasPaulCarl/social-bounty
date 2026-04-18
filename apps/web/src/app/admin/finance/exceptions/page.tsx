'use client';

import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { useFinanceExceptions } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatDateTime } from '@/lib/utils/format';
import { RefreshCw } from 'lucide-react';

const SEVERITY_MAP: Record<string, 'success' | 'warning' | 'danger' | 'info' | undefined> = {
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

type SeverityFilter = 'all' | 'info' | 'warning' | 'critical';
type ResolvedFilter = 'all' | 'open' | 'resolved';

const SEVERITY_OPTIONS: Array<{ label: string; value: SeverityFilter }> = [
  { label: 'All severities', value: 'all' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' },
];

const RESOLVED_OPTIONS: Array<{ label: string; value: ResolvedFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
];

export default function FinanceExceptionsPage() {
  const { data, isLoading, error, refetch } = useFinanceExceptions();
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [resolved, setResolved] = useState<ResolvedFilter>('all');

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      if (severity !== 'all' && r.severity !== severity) return false;
      if (resolved === 'open' && r.resolved) return false;
      if (resolved === 'resolved' && !r.resolved) return false;
      return true;
    });
  }, [data, severity, resolved]);

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const total = data?.length ?? 0;

  return (
    <>
      <PageHeader
        title="Exceptions"
        subtitle="Reconciliation findings and recurring issues"
        actions={<Button label="Refresh" icon={<RefreshCw size={16} strokeWidth={2} />} outlined onClick={() => refetch()} />}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Severity</label>
            <Dropdown
              value={severity}
              options={SEVERITY_OPTIONS}
              onChange={(e) => setSeverity(e.value as SeverityFilter)}
              optionLabel="label"
              optionValue="value"
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted">Status</label>
            <SelectButton
              value={resolved}
              options={RESOLVED_OPTIONS}
              onChange={(e) => {
                if (e.value) setResolved(e.value as ResolvedFilter);
              }}
              optionLabel="label"
              optionValue="value"
            />
          </div>
          <div className="ml-auto text-sm text-text-muted">
            Showing <span className="font-semibold text-text-primary">{filtered.length}</span> of{' '}
            <span className="font-semibold text-text-primary">{total}</span>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable value={filtered} size="small" stripedRows paginator rows={25}>
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
          <Column field="firstSeenAt" header="First seen" body={(r) => <span className="font-mono tabular-nums">{formatDateTime(r.firstSeenAt)}</span>} />
          <Column field="lastSeenAt" header="Last seen" body={(r) => <span className="font-mono tabular-nums">{formatDateTime(r.lastSeenAt)}</span>} />
        </DataTable>
      </Card>
    </>
  );
}
