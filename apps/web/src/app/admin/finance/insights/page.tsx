'use client';

import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import {
  useAdminVisibilityAnalytics,
  useConfidenceScores,
} from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import type {
  ConfidenceScore,
  VisibilityAnalyticsResponse,
  VisibilityFailureBucket,
} from '@social-bounty/shared';

// Score bands per agent spec: >=80 success, 60-79 warning, <60 danger.
function severityForScore(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}

function scoreToneClass(score: number): string {
  if (score >= 80) return 'text-success-600';
  if (score >= 60) return 'text-warning-600';
  return 'text-danger-600';
}

// Phase 3D — failure-rate color bands. Mirrors the backend alert thresholds
// (warning at 30%, critical at 50%) with a quieter emerald band below 10%.
// emerald < 10%; amber 10-30%; rose > 30%.
function failureRateToneClass(rate: number): string {
  if (rate < 0.1) return 'text-emerald-600';
  if (rate < 0.3) return 'text-amber-600';
  return 'text-rose-600';
}

function formatFailureRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

// PrimeReact <Message> takes 'info' | 'success' | 'warn' | 'error'. Map our
// service-level severity strings to the closest PrimeReact tone.
function alertSeverityToMessageType(
  severity: 'warning' | 'critical',
): 'warn' | 'error' {
  return severity === 'critical' ? 'error' : 'warn';
}

// Phase 3D — analytics card. Renders an inline loading hint or empty state
// instead of failing the whole page so the existing confidence-scores grid
// still loads if the analytics query is slow or errors out.
function VisibilityAnalyticsSection() {
  const { data, isLoading, error, refetch } = useAdminVisibilityAnalytics({
    windowHours: 24,
  });

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Visibility Failure Rate (24h)
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Per-channel post-visibility re-scrape outcomes from{' '}
            <span className="font-mono">SubmissionUrlScrapeHistory</span>. Apify
            outages spike a channel&apos;s rate before the auto-refund machinery
            compounds false positives (ADR 0010, Risk 1).
          </p>
        </div>
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          outlined
          size="small"
          onClick={() => refetch()}
        />
      </div>

      {isLoading ? (
        <Card>
          <div className="text-text-muted text-sm py-4 text-center">
            Loading visibility analytics&hellip;
          </div>
        </Card>
      ) : error ? (
        <Message
          severity="error"
          className="w-full"
          text={`Could not load visibility analytics: ${(error as Error).message}`}
        />
      ) : (
        <VisibilityAnalyticsContent data={data} />
      )}
    </section>
  );
}

