# Earnings & Payouts — `/admin/finance/earnings-payouts`

**Route path:** `/admin/finance/earnings-payouts`
**File:** `apps/web/src/app/admin/finance/earnings-payouts/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (4th position)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Rollup view of hunter-side ledger account totals across the payout pipeline: Pending → Net payable → Clearing → Available → In transit → Paid. Gives SA an at-a-glance snapshot of where hunter money sits in the state machine. Read-only.

## Entry & exit
- **Reached from:** Finance sub-nav "Earnings & Payouts" tab.
- **Links out to:** No inline drilldowns — `/admin/finance/payouts` (deep-link only, not in nav) is the per-payout triage view. Operators drill into specific hunters via `/admin/users/[id]`.

## Data
- **React Query hooks:** `useEarningsPayouts()`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/earnings-payouts`
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with title "Earnings & payouts", subtitle "Hunter-side ledger totals across the payout pipeline". Action: Refresh.
- Single `<Card>` wrapping a fixed-order `<DataTable>` with 6 rows, one per hunter account:
  1. `hunter_pending` — "Pending (gross, awaiting split)"
  2. `hunter_net_payable` — "Net payable (in clearance)"
  3. `hunter_clearing` — "Clearing (held / clawback)"
  4. `hunter_available` — "Available (eligible for payout)"
  5. `payout_in_transit` — "In transit (sent to Stitch)" <!-- historical -->
  6. `hunter_paid` — "Paid (settled to bank)"
- Columns: Account (mono), What it means (label), Total cents (mono, `formatCents`).

## States
- **Loading:** `LoadingState type="cards-grid" cards={4}` (misnamed for this page — loading style inherits the dashboard cards skeleton).
- **Empty:** Rows always present (even with `0` totals) — no explicit empty state.
- **Error:** `ErrorState` with retry CTA.
- **Success:** Rows mapped from `ACCOUNT_ORDER` against the API response keyed by account name (missing key → `'0'`).

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetch()` | Re-query earnings/payouts rollup |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation (this page is read-only)
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee — the 3.5% sits in `global_fee_revenue` (separate account, not shown here); `hunter_pending` / `hunter_net_payable` already have it deducted.
- Kill switch: read-only surface, unaffected.

Page-specific:
- Supports reconciliation check **#5 wallet-projection drift** — the wallet read-model (ADR 0002) should sum to these totals; a mismatch is flagged on Exceptions.
- Also informs **#6 payouts-vs-ledger** — `payout_in_transit` should equal the sum of `StitchPayout.INITIATED` rows in cents (verifiable by joining `/admin/finance/payouts`). <!-- historical -->
- Displays **live** balances; no paused view.
- No write operations from this surface.

## Edge cases
- All accounts at `'0'` — fresh platform / staging seed; nothing to investigate.
- `hunter_paid` is a terminal account; it grows monotonically. Any decrement is a correctness bug (surfaces on Exceptions).
- `PAYOUTS_ENABLED=false` — `payout_in_transit` and `hunter_paid` stay flat even with approved submissions; `hunter_available` accumulates. This is the expected MVP-gated state.
- Concurrent payout batch running — totals may briefly show money "in flight" between `hunter_available` → `payout_in_transit` (not a drift).
- Multi-currency deferred; amounts are implicitly ZAR.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/admin/finance-admin.service.spec.ts` — `getEarningsPayouts`.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useEarningsPayouts`
- `apps/web/src/lib/api/finance-admin.ts` — `getEarningsPayouts`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatCents`
- Backend: `apps/api/src/modules/admin/finance-admin.service.ts` (earnings/payouts rollup query)
- `docs/adr/0002-wallet-read-model-projection.md`
- `md-files/financial-architecture.md`

## Open questions / TODOs
- `LoadingState` variant `cards-grid` is visually odd for a 6-row table; mismatch noted but low-priority.
- No drill-down — per-hunter breakdown currently requires navigating to `/admin/users/{id}` and reading their hunter earnings page.
- Multi-currency labels would need a pivot column if enabled.
