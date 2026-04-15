'use client';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useConfidenceScores } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import type { ConfidenceScore } from '@social-bounty/shared';

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

export default function FinanceInsightsPage() {
  const { data, isLoading, error, refetch } = useConfidenceScores();

  if (isLoading) return <LoadingState type="cards-grid" cards={6} />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

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

      {scores.length === 0 ? (
        <EmptyState
          icon="pi-chart-line"
          title="No insights yet"
          message="No KB recurrence data yet — once reconciliation flags an issue, systems will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scores.map((s) => {
            const severity = severityForScore(s.score);
            return (
              <Card key={s.system}>
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-sm text-text-secondary break-all">
                    {s.system}
                  </span>
                  <Tag value={severity.toUpperCase()} severity={severity} />
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
