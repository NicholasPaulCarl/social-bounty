'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

/**
 * BountyFilterRow — search input + Filter button for `/business/bounties`.
 *
 * Replaces `<BrowseFilterBar>` (which is still used by the participant
 * browse page) for Wave 2 hub layout polish. Simplified to match the
 * design (hub.jsx:192-209): full-width search input with a left Search
 * icon + a single "Filter" button anchored to the right.
 *
 * The reward-type filter and sort dropdowns from BrowseFilterBar are
 * intentionally dropped — the URL keys remain readable by useManageFilters
 * if previously set, but there is no UI to set them from this row.
 *
 * TODO: wire onFilterClick to a filter panel / sheet once the filter panel
 * design is available. For now it is a no-op stub that surfaces the intent.
 *
 * Design reference: hub.jsx:192-209.
 */

interface BountyFilterRowProps {
  /** Current search value (controlled from useManageFilters.searchInput). */
  searchValue: string;
  /** Called on every keystroke; debouncing is handled upstream in useManageFilters. */
  onSearchChange: (value: string) => void;
  /**
   * Optional click handler for the Filter button.
   * No-op stub — filter panel not yet implemented.
   */
  onFilterClick?: () => void;
}

export function BountyFilterRow({
  searchValue,
  onSearchChange,
  onFilterClick,
}: BountyFilterRowProps) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ width: '100%' }}
    >
      {/* Search — full width on mobile, ~320px capped on desktop */}
      <div
        className="relative flex-1 sm:flex-none"
        style={{ minWidth: 0, maxWidth: '100%' }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            pointerEvents: 'none',
          }}
        >
          <Search size={14} strokeWidth={2} />
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bounties…"
          aria-label="Search bounties"
          className="w-full bg-surface text-text-primary sm:w-80"
          style={{
            boxSizing: 'border-box',
            padding: '7px 12px 7px 30px',
            border: '1px solid var(--slate-200)',
            borderRadius: 8,
            fontSize: 13,
            height: 36,
            fontFamily: 'var(--font-body)',
            outline: 'none',
          }}
        />
      </div>

      {/* Spacer — pushes Filter button to the right */}
      <div style={{ flex: 1 }} />

      {/* Filter button — stub; no-op until filter panel is designed */}
      <button
        type="button"
        onClick={onFilterClick}
        className="cursor-pointer inline-flex items-center gap-1.5 transition-all"
        style={{
          padding: '7px 12px',
          border: '1px solid var(--slate-200)',
          borderRadius: 8,
          background: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 600,
          height: 36,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        aria-label="Open filters"
      >
        <SlidersHorizontal size={13} strokeWidth={2} aria-hidden="true" />
        Filter
      </button>
    </div>
  );
}
