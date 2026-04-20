# Admin wallets list — `/admin/wallets`

**Route path:** `/admin/wallets`
**File:** `apps/web/src/app/admin/wallets/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** Finance → Wallets
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/financial-architecture.md` (wallet read-model), `docs/adr/0002-wallet-read-model-projection.md`.

## Purpose
Paginated list of hunter (participant) wallets with balance snapshot — available, pending, total earned, total withdrawn. Entry point to per-wallet transaction ledger + adjustment form.

## Entry & exit
- **Reached from:** admin sidebar → Wallets.
- **Links out to:** `/admin/wallets/[userId]` (row click).

## Data
- **React Query hooks:** `useAdminWallets({ page, limit, search })`.
- **API endpoints called:** `GET /api/v1/admin/wallets`.
- **URL params:** none.
- **Search params (via `usePagination`):** `page`, `limit`; `search` in local state.

## UI structure
- `PageHeader` subtitle "View and manage hunter wallet balances" + toolbar: single search ("Search by name or email...") + clear-filters.
- `glass-card` wrapping DataTable (min-w-[700px]): User (name + email stacked), Balance (success-600 semibold currency), Pending (warning-600 currency), Total Earned, Total Withdrawn. Row click → `/admin/wallets/:userId` (cursor-pointer).
- `Paginator` below.
- `EmptyState` (Wallet icon) when empty.

## States
- **Loading:** `LoadingState type="table" rows={10} columns={5}`.
- **Empty:** `EmptyState` "No wallets found" / "Try adjusting your search."
- **Error:** `ErrorState` with `refetch()`.
- **Success:** table + paginator.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Row click | `router.push('/admin/wallets/:userId')` | Wallet ledger + adjust panel |
| Search | `setSearch(value); resetPage()` | Refetch |

## Business rules
- RBAC: SUPER_ADMIN-only.
- Read-only list — all mutations happen on detail (`adjust` endpoint).
- Wallet read-model is a projection off the append-only ledger (ADR 0002) — balances here are snapshot-cached.
- **Kill switch** (`SystemSetting.financial.kill_switch.active`) is not surfaced on this list but is gate-checked on the detail adjust path via the ledger service.

## Edge cases
- Brand-admin / super-admin users do not appear (only hunters/participants have wallets).
- Search by partial name or email — server-side ILIKE.
- Currency per-wallet (ZAR typical) — each row renders its own currency code.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useWallet.ts` — `useAdminWallets`.
- `apps/api/src/modules/wallet/wallet.service.ts`.
- `apps/web/src/lib/utils/format.ts` — `formatCurrency`.

## Open questions / TODOs
- No filter by balance threshold (e.g., "balance > R1000") — would help payout-triage.
- No negative-balance surface (should theoretically be impossible post-ADR-0005 idempotency fixes, but a safety net panel would be useful).
