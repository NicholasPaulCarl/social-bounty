# System health / troubleshooting — `/admin/troubleshooting`

**Route path:** `/admin/troubleshooting`
**File:** `apps/web/src/app/admin/troubleshooting/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** System → System Health
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/knowledge-base.md` (KB entry triggers + `recordRecurrence`), CLAUDE.md §9 (automatic KB entry triggers, ineffective-fix auto-flag), Phase 4 in `md-files/implementation-phases.md`.

## Purpose
Platform service-health snapshot (overall / db / uptime / memory) + recent error log. Companion to the Knowledge Base automation surface for diagnosing incidents without leaving the admin shell.

## Entry & exit
- **Reached from:** admin sidebar → System Health.
- **Links out to:** none (diagnostic surface; KB drill-down is via the KB module, not this page yet).

## Data
- **React Query hooks:** `useSystemHealth()`, `useRecentErrors({ page: errorsPage, limit: 20 })`.
- **API endpoints called:** `GET /api/v1/admin/system-health`, `GET /api/v1/admin/recent-errors`.
- **URL params:** none.
- **Search params:** none (pagination kept in local state but not paged through in the current implementation).

## UI structure
- `PageHeader` title "System health" + subtitle "Monitor platform health and recent errors" + "Refresh" button (refetches both).
- 4-stat grid (1/2/4 cols responsive): Overall status Tag (`success`/`warning`/`danger` per `getStatusSeverity`), Database status Tag, Uptime (`h m` formatted), Memory usage % of total — each with Lucide icon (Server, Database, Clock, BarChart3) tucked right.
- Recent errors `glass-card`:
  - Loading → `LoadingState type="table"`.
  - Error (fetch) → `ErrorState`.
  - Empty → `EmptyState` (CheckCircle2, "No recent errors", "The system is running smoothly with no recent errors.").
  - Populated → `DataTable`: Message, Endpoint, Severity, Timestamp.

## States
- **Loading (health):** `LoadingState type="cards-grid" cards={4}`.
- **Empty:** `EmptyState` with CheckCircle2 when no recent errors.
- **Error:** top-level `ErrorState` on health fetch; per-card `ErrorState` on errors fetch.
- **Success:** stat grid + errors table.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetchHealth()` + `refetchErrors()` | Re-probe |

## Business rules
- RBAC: SUPER_ADMIN-only.
- Read-only surface — no mutations.
- **Kill switch is not surfaced here** — see `/admin/payments-health` (diagnostic surface) and `/admin/finance` (control surface).
- This surface is the **recurring-issue detection** side of CLAUDE.md §9 triggers; KB entries themselves are created by backend paths (`recordRecurrence` in `reconciliation` + `webhook-failure` paths). Ineffective-fix auto-flag writes an AuditLog.

## Edge cases
- System health endpoint transient 5xx → retry via Refresh.
- Memory usage > 100% indicates calc error; display as-is; never seen in practice.
- Uptime wraps to weeks/months — displayed as `Xh Ym` (days aren't broken out).
- Recent errors DataTable has no sort/filter — it's a simple rolling-window feed.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useSystemHealth`, `useRecentErrors`.
- `apps/api/src/modules/admin/admin.controller.ts` — `system-health` + `recent-errors`.
- `apps/api/src/modules/kb/` — KB service, `recordRecurrence`.

## Open questions / TODOs
- No KB-recurrence feed here yet (CLAUDE.md §9 + `md-files/knowledge-base.md`) — would surface "same root cause seen twice within 90 days" right next to error feed.
- No per-error drill-down (stack trace / correlation id).
- No filter by severity or endpoint — could grow with volume.
- No Sentry link inline (Sentry is referenced in the tech stack but not bridged to this page).
