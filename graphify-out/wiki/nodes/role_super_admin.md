# `SUPER_ADMIN` role

> The privilege-escalation tier that owns kill-switch, audit-log, user-management, and financial-override surfaces.

## What it does

`SUPER_ADMIN` is the highest-privilege role in the `UserRole` enum (declared in `packages/shared/src/enums.ts`, alongside `PARTICIPANT` and `BUSINESS_ADMIN`). It is the only role that can: toggle the Financial Kill Switch (`SystemSetting.financial.kill_switch.active`), post manual compensating ledger entries via `FinanceAdminController.overrideEntry()`, view full AuditLog history, create/suspend brands and users, resolve disputes platform-wide (not just brand-scoped), access every `/admin/*` web route, access the payments-health dashboard, access the Finance reconciliation drill-down, and access the visibility-failures surface introduced by Phase 3B (commit `248bd73`). The role is checked two ways: at the controller-method level via `@Roles(UserRole.SUPER_ADMIN)` from `apps/api/src/common/decorators/roles.decorator.ts`, and at the Next.js layout level via `AuthGuard allowedRoles={[UserRole.SUPER_ADMIN]}` in `apps/web/src/app/admin/layout.tsx`.

## Why it exists

Hard Rule #2 (RBAC mandatory on every screen and API endpoint) is impossible without a privilege tier for operator-level actions — things that bypass normal business logic but must still land in the AuditLog. SUPER_ADMIN is that tier. The Escalation clause in `claude.md` §10 references the role directly: "On detection of a Critical severity... recommend invoking the Financial Kill Switch" — only SUPER_ADMIN can invoke it. ADR 0006 (Compensating Entries Bypass the Kill Switch) calls out that the `allowDuringKillSwitch: true` flag on `LedgerService.postTransactionGroup` may only be set by a SUPER_ADMIN path (enforced via `actor.role === SUPER_ADMIN` check inside the ledger service).

## How it connects

- **`BUSINESS_ADMIN` role** — the sibling tier one hop below; SUPER_ADMIN is a strict superset.
- **`AuthGuard business/layout` concept** — the layout-guard pattern is replicated at `apps/web/src/app/admin/layout.tsx` with `allowedRoles={[SUPER_ADMIN]}`.
- **`AdminController`, `AdminService`, `FinanceAdminController`, `FinanceAdminService`** — all four are gated by `@Roles(SUPER_ADMIN)` at the controller level.
- **`Financial Kill Switch` concept** — SUPER_ADMIN is the only role that can flip it; the `setKillSwitch` service method requires the role.
- **Page specs for `/admin/*`** — every one of the ~35 admin routes documents `Role: SUPER_ADMIN` in its header block.
- **`PaymentsHealthController`** — the credential-hash + token-probe endpoint is `@Roles(SUPER_ADMIN)` only.

The degree of 36 reflects how many admin-surface files reference the role identifier — mostly page-spec docs, controller decorators, and layout guards.

---
**degree:** 36 • **community:** "Page spec documentation" (ID 5) • **source:** `md-files/page-spec/` (referenced across enums + decorators + layouts)

> **Architectural note:** the role's reach (36 neighbors) is a healthy sign — centralising admin gating under one named role makes audit-review tractable. Watch for drift: if a new admin-only endpoint lands without `@Roles(SUPER_ADMIN)`, the graph will register a lower degree and the page-spec document template will fail review.
