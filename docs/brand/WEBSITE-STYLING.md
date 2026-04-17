# Social Bounty — Public Website Styling

Detailed styling reference for the public-facing marketing site at `http://localhost:3000/` (routes under `apps/web/src/app/(marketing)/`). This document captures what is actually implemented in code — fonts, colors, tokens, component patterns, motion — so marketing material, emails, decks, and partner documents can stay visually aligned with the live site.

Scope: marketing pages only (home, about, how-it-works, pricing, for-brands, for-hunters, terms, privacy). App-shell and admin styling is out of scope here.

---

## 1. Foundation

### 1.1 Light Mode

The public site is light-mode only. There is no dark toggle on marketing routes.

- Page background: `#f8fafc` (slate-50, token `bg-abyss`)
- Card / surface background: `#ffffff` (token `bg-surface`)
- Elevated surface: `#f1f5f9` (slate-100, token `bg-elevated`)
- Hover surface: `#e2e8f0` (slate-200, token `bg-hover`)
- Body text: `#0f172a` (slate-900, token `text-primary`)
- Secondary text: `#475569` (slate-600, token `text-secondary`)
- Muted text: `#94a3b8` (slate-400, token `text-muted`)
- Browser theme color (mobile chrome): `#f8fafc`

### 1.2 Typography Stack

Fonts are loaded via `next/font/google` in `apps/web/src/app/layout.tsx` and exposed as CSS variables:

- **Headings** — Space Grotesk (`--font-heading`) — weights 400, 500, 600, 700
- **Body** — Inter (`--font-body`) — weights 400, 500, 600, 700
- **Monospace / numerics** — JetBrains Mono (`--font-mono`) — weights 400, 500

Tailwind utilities: `font-heading`, `font-body`, `font-mono`.

Body default: `font-body antialiased`, with `-webkit-font-smoothing: antialiased` applied on `body`.

### 1.3 UI Library

- **PrimeReact** with the `lara-light-pink` theme (`primereact/resources/themes/lara-light-pink/theme.css`), icons from `primeicons`.
- **Tailwind CSS** with an extended config (see §3) providing the NeoGlass light-mode token system.
- PrimeReact components are restyled through `globals.css` overrides to match the NeoGlass tokens — notably buttons (gradient pink), inputs (slate-200 borders, pink focus), and focus rings (`0 0 0 2px #ffffff, 0 0 0 4px #db2777`).

---

## 2. Brand Color System

### 2.1 Primary — Pink

The primary brand color is pink. All marketing CTAs, active nav underlines, hero gradient text, and selection highlights use this scale.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#fdf2f8` | Soft wash, hero background |
| `primary-100` | `#fce7f3` | Gradient stops |
| `primary-200` | `#fbcfe8` | Subtle tint |
| `primary-300` | `#f9a8d4` | — |
| `primary-400` | `#f472b6` | Footer hover links |
| `primary-500` | `#ec4899` | Icon/accent |
| `primary-600` | `#db2777` | **Default brand pink**, buttons, logo wordmark, links |
| `primary-700` | `#be185d` | Button hover, gradient end |
| `primary-800` | `#9d174d` | — |
| `primary-900` | `#831843` | — |

CSS var: `--primary-color: #db2777`. PrimeReact `--focus-ring` and `::selection` both derive from `#db2777`.

### 2.2 Secondary — Blue

Blue is the counter-accent used in gradients, secondary CTAs, and the blob mesh behind the hero.

| Token | Hex |
|-------|-----|
| `secondary-500` | `#3b82f6` |
| `secondary-600` | `#2563eb` (default) |
| `secondary-700` | `#1d4ed8` |

### 2.3 Accent Slots

Defined for the design system's accent slots (cyan/violet/amber/emerald/rose/blue). Note: in this light variant `accent-cyan` is remapped to the brand pink so any NeoGlass template referencing "cyan" will render pink.

- `accent-cyan` → `#db2777`
- `accent-violet` → `#2563eb`
- `accent-amber` → `#d97706`
- `accent-emerald` → `#059669`
- `accent-rose` → `#e11d48`
- `accent-blue` → `#2563eb`

### 2.4 Status Colors

| State | 500 | 600 | 700 |
|-------|-----|-----|-----|
| success | `#22c55e` | `#16a34a` | `#15803d` |
| warning | `#f59e0b` | `#d97706` | `#b45309` |
| danger | `#ef4444` | `#dc2626` | `#b91c1c` |
| info | `#3b82f6` | `#2563eb` | `#1d4ed8` |

### 2.5 Neutral Scale

