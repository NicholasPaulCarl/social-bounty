'use client';

import { BountyStatus } from '@social-bounty/shared';
import type { StatusFilter } from '@/hooks/useManageFilters';

/**
 * BountyStatusPills — pill row used on `/business/bounties`.
 *
 * Mirrors `BrowseCategoryPills` (same DS — solid `pink-600` fill on the
 * active pill, slate-200 border on idle, mobile horizontal scroll). On the
 * brand surface the dimension being filtered is bounty lifecycle stage
 * rather than category, so the pills are: All · Draft · Live · Paused ·
 * Closed.
 *
 * The hero meta strip carries the per-status counts as separator-joined
 * clauses ("12 live · 5 draft · 2 paused · 1 closed"); the pills stay
 * label-only to keep the visual rhythm tight and avoid duplicated numbers.
 */
const PILLS: ReadonlyArray<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: BountyStatus.DRAFT, label: 'Draft' },
  { id: BountyStatus.LIVE, label: 'Live' },
  { id: BountyStatus.PAUSED, label: 'Paused' },
  { id: BountyStatus.CLOSED, label: 'Closed' },
];

interface BountyStatusPillsProps {
  value: StatusFilter;
  onChange: (id: StatusFilter) => void;
}

export function BountyStatusPills({ value, onChange }: BountyStatusPillsProps) {
  return (
    <div
      className="no-scrollbar flex overflow-x-auto sm:flex-wrap sm:overflow-visible"
      style={{ gap: 10, paddingBottom: 4 }}
      role="tablist"
      aria-label="Bounty status filter"
    >
      {PILLS.map((p) => {
        const selected = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(p.id)}
            className="cursor-pointer transition-all"
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              border: selected ? '1px solid var(--pink-600)' : '1px solid var(--slate-200)',
              background: selected ? 'var(--pink-600)' : 'var(--bg-surface)',
              color: selected ? '#fff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minHeight: 36,
              lineHeight: 1,
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
