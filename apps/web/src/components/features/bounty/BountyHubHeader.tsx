'use client';

import { Plus } from 'lucide-react';

/**
 * BountyHubHeader — simple page-head for `/business/bounties`.
 *
 * Replaces `<ManageHero>` for Wave 2 hub layout polish. The status counts
 * formerly shown in ManageHero are dropped here — they're redundant now
 * that the segmented status filter is visible directly below.
 *
 * Design reference: hub.jsx:155-166 (H1 + subtitle + "+ New bounty" CTA).
 */

interface BountyHubHeaderProps {
  /** Called when the user clicks the "+ New bounty" primary CTA. */
  onCreate: () => void;
}

export function BountyHubHeader({ onCreate }: BountyHubHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-3 sm:pb-5">
      <div className="min-w-0 flex-1">
        <h1
          className="font-heading text-text-primary"
          style={{
            fontWeight: 700,
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Bounties
        </h1>
        <p
          className="mt-1 text-text-secondary"
          style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}
        >
          Launch bounties, track submissions, and pay creators when they deliver.
        </p>
      </div>

      <div className="flex items-center" style={{ paddingTop: 2 }}>
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
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
          New bounty
        </button>
      </div>
    </header>
  );
}
