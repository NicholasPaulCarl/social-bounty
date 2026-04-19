'use client';

import { LayoutGrid, List } from 'lucide-react';
import type { ViewMode } from '@/hooks/useBrowseFilters';
import { formatRewardZAR } from '@/lib/utils/bounty-format';

/**
 * BrowseHero — the title + meta strip + view toggle on `/bounties`.
 *
 * Per the Claude Design handoff (`page-chrome.jsx:48-128`). The word
 * "Browse" gets the `.gradient-text` treatment (one gradient per view —
 * Hard Rule). Meta strip drops clauses silently when their numbers are
 * null / zero so the UI never lies about a "0 new today".
 *
 * View toggle (Grid/List) is desktop-only; on mobile the toggle is hidden
 * because the list view collapses to single-column cards anyway.
 */
interface BrowseHeroProps {
  live: number;
  newToday?: number; // forward-compat — drops the clause if undefined
  earnings?: number; // forward-compat — drops the clause if undefined or 0
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function BrowseHero({ live, newToday, earnings, viewMode, onViewChange }: BrowseHeroProps) {
  const showNewToday = typeof newToday === 'number' && newToday > 0;
  const showEarnings = typeof earnings === 'number' && earnings > 0;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-3 sm:pb-5">
      <div className="min-w-0 flex-1">
        <h1
          className="font-heading text-text-primary"
          style={{
            fontWeight: 700,
            fontSize: 'clamp(26px, 4vw, 36px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          <span className="gradient-text">Browse</span> bounties
        </h1>
        <div
          className="mt-1.5 flex flex-wrap items-center text-text-secondary"
          style={{ gap: 8, fontSize: 13 }}
        >
          <span>
            <span
              className="font-mono tabular-nums text-text-primary"
              style={{ fontWeight: 600 }}
            >
              {live}
            </span>{' '}
            live
          </span>
          {showNewToday && (
            <>
              <span className="text-text-muted">·</span>
              <span
                className="text-pink-600 uppercase"
                style={{ fontWeight: 700, letterSpacing: '0.06em', fontSize: 12 }}
              >
                <span className="font-mono tabular-nums">{newToday}</span> new today
              </span>
            </>
          )}
          {showEarnings && (
            <>
              <span className="text-text-muted hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                earnings up{' '}
                <span
                  className="font-mono tabular-nums text-text-primary"
                  style={{ fontWeight: 600 }}
                >
                  {formatRewardZAR(earnings, 'ZAR')}
                </span>{' '}
                this week
              </span>
            </>
          )}
        </div>
      </div>

      {/* Desktop view toggle */}
      <div
        className="hidden sm:inline-flex"
        role="group"
        aria-label="View mode"
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: 10,
          padding: 3,
        }}
      >
        {(['grid', 'list'] as const).map((m) => {
          const active = viewMode === m;
          const Icon = m === 'grid' ? LayoutGrid : List;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onViewChange(m)}
              aria-pressed={active}
              className="cursor-pointer transition-all"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: active ? 'var(--bg-surface)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: active ? 'var(--shadow-level-1)' : 'none',
              }}
            >
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
              {m === 'grid' ? 'Grid' : 'List'}
            </button>
          );
        })}
      </div>
    </header>
  );
}
