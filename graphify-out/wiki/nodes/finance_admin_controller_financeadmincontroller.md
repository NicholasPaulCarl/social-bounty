# `FinanceAdminController`

> REST controller exposing SUPER_ADMIN finance endpoints — overview, overrides, kill-switch, reconciliation drill-downs, visibility analytics.

## What it does

`FinanceAdminController` is the HTTP shell over `FinanceAdminService`. Endpoints: `GET /admin/finance/overview` (snapshot for the finance dashboard), `GET /admin/finance/inbound` (list of brand-funding events), `GET /admin/finance/reserves`, `GET /admin/finance/earnings-payouts`, `GET /admin/finance/refunds`, `GET /admin/finance/exceptions`, `GET /admin/finance/audit-trail`, `GET /admin/finance/confidence`, `GET /admin/finance/system-insights/:system`, `GET /admin/finance/visibility-analytics?windowHours=<n>` (Phase 3D analytics — `windowHours` clamped to [1, 720], default 24), `GET /admin/finance/visibility-failures` (Phase 3B list), `GET /admin/finance/visibility-failures/:submissionId/history` (per-submission scrape history), `GET /admin/finance/subscriptions`, `GET /admin/finance/payouts`, `GET /admin/finance/groups/:transactionGroupId` (drill-down). Mutations: `POST /admin/finance/kill-switch` (toggle), `POST /admin/finance/overrides` (manual compensating entry per ADR 0006). Every endpoint is `@Roles(UserRole.SUPER_ADMIN)`.

## Why it exists

Without this controller, no `/admin/finance/*` page could exist — the whole Phase 3 finance-dashboard surface hangs off these REST endpoints. The mutation endpoints (`kill-switch`, `overrides`) are the two sanctioned paths for SUPER_ADMIN financial intervention; both carry mandatory `reason` fields that propagate through `FinanceAdminService` → `LedgerService.postTransactionGroup` → `AuditLog`. Hard Rule #3 is satisfied end-to-end. The `windowHours` clamp on `visibility-analytics` is defence-in-depth against a malformed query (Postgres scan width would otherwise be unbounded against the append-only `SubmissionUrlScrapeHistory` table).

## How it connects

- **`FinanceAdminService`** — the delegate; every endpoint forwards here.
- **`SUPER_ADMIN` role** — the `@Roles` gate.
- **`AdminController`** + **`DisputesController`** — sibling admin controllers; same RBAC pattern.
- **`AdminVisibilityFailureListResponse`, `VisibilityAnalyticsResponse`, `TransactionGroupDetail`, `KillSwitchToggleRequest`, `OverrideRequest` (shared)** — the DTOs every endpoint types against.
- **`useFinanceAdmin.ts` (web)** — the TanStack Query hook bundle consuming these endpoints.
- **`financeAdminApi`** — the fetch client.
- **ADR 0006 — Compensating Entries Bypass the Kill Switch** — governs the `overrides` endpoint's behaviour; the `allowDuringKillSwitch` flag is set only from this controller's request path.
- **ADR 0010 — Auto-Refund on PostVisibility** — the `visibility-failures` + `visibility-analytics` endpoints surface the signal that this ADR generates.

---
**degree:** 17 • **community:** "Finance admin dashboard" (ID 6) • **source:** `apps/api/src/modules/finance-admin/finance-admin.controller.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the `kill-switch` and `overrides` endpoints are the two paths most likely to be abused (or mis-used) — review discipline on PRs touching this controller should be strict. Each change here must include test coverage that the `reason` field is mandatory and that AuditLog emission is verified end-to-end.
