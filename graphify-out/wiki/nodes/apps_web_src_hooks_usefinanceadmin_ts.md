# `useFinanceAdmin.ts`

> TanStack Query hooks for every finance-admin surface — overview, reconciliation, overrides, visibility analytics, subscriptions.

## What it does

`useFinanceAdmin.ts` exports a dense set of ~18 hooks backing the `/admin/finance/*` page tree: `useFinanceOverview` (15-second refetch for live kill-switch + exception count), `useTransactionGroup(id)` (drill-down with no-retry-on-failure — it's a one-shot lookup), `useInboundFunding(limit)` (list of brand-funding events), `useReserves`, `useEarningsPayouts`, `useRefunds`, `useExceptions`, `useAuditTrail`, `useConfidenceScores`, `useSystemInsights(system)`, `useVisibilityAnalytics(windowHours)` (polls every 30s on the insights page — Phase 3D), `useSubscriptions(page, limit)`, `usePayouts(page, limit)`, `useVisibilityFailures(page, limit)` (Phase 3B admin surface for submissions with consecutive visibility failures), `useVisibilityHistory(submissionId)` (per-submission scrape history), plus mutations like `useToggleKillSwitch`, `useOverrideEntry`. Keyed through `keys` — a per-module lookup table — so `onSuccess` invalidations are coordinated cleanly.

## Why it exists

The finance-admin surface is the most data-rich corner of the admin tree; centralising these hooks means page components can lean on a stable set of named hooks rather than wrap `useQuery({ queryFn: ... })` ad-hoc. Polling cadences are tuned per-endpoint: `useFinanceOverview` refetches every 15s because the kill-switch indicator must be live, `useVisibilityAnalytics` polls every 30s because Phase 3D thresholds emit alerts in real time, and `useTransactionGroup` has `retry: false` because a failed lookup is a 404, not a transient issue. This file is the primary consumer of `FinanceAdminService` via the `financeAdminApi` client wrapper.

## How it connects

- **`FinanceAdminService` (API)** — the server-side counterpart via `financeAdminApi`.
- **`financeAdminApi`** — the underlying fetch client in `lib/api/finance-admin.ts`.
- **`KillSwitchToggleRequest`, `OverrideRequest` (shared)** — mutation DTOs.
- **`VisibilityAnalyticsResponse`, `VisibilityFailureRow`, `VisibilityHistoryRow`, `VisibilityFailureBucket`, `VisibilityAnalyticsAlert` (shared)** — Phase 3 response DTOs.
- **`/admin/finance/*` page.tsx files** — ~15 pages consuming these hooks; the largest block is under `/admin/finance/groups/[transactionGroupId]`, `/admin/finance/insights/[system]`, `/admin/finance/visibility-failures`.
- **`useAdmin.ts`** — sibling hook bundle for the non-finance admin surface.
- **`queryKeys.financeAdmin`** — the cache-key factory, structured to support granular invalidation after `useOverrideEntry` or `useToggleKillSwitch` mutations.

---
**degree:** 21 • **community:** "Finance admin dashboard" (ID 6) • **source:** `apps/web/src/hooks/useFinanceAdmin.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the per-hook polling cadences are the important detail. If you add a new live-metric endpoint, match its refetchInterval to the operator's mental model (30s for analytics, 15s for kill-switch-adjacent, no polling for drill-down reads). Getting this wrong wastes API requests or shows stale operator state.
