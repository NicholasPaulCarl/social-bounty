# SKILL — Social Bounty design system

A creator-economy product. Pays creators per verified click on brand "bounties." Two-sided web app + marketing site. Gen-Z/millennial audience. Voice: **receipts-first, friendly, short**.

## Wiring

```html
<link rel="stylesheet" href="colors_and_type.css" />
<link rel="stylesheet" href="components.css" />
<link rel="stylesheet" href="patterns.css" />
<link rel="stylesheet" href="dark.css" />
<!-- fonts: Inter, Space Grotesk, JetBrains Mono (imported from colors_and_type.css) -->
```

## Non-negotiables

- **Pink-600 is the brand.** `--pink-600` on primary buttons, links, active states, focus, `.eyebrow`. Hover = `pink-700`. Tints = `pink-100`.
- **Blue-600 only lives inside the gradient** (`linear-gradient(90deg, pink-600, blue-600)`) and `.info` status. Don't pull it out as a free accent.
- **Slate does 80% of UI.** Text, borders, surfaces.
- **Gold = rewards only.** Earnings, points. Never interactive.
- **Gradient is used ONCE per view**, on one heading phrase (`.gradient-text`) or progress bar or marketing CTA pill. Never on body copy, never on buttons (except `.btn-cta`).

## Type cheat sheet

- Headings — Space Grotesk 700, `-0.02em`.
- Body — Inter 400/500/600.
- Numbers/IDs — JetBrains Mono, `tabular-nums`.
- `.eyebrow` = pink-600, uppercase, `+0.08em` tracking. Use it liberally.
- Scale via tokens: `--fs-xs` (12) → `--fs-7xl` (72). H1 auto-scales at breakpoints.
- Metrics use `.metric` (mono, 48px, tabular).

## Components (on `components.css`)

- `.btn` + `.btn-primary | -secondary | -ghost | -danger | -success | -cta`, sizes `-sm -md -lg -xl`.
  - Primary = pink pill-ish (8px radius). CTA = full-pill gradient, marketing only.
- `.card` (default 16px radius, 24px padding) · `.card-interactive` (hover lift) · `.card-feature` (24px radius, 32px padding).
  - **Bounty cards** — 6 canonical states: Live · Ending-soon · Claimed/in-progress · Paid-out · Rejected · Invite-only. Status badge top-right, avatar top-left, reward pill bottom-left, meta bottom-right.
  - **Hunter cards** — 3 canonical variants: Top hunter (Pro, 3-metric strip) · New hunter (Invite CTA) · Leaderboard (pink-tinted, rank medallion + big earned number).
- `.input` / `.textarea` / `.select` — pink focus ring (`--focus-ring-form`), `.input-error` for invalid. Search inputs wrap in `.input-group` with a 14px `.input-icon` prefix.
- `.badge` (read-only) vs `.chip` (interactive). Statuses: `-brand -success -warning -danger -info -neutral -reward`.
- `.avatar` with `-sm -lg -xl`. `.avatar-group` overlaps with white ring.
- `.toast` + status modifiers; 4px left accent, level-3 shadow.
- `.progress` — pink→blue gradient bar.
- `.table` — slim borders, uppercase label headers, tabular-num cells. Three canonical table views:
  - **Bounties** (participant) — avatar · title+sub · category · status · reward · ends · action
  - **Hunters** (brand directory) — rank · hunter · interests · tier · bounties · clicks · approval · earned · invite
  - **Submissions** (brand review queue) — checkbox · time · hunter · bounty · verification · status · reward · approve/reject

## Patterns (on `patterns.css`)

