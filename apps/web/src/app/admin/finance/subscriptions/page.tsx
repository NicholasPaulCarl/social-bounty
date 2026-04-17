'use client';

import { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { SubscriptionStatus } from '@social-bounty/shared';
import { useFinanceSubscriptions } from '@/hooks/useFinanceAdmin';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import type { FinanceSubscriptionRow } from '@/lib/api/finance-admin';

/**
 * Map each subscription status to a PrimeReact Tag severity.
 * FREE/CANCELLED/EXPIRED render as muted states; PAST_DUE as a warning so
 * the SA can triage collection-at-risk accounts at a glance; ACTIVE green.
 */
const STATUS_SEVERITY: Record<
  SubscriptionStatus,
  'success' | 'warning' | 'danger' | 'info' | null
> = {
  [SubscriptionStatus.ACTIVE]: 'success',
  [SubscriptionStatus.PAST_DUE]: 'warning',
  [SubscriptionStatus.CANCELLED]: 'info',
  [SubscriptionStatus.EXPIRED]: 'danger',
  [SubscriptionStatus.FREE]: null,
};

export default function FinanceSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const { data, isLoading, error, refetch } = useFinanceSubscriptions({ page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const first = (page - 1) * limit;

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="All hunter and brand subscriptions (read-only)"
        actions={<Button label="Refresh" icon="pi pi-refresh" outlined onClick={() => refetch()} />}
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
            header="Owner"
            body={(r: FinanceSubscriptionRow) => (
              <div className="flex flex-col">
                <span className="font-medium">{r.ownerName ?? '—'}</span>
                <span className="text-xs text-text-muted">{r.ownerEmail ?? ''}</span>
              </div>
            )}
          />
          <Column
            field="entityType"
            header="Entity"
            body={(r: FinanceSubscriptionRow) => <Tag value={r.entityType} />}
          />
          <Column
            field="tier"
            header="Tier"
            body={(r: FinanceSubscriptionRow) => (
              <Tag value={r.tier} severity={r.tier === 'PRO' ? 'success' : null} />
            )}
          />
          <Column
            field="status"
            header="Status"
            body={(r: FinanceSubscriptionRow) => (
              <Tag
                value={r.status}
                severity={STATUS_SEVERITY[r.status] ?? null}
              />
            )}
          />
          <Column
            field="priceAmount"
            header="Price"
            body={(r: FinanceSubscriptionRow) => (
              <span className="font-mono">{formatCurrency(r.priceAmount, r.currency)}</span>
            )}
          />
          <Column
            field="currentPeriodEnd"
            header="Period end"
            body={(r: FinanceSubscriptionRow) =>
              r.currentPeriodEnd ? formatDateTime(r.currentPeriodEnd) : '—'
            }
          />
          <Column
            field="gracePeriodEndsAt"
            header="Grace ends"
            body={(r: FinanceSubscriptionRow) =>
              r.gracePeriodEndsAt ? formatDateTime(r.gracePeriodEndsAt) : '—'
            }
          />
          <Column
            field="failedPaymentCount"
            header="Failed"
            body={(r: FinanceSubscriptionRow) => (
              <span className={r.failedPaymentCount > 0 ? 'text-danger-600 font-semibold' : ''}>
                {r.failedPaymentCount}
              </span>
            )}
          />
        </DataTable>
      </Card>
    </>
  );
}
