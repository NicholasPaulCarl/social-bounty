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
import { ArrowLeft, RefreshCw, AlertTriangle, LineChart } from 'lucide-react';
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
          className="text-sm text-pink-600 hover:text-pink-700 inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to insights
        </Link>
      </div>

      <PageHeader
        title={`KB drill-down · ${system}`}
        subtitle="All RecurringIssue rows filed against this system, most recent first."
        actions={
          <Button label="Refresh" icon={<RefreshCw size={16} strokeWidth={2} />} outlined onClick={() => refetch()} />
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          Icon={LineChart}
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
              <span className="font-mono tabular-nums text-xs break-all">{r.signature}</span>
            )} />
            <Column field="title" header="Title" />
            <Column field="occurrences" header="Hits" body={(r: KbSystemIssueRow) => <span className="font-mono tabular-nums">{r.occurrences}</span>} />
            <Column
              field="ineffectiveFix"
              header="Flags"
              body={(r: KbSystemIssueRow) =>
                r.ineffectiveFix ? (
                  <Tag
                    severity="danger"
                    icon={<AlertTriangle size={12} strokeWidth={2} />}
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
              body={(r: KbSystemIssueRow) => <span className="font-mono tabular-nums">{formatDateTime(r.firstSeenAt)}</span>}
            />
            <Column
              field="lastSeenAt"
              header="Last seen"
              body={(r: KbSystemIssueRow) => <span className="font-mono tabular-nums">{formatDateTime(r.lastSeenAt)}</span>}
            />
            <Column
              field="kbEntryRef"
              header="KB ref"
              body={(r: KbSystemIssueRow) =>
                r.kbEntryRef ? (
                  <span className="font-mono tabular-nums text-xs">{r.kbEntryRef}</span>
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
