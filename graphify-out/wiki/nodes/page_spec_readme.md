# Page Specs Index (`md-files/page-spec/README.md`)

> The per-route specification index — 91 files covering every `page.tsx` under `apps/web/src/app/`.

## What it does

`md-files/page-spec/README.md` is the canonical index for the page-spec documentation set added 2026-04-19. Each of the 91 `<route>.md` files under `md-files/page-spec/` follows an identical template: **Route path · File · Role · Access · Nav entry · Layout** header block; **Purpose** (one-two sentences on user outcome); **Entry & exit** (inbound sources + outbound hrefs); **Data** (hooks, API endpoints, URL + search params); **UI structure** (top-to-bottom enumeration of major sections); **States** (loading / empty / error / success); **Primary actions** (labelled table); **Business rules** (RBAC, kill-switch, plan-tier, state-machine gates, `claude.md` §4 references); **Edge cases** (unauthorized, missing data, race conditions); **Tests** (colocated spec files); **Related files**; **Open questions / TODOs**. The index groups specs by route role: Public (9), Shared authenticated (1), Participant (18), Business (~30), Admin (~30), Marketing (~5).

## Why it exists

With 91 routes, no one engineer can hold the full surface in memory. The spec set makes every route auditable — role gates, financial rules, state-machine transitions are all named inline, not inferred from code. The template's "Business rules" slot is where Hard Rule #2 (RBAC) and §4 Financial Non-Negotiables citation lands; "Tests" slot is where Hard Rule #4 (100% test pass rate) enforcement is visible per route. The spec set also serves as the companion to `docs/architecture/sitemap.md` (the one-look route table) and `apps/web/src/lib/navigation.ts` (the nav configuration). Updating specs alongside a route change is an explicit workflow rule in the index's "When to update" section.

## How it connects

- **`SUPER_ADMIN`, `BUSINESS_ADMIN`, PARTICIPANT roles** — every spec names the required role in its header; the index groups by role.
- **`AuthGuard business/layout` concept** — the layout-level RBAC pattern referenced by most spec files.
- **`apps/web/src/lib/navigation.ts`** — the nav configuration each spec cross-links.
- **`docs/architecture/sitemap.md`** — the one-pager sitemap companion doc.
- **Per-route spec files** — e.g. `business-bounties-id.md` (Business Bounty Detail), `admin-finance-visibility-failures.md` (Phase 3B admin surface).
- **`claude.md` §4 Financial Non-Negotiables** — referenced from every finance-adjacent spec.
- **`concept:social-bounty-mvp`** — the scope envelope the specs cover.

---
**degree:** 21 • **community:** "Page spec documentation" (ID 5) • **source:** `md-files/page-spec/README.md`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** keeping spec-per-route in lockstep with the actual routes is the maintenance bet. The "When to update" rule in the index is only as strong as the review discipline behind it — a `yarn spec-lint` that fails CI when a new `page.tsx` lands without a matching spec file would be a cheap next step.
