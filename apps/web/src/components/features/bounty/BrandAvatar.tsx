'use client';

import { hashHue } from '@/lib/utils/bounty-format';

interface BrandAvatarProps {
  /** Brand display name — first letter is used as monogram fallback. */
  name: string;
  /** Stable seed for the hue (use brand.id when available, brand.name otherwise). */
  seed?: string;
  /** Pre-computed HSL hue 0..359; overrides `seed` when supplied. */
  hue?: number;
  /** Logo URL — currently unused; design renders monogram for deterministic colour, no broken-image risk. */
  logoUrl?: string | null;
  /** Pixel size of the disc. 24 default; 22 for list rows; 32 for hero. */
  size?: number;
}

/**
 * BrandAvatar — tinted disc + first-letter monogram.
 *
 * Per the Claude Design handoff (`bounty-card.jsx:29-44`) the brand row
 * leads with a hue-tinted disc carrying the first letter of the brand
 * name. Hue is derived deterministically when not provided so a brand
 * keeps the same colour across sessions / pages.
 */
export function BrandAvatar({ name, seed, hue, size = 24 }: BrandAvatarProps) {
  const h = hue ?? hashHue(seed ?? name ?? '');
  const bg = `hsl(${h} 80% 92%)`;
  const fg = `hsl(${h} 70% 35%)`;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: size <= 24 ? 11 : 13,
        letterSpacing: '-0.02em',
        flex: 'none',
        userSelect: 'none',
      }}
    >
      {(name?.charAt(0) ?? '?').toUpperCase()}
    </span>
  );
}
