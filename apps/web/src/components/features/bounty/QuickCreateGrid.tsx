'use client';

import Link from 'next/link';
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
 */
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
        {BOUNTY_PRESETS.map(({ id, label, description, Icon }) => {
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
                <div className="min-w-0">
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
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
