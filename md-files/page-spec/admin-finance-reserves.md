# Brand Reserves — `/admin/finance/reserves`

**Route path:** `/admin/finance/reserves`
**File:** `apps/web/src/app/admin/finance/reserves/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (3rd position)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Per-bounty view of the `brand_reserve` ledger account balance versus the bounty's paid face value. Surfaces reconciliation check #7 (**reserve-vs-bounty**) visually — any row where balance ≠ face value and ≠ 0 is flagged as "DRIFT". Performance note from CLAUDE.md: the reserve check runs as a single `GROUP BY` (184×–494× faster than the legacy per-bounty aggregate; cadence safe to ~1M paid bounties).

## Entry & exit
- **Reached from:** Finance sub-nav "Reserves" tab.
- **Links out to:** `/admin/bounties/{bountyId}` on row click.

## Data
- **React Query hooks:** `useReserves()`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/reserves`
  - GET `/api/v1/admin/finance/exports/reserves.csv` (audited)
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with title "Brand reserves", subtitle "Per-bounty brand_reserve balance vs face value". Actions: Download CSV, Refresh.
- Amber `<Message severity="warn">` banner above the table when any row has `drift: true` ("N bounty/bounties have reserve drift").
- `<Card>` wrapping a 25-row paginated `<DataTable>`, stripedRows, cursor-pointer on rows.
- Row tint: `bg-yellow-50` class applied to drifted rows.
- Columns: Bounty title (primary colour link text), Payment status Tag, Face value cents (mono), Reserve balance cents (mono), Drift (success `ok` or warning `DRIFT` Tag).
- Row click routes to `/admin/bounties/{bountyId}`.

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** Natural empty table (no paid bounties yet).
- **Error:** `ErrorState` with retry CTA.
- **Success:** Rows rendered; banner shown only if `drifted.length > 0`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Download CSV | GET `/admin/finance/exports/reserves.csv` | Streams Blob, `saveBlob(csvFilename('reserves'))` |
| Refresh | `refetch()` | Re-query reserves |
| Row click | `router.push` | `/admin/bounties/{bountyId}` |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation (this page is read-only; CSV download audited)
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee (not shown here — sits in `global_fee_revenue` account, visible on overview)
- Kill switch: read-only surface, unaffected.

Page-specific:
- Implements reconciliation check **#7: reserve-vs-bounty** — balance ≠ face value and ≠ 0 is a drift signal (a fully paid-out bounty should be 0; a pre-paid active bounty should equal face value).
- Displays **live** balances computed server-side via `GROUP BY brand_reserve` aggregate (per ADR 0002 wallet-read-model).
- No write operations from this surface; corrections routed via `/admin/finance/overrides`.

## Edge cases
- Bounty in DRAFT / not yet funded — balance = 0, face = 0, drift = false.
- Bounty fully paid out — balance = 0, face > 0, drift = false (terminal).
- Drift detected — amber banner + yellow tint + DRIFT tag; triage by opening `/admin/bounties/{id}` and/or posting a compensating entry via Overrides.
- Pagination — fixed 25 rows/page; for full history use CSV export.
- Currency is implicitly ZAR (not multi-currency on this page).

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend perf evidence: `docs/perf/2026-04-15-reconciliation-benchmarks.md` (reserve check benchmark). Service: `apps/api/src/modules/admin/finance-admin.service.spec.ts` — `listReserves`; reconciliation fault-injection tests cover the reserve-vs-bounty arm.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useReserves`
- `apps/web/src/lib/api/finance-admin.ts` — `getReserves`, `downloadExport('reserves')`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatCents`
- `apps/web/src/lib/utils/download.ts` — `saveBlob`, `csvFilename`
- Backend: `apps/api/src/modules/admin/finance-admin.service.ts` (reserves aggregate)
- `apps/api/src/modules/reconciliation/checks/reserve-vs-bounty.check.ts`
- `docs/perf/2026-04-15-reconciliation-benchmarks.md`

## Open questions / TODOs
- No inline filter (e.g. "show only drifted"); CSV export is the fallback.
- Could surface a direct "Post compensating entry" CTA per row (currently operators navigate to Overrides manually).
