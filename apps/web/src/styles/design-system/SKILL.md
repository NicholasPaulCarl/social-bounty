# SKILL — Social Bounty design system

A creator-economy product. Pays creators per verified click on brand "bounties." Two-sided web app + marketing site. Gen-Z/millennial audience. Voice: **receipts-first, friendly, short**.

## Wiring

```html
<link rel="stylesheet" href="colors_and_type.css" />
<link rel="stylesheet" href="components.css" />
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
- `.input` / `.textarea` / `.select` — pink focus ring (`--focus-ring-form`), `.input-error` for invalid.
- `.badge` (read-only) vs `.chip` (interactive). Statuses: `-brand -success -warning -danger -info -neutral -reward`.
- `.avatar` with `-sm -lg -xl`. `.avatar-group` overlaps with white ring.
- `.toast` + status modifiers; 4px left accent, level-3 shadow.
- `.progress` — pink→blue gradient bar.
- `.table` — slim borders, uppercase label headers, tabular-num cells.

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
