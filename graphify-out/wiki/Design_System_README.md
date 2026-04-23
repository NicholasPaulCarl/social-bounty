# Design System README

> God node · 21 connections · `apps/web/src/styles/design-system/README.md`

**Community:** [[Design system handoff]]

## Summary

`Design System README` is the canonical human-facing brief for the product's visual language, the anchor of the Claude Design handoff bundle that replaced three superseded docs (`md-files/DESIGN-SYSTEM.md`, `docs/brand/WEBSITE-STYLING.md`, `docs/brand/BRAND-GUIDELINES.md`) on 2026-04-18. It defines the one-sentence identity — **pink leads (`--pink-600` #db2777), blue counters (gradient + `.info` only), slate carries everything, gold (`--reward-500`) is rewards-only, and the `pink → blue` gradient appears ONCE per view** — plus the three type families (Space Grotesk headings, Inter body, JetBrains Mono metrics), the 4-point spacing grid, the radius ladder (buttons `md`, cards `xl`, feature cards `3xl`, CTAs/badges `full`), and the 4-level elevation system.

It exists so every agent or contributor building UI has one file to load instead of three diverging brand docs. It `cites` the two canonical CSS files it orders (`colors_and_type.css` imported before `components.css`), the `SKILL.md` short reference, `ICONS.md`, and the five preview HTMLs (colors, type, spacing, components, brand, shell-navigation). It `defines` the core tokens and `mandates` Lucide Icons — the reason the 2026-04-18 `ui-ds-apply` sweep removed all ~300 `pi pi-*` references. The `superseded-by` edge to `design-system/social-bounty/MASTER.md` flags a newer bundle exists; this README remains the on-repo source of truth for `apps/web/`.

## Connections by Relation

### cites
- [[Design System SKILL.md]]
- [[previews/components.html]]
- [[previews/colors.html]]
- [[previews/type.html]]
- [[Design System ICONS.md]]
- [[previews/shell-navigation.html]]
- [[colors_and_type.css]]
- [[components.css]]

### defines
- [[--pink-600 (#db2777)]]
- [[--blue-600 (#2563eb)]]
- [[--slate-* tokens]]
- [[--reward-500 (gold)]]
- [[Space Grotesk (headings)]]
- [[Inter (body)]]
- [[JetBrains Mono (metrics)]]
- [[Shell Navigation]]
- [[Gradient once per view]]

### demonstrates
- [[previews/brand.html]]
- [[previews/spacing.html]]

### mandates
- [[Lucide Icons (lucide-react)]]

### superseded-by
- [[design-system/social-bounty/MASTER.md]]

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*