# Payouts — `/admin/finance/payouts`

**Route path:** `/admin/finance/payouts`
**File:** `apps/web/src/app/admin/finance/payouts/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** **Deep-link only** — not in the Finance sub-nav bar (per `docs/architecture/sitemap.md` line 156). Reached from the Earnings & Payouts tab's context or per-hunter drilldowns; referenced in the sitemap as `→` arrow.
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Platform-wide list of `StitchPayout` rows — every hunter payout with status, amount, attempts, last error, and next retry time. SA can retry FAILED or RETRY_PENDING rows. Because `PAYOUTS_ENABLED=false` in the current MVP, retry is logged as an intent but moves no funds (explicit `<Message>` banner at the top). <!-- historical -->

## Entry & exit
- **Reached from:** Direct URL / `/admin/finance/earnings-payouts` (deep-link, no explicit anchor in the current UI).
- **Links out to:** No inline drilldowns — `Retry` mutates in place; to trace a payout's ledger group the operator opens `/admin/finance/groups/{transactionGroupId}` directly.

## Data
- **React Query hooks:** `usePayoutsAdmin(page, limit)`, `useRetryPayoutAdmin()`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/payouts?page=&limit=`
  - POST `/api/v1/payouts/{id}/retry` (audited — retries bypass the Finance namespace and hit the payouts controller directly)
- **URL params:** none
- **Search params:** none (pagination is stored in React state, not URL)

## UI structure
- `PageHeader` with title "Payouts", subtitle "All hunter payouts platform-wide (StitchPayout)". Action: Refresh. <!-- historical -->
- Info `<Message>` banner: "Hunter payouts to TradeSafe are pending (ADR 0009). `PAYOUTS_ENABLED` is currently false; retry will log an intent but no funds will move."
- `<Card>` wrapping a lazy-loaded `<DataTable>` (25 rows/page), server-paginated via `totalRecords` + `first` + `onPage`.
- Columns: Status (colour-coded Tag — SETTLED=success, INITIATED/CREATED=info, FAILED=danger, RETRY_PENDING=warning, CANCELLED=null), Amount (mono cents per currency), Hunter (name + email stacked), Attempts, Last error (truncated 60 chars, danger tone, title-tooltip), Next retry (mono datetime), Created (mono datetime), Retry CTA.
- Retry button shown only for FAILED / RETRY_PENDING rows → opens `<ConfirmAction>` dialog.

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** Native DataTable empty when no payouts have ever been attempted.
- **Error:** `ErrorState` with retry CTA.
- **Success:** Toast + refetch after retry mutation.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetch()` | Re-query current page |
| Retry (per-row) | POST `/payouts/{id}/retry` | Resets `attempts=0`, clears `nextRetryAt`, requeues for next batch; audited |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation — Retry writes an AuditLog row with action=`PAYOUT_RETRIED`
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee
- Kill switch: Retry **honours** the kill switch — if active, the payout will not actually dispatch (adapter gates via `PAYOUTS_ENABLED=false` in addition per ADR 0008/0009). Per ADR 0006 only compensating entries (Overrides) bypass the switch.

Page-specific:
- Surfaces reconciliation check **#6: payouts-vs-ledger** via the wire-level `StitchPayout.status` column. Any divergence between `INITIATED`/`SETTLED` rows and `payout_in_transit`/`hunter_paid` ledger balances is flagged on Exceptions. The `R32` closure (CLAUDE.md 2026-04-18) generalised this check to cover TradeSafe via the new `StitchPayout.provider` column (default `STITCH`). <!-- historical -->
- Displays **live** status per row — polling is not enabled (manual Refresh).
- Write operations: Retry → AuditLog; no ledger mutation on retry itself (ledger writes happen on the subsequent webhook).

## Edge cases
- `PAYOUTS_ENABLED=false` — banner surfaced; retry still hits the endpoint but the adapter short-circuits.
- Row status CANCELLED — terminal bad state; no retry CTA.
- Concurrent retry by another SA — idempotency key prevents double-dispatch; the second retry is a no-op with the same `nextRetryAt`.
- Last error exceeds 60 chars — truncated in cell; full text in `title` attribute.
- Pagination across a large result set — 25/page lazy-fetch; jumping pages re-fires the query.
- TradeSafe provider row (post-R37 close) — same schema; `provider` column deferred for UI exposure per R37 (open).

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/payouts/payouts.controller.spec.ts` (retry path), `apps/api/src/modules/payouts/payouts.service.spec.ts`; R34 adds 15 TradeSafe webhook handler tests + 1 router dispatch test.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `usePayoutsAdmin`, `useRetryPayoutAdmin`
- `apps/web/src/lib/api/finance-admin.ts` — `listPayouts`, `retryPayout`
- `apps/web/src/components/common/PageHeader.tsx`, `ConfirmAction.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatCents`, `formatDateTime`, `truncate`
- `packages/shared/src/types/finance-admin.ts` — `AdminPayoutRow`, `AdminPayoutListResponse`
- Backend: `apps/api/src/modules/payouts/*`, `apps/api/src/modules/tradesafe/tradesafe-webhook.handler.ts`
- `docs/adr/0008-tradesafe-for-hunter-payouts.md`, `docs/adr/0009-tradesafe-integration-skeleton.md`

## Open questions / TODOs
- No provider column shown (STITCH vs TRADESAFE discriminator from R32) — operators can't filter by rail yet. <!-- historical -->
- R24 (TradeSafe creds — external blocker) and R37 (multi-recipient payout shape) still open; page will need amendment post-go-live.
- Sitemap notes this page is deep-link; no explicit "Payouts" CTA from Earnings & Payouts currently — minor navigation gap.
- `PAYOUTS_ENABLED` gate duplicated in copy + backend — ensure banner is removed once flipped.
