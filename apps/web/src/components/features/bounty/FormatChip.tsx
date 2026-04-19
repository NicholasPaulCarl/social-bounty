'use client';

import type { LucideIcon } from 'lucide-react';

interface FormatChipProps {
  Icon: LucideIcon;
  label: string;
}

/**
 * FormatChip — tiny pill: icon + short label.
 *
 * Per the Claude Design handoff (`bounty-card.jsx:46-61`):
 *   bg-elevated · text-secondary · 11px · 22px tall · radius-full
 * Used on the BountyCard fourth row to show "IG Reel", "TT Video"
 * etc., one chip per channel/format pair on the bounty.
 */
export function FormatChip({ Icon, label }: FormatChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-elevated text-text-secondary"
      style={{
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
        height: 22,
      }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}
