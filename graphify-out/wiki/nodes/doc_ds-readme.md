# Design System README (`apps/web/src/styles/design-system/README.md`)

> Canonical design-system spec (Claude Design handoff bundle) — tokens, components, voice, identity rules.

## What it does

`apps/web/src/styles/design-system/README.md` is the single source of truth for the platform's visual language after the 2026-04-18 handoff. The bundle includes: `colors_and_type.css` (token layer — `pink-*`, `blue-*`, `slate-*`, `reward-*` scales plus type scale); `components.css` (btn/card/input/badge/chip/avatar/table/toast/progress component classes); `SKILL.md` (short agent reference); 5 preview HTMLs for visual QA; the wordmark asset. The README codifies identity rules: **pink leads (`pink-600` #db2777)**, **blue counters (gradient stop + `.info` only)**, **slate carries everything**, **gold is rewards-only**, and **the `pink → blue` gradient is used ONCE per view at most**.

## Why it exists

Before the handoff, visual consistency lived in three overlapping docs (`md-files/DESIGN-SYSTEM.md`, `docs/brand/WEBSITE-STYLING.md`, `docs/brand/BRAND-GUIDELINES.md`) and drift was inevitable. Consolidating into one handoff bundle makes enforcement tractable: `grep -r "text-cyan-\|text-violet-\|text-amber-"` returning 0 matches is the smoke test the `ui-ds-apply` branch established. The rules fall out of product character — pink for interactive confidence, blue as occasional counterpoint, slate as the workhorse — and Hard Rule #5 (PrimeReact + Tailwind for all UI) makes those token names the enforcement surface: Tailwind's `tailwind.config.ts` re-exports the canonical scales, so token misuse is a build-time error.

## How it connects

- **`globals.css`** — imports both `colors_and_type.css` and `components.css` before `@tailwind`.
- **`tailwind.config.ts`** — re-exports the canonical `pink-*` / `blue-*` / `slate-*` / `reward-*` scales.
- **PrimeReact theme** — the component classes (`.btn`, `.card`, `.input`) integrate with PrimeReact primitives; `components.css:.input` sets the 2.5rem (40px) min-height for single-line controls.
- **Lucide icon migration** — the `ui-ds-apply` sweep (`grep -r "pi pi-"` → 0) replaced PrimeIcons with Lucide React components; `ICONS.md` inside the handoff bundle is the canonical mapping.
- **`EmptyState.tsx`** — migrated to `Icon?:LucideIcon` + `CtaIcon?:LucideIcon` props in commit `7dce09d`.
- **`AppSidebar`, `AppHeader`, `BrandSelector`** — rewritten to Lucide in the `ui-ds-apply` pass.
- **Claude Design skill** (`design:*` skill family) — produces content compatible with this bundle.

---
**degree:** 21 • **community:** "Design system handoff" (ID 19) • **source:** `apps/web/src/styles/design-system/README.md`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the "gradient once per view" rule is the most-likely-to-drift rule. Add a linter rule or a CSS-level regex grep as part of CI if views grow past ~50 screens.
