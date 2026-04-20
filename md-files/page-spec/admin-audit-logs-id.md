# Admin audit log detail — `/admin/audit-logs/[id]`

**Route path:** `/admin/audit-logs/[id]`
**File:** `apps/web/src/app/admin/audit-logs/[id]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** deep-link only
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, CLAUDE.md (Hard Rule #3).

## Purpose
Standalone view for a single audit log entry — useful for direct-link sharing and scannable full-page layout rather than the list's inline expansion.

## Entry & exit
- **Reached from:** `/admin/audit-logs` (deep link only — list has no row link today).
- **Links out to:** none (the entityId is text-only; no automatic routing back to the subject entity).

## Data
- **React Query hooks:** `useAuditLogDetail(id)`.
- **API endpoints called:** `GET /api/v1/admin/audit-logs/:id`.
- **URL params:** `id` (audit log UUID).
- **Search params:** none.

## UI structure
- `PageHeader` breadcrumbs (Audit Logs → `Log #<id-8>`) + title `Audit Log #<id-8>`.
- Two-column `grid lg:grid-cols-2`:
  - `glass-card` "Log Details" — dl: Action, Entity Type, Entity ID (font-mono text-xs), Performed By (actor email or id), Timestamp, IP Address (if set).
  - `glass-card` "Changes" — Before `<pre>` JSON, After `<pre>` JSON, Reason, fallback "No additional details recorded." when all three missing.

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** N/A (always has some data).
- **Error:** `ErrorState` with `refetch()`.
- **Success:** full detail.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| (none) | — | Read-only |

## Business rules
- RBAC: SUPER_ADMIN-only.
- Read-only surface — audit is append-only.
- No mutations possible from this page.

## Edge cases
- Actor user deleted → `log.actor?.email || log.actorId` falls back to raw id.
- Entity deleted → entityId is an opaque reference; no follow link.
- All three of `beforeState` / `afterState` / `reason` missing → fallback text.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAuditLogDetail`.
- `apps/api/src/modules/audit/audit.service.ts`.

## Open questions / TODOs
- No automatic "go to entity" link — could be wired per `entityType` (e.g., `User` → `/admin/users/[entityId]`, `Bounty` → `/admin/bounties/[entityId]`).
- No prev/next navigation — admin must go back to list.
