'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import {
  useAdminVisibilityFailures,
  useAdminVisibilityHistory,
  useFinanceExceptions,
} from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatDateTime } from '@/lib/utils/format';
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, AlertTriangle, History, ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  VisibilityFailureRow,
  VisibilityHistoryRow,
} from '@social-bounty/shared';

/**
 * Phase 3B — admin visibility-failure surface (ADR 0010).
 *
 * Lists submissions that have failed at least one PostVisibility re-check.
 * Two-failures-in-a-row triggers an automatic post-approval refund — see
 * apps/api/src/modules/submissions/submission-visibility.scheduler.ts. This
 * page is a read-only triage surface; admins use the existing
 * /admin/finance/refunds page for any manual override.
 *
 * KB integration: queries the existing finance-exceptions endpoint and
 * shows a banner when any open `post_visibility` recurring issue is
 * `critical`.
 */

// Severity colour for the consecutive-failures count. The visibility
// scheduler triggers an auto-refund at 2; rendering 1 amber and 2+ rose
// gives admins an at-a-glance "this row is about to refund" signal.
function failureCountSeverity(
  count: number,
): 'success' | 'warning' | 'danger' {
  if (count >= 2) return 'danger';
  if (count === 1) return 'warning';
  return 'success';
}

const STATUS_SEVERITY: Record<
  string,
  'success' | 'warning' | 'danger' | 'info' | undefined
> = {
  VERIFIED: 'success',
  FAILED: 'danger',
  IN_PROGRESS: 'info',
  PENDING: 'warning',
};

