# Exceptions — `/admin/finance/exceptions`

**Route path:** `/admin/finance/exceptions`
**File:** `apps/web/src/app/admin/finance/exceptions/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (6th position)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Reconciliation findings and recurring issues across the platform. Each row is a `RecurringIssue` — a deduped signature of a failure class seen one-or-more times in the last 90 days (KB entry). Filterable by severity (info / warning / critical) and resolved state. This is the entry point for the 7-check reconciliation run — findings from `/admin/finance` (Run reconciliation button) land here.

## Entry & exit
- **Reached from:** Finance sub-nav "Exceptions" tab. Cross-referenced from `/admin/finance/visibility-failures` (for critical `post_visibility` issues).
- **Links out to:** No inline drilldowns on this surface currently (title + category only). Operators open the per-system page via Insights (`/admin/finance/insights/{system}`) or find the source transaction group via Audit Trail / Overview.

## Data
- **React Query hooks:** `useFinanceExceptions()` (30 s refetch)
- **API endpoints called:**
  - GET `/api/v1/admin/finance/exceptions` (→ `RecurringIssue[]`)
- **URL params:** none
- **Search params:** none (filters in local state)

## UI structure
- `PageHeader` with title "Exceptions", subtitle "Reconciliation findings and recurring issues". Action: Refresh.
- Filter `<Card>`: two controls — severity `Dropdown` (all / info / warning / critical) and resolved `SelectButton` (all / open / resolved). Right-aligned "Showing X of Y" counter.
- Results `<Card>` wrapping a paginated `<DataTable>` (25/page), stripedRows.
- Columns: Severity (colour-coded Tag via `SEVERITY_MAP`: critical=danger, warning=warning, info=info), Category, Title, Hits (`occurrences` count), Status (Tag — resolved=success, open=warning), First seen (mono datetime), Last seen (mono datetime).

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** Natural empty table after filters; with no filters applied, empty means "all clear" — no recurring issues tripped.
- **Error:** `ErrorState` with retry CTA.
- **Success:** Polls every 30 s (matches the scheduler cadence for most reconciliation engines).

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetch()` | Re-query exceptions |
| Severity / Status filter | local state change | Client-side filters the in-memory array |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation — this page is read-only
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee
- Kill switch: read-only surface. A finding may **auto-trip** the kill switch (Critical financial-impact) — the Overview page banner and reconciliation-result message call that out. This surface reflects that finding as a row.

Page-specific:
- Surfaces **all 7 reconciliation checks**' findings (group balance, duplicate detection, missing legs, status consistency, wallet-projection drift, payouts-vs-ledger — formerly Stitch-vs-ledger per R32, reserve-vs-bounty) indirectly via `category` strings that map back to the check names. The same table also holds non-reconciliation recurrences (webhook failures, post-visibility scheduler issues, OAuth issues, etc.) because the KB table is shared.
- Displays **live** state; polls 30 s.
- No write operations. Resolution happens via:
  - The reconciliation engine auto-resolving on re-run (when the root cause clears)
  - Engineering manually marking a row resolved via admin tools (not this page)
- CLAUDE.md §9 — KB entry is mandatory on: duplicate tx detected, ledger imbalance, reconciliation mismatch, recurrence threshold hit, any Critical / High financial-impact incident.

## Edge cases
- Same signature hit twice in 90 days — `occurrences` increments; severity may be upgraded by `recordRecurrence` logic (Medium → High → Critical on repeated hits for the same root cause — CLAUDE.md §6 "Known Failure Patterns").
- Ineffective-fix flag — Phase 4 auto-flag when a "fixed" issue recurs; that surfaces on `/admin/finance/insights/{system}` (column: Flags), not here.
- Severity filter narrows; resolved filter defaults to "all" (shows both resolved + open). Changing to "open" hides resolved rows and vice versa.
- Large result set — paginated 25/page; server-side doesn't paginate yet.
- Title is free text from `KbService.recordRecurrence(...)` — no in-page truncation.
- Cross-category row (e.g. `post_visibility` critical) — picked up by the Visibility Failures page banner via the same endpoint.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/admin/finance-admin.service.spec.ts` — `listExceptions`, `KbService.recordRecurrence`, reconciliation fault-injection tests per check.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useFinanceExceptions`
- `apps/web/src/lib/api/finance-admin.ts` — `getExceptions`, `listReconciliationExceptions`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatDateTime`
- `packages/shared/src/types/finance-admin.ts` — `ExceptionRow`
- Backend: `apps/api/src/modules/kb/kb.service.ts`, reconciliation engine `apps/api/src/modules/reconciliation/*`
- `md-files/knowledge-base.md` — entry schema, recurrence rules
- `docs/perf/2026-04-15-reconciliation-benchmarks.md`
- CLAUDE.md §6 — known failure patterns; §9 — automatic KB entry triggers

## Open questions / TODOs
- No row-click drilldown to the source group / KB entry — operators copy title + category and search elsewhere.
- No "mark resolved" inline action from this page; currently resolved only by re-runs or engineer intervention.
- Missing filter by `system` (category and severity only) — cross-page with Insights page would resolve this.
- Deferred review items in `docs/reviews/2026-04-15-team-lead-audit-batch-*.md` for admin-dashboard flag richer exceptions drill-down as a Phase 4+ goal.
