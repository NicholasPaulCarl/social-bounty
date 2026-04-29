'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { BountyStatus, type BountyListItem } from '@social-bounty/shared';
import type { ManageStatusAction } from './BountyManageActions';
import { BountyManageRowMenu } from './BountyManageRowMenu';
import { PlatformChips } from './PlatformChips';
import { formatRewardZAR } from '@/lib/utils/bounty-format';
import { formatDate } from '@/lib/utils/format';

/**
 * BusinessBountyListView — DataTable rendering of `/business/bounties`
 * matching the Claude Design handoff hub.jsx column set.
 *
 * 8 columns (left → right):
 *  1. Bounty       — name (semibold) + ID (mono, muted) two-line cell
 *  2. Category     — bounty.category text, muted
 *  3. Platforms    — PlatformChips for each key of bounty.channels
 *  4. Status       — colored dot + label badge (LIVE/DRAFT/PAUSED/CLOSED)
 *  5. Reward       — formatRewardZAR(rewardValue, currency), mono, medium
 *  6. Claims       — progress bar + "taken/total" fraction; "—" when null
 *  7. Ends         — endDate formatted short, mono, muted; "—" when null
 *  8. ⋯ menu       — BountyManageRowMenu (re-used unchanged)
 *
 * Row click routes to the bounty detail page.
 */

// ─────────────────────────────────────
// Per-status badge config
// ─────────────────────────────────────

const STATUS_CONFIG: Record<
  BountyStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  [BountyStatus.LIVE]: {
    dot: 'var(--success-500, #10b981)',
    bg: 'var(--success-50, #ecfdf5)',
    text: 'var(--success-700, #065f46)',
    label: 'Live',
  },
  [BountyStatus.DRAFT]: {
    dot: 'var(--slate-400, #94a3b8)',
    bg: 'var(--slate-100, #f1f5f9)',
    text: 'var(--slate-600, #475569)',
    label: 'Draft',
  },
  [BountyStatus.PAUSED]: {
    dot: 'var(--warning-500, #f59e0b)',
    bg: 'var(--warning-50, #fffbeb)',
    text: 'var(--warning-700, #92400e)',
    label: 'Paused',
  },
  [BountyStatus.CLOSED]: {
    dot: 'var(--rose-500, #f43f5e)',
    bg: 'var(--rose-50, #fff1f2)',
    text: 'var(--rose-700, #be123c)',
    label: 'Closed',
  },
};

// ─────────────────────────────────────
// Column body renderers
// ─────────────────────────────────────

function bountyBody(row: BountyListItem) {
  return (
    <div style={{ lineHeight: 1.3 }}>
      <span
        className="block font-semibold text-text-primary"
        style={{ fontSize: 13, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={row.title}
      >
        {row.title}
      </span>
      <span
        className="block font-mono text-text-muted"
        style={{ fontSize: 11, marginTop: 1, opacity: 0.7 }}
      >
        {row.id.slice(0, 8)}…
      </span>
    </div>
  );
}

function categoryBody(row: BountyListItem) {
  return (
    <span className="text-text-secondary" style={{ fontSize: 13 }}>
      {row.category || '—'}
    </span>
  );
}

function platformsBody(row: BountyListItem) {
  return <PlatformChips channels={row.channels ?? undefined} size={14} />;
}

function statusBody(row: BountyListItem) {
  const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG[BountyStatus.DRAFT];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
      style={{ background: cfg.bg, fontSize: 11, fontWeight: 600 }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      <span style={{ color: cfg.text, letterSpacing: '0.02em' }}>{cfg.label}</span>
    </span>
  );
}

function rewardBody(row: BountyListItem) {
  const text = formatRewardZAR(row.rewardValue, row.currency);
  return (
    <span
      className="font-mono tabular-nums font-medium"
      style={{ fontSize: 13, color: 'var(--pink-600, #db2777)' }}
    >
      {text || '—'}
    </span>
  );
}

function claimsBody(row: BountyListItem) {
  if (row.maxSubmissions == null) {
    return (
      <span className="font-mono text-text-muted" style={{ fontSize: 13 }}>
        —
      </span>
    );
  }

  const taken = row.submissionCount ?? 0;
  const total = row.maxSubmissions;
  const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;

  return (
    <div style={{ minWidth: 72 }}>
      {/* Progress track */}
      <div
        className="rounded-full bg-slate-200 overflow-hidden"
        style={{ height: 4, width: '100%' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${taken} of ${total} claims taken`}
      >
        <div
          className="rounded-full bg-pink-600 transition-all"
          style={{ height: '100%', width: `${pct}%` }}
        />
      </div>
      {/* Fraction text */}
      <span
        className="mt-1 block font-mono tabular-nums text-text-muted"
        style={{ fontSize: 11 }}
      >
        {taken}/{total}
      </span>
    </div>
  );
}

function endsBody(row: BountyListItem) {
  if (!row.endDate) {
    return (
      <span className="font-mono text-text-muted" style={{ fontSize: 12 }}>
        —
      </span>
    );
  }
  return (
    <span className="font-mono tabular-nums text-text-muted" style={{ fontSize: 12 }}>
      {formatDate(row.endDate)}
    </span>
  );
}

// ─────────────────────────────────────
// Component
// ─────────────────────────────────────

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
        className="min-w-[900px]"
      >
        {/* 1. Bounty — name + ID two-line cell */}
        <Column
          header="Bounty"
          body={bountyBody}
          style={{ width: '28%' }}
        />

        {/* 2. Category — muted text */}
        <Column
          header="Category"
          body={categoryBody}
          style={{ width: '14%' }}
        />

        {/* 3. Platforms — icon chips per channel key */}
        <Column
          header="Platforms"
          body={platformsBody}
          style={{ width: '10%' }}
        />

        {/* 4. Status — colored dot + label badge */}
        <Column
          header="Status"
          body={statusBody}
          style={{ width: '10%' }}
        />

        {/* 5. Reward — formatted currency, mono */}
        <Column
          header="Reward"
          body={rewardBody}
          style={{ width: '12%' }}
        />

        {/* 6. Claims — progress bar + fraction */}
        <Column
          header="Claims"
          body={claimsBody}
          style={{ width: '12%' }}
        />

        {/* 7. Ends — short date or em-dash */}
        <Column
          header="Ends"
          body={endsBody}
          style={{ width: '10%' }}
        />

        {/* 8. ⋯ menu — BountyManageRowMenu */}
        <Column
          header=""
          body={actionsBody}
          headerClassName="text-right"
          bodyClassName="text-right"
          style={{ width: '48px' }}
        />
      </DataTable>
    </div>
  );
}