Slate 50–900 (`#f8fafc` … `#0f172a`) is used throughout. The footer sits on `slate-900` with `slate-400` text and `pink-400` hover.

### 2.6 Glass Tokens

| Token | Value |
|-------|-------|
| `glass-bg` | `rgba(255, 255, 255, 0.80)` |
| `glass-border` | `rgba(0, 0, 0, 0.08)` |
| `glass-hover` | `rgba(0, 0, 0, 0.04)` |
| `glass-active` | `rgba(0, 0, 0, 0.06)` |
| `glass-overlay` | `rgba(0, 0, 0, 0.30)` |

Utility classes (provided as a Tailwind plugin): `.glass-card`, `.glass-panel`, `.glass-input`, `.glass-dropdown`. The marketing site uses these sparingly — mostly on feature cards with a white background and a soft elevation shadow.

---

## 3. Tailwind Token Reference

### 3.1 Breakpoints

`sm 640px · md 768px · lg 1024px · xl 1280px · 2xl 1536px`.

### 3.2 Font Sizes

`xs 0.75 · sm 0.875 · base 1 · lg 1.125 · xl 1.25 · 2xl 1.5 · 3xl 1.875 · 4xl 2.25 · 5xl 3 · 6xl 3.75` (rem).

Hero uses `text-4xl sm:text-5xl lg:text-7xl` with `font-heading font-bold tracking-tight`.

### 3.3 Border Radius

`sm 4 · default 8 · lg 12 · xl 16 · 2xl 20 · 3xl 24` (px). Buttons default to 8, cards to 16, primary CTAs are `rounded-full`.

### 3.4 Elevation (Box Shadows)

- `shadow-level-1` — subtle card resting state
- `shadow-level-2` — hover / focused card
- `shadow-level-3` — modal / dropdown
- `shadow-level-4` — overlay
- `shadow-glow-*` — pink/blue glows for emphasis

### 3.5 Backdrop Blur

`xs 4 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 24` (px). The sticky nav uses `backdrop-blur-md` on top of `bg-white/80`.

### 3.6 Motion

**Durations**: fast 150ms · normal 250ms · slow 400ms · dramatic 600ms.

**Easings**:

- standard — `cubic-bezier(0.4, 0, 0.2, 1)`
- decelerate — `cubic-bezier(0, 0, 0.2, 1)`
- accelerate — `cubic-bezier(0.4, 0, 1, 1)`
- spring — `cubic-bezier(0.34, 1.56, 0.64, 1)`

**Named animations** (Tailwind `animate-*`):

- `fade-up` 300ms
- `fade-in` 200ms
- `slide-in-right` / `slide-in-left` 400ms spring
- `pulse-glow` 2s
- `status-pulse`
- `shimmer` 1.5s (skeleton loading)
- `mesh-drift` 20s (animated background blobs)

Reveal-on-scroll sections use an `IntersectionObserver` with a `cubic-bezier(0.25, 0.46, 0.45, 0.94)` ease to fade and rise ~16px into place.

### 3.7 Focus & Selection

- Global focus ring (`:focus-visible`): 2px solid `#db2777` with 2px offset.
- PrimeReact focus: `0 0 0 2px #ffffff, 0 0 0 4px #db2777`.
- `::selection` background `rgba(219, 39, 119, 0.2)`, foreground `#0f172a`.

---

## 4. Marketing Layout Anatomy

### 4.1 Navigation (sticky top)

Located in `apps/web/src/app/(marketing)/layout.tsx`.

