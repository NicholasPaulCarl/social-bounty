'use client';

import { useState } from 'react';
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { RewardType } from '@social-bounty/shared';
import type { RewardFilter, SortKey } from '@/hooks/useBrowseFilters';
import { SelectPill, type SelectPillOption } from './SelectPill';
import { MobileFilterSheet, type MobileFilterMode } from './MobileFilterSheet';

/**
 * BrowseFilterBar — the sticky filter row on `/bounties`.
 *
 * Per the Claude Design handoff (`page-chrome.jsx:180-228`). Sticky under
 * the page header on desktop with a translucent surface + backdrop-blur
 * (so the cards underneath show through faintly on scroll). Mobile
 * collapses to a single-line search + a 50/50 split of `[Filters ▾]`
 * `[Sort ▾]` triggers; tapping either opens a `<MobileFilterSheet>`.
 *
 * Search is uncontrolled-then-debounced inside `useBrowseFilters` so the
 * user feels typing as immediate but the URL only updates after 300ms.
 */

const REWARD_OPTIONS: ReadonlyArray<SelectPillOption<RewardFilter>> = [
  { id: 'all', label: 'Any reward' },
  { id: RewardType.CASH, label: 'Cash' },
  { id: RewardType.PRODUCT, label: 'Product' },
  { id: RewardType.SERVICE, label: 'Service' },
  { id: RewardType.OTHER, label: 'Other' },
];

const SORT_OPTIONS: ReadonlyArray<SelectPillOption<SortKey>> = [
  { id: 'newest', label: 'Newest' },
  { id: 'reward-high', label: 'Reward (high → low)' },
  { id: 'reward-low', label: 'Reward (low → high)' },
  { id: 'ending-soon', label: 'Ending soon' },
];

interface BrowseFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  rewardType: RewardFilter;
  onRewardTypeChange: (value: RewardFilter) => void;
  sortBy: SortKey;
  onSortByChange: (value: SortKey) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function BrowseFilterBar(props: BrowseFilterBarProps) {
  const {
    search,
    onSearchChange,
    rewardType,
    onRewardTypeChange,
    sortBy,
    onSortByChange,
    hasActiveFilters,
    onClearAll,
  } = props;
  const [sheetMode, setSheetMode] = useState<MobileFilterMode>(null);

  const SearchInput = (
    <div className="relative" style={{ flex: 1 }}>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          display: 'inline-flex',
        }}
      >
        <Search size={16} strokeWidth={2} />
      </span>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search bounties…"
        aria-label="Search bounties"
        className="w-full bg-surface text-text-primary"
        style={{
          boxSizing: 'border-box',
          padding: '9px 36px 9px 12px',
          border: '1px solid var(--slate-200)',
          borderRadius: 8,
          fontSize: 13,
          height: 38,
          fontFamily: 'var(--font-body)',
          outline: 'none',
        }}
      />
    </div>
  );

  return (
    <>
      {/* Desktop bar */}
      <div
        className="sticky z-20 hidden sm:flex items-center"
        style={{
          top: 64,
          gap: 12,
          padding: '12px 0',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--slate-200)',
          borderBottom: '1px solid var(--slate-200)',
        }}
      >
        <div style={{ width: 288, flex: 'none' }}>{SearchInput}</div>
        <SelectPill
          label="Reward type"
          value={rewardType}
          options={REWARD_OPTIONS}
          onChange={onRewardTypeChange}
        />
        <SelectPill
          label="Sort"
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={onSortByChange}
        />
        <div style={{ flex: 1 }} />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center cursor-pointer text-text-secondary"
            style={{
              gap: 4,
              padding: '6px 10px',
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
            }}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* Mobile bar */}
      <div
        className="sticky z-20 sm:hidden flex flex-col"
        style={{
          top: 56,
          gap: 8,
          padding: '10px 0',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--slate-200)',
          borderBottom: '1px solid var(--slate-200)',
        }}
      >
        {SearchInput}
        <div className="flex" style={{ gap: 8 }}>
          <button
            type="button"
            onClick={() => setSheetMode('reward')}
            className="cursor-pointer bg-surface text-text-primary inline-flex items-center justify-center"
            style={{
              flex: 1,
              gap: 8,
              padding: '10px 12px',
              border: '1px solid var(--slate-200)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              height: 44,
            }}
          >
            <SlidersHorizontal size={14} strokeWidth={2} aria-hidden="true" />
            Filters
            <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSheetMode('sort')}
            className="cursor-pointer bg-surface text-text-primary inline-flex items-center justify-center"
            style={{
              flex: 1,
              gap: 8,
              padding: '10px 12px',
              border: '1px solid var(--slate-200)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              height: 44,
            }}
          >
            <ArrowUpDown size={14} strokeWidth={2} aria-hidden="true" />
            Sort
            <ChevronDown size={12} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="self-end inline-flex items-center cursor-pointer text-text-secondary"
            style={{
              gap: 4,
              padding: '4px 8px',
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
            }}
          >
            <X size={12} strokeWidth={2} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* Bottom sheet — single mount, dispatched by mode */}
      {sheetMode === 'reward' && (
        <MobileFilterSheet<RewardFilter>
          mode={sheetMode}
          onClose={() => setSheetMode(null)}
          options={REWARD_OPTIONS}
          value={rewardType}
          onSelect={onRewardTypeChange}
        />
      )}
      {sheetMode === 'sort' && (
        <MobileFilterSheet<SortKey>
          mode={sheetMode}
          onClose={() => setSheetMode(null)}
          options={SORT_OPTIONS}
          value={sortBy}
          onSelect={onSortByChange}
        />
      )}
    </>
  );
}
