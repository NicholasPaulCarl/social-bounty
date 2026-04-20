# Refunds — `/admin/finance/refunds`

**Route path:** `/admin/finance/refunds`
**File:** `apps/web/src/app/admin/finance/refunds/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance sub-nav tab (5th position)
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx`

## Purpose
Refund-request queue across all three scenarios — pre-approval, post-approval, post-payout. SA can approve `BEFORE_APPROVAL` refunds inline (the other two scenarios fire automatically from system events like Phase 2A's auto-refund-on-visibility-failure). Export to CSV.

## Entry & exit
- **Reached from:** Finance sub-nav "Refunds" tab. Also linked from `/admin/finance/visibility-failures` (per `ADR 0010` — auto-refunds surface here).
- **Links out to:** `/admin/bounties/{bountyId}` via the Bounty column.

## Data
- **React Query hooks:** `useAdminRefunds()`, `useApproveRefundBefore()`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/refunds`
  - POST `/api/v1/refunds/{id}/approve-before` (audited — routes via the Refunds module, not the admin/finance namespace)
  - GET `/api/v1/admin/finance/exports/refunds.csv` (audited)
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with title "Refunds", subtitle "Pre-approval, post-approval, and post-payout refund requests". Actions: Download CSV, Refresh.
- Single `<Card>` wrapping a 20-row paginated `<DataTable>`, stripedRows.
- Columns: Scenario (formatted enum — BEFORE_APPROVAL / AFTER_APPROVAL / AFTER_PAYOUT), State (colour-coded Tag via `STATE_SEVERITY`: REQUESTED=info, APPROVED=warning, PROCESSING=warning, COMPLETED=success, FAILED=danger, REVERSED=warning), Bounty link (truncated id), Amount (mono cents), Reason (free text), Created (mono datetime), Actions.
- "Approve" button shown only when `state === 'REQUESTED' && scenario === 'BEFORE_APPROVAL'` → opens `<ConfirmAction>` dialog.

## States
- **Loading:** `LoadingState type="table"`
- **Empty:** Native DataTable empty row when there are no refund requests.
- **Error:** `ErrorState` with retry CTA.
- **Success:** Toast on approve + refetch.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Download CSV | GET `/admin/finance/exports/refunds.csv` | `saveBlob(csvFilename('refunds'))` |
| Refresh | `refetch()` | Re-query refunds |
| Approve (per-row, BEFORE_APPROVAL only) | POST `/refunds/{id}/approve-before` | Calls Stitch to process; webhook writes compensating ledger entries on settlement |
| Bounty link | `Link` | `/admin/bounties/{bountyId}` |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation — approve writes `REFUND_APPROVED` AuditLog; later webhook writes the compensating group
- Plan snapshot per transaction (tier not re-priced) — refund uses the snapshot from the original funding group
- Global 3.5% fee independent of tier admin fee — Stitch returns the 3.5% to `global_fee_revenue` via compensating entries (refund policy: gateway fee may or may not be recoverable depending on Stitch)
- Kill switch: refund-approval **honours** the kill switch — compensating writes bypass per ADR 0006, but the **outbound** Stitch refund call is wrapped in the kill-switch check (fail-closed: a stuck refund is better than an unrecoverable one).

Page-specific:
- No direct reconciliation check, but refunds are **compensating entries** (ADR 0006) — they're the approved path for post-facto correction. The reconciliation run surfaces any refund whose compensating group didn't land (Exceptions page).
- Displays **live** state per row; polling is not enabled.
- Write operations:
  - `approve-before` → mutates `Refund.state` REQUESTED → APPROVED + AuditLog
  - Compensating ledger write happens async on Stitch webhook

## Edge cases
- Refund in REQUESTED but scenario != BEFORE_APPROVAL — no Approve button (AFTER_APPROVAL / AFTER_PAYOUT flow auto-created and auto-processed by the system, e.g. Phase 2A visibility-failure refunds from ADR 0010).
- Refund in FAILED state — no inline retry; operators either reissue via override (Overrides page) or escalate to engineering.
- Refund in REVERSED — terminal; indicates a double-compensation was applied back out.
- Approving while kill switch is active — the approve-before call will be rejected server-side until the switch flips.
- Concurrent approve by two SAs — idempotency on the refund id makes the second call a no-op.
- Large reason text — rendered inline without truncation.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Backend: `apps/api/src/modules/refunds/refunds.service.spec.ts`, `refunds.controller.spec.ts`. Phase 2A & 3A adds visibility-failure auto-refund coverage (`submission-visibility.scheduler.spec.ts`).

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` — `useAdminRefunds`, `useApproveRefundBefore`
- `apps/web/src/lib/api/finance-admin.ts` — `getRefunds`, `approveRefundBefore`, `downloadExport('refunds')`
- `apps/web/src/components/common/PageHeader.tsx`, `ConfirmAction.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` — `formatCents`, `formatDateTime`, `formatEnumLabel`
- Backend: `apps/api/src/modules/refunds/refunds.service.ts`, `refunds.controller.ts`; visibility scheduler calls `requestAfterApproval`
- `docs/adr/0005-ledger-idempotency-via-header-table.md`, `docs/adr/0006-compensating-entries-bypass-kill-switch.md`, `docs/adr/0010-auto-refund-on-visibility-failure.md`

## Open questions / TODOs
- No inline filter by scenario / state — operators scroll or CSV-export.
- No drill-down link from the refund row to the compensating `LedgerTransactionGroup` (would deep-link to `/admin/finance/groups/{id}`).
- UX: the scenario cell is verbose; a compact icon-set could reduce visual noise.
