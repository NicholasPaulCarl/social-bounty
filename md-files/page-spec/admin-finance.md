# Finance Overview — `/admin/finance`

**Route path:** `/admin/finance`
**File:** `apps/web/src/app/admin/finance/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance section (primary entry) in main sidebar (`lib/navigation.ts`); first tab in the Finance sub-nav (`admin/finance/layout.tsx`).
**Layout:** `apps/web/src/app/admin/layout.tsx` → `apps/web/src/app/admin/finance/layout.tsx` (tab bar)

## Purpose
Single-pane-of-glass for platform financial state. Surfaces live kill-switch status, open reconciliation exceptions, balances per ledger account, and the latest 20 ledger transaction groups. Drives the manual reconciliation run and kill-switch toggle. Referenced in CLAUDE.md as the page whose `getDashboard()` was collapsed from 23 parallel `count()` round-trips to 6 `groupBy` queries (commit `6e110ca`) — load ~30-50 ms.

## Entry & exit
- **Reached from:** Finance menu in admin sidebar (parent group href).
- **Links out to:**
  - `/admin/finance/groups/{id}` (row click in recent transaction groups table)
  - Finance sub-nav tabs via `admin/finance/layout.tsx` (Inbound / Reserves / Earnings & Payouts / Refunds / Payouts / Subscriptions / Visibility Failures / Exceptions / Audit Trail / Overrides / Insights)

## Data
- **React Query hooks:** `useFinanceOverview()` (polls every 15 s), `useToggleKillSwitch()`, `useRunReconciliation()`
- **API endpoints called:**
  - GET `/api/v1/admin/finance/overview`
  - POST `/api/v1/admin/finance/kill-switch` (audited)
  - POST `/api/v1/admin/finance/reconciliation/run` (audited)
  - GET `/api/v1/admin/finance/exports/ledger.csv` (audited, 7-day window via `?since=`)
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with title "Finance overview", subtitle "Live ledger balances, exceptions, and Kill Switch control". Actions: Refresh / Run reconciliation / Download ledger CSV (7-day window).
- Red `<Message severity="error">` banner when kill switch is active ("All non-compensating ledger writes are blocked").
- Reconciliation result banner (success when 0 findings, warn otherwise; flags `killSwitchActivated` if auto-tripped).
- Three stat cards: Kill Switch (tag + toggle CTA), Open exceptions (count of unresolved `RecurringIssue`), Recent groups (count of last 20).
- "Balances by account" DataTable — ledger account name + formatted cents balance (`hunter_pending`, `hunter_available`, `brand_reserve`, `global_fee_revenue`, etc.).
- "Recent transaction groups" DataTable — clickable rows routing to `/admin/finance/groups/{id}`. Columns: action, referenceId (mono), description, totalCents, createdAt.
- Kill-Switch confirmation `Dialog` with required ≥10-char reason `InputTextarea`.

## States
- **Loading:** `LoadingState type="cards-grid" cards={4}`
- **Empty:** Rendered empty balances table when no ledger data (edge case pre-production seed).
- **Error:** `ErrorState` with retry CTA.
- **Success:** refetches every 15 s; mutations toast + re-invalidate the overview query.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Refresh | `refetch()` | Force revalidation of overview query |
| Run reconciliation | POST `/admin/finance/reconciliation/run` | Returns `findings[]` + `killSwitchActivated` flag; 7 reconciliation checks executed server-side |
| Download ledger CSV | GET `/admin/finance/exports/ledger.csv?since=…` | Streams Blob for last 7 days, downloaded via `saveBlob` |
| Activate / Deactivate Kill Switch | POST `/admin/finance/kill-switch` with `{ active, reason }` | Flips `SystemSetting.financial.kill_switch.active`; audit log written |
| Row click (recent groups) | `router.push` | `/admin/finance/groups/{id}` |

## Business rules
Reference CLAUDE.md §4 Financial Non-Negotiables:
- Double-entry, idempotent via `UNIQUE(referenceId, actionType)`, transaction-group integrity
- Integer minor units, append-only ledger
- AuditLog required for every mutation (kill-switch toggle + reconciliation run both audited)
- Plan snapshot per transaction (tier not re-priced)
- Global 3.5% fee independent of tier admin fee (surfaces as own row in `balancesByAccount`: `global_fee_revenue`)
- Kill switch: `SystemSetting.financial.kill_switch.active` — toggled here. Regular ledger writes honour it; compensating entries (Overrides page) bypass it per ADR 0006.

Page-specific:
- Surfaces **all 7 reconciliation checks** transitively through the Run reconciliation CTA — the backend returns aggregate `findings[]`. Individual check drill-downs live on Reserves (reserve-vs-bounty), Exceptions (group-balance / duplicate / missing-legs / status-consistency / wallet-projection / payouts-vs-ledger).
- Shows **live** vs paused state via `killSwitchActive` flag + red banner.
- Write operations: (a) kill-switch toggle → audit log with reason, (b) reconciliation run → audit log + may auto-activate the kill switch when a critical finding fires.

## Edge cases
- Empty reconciliation result (0 findings) — green success banner; overview unchanged.
- Kill switch already active — CTA flips to "Deactivate"; reason still required for audit trail.
- Reconciliation auto-activates kill switch — banner copy explicitly calls this out.
- Concurrent kill-switch toggle from another admin — last-write-wins; `refetch()` after mutation picks up the settled state.
- CSV download fails (network / 500) — toast with error message; button re-enabled.

## Tests
Integration-only convention per finance-pages; no colocated `page.test.tsx`. Core logic lives in the hooks and backend `FinanceAdminService`. Relevant backend specs: `apps/api/src/modules/admin/finance-admin.service.spec.ts`, reconciliation runner specs.

## Related files
- `apps/web/src/hooks/useFinanceAdmin.ts` (all queries/mutations)
- `apps/web/src/lib/api/finance-admin.ts` (API client)
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/utils/format.ts` (`formatCents`, `formatDateTime`)
- `apps/web/src/lib/utils/download.ts` (`saveBlob`, `csvFilename`)
- `apps/web/src/app/admin/finance/layout.tsx` (sub-nav tab bar)
- Backend: `apps/api/src/modules/admin/finance-admin.service.ts` (6-query `getDashboard` — CLAUDE.md commit `6e110ca`)
- `docs/adr/0005-ledger-idempotency-via-header-table.md`, `docs/adr/0006-compensating-entries-bypass-kill-switch.md`

## Open questions / TODOs
- Stat cards grid is currently 3-up; see `docs/reviews/2026-04-15-team-lead-audit-batch-*.md` for admin-dashboard deferred items (confidence-score gauge integration into overview is deferred — currently lives on `/admin/finance/insights`).
- Ledger export hardcoded to 7-day window; filter UI deferred.
