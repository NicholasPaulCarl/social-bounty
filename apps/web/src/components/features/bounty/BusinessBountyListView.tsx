'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { BountyStatus, RewardType, type BountyListItem } from '@social-bounty/shared';
import { StatusDot } from './StatusDot';
import type { ManageStatusAction } from './BountyManageActions';
import { BountyManageRowMenu } from './BountyManageRowMenu';
import { formatDate } from '@/lib/utils/format';
import { formatRewardZAR } from '@/lib/utils/bounty-format';

/**
 * BusinessBountyListView — DataTable rendering of `/business/bounties`
 * results, the manage variant of `BountyListView`.
 *
 * Brand sees their own bounties of every status, so the column set is
 * tuned for management rather than discovery: Reward · Title · Status ·
 * Submissions · Created · Actions. Brand column is dropped (always the
 * same brand); time-left and slots-remaining are dropped (less critical
 * to the brand at-a-glance than to the hunter).
 *
 * Status dot reflects the actual `bounty.status` — DRAFT / LIVE /
 * PAUSED / CLOSED — matched to the same DS palette as the manage card.
 *
 * Row click routes to the bounty detail page; action buttons stop the
 * row-click event so the parent's modal/handler fires cleanly.
 */
const STATUS_DOT: Record<BountyStatus, { color: string; label: string }> = {
  [BountyStatus.DRAFT]: { color: 'var(--slate-400)', label: 'DRAFT' },
  [BountyStatus.LIVE]: { color: 'var(--success-500)', label: 'LIVE' },
  [BountyStatus.PAUSED]: { color: 'var(--warning-500)', label: 'PAUSED' },
  [BountyStatus.CLOSED]: { color: 'var(--slate-700)', label: 'CLOSED' },
};

interface BusinessBountyListViewProps {
  bounties: BountyListItem[];
  onView: (bounty: BountyListItem) => void;
  onEdit: (bounty: BountyListItem) => void;
  onStatusChange: (bounty: BountyListItem, action: ManageStatusAction) => void;
  onDelete: (bounty: BountyListItem) => void;
  onDuplicate: (bounty: BountyListItem) => void;
  /** Bounty id currently in the publish-payment redirect. */
  paymentBountyId?: string | null;
}

function rewardBody(row: BountyListItem) {
  const isCash = row.rewardType === RewardType.CASH;
  const text = formatRewardZAR(row.rewardValue, row.currency);
  return (
    <span
      className="font-mono tabular-nums"
      style={{
        fontWeight: 700,
        color: isCash ? 'var(--pink-600)' : 'var(--reward-600)',
        fontSize: 14,
      }}
    >
      {text || '—'}
    </span>
  );
}

function titleBody(row: BountyListItem) {
  return (
    <span
      className="block font-medium"
      style={{
        fontSize: 13,
        maxWidth: 320,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={row.title}
    >
      {row.title}
    </span>
  );
}

function statusBody(row: BountyListItem) {
  const dot = STATUS_DOT[row.status];
  return <StatusDot color={dot.color} label={dot.label} />;
}

function submissionsBody(row: BountyListItem) {
  return (
    <span
      className="font-mono tabular-nums text-text-secondary"
      style={{ fontSize: 13, fontWeight: 600 }}
    >
      {row.submissionCount}
    </span>
  );
}

function createdBody(row: BountyListItem) {
  return (
    <span
      className="font-mono tabular-nums text-text-muted"
      style={{ fontSize: 12 }}
    >
      {formatDate(row.createdAt)}
    </span>
  );
}

export function BusinessBountyListView({
  bounties,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  onDuplicate,
  paymentBountyId,
}: BusinessBountyListViewProps) {
  const router = useRouter();
  const actionsBody = (row: BountyListItem) => (
    <div className="inline-flex items-center justify-end" style={{ width: '100%' }}>
      <BountyManageRowMenu
        bounty={row}
        onView={onView}
        onEdit={onEdit}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        paymentLoading={paymentBountyId === row.id}
      />
    </div>
  );

  return (
    <div
      className="overflow-x-auto bg-surface"
      style={{
        border: '1px solid var(--slate-200)',
        borderRadius: 12,
      }}
    >
      <DataTable
        value={bounties}
        onRowClick={(e) => router.push(`/business/bounties/${(e.data as BountyListItem).id}`)}
        rowClassName={() => 'cursor-pointer'}
        aria-label="Manage bounties list"
        scrollable
        className="min-w-[760px]"
      >
        <Column
          header="Reward"
          body={rewardBody}
          headerClassName="text-right"
          bodyClassName="text-right"
          style={{ width: '120px' }}
        />
        <Column header="Title" body={titleBody} />
        <Column header="Status" body={statusBody} style={{ width: '120px' }} />
        <Column
          header="Submissions"
          body={submissionsBody}
          headerClassName="text-right"
          bodyClassName="text-right"
          style={{ width: '120px' }}
        />
        <Column header="Created" body={createdBody} style={{ width: '110px' }} />
        <Column
          header=""
          body={actionsBody}
          headerClassName="text-right"
          bodyClassName="text-right"
          style={{ width: '64px' }}
        />
      </DataTable>
    </div>
  );
}
