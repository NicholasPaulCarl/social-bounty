# Transaction History — `/wallet/transactions`

**Route path:** `/wallet/transactions`
**File:** `apps/web/src/app/(participant)/wallet/transactions/page.tsx`
**Role:** Any authenticated role (API scopes to user).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Deep-link only; reached from `/wallet` "View all".
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Full paginated wallet ledger for the user — all transactions, all types, with type + sort filters. Read-only view of the append-only ledger projection.

## Entry & exit
- **Reached from:** `/wallet` "View all" link.
- **Links out to:** `/wallet` (breadcrumb).

## Data
- **React Query hooks:** `useWalletTransactions({ page, limit, type, sortOrder })`, `useWalletDashboard()` (for currency), `usePagination()`.
- **API endpoints called:** `GET /wallet/transactions?page=…&type=…&sortOrder=…`, `GET /wallet/dashboard`.
- **URL params:** None.
- **Search params:** None.

## UI structure
- `PageHeader` "Transaction History" with breadcrumb (`Wallet > Transactions`) and toolbar (Type filter, Sort filter, clear button).
- DataTable (min-w-[700px]): Date, Type (colored pill per `TYPE_CONFIG`), Description, Amount (signed green/red mono), Balance After (mono).
- `Paginator` under table.

## States
- **Loading:** `LoadingState type="table" rows={10} columns={5}`.
- **Empty:** `EmptyState` — List icon + "Nothing here yet" + "Your earnings history will show up once you start hunting."
- **Error:** `ErrorState` with retry.
- **Success:** Table hydrates.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Type filter | `setTypeFilter(val)` + `resetPage()` | Refetches |
| Sort filter | `setSortOrder(val)` | Refetches |
| Clear filters | Resets both + `resetPage()` | Refetches defaults |

## Business rules
- Append-only ledger projection — no inline actions (no edit/delete/dispute from here).
- CREDIT + RELEASE colored green and rendered `+`; DEBIT + HOLD + CORRECTION red/`-`.
- Currency sourced from wallet dashboard (falls back to `'ZAR'`).

## Edge cases
- Currency hook fails → hard-coded fallback `'ZAR'`.
- Empty data → EmptyState.
- Very long descriptions → not truncated; table scrolls horizontally.

## Tests
No colocated tests.

## Related files
- `@/hooks/useWallet`
- Shared: `WalletTxType`, `WalletTransactionListItem`

## Open questions / TODOs
- No date-range filter; may be useful once volumes grow.
- No CSV export.
