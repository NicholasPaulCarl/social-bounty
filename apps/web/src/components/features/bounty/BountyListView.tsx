'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { BadgeCheck } from 'lucide-react';
import {
  RewardType,
  type BountyListItem,
  type SocialChannel,
  type PostFormat,
} from '@social-bounty/shared';
import { BrandAvatar } from './BrandAvatar';
import { StatusDot } from './StatusDot';
import {
  formatRewardZAR,
  getFormatIcon,
  hashHue,
  timeLabel,
} from '@/lib/utils/bounty-format';

/**
 * BountyListView — DataTable rendering of `/bounties` results.
 *
 * Per the Claude Design handoff (`live-prototype.jsx:124-187`). 7 columns:
 * Reward · Brand · Title · Format · Time left · Slots · Status. Reward is
 * right-aligned mono pink/reward; format renders icons only (saves
 * horizontal space vs. chips); time-left flips to warning-600 + bold when
 * <24h; slots use the same `submissionCount`-derived pair as the card.
 *
 * Uses PrimeReact DataTable to keep row-level a11y + onRowClick semantics
 * the existing page already had.
 */
type ForwardCompat = BountyListItem & {
  brand: BountyListItem['brand'] & { verified?: boolean; hue?: number };
};

interface BountyListViewProps {
  bounties: BountyListItem[];
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

function brandBody(row: BountyListItem) {
  const fc = row as ForwardCompat;
  const hue = fc.brand.hue ?? hashHue(fc.brand.id ?? fc.brand.name ?? '');
  return (
    <span className="inline-flex items-center" style={{ gap: 8 }}>
      <BrandAvatar name={fc.brand.name} hue={hue} size={22} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{fc.brand.name}</span>
      {fc.brand.verified === true && (
        <span style={{ color: 'var(--pink-600)', display: 'inline-flex' }}>
          <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

function titleBody(row: BountyListItem) {
  return (
    <span
      className="block"
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

function formatBody(row: BountyListItem) {
  if (!row.channels) return null;
  const entries = (Object.entries(row.channels) as Array<
    [SocialChannel, PostFormat[] | undefined]
  >).slice(0, 3);
  return (
    <span className="inline-flex items-center text-text-muted" style={{ gap: 4 }}>
      {entries.map(([channel]) => {
        const Icon = getFormatIcon(channel);
        return <Icon key={channel} size={14} strokeWidth={2} aria-hidden="true" />;
      })}
    </span>
  );
}

function timeBody(row: BountyListItem) {
  const t = timeLabel(row.endDate);
  if (!t) {
    return (
      <span className="font-mono tabular-nums text-text-muted" style={{ fontSize: 12 }}>
        —
      </span>
    );
  }
  // Compact label — drop the " left" suffix in the table for density.
  const compact = t.label.replace(' left', '');
  return (
    <span
      className="font-mono tabular-nums"
      style={{
        fontSize: 12,
        color: t.urgent ? 'var(--warning-600)' : 'var(--text-secondary)',
        fontWeight: t.urgent ? 700 : 500,
      }}
    >
      {compact}
    </span>
  );
}

function slotsBody(row: BountyListItem) {
  if (row.maxSubmissions == null) {
    return (
      <span className="font-mono tabular-nums text-text-muted" style={{ fontSize: 12 }}>
        ∞
      </span>
    );
  }
  const remaining = Math.max(0, row.maxSubmissions - row.submissionCount);
  return (
    <span
      className="font-mono tabular-nums text-text-secondary"
      style={{ fontSize: 12 }}
    >
      {remaining}/{row.maxSubmissions}
    </span>
  );
}

function statusBody() {
  return <StatusDot />;
}

export function BountyListView({ bounties }: BountyListViewProps) {
  const router = useRouter();
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
        onRowClick={(e) => router.push(`/bounties/${(e.data as BountyListItem).id}`)}
        rowClassName={() => 'cursor-pointer'}
        aria-label="Bounties list"
        scrollable
        className="min-w-[760px]"
      >
        <Column header="Reward" body={rewardBody} headerClassName="text-right" bodyClassName="text-right" />
        <Column header="Brand" body={brandBody} />
        <Column header="Title" body={titleBody} />
        <Column header="Format" body={formatBody} />
        <Column header="Time left" body={timeBody} />
        <Column header="Slots" body={slotsBody} />
        <Column header="Status" body={statusBody} />
      </DataTable>
    </div>
  );
}
