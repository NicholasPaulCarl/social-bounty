# My Disputes — `/my-disputes`

**Route path:** `/my-disputes`
**File:** `apps/web/src/app/(participant)/my-disputes/page.tsx`
**Role:** Any authenticated role (API scopes to filer).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Sidebar "My disputes" (participant).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
List the hunter's disputes (paginated) with status filter pills. "File" CTA routes to the 4-step new-dispute wizard.

## Entry & exit
- **Reached from:** Sidebar nav.
- **Links out to:** `/my-disputes/new` (File CTA), `/my-disputes/:id` (row click).

## Data
- **React Query hooks:** `useMyDisputes({ page, limit, status, sortOrder: 'desc' })`, `usePagination()`.
- **API endpoints called:** `GET /disputes/mine?page=…&status=…&sortOrder=desc`.
- **URL params:** None.
- **Search params:** None.

## UI structure
- `PageHeader` with subtitle, File action (Plus icon), and status pills (from `DISPUTE_STATUS_OPTIONS`).
- DataTable (min-w-[600px]): Dispute # (mono pink), Bounty, Category (slate pill), Status (`StatusBadge`), Filed.
- `Paginator` under table.

## States
- **Loading:** `LoadingState type="table" rows={8} columns={5}`.
- **Empty:** `EmptyState` — Flag icon + "All clear" + "File a dispute" CTA (Plus).
- **Error:** `ErrorState` with retry.
- **Success:** Table with clickable rows.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| File | `router.push('/my-disputes/new')` | Wizard |
| Status pill | `setStatusFilter(id)` | Refetches |
| Row click | `router.push('/my-disputes/:id')` | Detail |

## Business rules
- `sortOrder` fixed to desc (newest first).
- No role gate — API enforces ownership.
- Pills include an `all` option (`statusFilter === 'all'` → no filter param).

## Edge cases
- Pill value `'all'` is translated to `undefined` in the query param.
- No disputes → EmptyState CTA opens wizard.

## Tests
No colocated tests.

## Related files
- `@/hooks/useDisputes`, `usePagination`
- `@/lib/constants/disputes` — `DISPUTE_STATUS_OPTIONS`
- `@/components/common/StatusBadge`, `EmptyState`

## Open questions / TODOs
- No search by dispute #.
