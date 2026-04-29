'use client';

import Link from 'next/link';
import { Camera, ThumbsUp, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SocialChannel } from '@social-bounty/shared';
import { BOUNTY_PRESETS } from '@/components/bounty-form/bounty-presets';

/**
 * QuickCreateGrid — four-card preset launcher rendered above the
 * existing bounty list controls on `/business/bounties`.
 *
 * Compact action cards (not a marketing hero): each links to
 * `/business/bounties/new?preset=<id>` so the create page can read
 * the query param and seed the form. Blank uses the bare path
 * (`/business/bounties/new`) — no preset query, the form's normal
 * `INITIAL_FORM_STATE` survives.
 *
 * Card radius matches the local default established by the page
 * (`rounded-xl`, 16px). Layout: 2-up on mobile, 4-up from sm-up,
 * keeping each card a focusable button surface (the `<Link>`
 * carries the focus ring).
 *
 * Platform chips use the Lucide semantic stand-ins established by the
 * `ui-ds-apply` DS pass (no brand trademark icons in Lucide):
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
      <h2
        className="mb-2 sm:mb-2.5 text-[10px] font-bold uppercase tracking-[0.10em] text-text-muted"
      >
        Quick create
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {BOUNTY_PRESETS.map(({ id, label, description, Icon, platforms }) => {
          const href =
            id === 'blank'
              ? '/business/bounties/new'
              : `/business/bounties/new?preset=${id}`;
          return (
            <Link
              key={id}
              href={href}
              className="group block rounded-xl border border-slate-200 bg-surface px-3 py-3 sm:px-4 sm:py-3.5 text-left transition-all hover:border-pink-600/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
              aria-label={`Create bounty: ${label}`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pink-600/10 text-pink-600 transition-colors group-hover:bg-pink-600/15"
                  style={{ width: 32, height: 32 }}
                  aria-hidden="true"
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="block font-semibold text-text-primary"
                    style={{ fontSize: 13, lineHeight: 1.25 }}
                  >
                    {label}
                  </span>
                  <span
                    className="mt-0.5 block text-text-muted"
                    style={{ fontSize: 11, lineHeight: 1.35 }}
                  >
                    {description}
                  </span>
                  {platforms && platforms.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Platforms">
                      {platforms.map((channel) => {
                        const entry = PLATFORM_ICON_MAP[channel];
                        if (!entry) return null;
                        const { Icon: PlatformIcon, label: platformLabel } = entry;
                        return (
                          <span
                            key={channel}
                            aria-label={platformLabel}
                            className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-600"
                            style={{ width: 20, height: 20 }}
                          >
                            <PlatformIcon size={11} strokeWidth={2} aria-hidden="true" />
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
