# Admin withdrawals — `/admin/withdrawals`

**Route path:** `/admin/withdrawals`
**File:** `apps/web/src/app/admin/withdrawals/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance → Withdrawals
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/payment-gateway.md`, `md-files/financial-architecture.md` (clearance + payout), `docs/adr/0008-tradesafe-for-hunter-payouts.md`, `docs/adr/0009-tradesafe-integration-skeleton.md`, CLAUDE.md §4 (kill switch, payouts), `docs/deployment/tradesafe-live-readiness.md`.

## Purpose
Queue + state-machine surface for withdrawal (payout) requests: REQUESTED → PROCESSING → COMPLETED/FAILED. Super-admin actions mark transitions; COMPLETE captures optional proof URL; FAIL requires a reason.

## Entry & exit
- **Reached from:** admin sidebar → Withdrawals.
- **Links out to:** none directly (Complete dialog has no drilldown; row click not wired).

## Data
- **React Query hooks:** `useAdminWithdrawals({ page, limit, status })`, `useAdminProcessWithdrawal()`, `useAdminCompleteWithdrawal()`, `useAdminFailWithdrawal()`.
- **API endpoints called:** `GET /api/v1/admin/withdrawals`, `PATCH /api/v1/admin/withdrawals/:id/process`, `PATCH /api/v1/admin/withdrawals/:id/complete` (body: `{ proofUrl? }`), `PATCH /api/v1/admin/withdrawals/:id/fail` (body: `{ reason }`).
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; `statusFilter` pill held in local state.

## UI structure
- `PageHeader` pills: All / Requested / Processing / Completed / Failed / Cancelled (filter by status enum).
- `glass-card` DataTable (min-w-[800px]): User (name + email stacked), Amount (font-mono tabular-nums), Method (formatted payout method), Status chip (per `STATUS_CONFIG` — REQUESTED pink, PROCESSING warning, COMPLETED success, FAILED danger, CANCELLED slate), Requested date, Actions column.
- Actions column (row-state-dependent):
  - REQUESTED → "Process" button (warning outlined) → `ConfirmAction` "Mark as Processing".
  - PROCESSING → "Complete" (success outlined) + "Fail" (danger outlined). Complete opens `Dialog` with optional Proof URL input; Fail opens `ConfirmAction` with `requireReason reasonMinLength={10}`.
- `Paginator` below.
- `EmptyState` (Banknote icon, "No payouts pending", "All squared up — no withdrawal requests in this view.") when empty.

## States
- **Loading:** `LoadingState type="table" rows={10} columns={6}`.
- **Empty:** `EmptyState`.
- **Error:** `ErrorState` with `refetch()`.
- **Success:** table + actions.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Process | `processWithdrawal(id)` | PATCH; status → PROCESSING; AuditLog; no funds move yet |
| Complete | `completeWithdrawal({ id, data: { proofUrl } })` | PATCH; status → COMPLETED; AuditLog + ledger entry (release from hold to external) |
| Fail | `failWithdrawal({ id, data: { reason } })` | PATCH; status → FAILED; AuditLog; funds returned to available balance |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Destructive-action confirmation (Hard Rule #6)** — Process, Complete, Fail all go through dialogs; Fail requires a reason (≥10 chars).
- **Audit log mandatory (Hard Rule #3)** — every transition.
- **Payout rail gates:**
  - `PAYOUTS_ENABLED=false` flag still gates live TradeSafe calls (ADR 0008/0009). While off, "Complete" is a manual-proof attestation rather than a live-rail release — the admin enters a proof URL of the out-of-band transfer.
  - When flipped on, the complete path integrates with TradeSafe webhook (`R34` closed) via `StitchPayout.provider` rail discriminator (`R32` closed with new PayoutRail enum). <!-- historical -->
- **Kill switch visibility:** the kill switch (`SystemSetting.financial.kill_switch.active`) is **not** shown here — its live surface is `/admin/payments-health` + `/admin/finance` — but the backend respects it (disabled Complete path on the ledger service).
- Withdrawal state-machine is strict — can't jump states (e.g., REQUESTED → COMPLETED direct); admin must Process first.

## Edge cases
- Status filter "all" → status omitted from query; otherwise query-stringified.
- Proof URL optional — admin may complete without one (e.g., for cash-equivalent rails).
- Fail reason <10 chars blocked client-side.
- Multiple withdrawals for same user — no visual grouping.
- CANCELLED is terminal (user-cancelled); no admin action shown.

## Tests
Integration-only (backend 5-test idempotency matrix per Hard Rule §5 applies to the ledger-touching endpoints).

## Related files
- `apps/web/src/hooks/useWallet.ts` — withdrawal mutation hooks.
- `apps/api/src/modules/wallet/wallet.service.ts` — transition methods.
- `apps/web/src/components/common/ConfirmAction.tsx`.
- `apps/web/src/lib/utils/format.ts` — `formatCurrency`, `formatPayoutMethod`.

## Open questions / TODOs
- No bulk select (can't approve N withdrawals at once).
- No provider rail column (STITCH vs TRADESAFE) — would surface `StitchPayout.provider` once live. <!-- historical -->
- No visibility into kill-switch state alongside Complete/Fail buttons (admin could hit it blind).
- Dialog for "Complete" doesn't ask for rail — currently implicit (STITCH default). <!-- historical -->
