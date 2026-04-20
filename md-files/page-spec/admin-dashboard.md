# Admin dashboard — `/admin/dashboard`

**Route path:** `/admin/dashboard`
**File:** `apps/web/src/app/admin/dashboard/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Main → Dashboard (top of `adminSections` in `navigation.ts`)
**Layout:** `apps/web/src/app/admin/layout.tsx` (wraps every admin child with `AuthGuard` + `MainLayout` + admin `NavSection[]`)

**Refs:** `docs/architecture/sitemap.md` (admin tree), `docs/architecture/security-and-rbac.md` (role matrix), CLAUDE.md §4 (financial non-negotiables).

## Purpose
Platform-wide overview for SUPER_ADMIN: headline counts, recent audit activity, and service-health snapshot. First screen after admin login.

## Entry & exit
- **Reached from:** admin login redirect, "Dashboard" nav item, admin logo click.
- **Links out to:** each stat card deep-links into the relevant list (`/admin/users`, `/admin/brands`, `/admin/bounties?status=LIVE`, `/admin/submissions?status=IN_REVIEW`, `/admin/disputes`, `/admin/disputes?status=ESCALATED`). Audit rows link implicitly via the user reading them — no click target wired (no row `onClick`).

## Data
- **React Query hooks:** `useAdminDashboard()`, `useAuditLogs({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })`, `useSystemHealth()`, `useDisputeStats()`.
- **API endpoints called:** `GET /api/v1/admin/dashboard`, `GET /api/v1/admin/audit-logs`, `GET /api/v1/admin/system-health`, `GET /api/v1/admin/disputes/stats`.
- **URL params:** none.
- **Search params:** none.

## UI structure
- `PageHeader` "Admin dashboard" / subtitle "Platform overview and management".
- Stat grid (1/2/3 cols responsive) with 8 cards: Total users, Total brands, Total bounties, Active bounties (LIVE), Total submissions, Pending reviews (IN_REVIEW), Open disputes, Escalated. Each card: Lucide icon in pink-100 tile, `font-mono tabular-nums` value, `.eyebrow` label. Clickable → `router.push(stat.href)`.
- Two-column grid: "Recent activity" (left, span-2) lists last 10 audit entries — actor name, formatted action, entity type + first-8-char entity ID, formatted timestamp; "System health" (right) lists each service with coloured dot (success-600/warning-600/danger-600), response time, and overall status + version footer.

## States
- **Loading:** `LoadingState type="cards-grid" cards={6}` skeleton.
- **Empty:** audit log section — "No recent activity."; health section — "Loading health data..." when `healthData` falsy.
- **Error:** `ErrorState` with `refetch()` retry (dashboard hook only; sub-fetches fail silently into the "Loading..." fallback).
- **Success:** stat cards populate; audit + health lists render.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Stat card click | `router.push(stat.href)` | Admin sub-list filtered to the relevant slice |
| (read-only) | — | No mutations on this page |

## Business rules
- RBAC: SUPER_ADMIN-only; participant/brand admin are 403'd by layout's `AuthGuard`.
- Stat counts read `data.users.total`, `data.brands.total`, `data.bounties.total`, `data.bounties.byStatus.LIVE`, etc. — the `data.brands.total` key was renamed as part of the Organisation→Brand rename (commit `6e110ca` 2026-04-16); legacy `data.organisations.total` is no longer served.
- No admin mutations are triggered here — all changes happen on the drilldown pages. Hard Rule #3 audit log surface is the "Recent activity" feed; not a mutation surface itself.
- Kill switch is **not** surfaced here — it lives in `/admin/finance` / `/admin/payments-health`.

## Edge cases
- `data.bounties.byStatus?.LIVE` falls back to `0` when no bounties are LIVE — handled via `?? 0`.
- Audit log entries with deleted actor render `log.actor?.firstName` as `undefined undefined`; acceptable — join is a left-outer in the API.
- System health "degraded" service colour (`warning-600`) distinct from `error` (`danger-600`).
- `auditData?.data ?? []` + `healthData` null-guards prevent crashes if any sub-fetch is still resolving.

## Tests
Integration-only. No colocated `*.spec.tsx` for this page.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — hooks.
- `apps/web/src/components/common/PageHeader.tsx` — header.
- `apps/web/src/components/common/LoadingState.tsx`, `ErrorState.tsx` — state components.
- `apps/web/src/lib/utils/format.ts` — `formatDateTime`.
- `apps/api/src/modules/admin/admin.service.ts` — `getDashboard()` collapsed from 23 `count()` round-trips to 6 `groupBy` (commit `6e110ca`).

## Open questions / TODOs
- No route to drill into a specific audit entry from the feed — user has to navigate `/admin/audit-logs` manually.
- "System health" card shows only status + response time; no per-check detail link.
