'use client';

import { BOUNTY_CATEGORIES } from '@social-bounty/shared';

/**
 * BrowseCategoryPills — pill row used on `/bounties`.
 *
 * Per the Claude Design handoff (`page-chrome.jsx:142-177`). Solid `pink-600`
 * fill on the active pill, slate-200 border on idle. Mobile: horizontal scroll
 * with `.no-scrollbar`; desktop: wraps.
 *
 * Built bespoke (not via the shared `PageHeaderPills`) because the shared pill
 * uses the older glow-bg-tint style; this surface needs the design's solid
 * fill for parity with the canvas frames.
 */
const PILLS = [
  { id: 'all', label: 'All' },
  ...BOUNTY_CATEGORIES.map((c) => ({ id: c.slug, label: c.name })),
];

interface BrowseCategoryPillsProps {
  value: string;
  onChange: (id: string) => void;
}

export function BrowseCategoryPills({ value, onChange }: BrowseCategoryPillsProps) {
  return (
    <div
      className="no-scrollbar flex overflow-x-auto sm:flex-wrap sm:overflow-visible"
      style={{ gap: 10, paddingBottom: 4 }}
      role="tablist"
      aria-label="Category filter"
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
