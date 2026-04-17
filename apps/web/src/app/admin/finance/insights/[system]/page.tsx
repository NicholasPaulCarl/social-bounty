'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useSystemInsights } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatDateTime } from '@/lib/utils/format';
import type { KbSystemIssueRow } from '@social-bounty/shared';

// Mirror the exceptions page severity mapping so visual language is consistent.
const SEVERITY_MAP: Record<string, 'success' | 'warning' | 'danger' | 'info' | undefined> = {
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

export default function KbSystemInsightsPage() {
  const params = useParams<{ system: string }>();
  const systemParam = params?.system ?? '';
  // Next.js App Router encodes path segments — decode once so the header +
  // API call see the raw system name (e.g. "stitch.webhooks").
  const system = decodeURIComponent(systemParam);

  const { data, isLoading, error, refetch } = useSystemInsights(system);

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const rows: KbSystemIssueRow[] = data ?? [];

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/finance/insights"
          className="text-sm text-accent-cyan hover:text-accent-cyan/80 inline-flex items-center gap-1"
        >
          <i className="pi pi-arrow-left text-xs" />
          Back to Insights
        </Link>
      </div>

      <PageHeader
        title={`KB Drill-down · ${system}`}
        subtitle="All RecurringIssue rows filed against this system, most recent first."
        actions={
          <Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => refetch()} />
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="pi-chart-line"
          title="No issues recorded"
          message={`No RecurringIssue rows matched metadata.system = "${system}".`}
        />
      ) : (
        <Card>
          <DataTable
            value={rows}
            size="small"
            stripedRows
            paginator
            rows={25}
            // Resolved rows render subdued; ineffective-fix rows get a soft red tint.
            rowClassName={(row) => {
              const r = row as KbSystemIssueRow;
              if (r.ineffectiveFix) return 'bg-danger-50/40';
              if (r.resolved) return 'opacity-60';
              return '';
            }}
          >
            <Column
              field="severity"
              header="Severity"
              body={(r: KbSystemIssueRow) => (
                <Tag value={r.severity} severity={SEVERITY_MAP[r.severity] ?? null} />
              )}
            />
            <Column field="category" header="Category" />
            <Column field="signature" header="Signature" body={(r: KbSystemIssueRow) => (
              <span className="font-mono text-xs break-all">{r.signature}</span>
            )} />
            <Column field="title" header="Title" />
            <Column field="occurrences" header="Hits" />
            <Column
              field="ineffectiveFix"
              header="Flags"
              body={(r: KbSystemIssueRow) =>
                r.ineffectiveFix ? (
                  <Tag
                    severity="danger"
                    icon="pi pi-exclamation-triangle"
                    value="Ineffective fix"
                  />
                ) : null
              }
            />
            <Column
              field="resolved"
              header="Status"
              body={(r: KbSystemIssueRow) =>
                r.resolved ? (
                  <Tag value="resolved" severity="success" />
                ) : (
                  <Tag value="open" severity="warning" />
                )
              }
            />
            <Column
              field="firstSeenAt"
              header="First seen"
              body={(r: KbSystemIssueRow) => formatDateTime(r.firstSeenAt)}
            />
            <Column
              field="lastSeenAt"
              header="Last seen"
              body={(r: KbSystemIssueRow) => formatDateTime(r.lastSeenAt)}
            />
            <Column
              field="kbEntryRef"
              header="KB ref"
              body={(r: KbSystemIssueRow) =>
                r.kbEntryRef ? (
                  <span className="font-mono text-xs">{r.kbEntryRef}</span>
                ) : (
                  <span className="text-text-muted">—</span>
                )
              }
            />
          </DataTable>
        </Card>
      )}
    </>
  );
}
