# `FinanceAdminService`

> Backbone of the SUPER_ADMIN finance console — reconciliation drill-downs, override entries, kill-switch control, visibility analytics.

## What it does

`FinanceAdminService` is the service-layer brains of the Finance Reconciliation Dashboard. `.overview()` returns a snapshot — totals by `LedgerAccount` × `LedgerEntryType` via a single `groupBy`, open-exceptions count from `recurring_issues`, the kill-switch row from `SystemSetting.financial.kill_switch.active`, and the 20 most recent transaction groups. `.overrideEntry({ reason, legs, description })` is the SUPER_ADMIN compensating-entry write path — it delegates to `LedgerService.postTransactionGroup` with `allowDuringKillSwitch: true` (per ADR 0006). `.toggleKillSwitch()` flips the DB row and emits the corresponding AuditLog. `.getTransactionGroup(id)` drills down to full leg detail + AuditLog correlation. `.getVisibilityAnalytics(windowHours)` — added in Phase 3D (commit `f010a8f`) — runs a single `$queryRaw` join across `submission_url_scrape_histories` and `submission_url_scrapes`, grouped by `(channel, scrapeStatus)`, and emits warning/critical alerts against the thresholds `{ warning: 30% + min 10 samples, critical: 50% + min 20 samples }` defined in `VISIBILITY_ANALYTICS_THRESHOLDS`.

## Why it exists

Phase 3 of the implementation plan (`md-files/implementation-phases.md`) put operator controls into production alongside the ledger itself — without this service, SUPER_ADMINs would have no way to observe or correct financial state outside raw SQL. `overrideEntry` is the sanctioned path that satisfies ADR 0006: only compensating entries may bypass the kill switch, only a SUPER_ADMIN may issue one, the reason field is mandatory and surfaces in the AuditLog. The 2026-04-16 performance fix (commit `6e110ca`) collapsed the overview from 23 parallel `count()` calls to 6 `groupBy` queries — a 3–5× speedup on dashboard load — and the response shape stayed byte-identical. Hard Rule #3 (AuditLog required) is satisfied by the mandatory `reason` passed through to `LedgerService.postTransactionGroup`'s `audit` field.

## How it connects

- **`LedgerService`** — all write paths flow through `postTransactionGroup`; `allowDuringKillSwitch` is only ever true here.
- **`FinanceAdminController`** — the HTTP shell that forwards REST calls to this service; both are `@Roles(SUPER_ADMIN)`.
- **`PrismaService`** — the overview's `groupBy` queries, the visibility analytics `$queryRaw`, and the transaction-group drill-down all go through it.
- **`SystemSetting.financial.kill_switch.active`** — the DB row this service reads/writes to control the kill switch.
- **`VisibilityAnalyticsResponse`, `VisibilityFailureBucket`, `VisibilityAnalyticsAlert` (shared)** — the Phase 3D DTOs this service produces.
- **`useFinanceAdmin.ts`** — the browser-side hook bundle that consumes this service's outputs.
- **`TransactionGroupDetail`** — the drill-down DTO; consumed by `/admin/finance/groups/[id]/page.tsx`.

Degree 26 reflects the breadth of this service's reach — every finance-admin page ultimately routes here.

---
**degree:** 26 • **community:** "Finance admin dashboard" (ID 6) • **source:** `apps/api/src/modules/finance-admin/finance-admin.service.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** this service is the canonical example of "operator tooling that must not bypass Financial Non-Negotiables". Every write path here mirrors the constraints of normal ledger writes (idempotency key, double-entry balance, audit log) and adds only one affordance — the `allowDuringKillSwitch` escape — in exactly one place. That discipline is what makes the kill switch credible.
