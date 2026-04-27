'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { ArrowRight, Inbox, ShieldCheck, FileText } from 'lucide-react';
import { useAdminPendingKyb } from '@/hooks/useAdmin';
import { usePagination } from '@/hooks/usePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';
import type { AdminKybQueueItem } from '@social-bounty/shared';

/**
 * Pending KYB review queue (SUPER_ADMIN only).
 *
 * Server-side: GET /admin/brands/kyb returns brands with kybStatus = PENDING,
 * oldest-first. Click-through routes to /admin/brands/:id#kyb where the review
 * surface lives.
 *
 * The route is static (`/admin/brands/kyb`) and Next.js's matcher prefers
 * static segments over dynamic ones, so it does not collide with the existing
 * `/admin/brands/[id]` page.
 */

// Time-since-submitted color coding. <2d emerald, 2–5d amber, >5d rose.
function daysWaiting(submittedAt: string | null): number {
  if (!submittedAt) return 0;
  const ms = Date.now() - new Date(submittedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / 86_400_000);
}

function daysWaitingSeverity(days: number): 'success' | 'warning' | 'danger' {
  if (days > 5) return 'danger';
  if (days >= 2) return 'warning';
  return 'success';
}

function countrySeverity(country: string | null): 'info' | undefined {
  return country ? 'info' : undefined;
}

export default function AdminKybQueuePage() {
  const router = useRouter();
  const { page, limit, first, onPageChange } = usePagination();

  const { data, isLoading, error, refetch } = useAdminPendingKyb({ page, limit });

  if (isLoading) return <LoadingState type="table" />;
  if (error) return <ErrorState error={error as Error} onRetry={() => refetch()} />;

  const rows: AdminKybQueueItem[] = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const brandTemplate = (row: AdminKybQueueItem) => (
    <Link
      href={`/admin/brands/${row.brandId}#kyb`}
      className="text-pink-600 hover:text-pink-700 underline font-medium"
    >
      {row.brandName}
    </Link>
  );

  const registeredNameTemplate = (row: AdminKybQueueItem) => (
    <span className="text-text-secondary">{row.registeredName ?? '—'}</span>
  );

  const countryTemplate = (row: AdminKybQueueItem) =>
    row.country ? (
      <Tag value={row.country} severity={countrySeverity(row.country)} />
    ) : (
      <span className="text-text-muted">—</span>
    );

  const submittedTemplate = (row: AdminKybQueueItem) =>
    row.kybSubmittedAt ? (
      <span
        className="font-mono tabular-nums text-text-secondary"
        title={formatDate(row.kybSubmittedAt)}
      >
        {formatRelativeTime(row.kybSubmittedAt)}
      </span>
    ) : (
      <span className="text-text-muted">—</span>
    );

  const daysTemplate = (row: AdminKybQueueItem) => {
    if (!row.kybSubmittedAt) return <span className="text-text-muted">—</span>;
    const days = daysWaiting(row.kybSubmittedAt);
    return (
      <Tag
        value={days === 0 ? 'today' : `${days}d`}
        severity={daysWaitingSeverity(days)}
      />
    );
  };

  const documentsTemplate = (row: AdminKybQueueItem) => {
    const count = row.documentCount;
    return (
      <Tag
        value={count.toString()}
        severity={count === 0 ? 'danger' : 'success'}
        icon={<FileText size={12} strokeWidth={2} aria-hidden="true" />}
      />
    );
  };

  const actionsTemplate = (row: AdminKybQueueItem) => (
    <Button
      label="Review"
      icon={<ArrowRight size={14} strokeWidth={2} />}
      iconPos="right"
      size="small"
      onClick={() => router.push(`/admin/brands/${row.brandId}#kyb`)}
    />
  );

  return (
    <div className="animate-fade-up">
      <p className="text-xs uppercase tracking-wider text-text-muted font-mono mb-1">
        Brand verification
      </p>
      <PageHeader
        title="KYB Review Queue"
        subtitle="Brands awaiting verification before TradeSafe BUYER party tokens are minted."
        actions={
          <Button
            label="Refresh"
            icon={<ShieldCheck size={16} strokeWidth={2} />}
            outlined
            onClick={() => refetch()}
          />
        }
      />

      {rows.length > 0 ? (
        <>
          <div className="glass-card overflow-x-auto">
            <DataTable value={rows} stripedRows className="min-w-[900px]">
              <Column header="Brand" body={brandTemplate} />
              <Column header="Registered name" body={registeredNameTemplate} />
              <Column field="registrationNumber" header="Reg. number" body={(r: AdminKybQueueItem) => (
                <span className="font-mono tabular-nums text-text-secondary">{r.registrationNumber ?? '—'}</span>
              )} />
              <Column header="Country" body={countryTemplate} />
              <Column header="Submitted" body={submittedTemplate} />
              <Column header="Waiting" body={daysTemplate} style={{ width: '7rem' }} />
              <Column header="Documents" body={documentsTemplate} style={{ width: '7rem' }} />
              <Column header="Action" body={actionsTemplate} style={{ width: '8rem' }} />
            </DataTable>
          </div>
          <Paginator
            first={first}
            rows={limit}
            totalRecords={total}
            onPageChange={onPageChange}
            className="mt-4"
          />
        </>
      ) : (
        <EmptyState
          Icon={Inbox}
          title="Inbox zero — no pending KYB reviews"
          message="When a brand submits KYB documents you'll see them here, oldest first."
        />
      )}
    </div>
  );
}