function HistoryDialog({
  visible,
  onHide,
  submissionId,
}: {
  visible: boolean;
  onHide: () => void;
  submissionId: string | null;
}) {
  const { data, isLoading, error } = useAdminVisibilityHistory(submissionId);

  return (
    <Dialog
      header={
        submissionId ? `Visibility check history · ${submissionId.slice(0, 8)}…` : 'History'
      }
      visible={visible}
      onHide={onHide}
      style={{ width: '90vw', maxWidth: '900px' }}
      modal
      dismissableMask
    >
      {isLoading && <LoadingState type="detail" />}
      {error && <ErrorState error={error as Error} onRetry={() => undefined} />}
      {!isLoading && !error && data && data.length === 0 && (
        <p className="text-text-muted text-sm py-4">
          No re-check history yet for this submission.
        </p>
      )}
      {!isLoading && !error && data && data.length > 0 && (
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {data.map((row: VisibilityHistoryRow) => (
            <li key={row.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-sm font-semibold text-text-primary">
                    {row.channel}{' '}
                    <span className="font-normal text-text-secondary">
                      {row.format}
                    </span>
                  </div>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:underline text-xs break-all"
                  >
                    {row.url}
                  </a>
                </div>
                <div className="text-right shrink-0">
                  <Tag
                    value={row.scrapeStatus}
                    severity={STATUS_SEVERITY[row.scrapeStatus] ?? null}
                  />
                  <div className="text-xs text-text-muted mt-1 font-mono tabular-nums">
                    {formatDateTime(row.checkedAt)}
                  </div>
                </div>
              </div>

              {row.errorMessage && (
                <div className="bg-danger-600/10 border border-danger-600/30 text-danger-600 text-xs px-3 py-2 rounded-lg flex items-start gap-1.5">
                  <AlertCircle size={12} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
                  <span>{row.errorMessage}</span>
                </div>
              )}

              {row.scrapeResult && (
                <div className="text-xs text-text-secondary">
                  <span className="text-text-muted">Scraped: </span>
                  <code className="text-[11px] bg-surface-hover/40 px-1.5 py-0.5 rounded">
                    {JSON.stringify(row.scrapeResult)}
                  </code>
                </div>
              )}

              {row.verificationChecks && row.verificationChecks.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {row.verificationChecks.map((check, idx) => {
                    const c = check as { rule?: string; pass?: boolean };
                    return (
                      <li key={idx} className="flex items-center gap-2">
                        {c.pass ? (
                          <CheckCircle2 size={14} strokeWidth={2} className="text-success-600" />
                        ) : (
                          <XCircle size={14} strokeWidth={2} className="text-danger-600" />
                        )}
                        <span className="text-text-secondary">{c.rule ?? 'rule'}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

export default function VisibilityFailuresPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [historyForId, setHistoryForId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useAdminVisibilityFailures({
    page,
    limit,
  });

  // KB banner — surface critical post_visibility recurring issues that
  // the scheduler has logged. Re-uses the existing exceptions endpoint
  // (no new API needed).
  const { data: exceptions } = useFinanceExceptions();
  const criticalKbBanner = useMemo(() => {
    if (!exceptions) return null;
    const critical = exceptions.filter(
      (e) =>
        e.category === 'post_visibility' &&
        !e.resolved &&
        e.severity === 'critical',
    );
    if (critical.length === 0) return null;
    return critical;
  }, [exceptions]);

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const rows: VisibilityFailureRow[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Visibility failures"
        subtitle="Approved submissions whose post is no longer accessible to Apify. Two consecutive failures auto-trigger a refund (ADR 0010)."
        actions={
          <Button
            label="Refresh"
            icon={<RefreshCw size={16} strokeWidth={2} />}
            outlined
            onClick={() => refetch()}
          />
        }
      />

      {criticalKbBanner && (
        <div
          className="mb-4 bg-danger-600/10 border border-danger-600/30 text-danger-600 px-4 py-3 rounded-xl flex items-start gap-3"
          role="alert"
        >
          <AlertTriangle size={18} strokeWidth={2} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-semibold">
              {criticalKbBanner.length} critical post-visibility recurrence
              {criticalKbBanner.length > 1 ? 's' : ''} open
            </div>
            <div className="text-xs mt-1 text-danger-600/90">
              {criticalKbBanner
                .slice(0, 3)
                .map((e) => e.title)
                .join(' · ')}
              {criticalKbBanner.length > 3
                ? ` · +${criticalKbBanner.length - 3} more`
                : ''}
            </div>
          </div>
        </div>
      )}

      <Card>
        <DataTable
          value={rows}
          size="small"
          stripedRows
          emptyMessage="No submissions are currently failing visibility re-checks."
        >
          <Column
            field="bountyTitle"
            header="Bounty"
            body={(r: VisibilityFailureRow) => (
              <div className="min-w-0">
                <Link
                  href={`/admin/bounties/${r.bountyId}`}
                  className="text-primary-600 hover:text-primary-700 underline font-medium"
                >
                  {r.bountyTitle}
                </Link>
              </div>
            )}
          />
          <Column
            field="brandName"
            header="Brand"
            body={(r: VisibilityFailureRow) => (
              <Link
                href={`/admin/brands/${r.brandId}`}
                className="text-primary-600 hover:text-primary-700 underline"
              >
                {r.brandName}
              </Link>
            )}
          />
          <Column
            field="hunterName"
            header="Hunter"
            body={(r: VisibilityFailureRow) => (
              <Link
                href={`/admin/users/${r.hunterId}`}
                className="text-primary-600 hover:text-primary-700 underline"
              >
                {r.hunterName}
              </Link>
            )}
          />
          <Column
            field="approvedAt"
            header="Approved"
            body={(r: VisibilityFailureRow) =>
              r.approvedAt ? <span className="font-mono tabular-nums">{formatDateTime(r.approvedAt)}</span> : '—'
            }
          />
          <Column
            field="lastVisibilityCheckAt"
            header="Last checked"
            body={(r: VisibilityFailureRow) =>
              r.lastVisibilityCheckAt
                ? <span className="font-mono tabular-nums">{formatDateTime(r.lastVisibilityCheckAt)}</span>
                : '—'
            }
          />
          <Column
            field="consecutiveVisibilityFailures"
            header="Failures"
            body={(r: VisibilityFailureRow) => (
              <Tag
                value={r.consecutiveVisibilityFailures}
                severity={failureCountSeverity(r.consecutiveVisibilityFailures)}
              />
            )}
          />
          <Column
            field="latestErrorMessage"
            header="Latest error"
            body={(r: VisibilityFailureRow) => (
              <span
                className="text-xs text-text-secondary line-clamp-2"
                title={r.latestErrorMessage ?? undefined}
              >
                {r.latestErrorMessage ?? '—'}
              </span>
            )}
          />
          <Column
            header="History"
            body={(r: VisibilityFailureRow) => (
              <Button
                label={`View (${r.historyRowCount})`}
                icon={<History size={14} strokeWidth={2} />}
                size="small"
                text
                onClick={() => setHistoryForId(r.submissionId)}
              />
            )}
          />
          <Column
            header="Submission"
            body={(r: VisibilityFailureRow) => (
              <Link
                href={`/admin/submissions/${r.submissionId}`}
                className="text-primary-600 hover:text-primary-700 underline text-sm"
              >
                Open
              </Link>
            )}
          />
        </DataTable>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-xs text-text-muted font-mono tabular-nums">
              Page {meta.page} of {meta.totalPages} · {meta.total} submissions
            </span>
            <div className="flex gap-2">
              <Button
                label="Prev"
                icon={<ChevronLeft size={14} strokeWidth={2} />}
                size="small"
                outlined
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
              <Button
                label="Next"
                icon={<ChevronRight size={14} strokeWidth={2} />}
                iconPos="right"
                size="small"
                outlined
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              />
            </div>
          </div>
        )}
      </Card>

      <HistoryDialog
        visible={Boolean(historyForId)}
        onHide={() => setHistoryForId(null)}
        submissionId={historyForId}
      />
    </>
  );
}