- Container: `sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200`
- Height: `h-16` with `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Logo: `<Link>` text-only wordmark — `text-xl font-heading font-bold text-pink-600` reading **Social Bounty**. No icon is used in the header.
- Links: slate-700 at rest, pink-600 on hover, with a pink underline that grows from 0 → 100% width on hover (200ms).
- CTA on the right: pink-600 rounded-full pill button, "Sign up" or "Start earning".

### 4.2 Hero (homepage)

`apps/web/src/app/(marketing)/page.tsx`.

- Background gradient: `linear-gradient(135deg, #fdf2f8 0%, #eff6ff 40%, #fce7f3 70%, #dbeafe 100%)` — pink-50 → blue-50 diagonal wash.
- Two animated blobs positioned absolutely: pink (`#DB2777`) top-left and blue (`#2563EB`) bottom-right. Each uses `filter: blur(80px)` with `opacity: 0.15` and a 20s `mesh-drift` loop.
- Headline: `text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-slate-900 leading-[1.05] tracking-tight`. Structured as two lines split by `<br />`:
  - Line 1 — `The bounty board` — solid `text-slate-900`.
  - Line 2 — `for the internet.` — wrapped in a `<span>` with the signature gradient-text treatment (see §5.6).
- Subhead: `text-lg sm:text-xl text-slate-600 max-w-2xl`.
- Primary CTA: pink-600 `rounded-full px-8 py-4 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.03] transition`.
- Secondary CTA: white `rounded-full` with slate-200 border, slate-900 text.

### 4.3 Section Rhythm

Marketing sections alternate between `bg-white` and `bg-slate-50` to create visual rhythm without heavy dividers. Each section uses:

- `py-20 sm:py-24 lg:py-32`
- `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section eyebrow: `text-sm font-semibold uppercase tracking-wider text-pink-600`
- Section heading: `text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900`
- Section lead: `mt-4 text-lg text-slate-600 max-w-3xl`

### 4.4 Feature Cards

- `bg-white rounded-2xl p-8 border border-slate-200`
- Hover: `hover:border-pink-200 hover:shadow-lg transition-all duration-250`
- Icon tile: `w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center` (lucide icons).
- Card title: `text-xl font-heading font-semibold text-slate-900 mt-6`
- Card copy: `mt-3 text-slate-600 leading-relaxed`

### 4.5 Stats Strip

- Container: `bg-slate-900 text-white rounded-3xl py-16`
- Numbers: `font-mono text-5xl sm:text-6xl font-bold` (JetBrains Mono) with the primary figure often wrapped in a pink → blue gradient clip.
- Labels: `text-sm uppercase tracking-wider text-slate-400`

### 4.6 Final CTA Band — "Ready to hunt?"

The closing section of the homepage is a full-bleed animated gradient with a noise-texture overlay. It's the loudest moment on the public site and the one place where the pink/blue brand palette crosses into violet to bridge the two anchors.

**Markup (abridged from `page.tsx` around lines 495–550):**

```tsx
<section className="relative py-24 sm:py-32 overflow-hidden">
  {/* Layer 1 — animated gradient */}
  <div
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(135deg, #DB2777, #7C3AED, #2563EB)',
      backgroundSize: '300% 300%',
      animation: 'gradientShift 15s ease infinite',
    }}
  />

  {/* Layer 2 — SVG noise overlay at 10% opacity */}
  <div
    className="absolute inset-0 opacity-10"
    style={{ backgroundImage: "url(\"data:image/svg+xml,…fractalNoise…\")" }}
  />

  {/* Layer 3 — content */}
  <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
      Ready to hunt?
    </h2>
    <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
      Whether you&apos;re here to earn or here to grow your brand — the board&apos;s open.
    </p>
    {/* …two pill CTAs… */}
  </div>
</section>

<style jsx>{`
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`}</style>
```

**Layer-by-layer spec:**

1. **Gradient layer** — absolutely positioned, fills the section.
   - Direction: `135deg` (top-left → bottom-right).
   - Stops: `#DB2777` (pink-600) → `#7C3AED` (violet-600) → `#2563EB` (blue-600). The violet is *not* a new brand color; it is the geometric midpoint between the two anchors, used only here to smooth the blend across three stops instead of two.
   - `background-size: 300% 300%` — the gradient canvas is three times the section in both axes. Without this the animation has nowhere to travel and the surface looks static.
   - Animation: `gradientShift 15s ease infinite` — the background-position slides from `0% 50%` → `100% 50%` → `0% 50%`. The horizontal sweep reads as a slow, breathing shift of the color center; no vertical travel keeps it calm at the top/bottom edges where content sits.
   - Timing: a full 15-second loop is deliberately long — the motion registers subconsciously, never as "an animation." Anything under 10s starts to feel like a banner ad.
   - Easing: `ease` (default cubic-bezier). `linear` would reveal the seam at the midpoint; `ease` softens the turnarounds.

2. **Noise texture layer** — absolutely positioned, fills the section, `opacity: 0.10`.
   - Inline SVG `feTurbulence` `type="fractalNoise"`, `baseFrequency="0.9"`, `numOctaves="4"`, `stitchTiles="stitch"`.
   - `stitchTiles="stitch"` is important: it makes the noise tile without seams, so the texture behaves well at any viewport width.
   - Purpose: breaks up the banding that otherwise appears on large gradient fills (especially on 8-bit displays and over-compressed screenshots). The effect is subtle — think "matte paper", not "grain".
   - Keep opacity between `0.08` and `0.12`. Above that it looks like dirt; below it the gradient bands come back.

