'use client';

import { X } from 'lucide-react';
import type { FilterChip } from '@/hooks/useBrowseFilters';

/**
 * ActiveFilterChips — the chip row above results.
 *
 * Per the Claude Design handoff (`page-chrome.jsx:310-342`). Renders nothing
 * when there are no active chips (clean baseline). Eyebrow "ACTIVE FILTERS:"
 * sits left of pink-tinted chips; clicking the X removes that single
 * dimension via the `removeChip` handler from `useBrowseFilters`.
 */
interface ActiveFilterChipsProps {
  chips: FilterChip[];
  onRemove: (key: FilterChip['key']) => void;
}

export function ActiveFilterChips({ chips, onRemove }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
      <span
        className="uppercase text-text-muted"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}
      >
        Active filters:
      </span>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onRemove(c.key)}
          className="inline-flex items-center cursor-pointer"
          aria-label={`Remove filter: ${c.label}`}
          style={{
            gap: 5,
            padding: '5px 10px 5px 8px',
            background: 'var(--pink-100)',
            color: 'var(--pink-700)',
            border: '1px solid #fbcfe8',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <X size={12} strokeWidth={2.5} aria-hidden="true" />
          {c.label}
        </button>
      ))}
    </div>
  );
}
