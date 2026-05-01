'use client';

import Link from 'next/link';
import { Camera, Plus, ThumbsUp, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SocialChannel } from '@social-bounty/shared';
import { BOUNTY_PRESETS } from '@/components/bounty-form/bounty-presets';

/**
 * QuickCreateGrid — four-card preset launcher rendered above the
 * existing bounty list controls on `/business/bounties`.
 *
 * Redesigned per the Claude Design handoff (2026-04-30):
 * - Vertical layout: title → subtitle (flex-1) → platform chips at bottom.
 * - Blank card gets dashed-border special treatment with a Plus circle.
 * - Eyebrow reads "Quick start" in pink-600.
 * - Template cards show NO icon at the top — only title/subtitle/chips.
 * - Platform chips: 26×26 circle, slate-100 bg, slate-700 color, icon 14px.
 *
 * Each card remains a `<Link>` (Next.js) pointing to:
 *   blank  → /business/bounties/new
 *   others → /business/bounties/new?preset=<id>
 *
 * Platform icon stand-ins (no brand trademark icons in Lucide):
 *   Instagram → Camera
 *   Facebook  → ThumbsUp
 *   TikTok    → Video
 */

/** Maps each SocialChannel to its Lucide semantic stand-in + human label. */
const PLATFORM_ICON_MAP: Record<SocialChannel, { Icon: LucideIcon; label: string }> = {
  [SocialChannel.INSTAGRAM]: { Icon: Camera, label: 'Instagram' },
  [SocialChannel.FACEBOOK]: { Icon: ThumbsUp, label: 'Facebook' },
  [SocialChannel.TIKTOK]: { Icon: Video, label: 'TikTok' },
};

export function QuickCreateGrid() {
  return (
    <section
      aria-label="Quick create bounty"
      className="mb-4 sm:mb-5"
    >
      {/* Eyebrow — "Quick start" in pink-600, matching hub.jsx:167 + DS Eyebrow pattern */}
      <h2
        className="mb-2 sm:mb-2.5 text-[10px] font-bold uppercase tracking-wide text-pink-600"
      >
        Quick start
      </h2>

      {/* Grid: 2-up mobile, 4-up desktop. Gap bumped to match design (16px desktop, 12px mobile). */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {BOUNTY_PRESETS.map(({ id, label, description, platforms }) => {
          const href =
            id === 'blank'
              ? '/business/bounties/new'
              : `/business/bounties/new?preset=${id}`;

          const isBlank = id === 'blank';

          if (isBlank) {
            return (
              <Link
                key={id}
                href={href}
                aria-label={`Create bounty: ${label}`}
                className="qcg-blank-card group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
                style={{
                  minHeight: 168,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  borderRadius: 'var(--radius-xl)',
                  border: '1px dashed var(--slate-300)',
                  background: 'var(--slate-50)',
                  transition:
                    'border-color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard)',
                }}
              >
                {/* Dashed circle with Plus icon */}
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center text-slate-400 group-hover:border-pink-600 group-hover:text-pink-600"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface)',
                    border: '1.5px dashed var(--slate-300)',
                    flexShrink: 0,
                    transition:
                      'border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)',
                  }}
                >
                  <Plus size={20} strokeWidth={1.5} />
                </span>

                {/* Title — margin-top 4px per design's .qc-card-blank .qc-title rule */}
                <span
                  className="block text-slate-900 group-hover:text-pink-700"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    marginTop: 4,
                    transition: 'color var(--duration-fast) var(--ease-standard)',
                  }}
                >
                  Start from blank
                </span>

                {/* Subtitle */}
                <span
                  className="block text-slate-500 group-hover:text-pink-700"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.45,
                    flex: 1,
                    transition: 'color var(--duration-fast) var(--ease-standard)',
                  }}
                >
                  {description}
                </span>
              </Link>
            );
          }

          // Non-blank template card: vertical — title → subtitle (flex-1) → platform chips
          return (
            <Link
              key={id}
              href={href}
              aria-label={`Create bounty: ${label}`}
              className="qcg-template-card group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
              style={{
                minHeight: 168,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--slate-200)',
                background: 'var(--bg-surface)',
                transition:
                  'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)',
              }}
            >
              {/* Title */}
              <span
                className="block text-slate-900 group-hover:text-slate-900"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {label}
              </span>

              {/* Subtitle — flex:1 pushes platform chips to the bottom */}
              <span
                className="block text-slate-500"
                style={{
                  fontSize: 13,
                  lineHeight: 1.45,
                  flex: 1,
                }}
              >
                {description}
              </span>

              {/* Platform chips at the bottom */}
              {platforms && platforms.length > 0 && (
                <div
                  className="flex items-center"
                  style={{ gap: 8 }}
                  aria-label="Platforms"
                >
                  {platforms.map((channel) => {
                    const entry = PLATFORM_ICON_MAP[channel];
                    if (!entry) return null;
                    const { Icon: PlatformIcon, label: platformLabel } = entry;
                    return (
                      <span
                        key={channel}
                        aria-label={platformLabel}
                        className="inline-flex items-center justify-center"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--slate-100)',
                          color: 'var(--slate-700)',
                          flexShrink: 0,
                        }}
                      >
                        <PlatformIcon size={14} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                    );
                  })}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/*
        Hover state overrides via a global <style> block.
        Tailwind group-hover classes cannot target inline-style-set properties
        like border-color, box-shadow, and transform on the card element itself
        (Tailwind classes set the same property, but inline styles win in specificity).
        Using a scoped CSS block here keeps the component self-contained without
        requiring a new Tailwind utility or global stylesheet addition.
      */}
      <style>{`
        .qcg-template-card:hover {
          border-color: var(--pink-300) !important;
          box-shadow: var(--shadow-level-2) !important;
          transform: translateY(-1px) !important;
        }
        .qcg-blank-card:hover {
          border-color: var(--pink-600) !important;
          background: var(--pink-50) !important;
        }
      `}</style>
    </section>
  );
}
