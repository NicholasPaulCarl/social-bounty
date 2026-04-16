'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Tag } from 'primereact/tag';
import { useTransactionGroup } from '@/hooks/useFinanceAdmin';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ApiError } from '@/lib/api/client';
import { formatCents, formatDateTime } from '@/lib/utils/format';
import type { TransactionGroupDetailEntry } from '@/lib/api/finance-admin';

function JsonBlock({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!value) return null;
  const pretty = JSON.stringify(value, null, 2);
  const collapsible = pretty.length > 400;
  const display = !collapsible || expanded ? pretty : pretty.slice(0, 400) + '…';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-text-muted">{label}</h4>
        {collapsible && (
          <Button
            label={expanded ? 'Collapse' : 'Expand'}
            icon={expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'}
            size="small"
            text
            onClick={() => setExpanded((prev) => !prev)}
          />
        )}
      </div>
      <pre className="border border-glass-border rounded-lg p-4 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap font-mono">
        {display}
      </pre>
    </div>
  );
}

export default function TransactionGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.transactionGroupId as string;

  const { data, isLoading, error, refetch } = useTransactionGroup(id);

  const backButton = (
    <Button
      label="Back to Finance"
      icon="pi pi-arrow-left"
      outlined
      onClick={() => router.push('/admin/finance')}
    />
  );

  if (isLoading) return <LoadingState type="detail" />;

  if (error) {
    const is404 = error instanceof ApiError && error.statusCode === 404;
    if (is404) {
      return (
        <>
          <PageHeader title="Transaction group" actions={backButton} />
          <EmptyState
            icon="pi-search"
            title="Transaction group not found"
            message={`No ledger transaction group exists with id ${id}.`}
            ctaLabel="Back to Finance"
            ctaIcon="pi-arrow-left"
            ctaAction={() => router.push('/admin/finance')}
          />
        </>
      );
    }
    return <ErrorState error={error as Error} onRetry={() => refetch()} />;
  }

  if (!data) return null;

  const { group, entries, auditLog } = data;

  const refField = (row: TransactionGroupDetailEntry) => {
    const bits: React.ReactNode[] = [];
    if (row.userId) {
      bits.push(
        <Link
          key="user"
          href={`/admin/users/${row.userId}`}
          className="text-primary underline font-mono text-xs"
        >
          user:{row.userId.slice(0, 8)}
        </Link>,
      );
    }
    if (row.brandId) {
      bits.push(
        <Link
          key="brand"
          href={`/admin/brands/${row.brandId}`}
          className="text-primary underline font-mono text-xs"
        >
          brand:{row.brandId.slice(0, 8)}
        </Link>,
      );
    }
    if (row.bountyId) {
      bits.push(
        <Link
          key="bounty"
          href={`/admin/bounties/${row.bountyId}`}
          className="text-primary underline font-mono text-xs"
        >
          bounty:{row.bountyId.slice(0, 8)}
        </Link>,
      );
    }
    if (row.submissionId) {
      bits.push(
        <Link
          key="submission"
          href={`/admin/submissions/${row.submissionId}`}
          className="text-primary underline font-mono text-xs"
        >
          submission:{row.submissionId.slice(0, 8)}
        </Link>,
      );
    }
    if (bits.length === 0) return <span className="text-text-muted text-xs">—</span>;
    return <div className="flex flex-col gap-1">{bits}</div>;
  };

  return (
    <>
      <PageHeader
        title={`Transaction group ${group.referenceId}`}
        subtitle={group.description ?? undefined}
        actions={backButton}
      />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-text-muted mb-1">Reference ID</div>
            <div className="font-mono text-sm break-all">{group.referenceId}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Action</div>
            <Tag value={group.actionType} />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Created</div>
            <div className="text-sm">{formatDateTime(group.createdAt)}</div>
          </div>
        </div>
        {group.description && (
          <div className="mt-4">
            <div className="text-xs text-text-muted mb-1">Description</div>
            <div className="text-sm">{group.description}</div>
          </div>
        )}
      </Card>

      <Card title="Ledger entries" className="mb-6">
        <DataTable value={entries} size="small" stripedRows>
          <Column field="account" header="Account" body={(r: TransactionGroupDetailEntry) => <span className="font-mono text-xs">{r.account}</span>} />
          <Column
            field="type"
            header="Type"
            body={(r: TransactionGroupDetailEntry) => (
              <Tag
                value={r.type}
                severity={r.type === 'DEBIT' ? 'danger' : 'success'}
              />
            )}
          />
          <Column
            field="amountCents"
            header="Amount"
            body={(r: TransactionGroupDetailEntry) => (
              <span className="font-mono">{formatCents(r.amountCents)}</span>
            )}
          />
          <Column
            field="externalReference"
            header="External reference"
            body={(r: TransactionGroupDetailEntry) =>
              r.externalReference ? (
                <span className="font-mono text-xs">{r.externalReference}</span>
              ) : (
                <span className="text-text-muted text-xs">—</span>
              )
            }
          />
          <Column header="Links" body={refField} />
        </DataTable>
      </Card>

      <Card title="Audit log">
        {auditLog === null ? (
          <p className="text-sm text-text-muted">No audit log entry for this transaction group.</p>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-xs text-text-muted mb-1">Actor</div>
                <div className="text-sm">
                  {auditLog.actorId || 'system'}
                  {auditLog.actorRole && (
                    <span className="text-text-muted text-xs ml-2">({auditLog.actorRole})</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Action</div>
                <div className="text-sm font-medium">{auditLog.action}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">When</div>
                <div className="text-sm">{formatDateTime(auditLog.createdAt)}</div>
              </div>
            </div>
            {auditLog.reason && (
              <div className="mb-3">
                <div className="text-xs text-text-muted mb-1">Reason</div>
                <p className="text-sm text-text-secondary">{auditLog.reason}</p>
              </div>
            )}
            <JsonBlock label="Before" value={auditLog.beforeState} />
            <JsonBlock label="After" value={auditLog.afterState} />
          </div>
        )}
      </Card>
    </>
  );
}
