# Admin audit logs — `/admin/audit-logs`

**Route path:** `/admin/audit-logs`
**File:** `apps/web/src/app/admin/audit-logs/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance → Audit Logs
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `docs/architecture/security-and-rbac.md`, CLAUDE.md (Hard Rule #3 audit required on all admin actions + status changes).

## Purpose
Global append-only audit trail across every module. Expandable rows surface the `beforeState` / `afterState` JSON diff plus the reason + IP address.

## Entry & exit
- **Reached from:** admin sidebar → Audit Logs; dashboard recent-activity feed (informational, no direct link).
- **Links out to:** `/admin/audit-logs/[id]` only via direct URL (list has no row link — expansion inline).

## Data
- **React Query hooks:** `useAuditLogs({ ...filters, page, limit })`.
- **API endpoints called:** `GET /api/v1/admin/audit-logs`.
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; `action`, `entityType` in local state.

## UI structure
- `PageHeader` subtitle "Track all platform actions and changes" + toolbar: entity-type text input (placeholder "Entity type...") + Action dropdown (Create / Update / Delete / Status Change / Login / Override) + clear-filters.
- `glass-card` wrapping DataTable (min-w-[600px]) with per-row expander:
  - Columns: expander (3rem), Action (sortable), Entity Type, Entity ID (truncated max 10rem), User (email or id), Timestamp.
  - `rowExpansionTemplate` renders a `border-l-2 border-blue-600` panel with:
    - Reason (if present).
    - Before state as `<pre>` JSON.
    - After state as `<pre>` JSON.
    - IP Address (if present).
    - Fallback "No additional details available." when all four are null.
- `Paginator` below.
- `EmptyState` (History icon, "No activity", "No audit entries match your filters.") when empty.

## States
- **Loading:** `LoadingState type="table"`.
- **Empty:** `EmptyState`.
- **Error:** `ErrorState` with `refetch()`.
- **Success:** table + expandable rows.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Row expand | `setExpandedRows(e.data)` | Inline JSON detail panel |
| Filter | `setFilters({ ...filters, [key]: value, page: 1 })` | Refetch |

## Business rules
- RBAC: SUPER_ADMIN-only (audit is sensitive platform data).
- **Append-only contract** — audit rows are never updated or deleted (CLAUDE.md §4.5 ethos applies here too even though audit isn't part of the financial ledger).
- Read-only surface — this page itself doesn't mutate anything (no recursive audit).
- Search is a single-field entity-type filter (not full-text) — for deep queries use filter combinations.

## Edge cases
- Audit entry referencing a deleted entity — entityId is still rendered (opaque ref), no join fails.
- Orphaned `actorId` (actor user deleted) — rendered as raw id string.
- `beforeState` + `afterState` both null (e.g., `LOGIN` events) — fallback text shown.
- Action enum is fixed (not free-form); legacy values still stored would render verbatim.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAuditLogs`.
- `apps/api/src/modules/audit/audit.service.ts`.
- `apps/api/src/common/audit/audit.interceptor.ts`.

## Open questions / TODOs
- No actor-id filter (could drill into a single admin's activity — it's available via `/admin/users/[id]` Audit tab though).
- No date-range filter (older logs require pagination).
- Row has no direct link to `/admin/audit-logs/[id]` — expansion is the only detail affordance. Could add a deep-link for sharing.