function VisibilityAnalyticsContent({
  data,
}: {
  data: VisibilityAnalyticsResponse | undefined;
}) {
  if (!data) return null;
  const buckets = data.buckets;
  const hasData = buckets.length > 0;

  return (
    <>
      {data.alerts.length > 0 && (
        <div className="space-y-2 mb-3">
          {data.alerts.map((alert) => (
            <Message
              key={`${alert.channel}-${alert.severity}`}
              severity={alertSeverityToMessageType(alert.severity)}
              className="w-full"
              text={alert.message}
            />
          ))}
        </div>
      )}

      <Card>
        {!hasData ? (
          <div className="text-text-muted text-sm py-4 text-center">
            No visibility re-checks recorded in the last {data.windowHours}h.
          </div>
        ) : (
          <>
            <DataTable
              value={buckets}
              size="small"
              stripedRows
              aria-label="Visibility failure rate by channel"
            >
              <Column
                field="channel"
                header="Channel"
                body={(row: VisibilityFailureBucket) => (
                  <span className="font-medium text-text-primary">{row.channel}</span>
                )}
              />
              <Column
                field="total"
                header="Total"
                body={(row: VisibilityFailureBucket) => (
                  <span className="font-mono text-sm">{row.total}</span>
                )}
              />
              <Column
                field="verified"
                header="Verified"
                body={(row: VisibilityFailureBucket) => (
                  <span className="font-mono text-sm text-emerald-600">
                    {row.verified}
                  </span>
                )}
              />
              <Column
                field="failed"
                header="Failed"
                body={(row: VisibilityFailureBucket) => (
                  <span className="font-mono text-sm text-rose-600">
                    {row.failed}
                  </span>
                )}
              />
              <Column
                field="failureRate"
                header="Failure rate"
                body={(row: VisibilityFailureBucket) => (
                  <span
                    className={`font-mono text-sm font-semibold ${failureRateToneClass(row.failureRate)}`}
                  >
                    {formatFailureRate(row.failureRate)}
                  </span>
                )}
              />
            </DataTable>

            <div className="border-t border-border-subtle mt-3 pt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
              <span>
                Total rows{' '}
                <span className="font-semibold text-text-primary">
                  {data.totals.total}
                </span>
              </span>
              <span>
                Verified{' '}
                <span className="font-semibold text-emerald-600">
                  {data.totals.verified}
                </span>
              </span>
              <span>
                Failed{' '}
                <span className="font-semibold text-rose-600">
                  {data.totals.failed}
                </span>
              </span>
              <span>
                Combined failure rate{' '}
                <span
                  className={`font-semibold ${failureRateToneClass(data.totals.failureRate)}`}
                >
                  {formatFailureRate(data.totals.failureRate)}
                </span>
              </span>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

export default function FinanceInsightsPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useConfidenceScores();

  // Visibility analytics renders inline (its own loading + error states) so
  // the confidence-scores grid always paints. We only short-circuit the
  // whole page on confidence-scores failure since that's the headline data.

  const scores: ConfidenceScore[] = data ?? [];

  return (
    <>
      <PageHeader
        title="KB Insights"
        subtitle="Per-system confidence scores derived from open issues, 90d recurrences, and recent failed reconciliation runs."
        actions={
          <Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => refetch()} />
        }
      />

      <VisibilityAnalyticsSection />

      <div className="mb-3">
        <h2 className="text-xl font-semibold text-text-primary">
          Per-system confidence
        </h2>
      </div>

      {isLoading ? (
        <LoadingState type="cards-grid" cards={6} />
      ) : error ? (
        <ErrorState error={error as Error} onRetry={() => refetch()} />
      ) : scores.length === 0 ? (
        <EmptyState
          icon="pi-chart-line"
          title="No insights yet"
          message="No KB recurrence data yet — once reconciliation flags an issue, systems will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scores.map((s) => {
            const severity = severityForScore(s.score);
            const href = `/admin/finance/insights/${encodeURIComponent(s.system)}`;
            return (
              <Card
                key={s.system}
                role="link"
                tabIndex={0}
                aria-label={`View KB drill-down for ${s.system}`}
                className="cursor-pointer hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-pink-600/60"
                onClick={() => router.push(href)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(href);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4 gap-2">
                  <span className="font-mono text-sm text-text-secondary break-all">
                    {s.system}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <Tag value={severity.toUpperCase()} severity={severity} />
                    {s.ineffectiveFixCount > 0 && (
                      <Tag
                        severity="danger"
                        icon="pi pi-exclamation-triangle"
                        value={`Ineffective fix${s.ineffectiveFixCount > 1 ? 'es' : ''}`}
                      />
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div
                    className={`text-5xl font-bold leading-none ${scoreToneClass(s.score)}`}
                  >
                    {s.score}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-text-muted mt-1">
                    Confidence score
                  </div>
                </div>

                <div className="space-y-2 border-t border-border-subtle pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Critical open</span>
                    <span className="font-semibold text-text-primary">{s.criticalOpen}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">High open</span>
                    <span className="font-semibold text-text-primary">{s.highOpen}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Recurrences (90d)</span>
                    <span className="font-semibold text-text-primary">{s.recurrences90d}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Failed recon (7d)</span>
                    <span className="font-semibold text-text-primary">{s.failedRecon7d}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
