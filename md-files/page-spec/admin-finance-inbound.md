# Inbound Funding — `/admin/finance/inbound`

**Route path:** `/admin/finance/inbound`
**File:** `apps/web/src/app/admin/finance/inbound/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (2nd position)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Read-only triage surface for brand-initiated bounty funding via Stitch Express hosted checkout. Lets SA verify that `StitchPaymentLink` rows moved through CREATED → INITIATED → CAPTURED → SETTLED correctly and cross-check the Stitch payment id against the ledger. Exportable to CSV.

## Entry & exit
- **Reached from:** Finance sub-nav "Inbound" tab.
- **Links out to:** `/admin/bounties/{bountyId}` via the Bounty column link.

## Data
- **React Query hooks:** `useInboundFunding(100)`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/inbound?limit=100`
  - GET `/api/v1/admin/finance/exports/inbound.csv` (audited)
- **URL params:** none
- **Search params:** none (`limit` is hardcoded to 100 via hook default override)

## UI structure
- `PageHeader` with title "Inbound funding", subtitle "Brand bounty funding via Stitch hosted checkout". Actions: Download CSV, Refresh.
- Single `<Card>` wrapping a paginated `<DataTable>` (20 rows/page, stripedRows).
- Columns: Bounty (link), Status (colour-coded Tag via `STATUS_SEVERITY` map: CREATED/INITIATED=info, CAPTURED=warning, SETTLED=success, FAILED/EXPIRED=danger, REFUNDED=warning), Amount (mono cents, formatted per currency), merchantReference (mono, short), Stitch payment id (mono, may be `—`), Created timestamp.

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** DataTable native empty state (no explicit `EmptyState` component — rare in prod).
- **Error:** `ErrorState` with retry CTA.
- **Success:** `refetch()` via header button.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Download CSV | GET `/admin/finance/exports/inbound.csv` | Streams Blob, `saveBlob(csvFilename('inbound'))` |
| Refresh | `refetch()` | Re-query the inbound list |
| Bounty link | `Link` | `/admin/bounties/{bountyId}` |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger (amount stored as cents)
- AuditLog required for every mutation (this page is read-only; only the CSV download is audited)
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee
- Kill switch: this page is **read-only** and not affected by kill-switch state. Inbound ledger writes (in `StitchInboundHandler`) honour the kill switch per ADR 0006 — if active, new `CAPTURED` webhook events are deferred (logged via R36 open risk).

Page-specific:
- Surfaces **Stitch-vs-ledger** check materials (check #6 of the 7 reconciliation checks) — pairing merchantReference + stitchPaymentId with downstream `LedgerTransactionGroup` rows. The reconciliation runner joins these tables; this page gives operators the human-readable view.
- Displays **live** state; no paused/frozen view.
- No write operations from this surface.

## Edge cases
- Stitch payment id missing (status still CREATED) — column renders `—`.
- Large merchantReference — rendered in mono text-xs; no truncation (intentional; full ID needed for support).
- Currency mismatch (non-ZAR) — `formatCents` consumes `r.currency`.
- Status FAILED / EXPIRED — tagged danger; no auto-retry surfaced here (retries live in Stitch dashboard).
- Limit hardcoded at 100 — no explicit pagination cursor; operators filter by downloading full CSV for deeper history.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend service: `apps/api/src/modules/admin/finance-admin.service.spec.ts` (`listInbound`).

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useInboundFunding`
- `apps/web/src/lib/api/finance-admin.ts` — `getInbound`, `downloadExport('inbound')`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatCents`, `formatDateTime`
- `apps/web/src/lib/utils/download.ts` — `saveBlob`, `csvFilename`
- Backend: `apps/api/src/modules/stitch/stitch-inbound.handler.ts` (writes `StitchPaymentLink` + inbound ledger group)
- `md-files/payment-gateway.md` — canonical Stitch spec; `docs/STITCH-IMPLEMENTATION-STATUS.md`

## Open questions / TODOs
- No inline filter by status / date range — operators CSV-export for ad hoc analysis.
- No drill-down to the per-link ledger transaction group (would improve RCA workflow — see Exceptions page for related discussion).
