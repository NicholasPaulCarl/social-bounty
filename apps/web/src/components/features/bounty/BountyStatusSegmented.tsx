'use client';

import { BountyStatus } from '@social-bounty/shared';
import type { StatusFilter } from '@/hooks/useManageFilters';

/**
 * BountyStatusSegmented — segmented control for bounty status filter.
 *
 * Replaces `<BountyStatusPills>` for Wave 2 hub layout polish. The design
 * (hub.jsx:187-206) uses a single rounded container with 4 tabs rather
 * than 5 separate pill buttons. PAUSED is dropped from the visible filter
 * set to match the design — it remains valid via the URL (`?status=PAUSED`)
 * but is not surfaced in the UI.
 *
 * Mapping: All → 'all', Live → BountyStatus.LIVE,
 *          Drafts → BountyStatus.DRAFT, Ended → BountyStatus.CLOSED.
 *
 * Design reference: hub.jsx:187-206 (.segmented pattern).
 */

const OPTIONS: ReadonlyArray<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: BountyStatus.LIVE, label: 'Live' },
  { id: BountyStatus.DRAFT, label: 'Drafts' },
  { id: BountyStatus.CLOSED, label: 'Ended' },
];

interface BountyStatusSegmentedProps {
  value: StatusFilter;
  onChange: (status: StatusFilter) => void;
}

export function BountyStatusSegmented({ value, onChange }: BountyStatusSegmentedProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-surface p-0.5"
      role="tablist"
      aria-label="Bounty status filter"
      style={{ gap: 2 }}
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-pressed={isActive}
            onClick={() => onChange(opt.id)}
            className={
              isActive
                ? 'cursor-pointer rounded-md bg-pink-50 text-pink-600 transition-all'
                : 'cursor-pointer rounded-md text-text-muted hover:text-text-primary transition-all'
            }
            style={{
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              minHeight: 28,
              background: isActive ? 'var(--pink-50, #fdf2f8)' : 'transparent',
              color: isActive ? 'var(--pink-600)' : 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