- `.empty` — empty-state placeholder with `.empty-illus`, `.empty-title`, `.empty-body`.
- `.skeleton` — shimmer placeholders (`.skeleton-line`, `.skeleton-circle`, `.skeleton-rect`).
- `.spinner` — loading spinner with `-sm -lg` sizes, `.spinner-on-pink` for brand bg.
- `.modal` / `.drawer` — dialog/drawer with `.modal-head`, `.modal-body`, `.modal-foot`.
- `.tooltip` / `.popover` — dark tooltips, light popovers with `.popover-help-trigger`.
- `.kpi` — stat tiles with `.kpi-label`, `.kpi-value`, `.kpi-delta-up/down`, `.kpi-feature` gradient variant.
- `.feed` — activity timeline with `.feed-dot`, `.feed-body`, `.feed-time`.
- `.receipt` — payout receipt layout.
- `.stepper` — wizard progress with `.stepper-step.is-current`, `.is-done`.
- `.verif` — verification badges (`.verif-verified`, `.verif-scraping`, `.verif-pending`, `.verif-removed`).
- `.bottom-nav` — mobile bottom navigation bar.
- `.bar-chart` / `.funnel` — minimal chart scaffolds.

## Dark mode (on `dark.css`)

Opt in with `data-theme="dark"` on `<html>` or `<body>`. Flips slate scale, surfaces, text, shadows. Pink-600 stays the brand anchor.

## Spacing/radii/shadows

- 4px grid: `--space-1…24`. Card padding = `--space-6` (24). Between sections = `--space-12` to `--space-16`.
- Radii: buttons `md (8)`, cards `xl (16)`, feature cards `3xl (24)`, pills `full`.
- Elevations: `--shadow-level-1..4`. Colored glows `--shadow-brand-intense` / `--shadow-blue` for primary CTA only.

## Motion

- `--duration-normal 250ms` + `--ease-standard` for 90% of transitions.
- `--ease-spring` for playful (reward confirm, successful link).
- All of this respects `prefers-reduced-motion`.

## Iconography

Lucide only, 20–24px, `stroke-width: 2`, `stroke: currentColor`. Draw placeholders at that same visual weight.

## Shell Navigation

- Build from `getNavSections(role)` — never hand-roll. `NavSection[]` → `NavItem[]` → optional children.
- Active item = `pink-50` bg + `pink-700` text + 3px `pink-600` left rail (expanded); filled `pink-50` pad only (collapsed).
- Count pips: `urgent: true` → `danger-600` red; truthy count → `pink-100`/`pink-700`; `0`/undefined → render nothing. Mono, `tabular-nums`, 20×20.
- Collapsed rail = counts become 8px dots (pink / red) with a 2px `bg-surface` halo.
- Workspace disc: `USER` = round disc w/ soft pink-hue gradient. `BUSINESS_ADMIN` = square 8px-radius tile w/ brand-hue solid fill. Shape is the role cue.
- Section labels: uppercase, 10px, `tracking-[0.10em]`, `text-muted`. Collapsed = 1px `slate-200` hairline divider instead.
- Rail is 256px expanded / 72px collapsed — collapse is desktop only.
- Mobile: no rail. 300px drawer slides from left over `slate-900 @ 55%` scrim.
- Logo mark = 26px square, 8px radius, `pink-600 → blue-600` gradient, white "S". Wordmark: "social<span class="pink-600">bounty</span>" — the only place the gradient lives in the chrome.

## Copy & voice

- Lead with the number. "You earned $62 today" beats "Your earnings are growing!"
- Sentence-case everywhere. No product emoji.
- Button labels ≤ 3 words. Headings ≤ 10.
- Errors name the failure + the fix. No "Oops!"

## Don't

- Don't introduce new colors — extend the slate/pink ramps if you must.
- Don't use the gradient more than once per view.
- Don't put blue anywhere except in the gradient or `.info`.
- Don't mix two non-full radii in the same component.
- Don't use emoji in product UI (marketing copy is a case-by-case).
- Don't shrink text below 12px or touch targets below 40px.

## Reference files

- `previews/type.html` — full type scale
- `previews/colors.html` — every ramp + in-context demos
- `previews/spacing.html` — spacing scale, radii, shadows
- `previews/components.html` — every component state
- `previews/brand.html` — logo lockups, voice do/don't, imagery direction
- `previews/shell-navigation.html` — sidebar, collapsed rail, workspace switcher, mobile drawer
