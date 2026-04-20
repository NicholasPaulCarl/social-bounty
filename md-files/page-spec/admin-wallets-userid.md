# Admin wallet detail — `/admin/wallets/[userId]`

**Route path:** `/admin/wallets/[userId]`
**File:** `apps/web/src/app/admin/wallets/[userId]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** deep-link only
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/financial-architecture.md`, `docs/adr/0002-wallet-read-model-projection.md`, `docs/adr/0005-ledger-idempotency-via-header-table.md`, CLAUDE.md §4 (financial non-negotiables).

## Purpose
Single-user wallet ledger view with 4 balance stat cards, recent-transactions table, and the admin-only **Adjust Balance** form (credit/debit with mandatory ≥10-char reason) — every adjustment writes a compensating ledger entry.

## Entry & exit
- **Reached from:** `/admin/wallets` row click.
- **Links out to:** `/admin/finance/groups/[transactionGroupId]` recommended (not wired from this page today — each ledger row would be a natural candidate for a drilldown link).

## Data
- **React Query hooks:** `useAdminWallet(userId)`, `useAdminAdjustWallet(userId)`.
- **API endpoints called:** `GET /api/v1/admin/wallets/:userId`, `POST /api/v1/admin/wallets/:userId/adjust`.
- **URL params:** `userId` (user UUID).
- **Search params:** none.

## UI structure
- `PageHeader` title (userName) + subtitle (userEmail) + breadcrumbs (Wallets → userName).
- Balance stat grid (1/2/4 cols): Available (success-600, boxed border-success), Pending (warning-600), Total earned (pink-600), Total withdrawn (slate-700). Each uses `.eyebrow` + `font-mono tabular-nums` 2xl.
- Two-column `grid lg:grid-cols-3`:
  - Left (`span-2`) "Recent Transactions" — DataTable (min-w-[500px]): Date (font-mono), Type (coloured chip: CREDIT/DEBIT/HOLD/RELEASE/CORRECTION per `TYPE_CONFIG`), Description, Amount (signed +/-, success/danger colour), Balance After. `EmptyState` (List icon) when empty.
  - Right "Adjust Balance" — `glass-card` form: amount (`InputNumber currency mode` with +/- buttons, min −999999, max 999999), reason textarea (min 10 chars, char counter), inline error/success Messages (`AlertTriangle` / `Check`), "Apply adjustment" submit button.

## States
- **Loading:** `LoadingState type="page"`.
- **Empty (transactions):** `EmptyState` "No transactions" / "This wallet has no transactions yet."
- **Error:** `ErrorState` with `refetch()`.
- **Success:** stats + ledger + adjust form.
- **Validation:** client guards `adjAmount` non-zero and `adjReason.length >= 10`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Apply adjustment | `adjustWallet.mutate({ amount, reason })` | POST; on success clears form + inline success; creates compensating ledger entry + AuditLog |

## Business rules
- RBAC: SUPER_ADMIN-only throughout.
- **Double-entry preserved (CLAUDE.md §4.1)** — backend writes a balanced `LedgerTransactionGroup` with the adjustment + offset; no direct row update on the projection.
- **Idempotency (§4.2)** — enforced via `UNIQUE(referenceId, actionType)`; replaying the same request is a no-op.
- **Integer minor units (§4.4)** — `amount` passed as integer cents.
- **Append-only (§4.5)** — adjustment is a compensating entry, never an update/delete.
- **AuditLog required (§4.6 + Hard Rule #3)** — backend persists `ADJUST wallet` with actor id and reason.
- **Kill switch** (`SystemSetting.financial.kill_switch.active`) — when active, backend `LedgerService.isKillSwitchActive()` blocks the mutation (defence-in-depth).
- Payout rail gate: wallet adjustments don't interact with TradeSafe outbound (`PAYOUTS_ENABLED=false`); they stay in platform custody until the user requests a withdrawal (`/admin/withdrawals`).

## Edge cases
- Negative amount debits the wallet — banking-style, intentional for corrections.
- Amount zero — blocked with "Please enter a non-zero amount."
- Reason <10 chars — blocked; char counter visible.
- User doesn't exist — `useAdminWallet` errors and `ErrorState` renders.
- Transaction-group drilldown not wired from each row yet — note `commit 2eb7a0a` fixed the detail page's audit-log shape (`TransactionGroupDetail`).

## Tests
Integration-only (but ledger idempotency has a 5-test matrix per Hard Rule §5).

## Related files
- `apps/web/src/hooks/useWallet.ts` — `useAdminWallet`, `useAdminAdjustWallet`.
- `apps/api/src/modules/wallet/wallet.service.ts`.
- `apps/api/src/modules/ledger/ledger.service.ts` — `runInTx` + `postTransactionGroup`.
- `apps/web/src/lib/utils/format.ts` — `formatCurrency`, `formatDateTime`.

## Open questions / TODOs
- Transaction rows not clickable — a link to `/admin/finance/groups/[transactionGroupId]` would surface the double-entry detail.
- Form inputs don't clear on error (only success) — could leave stale state on repeated failures.
- No "impersonate user" or "view user" shortcut from here (user could be reached via `/admin/users/[id]`).