3. **Content layer** — `relative z-10`, centered, constrained to `max-w-3xl`.
   - Heading: `text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4`. Solid white — no gradient-text treatment here; the background already carries the color story.
   - Sub-copy: `text-lg text-white/80 mb-10 max-w-xl mx-auto` — white at 80% opacity sits on all three gradient stops while remaining AA-legible (≥4.6:1 against the lightest point).
   - CTAs: primary is a white pill with `text-pink-600` (inverts the page's usual pink-on-white rule — the button has to pop against a pink/violet/blue field); secondary is a white-outlined ghost pill.

**Why three layers instead of one:**

A single CSS gradient at rest would band visibly on ultrawide monitors and look flat in screenshots. The 300%-scaled animated gradient keeps the color center migrating so no single band is ever the focus; the noise layer obliterates what banding remains. The separation also lets the noise stay perfectly still while the color moves, which reads as "textured surface with light moving across it" rather than "animated image."

**Accessibility:**

- `prefers-reduced-motion: reduce` is enforced globally in `globals.css` (§5 of this doc) — it clamps `animation-duration` to `0.01ms`, which effectively freezes the gradient at its initial position. The section still looks correct because a 135° three-stop gradient is visually complete at rest; motion is an enhancement, not the design.
- No text or UI depends on the gradient phase, so the frozen state is fully usable.
- Contrast: white (`#FFFFFF`) against the lightest part of the gradient (`#7C3AED`) clears AA at 5.2:1. Against pink-600 it's 4.5:1 at ≥16px. Do not place body-size copy here.

**Reuse rules:**

- One animated-gradient band per page. Repeating it dilutes the moment.
- Keep the three stops in order: pink → violet → blue. Reversing the order or substituting stops (e.g. pink → amber → blue) breaks the brand read.
- If you need a calmer variant (e.g. in an email banner), drop the animation and keep the static 135° gradient + noise. Do not animate the noise.

### 4.7 Footer

- `bg-slate-900 text-slate-400`
- 4-column grid collapsing to 2 on `md` and 1 on base.
- Link hover: `hover:text-pink-400 transition-colors`.
- Bottom bar: copyright in `slate-500`, small-caps legal links separated by `·`.

---

## 5. Component Patterns

### 5.1 Buttons (Tailwind-first)

Marketing buttons are hand-styled with Tailwind rather than PrimeReact:

```tsx
// Primary pill
className="inline-flex items-center justify-center rounded-full
           bg-pink-600 px-8 py-4 text-base font-semibold text-white
           shadow-lg shadow-pink-600/20
           hover:bg-pink-700 hover:shadow-xl hover:scale-[1.03]
           active:scale-[0.98]
           transition-all duration-200 ease-out
           focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-pink-600 focus-visible:ring-offset-2"
```

```tsx
// Secondary pill
className="inline-flex items-center justify-center rounded-full
           bg-white px-8 py-4 text-base font-semibold text-slate-900
           border border-slate-200
           hover:border-slate-300 hover:bg-slate-50
           transition-all duration-200"
```

PrimeReact `<Button>` — used in forms/app screens, not marketing — receives a pink linear gradient (`#db2777 → #be185d`), 8px radius, 2.75rem min-height, Inter 14/500, and a pink drop shadow.

### 5.2 Forms (PrimeReact)

- Input base: `#ffffff` background, `1px solid #e2e8f0`, `8px` radius, `0.625rem 0.75rem` padding, Inter 14/400.
- Focus: pink border + `0 0 0 3px rgba(219, 39, 119, 0.12)` ring.
- Error: red-500 border + red-600 helper text.
- All PrimeReact wrappers inside `.w-full` expand to fill.

### 5.3 Links (inline)

`text-pink-600 underline decoration-pink-300 underline-offset-4 hover:decoration-pink-600 transition`.

### 5.4 Badges / Pills

`inline-flex items-center gap-1.5 rounded-full bg-pink-50 text-pink-700 px-3 py-1 text-xs font-medium`.

### 5.6 Gradient Text (signature treatment)

The hero's second line — **"for the internet."** — uses a pink → blue clipped-text gradient. This is the signature brand flourish: one phrase per section, never more, applied to the word or phrase you want the eye to land on.

```tsx
<h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold
               text-slate-900 leading-[1.05] tracking-tight">
  The bounty board
  <br />
  <span className="bg-gradient-to-r from-pink-600 to-blue-600
                   bg-clip-text text-transparent">
    for the internet.
  </span>
</h1>
```

Mechanics:

- `bg-gradient-to-r` — left-to-right (matches the reading direction; avoid `to-br` which drifts darker at the descenders).
- `from-pink-600 to-blue-600` — exactly `#DB2777 → #2563EB`, the two brand anchors. No midpoint stop; the natural blend passes through a muted violet around the centre which reads as intentional, not a third color.
- `bg-clip-text text-transparent` — clips the gradient to the glyph shapes. Must always be paired; dropping `text-transparent` leaves the solid fallback color visible.
- Weight must be `font-bold` (700) at heading sizes so the gradient reads. At `font-semibold` (600) and below it looks washed out — fall back to solid pink-600 instead.
- Inherit line-height from the parent heading. Do not add `leading-*` on the span itself — it desyncs the baseline across the break.

Rules of thumb:

- **One gradient phrase per section.** If a headline already has gradient text, the CTA below it should be solid pink, not gradient.
- **Never gradient body copy.** Minimum size: `text-3xl`. Below that the color blend fights with hinting and becomes muddy.
- **Never on dark backgrounds.** The treatment is calibrated for the white/slate-50 marketing canvas. On `slate-900` sections (stats strip, footer) use the alt treatment below.
- **Reverse / alt:** on dark bands, swap to `from-pink-400 to-blue-400` so both ends stay above AA contrast on `slate-900`.
- **Keep the gradient horizontal.** Diagonal (`to-br` / `to-tr`) distorts when the phrase wraps over two lines.

Variations used elsewhere on the site:

- Feature-card title accent word: same `from-pink-600 to-blue-600`, `text-2xl` minimum.
- Stats figure on the dark strip: `from-pink-400 via-fuchsia-400 to-blue-400` (three-stop because the background is dark and the mids need to stay luminous).
- Final-CTA band headline on white card: identical to the hero treatment.

Fallback for non-supporting browsers (very rare): the solid `color` on the span resolves to `text-slate-900` via the parent. To make the fallback pink instead, add `text-pink-600` on the span — modern browsers then override it with the clipped gradient and legacy browsers keep it legible.

### 5.5 Skeletons

`.skeleton` utility — 1.5s shimmer across a `#f1f5f9` base. Disabled under `prefers-reduced-motion`.

---

## 6. Accessibility

- `:focus-visible` is always a 2px pink outline with 2px offset — never removed.
- Skip link: `.sr-only-focusable:focus` pops into the top-left on Tab, pink-accented.
- `prefers-reduced-motion: reduce` globally clamps animation / transition duration to `0.01ms` and halts mesh blobs + skeleton shimmer.
- Color contrast: body text `#0f172a` on `#f8fafc` is ~17:1. Pink-600 on white is 4.5:1 for ≥16px text (AA). Pink-600 is **not** used for small muted text; muted text uses `slate-500/600`.
- All interactive PrimeReact elements have `cursor: pointer` enforced in globals.

---

## 7. Imagery & Iconography

- Icons: `lucide-react` line icons at 20–24px, `text-pink-600` for primary accents and `text-slate-500` for neutrals. Stroke width `1.75`.
- Illustrations: soft gradient washes in the pink/blue family; avoid photographic imagery on marketing pages unless framed in a `rounded-2xl` card with a slate-200 border.
- No drop shadows on icons. Emphasis comes from the pink tile behind them, not glow.

---

## 8. Voice Alignment

This styling pairs with the brand voice documented in `docs/brand/BRAND-GUIDELINES.md`:

- Tagline: **Hunt. Create. Earn.**
- Positioning: **The bounty board for the internet.**
- Terminology: *Hunter* (not user), *Bounty* (not task), *Brand* (not client).
- Archetype: The Jester — playful but precise. Styling mirrors this: confident pink on a clean slate canvas, generous radius, crisp type, a single moment of motion per section rather than constant animation.

---

## 9. Source of Truth

If anything in this doc conflicts with the code, the code wins and this doc should be updated:

- Tokens: `apps/web/tailwind.config.ts`
- Base styles + PrimeReact overrides: `apps/web/src/styles/globals.css`
- App shell, fonts, PrimeReact theme import: `apps/web/src/app/layout.tsx`
- Marketing shell (nav + footer): `apps/web/src/app/(marketing)/layout.tsx`
- Homepage sections: `apps/web/src/app/(marketing)/page.tsx`
- Brand voice and terminology: `docs/brand/BRAND-GUIDELINES.md`
- Internal design-system narrative (NeoGlass): `md-files/DESIGN-SYSTEM.md` (note: describes dark mode; the public site runs the light variant of the same token set)
