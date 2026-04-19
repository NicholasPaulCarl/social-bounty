# Social Bounty — Design System

The system for a creator-economy product that pays creators per verified click/conversion on a bounty. Built for a two-sided web app (brand dashboard + creator app) with a marketing site on top.

**Audience:** Gen-Z and millennial creators (primary), brand marketers (secondary).
**Platforms:** Responsive web, with mobile-first for the creator side.
**Mood:** Confident, cash-receipts-first, a little cheeky. Not corporate, not cutesy.

---

## FILES

| File | What's in it |
|---|---|
| `colors_and_type.css` | All design tokens (colors, type, radii, shadows, motion) + base typography styles |
| `components.css` | Buttons, cards, inputs, badges, chips, avatars, tables, toasts, progress, shell-nav primitives |
| `assets/logo-wordmark.png` | The primary wordmark |
| `previews/` | One HTML preview per foundation group (type / colors / spacing / components / brand / shell-navigation) |
| `SKILL.md` | The short reference I load when I'm building with this system |

Always `<link>` `colors_and_type.css` **before** `components.css`.

---

## VISUAL FOUNDATIONS

### The one-sentence identity
**Pink leads, blue counters, slate carries everything else** — and the only place those two colors meet is a single left-to-right gradient used once per view.

### Color
- **`--pink-600` (#db2777)** is the brand. Primary buttons, links, active states, focus rings, eyebrows. `--pink-700` is its hover. `--pink-100` is the badge/tint.
- **`--blue-600` (#2563eb)** exists *only* as the second stop of the signature gradient and the `.info` status color. Never use it as a standalone accent.
- **`--slate-*`** does 80% of the UI — text, borders, surfaces, dividers.
- **Status:** green (success), amber (warning), rose (danger), blue (info). Use the `--*-600` step for text/icons, the `*-100` tint for backgrounds.
- **Gold (`--reward-500`)** is reserved for earnings, points, streaks. Never on interactive affordances.
- **The signature gradient** `linear-gradient(90deg, pink-600, blue-600)` appears ONCE per view at most — on a single heading phrase (`.gradient-text`), a progress bar, or the marketing CTA pill.

### Type
Three families, each with a specific job:
- **Space Grotesk** (headings) — 400/500/600/700, `-0.02em` tracking at large sizes.
- **Inter** (body, labels) — 400/500/600. The default. Dense and neutral.
- **JetBrains Mono** (metrics, codes, IDs) — 400/500, always with `font-variant-numeric: tabular-nums` for numbers.

Scale is modular: `--fs-xs` (12) → `--fs-7xl` (72). H1 scales up at each breakpoint (36 → 48 → 72). Never size by hand — use the token.

The `.eyebrow` is always pink-600, uppercase, `+0.08em` tracking. It's the brand's favorite typographic move.

### Spacing, radii, shadows
- **4-point grid.** All spacing is a multiple of 4px via `--space-*`. Within a card: 1–4. Between cards: 4–6. Between sections: 8–16.
- **Radii:** `sm/md/lg/xl/2xl/3xl/full`. Buttons = `md`, cards = `xl`, feature cards = `3xl`, CTAs/badges/chips = `full`. Pills are a brand signal.
- **4 elevation levels** (1 resting → 4 modal) + **2 colored glows** (brand pink, blue) reserved for the hero CTA and primary button only. Never invent a custom shadow.

### Motion
- **Standard durations:** `fast 150ms`, `normal 250ms`, `slow 400ms`, `dramatic 600ms`.
- **Standard easing:** `--ease-standard` for 90% of things. `--ease-spring` for playful (confirm toasts, reward bursts). `--ease-decelerate` for entrances.
- **`prefers-reduced-motion`** is honored globally — don't add motion that conflicts.

---

## ICONOGRAPHY

**We don't ship a custom icon set.** Use **Lucide** (`lucide.dev`) at 20px or 24px, `stroke-width: 2`, `stroke: currentColor` so icons pick up the surrounding text color. Never colorize an icon outside of currentColor.

When drawing inline SVG placeholders, match Lucide's visual weight: 24×24 viewBox, 2px strokes, rounded caps and joins.

**The logo** (`assets/logo-wordmark.png`) is the only brand mark. Four approved treatments, documented in `previews/brand.html`:
1. Primary — full-color wordmark on white
2. Reversed — white on `--pink-600`
3. Gradient bg — white on pink→blue gradient (hero moments only)
4. Dark — white on `--slate-900`

Minimum height 20px digital / 6mm print. Clear-space = the height of the "S." No drop shadows, no stretching, no recoloring.

---

## SHELL NAVIGATION

See `previews/shell-navigation.html` for the canonical visual spec.

**IA.** Nav is `NavSection[]` → `NavItem[]` → optional `NavItem[]` children. One `getNavSections(role)` call per role returns the tree; don't hand-roll lists.

**Active-state contract.** The whole nav hangs on one rule: on the expanded rail, the active item is `pink-50` background + `pink-700` text + a 3px `pink-600` left rail (sits -8px outside the item, 8px top/bottom inset). On the collapsed rail, the pad itself is `pink-50` — no 3px rail, the fill is the signal. Nothing else turns pink.

**Count pips.** The decision tree:
- `urgent: true` and a positive count → red pip (`danger-600` bg / white fg, pill) or red dot (`danger-500`, 8px) when collapsed.
- Truthy `badge` / `count` → pink pip (`pink-100` bg / `pink-700` fg) or pink dot (`pink-600`, 8px) when collapsed.
- `0` or undefined → render nothing.

Pips are mono, `tabular-nums`, min-width 20px, height 20px. Dots carry a 2px `bg-surface` halo so they read against any icon.

**Workspace disc convention.** Role is the cue. `USER` = round disc with a soft pink-hue gradient. `BUSINESS_ADMIN` = square tile (8px radius) with the brand's solid hue fill + white initial. Don't cross-use — the shape is how you tell role at a glance.

**Section labels.** Uppercase, `text-[10px]`, `font-bold`, `tracking-[0.10em]`, `text-muted`, padded `14px 20px 6px`. When the rail collapses, every label becomes a 1px `slate-200` hairline divider at the same vertical spacing.

**Mobile.** Below `md`, the rail disappears. A hamburger opens a 300px drawer sliding in from the left over a `slate-900 @ 55%` scrim. No collapsed state exists on mobile — the drawer is either full-width or hidden.

**Responsiveness.** The collapsed 72px rail is desktop only. The mobile header (`md:hidden`) handles hamburger + notifications bell.

---

## VOICE

Three pillars, full detail in `previews/brand.html`:

1. **Receipts-first.** Lead with the number. Dollars, clicks, hours. If we can't show a number, we probably shouldn't say it.
2. **Friendly, not fake.** Contractions, second person, sentence-case. No product emoji. No "woohoo." We're in on the joke, not the butt of it.
3. **Short &gt; clever.** If a button label is over three words, cut one. If a heading is over ten, rewrite.

Sample: **"You posted. It landed. Here's your $62."** — *not* "Unlock the power of authentic creator partnerships."

---

## WHEN YOU'RE DESIGNING WITH THIS

1. Include both stylesheets and the fonts.
2. Reach for tokens (`var(--pink-600)`, `var(--fs-lg)`) — never hex or px values you made up.
3. Use the `.btn` / `.card` / `.input` / `.badge` classes as written; add modifiers rather than forking styles.
4. Use the gradient once per view, always on a single phrase at heading weight.
5. If something feels like it needs a new color or a custom shadow — it probably doesn't. Look again.

---

## IMPLEMENTATION STATUS (2026-04-19)

### Done ✅
- Token layer (`colors_and_type.css`, `components.css`) imported globally — tokens available everywhere.
- Tailwind config re-exports canonical scales (`pink-*`, `blue-*`, `slate-*`, `reward-*`).
- Legacy accent-* aliases codemoded to canonical names (90 files, commit `2431945`).
- **All pages migrated** (branch `ui-ds-apply`, merged to main 2026-04-18): PrimeIcons replaced with Lucide across all three surfaces (marketing/auth, participant, business + admin). `grep -r "pi pi-" apps/web/src --include="*.tsx" | wc -l` → 0. Standalone blue removed from non-info surfaces. Off-spec Tailwind primitives eliminated. Metrics in mono. Eyebrow on stat sections. Card radii normalised. One gradient per view.
- **`EmptyState.tsx` icon API** (commit `7dce09d`, 2026-04-19) — migrated from `icon?:string` (PrimeIcons suffix) to `Icon?:LucideIcon` / `CtaIcon?:LucideIcon`. Updated 27 call-sites. `grep -r "pi pi-" apps/web/src --include="*.tsx" | wc -l` → 0 globally.
- **Shell Navigation applied** (2026-04-19) — `apps/web/src/components/layout/AppSidebar.tsx` + `AppHeader.tsx` + `BrandSelector.tsx` migrated to the new Shell Navigation handoff (conventional tone). Adds: grouped nav sections, 3px pink-600 active rail, pink-100 count pips (danger-600 when `urgent: true`), desktop 72px collapsed rail with dot badges, gradient `S` logo mark, ⌘K search hint, workspace switcher popover with verified `BadgeCheck`. Preview at `previews/shell-navigation.html`.

### Deferred
- **Dark-mode token layer** — `prefers-color-scheme: dark` overrides for `--slate-*` surfaces and `--bg-*` variables. Nice-to-have; not in MVP scope.
- **Custom icon commission** — social brand glyphs (Instagram, Facebook, TikTok) are absent from Lucide 1.8 per trademark policy. Current stand-ins: `Camera` → Instagram, `ThumbsUp` → Facebook, `Music2` → TikTok. Replace when the brand-icon commission lands.
- **Additional component classes** — modals, nav drawers, empty states not yet in `components.css`. Add as patterns stabilise.
