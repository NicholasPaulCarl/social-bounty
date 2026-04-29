'use client';

import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

/**
 * ManageHero — title + meta strip + Create CTA on `/business/bounties`.
 *
 *  - Title gradient word is "Manage" (one gradient per view — Hard Rule).
 *  - Meta strip carries optional per-status counts (`live` / `draft` /
 *    `paused` / `closed`); each clause drops silently when its count is
 *    null / 0 so the UI never lies about a "0".
 *  - The CTA on the right is "Create bounty".
 */

export interface ManageStatusCounts {
  live?: number;
  draft?: number;
  paused?: number;
  closed?: number;
}

interface ManageHeroProps {
  /**
   * Per-status totals, populated from independent count queries. Each
   * clause renders only when its number is positive, so partial data
   * (e.g. only `live` populated) renders cleanly. Pass an empty object to
   * fall through to `extraMeta` alone.
   */
  statusCounts?: ManageStatusCounts;
  /** Optional trailing nodes appended to the meta strip (e.g. summary blurb). */
  extraMeta?: ReactNode;
  onCreate: () => void;
}

export function ManageHero({
  statusCounts,
  extraMeta,
  onCreate,
}: ManageHeroProps) {
  const c = statusCounts ?? {};
  const clauses: Array<{ key: string; label: string; count: number; hideOnMobile?: boolean }> = [];
  if (typeof c.live === 'number' && c.live > 0)
    clauses.push({ key: 'live', label: 'live', count: c.live });
  if (typeof c.draft === 'number' && c.draft > 0)
    clauses.push({ key: 'draft', label: 'draft', count: c.draft });
  if (typeof c.paused === 'number' && c.paused > 0)
    clauses.push({ key: 'paused', label: 'paused', count: c.paused });
  if (typeof c.closed === 'number' && c.closed > 0)
    clauses.push({ key: 'closed', label: 'closed', count: c.closed, hideOnMobile: true });

  const showEmpty = clauses.length === 0 && !extraMeta;

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
          <span className="gradient-text">Manage</span> bounties
        </h1>
        <div
          className="mt-1.5 flex flex-wrap items-center text-text-secondary"
          style={{ gap: 8, fontSize: 13 }}
        >
          {clauses.map((clause, idx) => (
            <span
              key={clause.key}
              className={`inline-flex items-center ${clause.hideOnMobile ? 'hidden sm:inline-flex' : ''}`}
              style={{ gap: 8 }}
            >
              {idx > 0 && <span className="text-text-muted">·</span>}
              <span>
                <span
                  className="font-mono tabular-nums text-text-primary"
                  style={{ fontWeight: 600 }}
                >
                  {clause.count}
                </span>{' '}
                {clause.label}
              </span>
            </span>
          ))}
          {extraMeta && (
            <>
              {clauses.length > 0 && <span className="text-text-muted">·</span>}
              {extraMeta}
            </>
          )}
          {showEmpty && (
            <span className="text-text-muted">No bounties yet</span>
          )}
        </div>
      </div>

      {/* Right-hand cluster: Create CTA */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCreate}
          className="cursor-pointer transition-all inline-flex items-center"
          style={{
            background: 'var(--pink-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            gap: 6,
            boxShadow: 'var(--shadow-level-1)',
          }}
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
          Create bounty
        </button>
      </div>
    </header>
  );
}
