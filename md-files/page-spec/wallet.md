# Wallet — `/wallet`

**Route path:** `/wallet`
**File:** `apps/web/src/app/(participant)/wallet/page.tsx`
**Role:** Any authenticated role (hunter-focused; ledger scoped to user).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Sidebar "Wallet" (participant).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`. Also `md-files/financial-architecture.md` (ledger journey underpinnings) and `claude.md` §4 Financial Non-Negotiables.

## Purpose
Dashboard with the hunter's ledger lifecycle (pending → clearing → available → paid), three balance cards (available/pending/total), historical totals (earned / withdrawn), and recent wallet transactions. Primary CTA is "Withdraw".

## Entry & exit
- **Reached from:** Sidebar nav, submission "Paid" notifications.
- **Links out to:** `/wallet/withdraw` (Withdraw CTA), `/wallet/transactions` (View all).

## Data
- **React Query hooks:** `useWalletDashboard()`, `useWalletLedgerSnapshot()`.
- **API endpoints called:** `GET /wallet/dashboard`, `GET /wallet/ledger-snapshot` (the latter feeds the 4-column "Ledger journey" panel — all values as integer minor-unit strings).
- **URL params:** None.
- **Search params:** None.

## UI structure
- `PageHeader` "Wallet — your earnings, cash out anytime" with Withdraw action (ArrowUpRight, success).
- Ledger journey card (glass-card, 4-col grid): Pending (Hourglass/warn), Clearing (Clock/pink/info), Available (CheckCircle2/success), Paid (Wallet/secondary). Each shows a `Tag` pill, minor-unit-formatted amount, description. Footer clarifies clearance rules (free 72h, pro instant, payouts every 10 min).
- Balance cards row: Available (success emphasis, `metric !text-4xl`, takes extra span at lg), Pending (warning), Total (pink neutral).
- Historical totals row: Total earned (pink ArrowDown), Total withdrawn (slate ArrowUp).
- Recent transactions card: list of up to 10 with `TxTypeLabel` (Credit/Debit/Hold/Release/Correction), description, created date, signed amount (success for CREDIT/RELEASE, danger otherwise), balance-after. "View all" link to `/wallet/transactions`.

## States
- **Loading:** `LoadingState type="page"` for dashboard; individual `animate-pulse` placeholders on ledger journey stage cards while snapshot loads.
- **Empty:** "No wallet yet" shell when dashboard hook returns nothing (Wallet icon); recent transactions fallback inline ("No transactions yet" + Inbox icon).
- **Error:** `ErrorState` with retry on dashboard error.
- **Success:** All cards hydrate.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Withdraw | `router.push('/wallet/withdraw')` | Request form |
| View all | `Link href="/wallet/transactions"` | Full ledger |

## Business rules
- **Financial Non-Negotiables (`claude.md` §4):** minor-unit integers (cents), no floats, read-only projection.
- TODO comment in `buildJourneyStages`: projection doesn't yet split `hunter_pending` vs `hunter_clearing` vs `hunter_net_payable`. For now `pendingCents` feeds Clearing; Pending displays zero.
- Free hunters: 72h clearance after approval. Pro hunters: instant. Payouts run every 10 minutes.
- Credit + Release treated as inbound (green +); everything else outbound (red -).

## Edge cases
- No wallet yet → "Complete a bounty to activate your wallet" shell (no withdraw).
- Zero recent transactions → inline empty row inside card.
- Kill switch active for outbound payments affects withdrawal page (not this dashboard).

## Tests
No colocated tests.

## Related files
- `@/hooks/useWallet` — `useWalletDashboard`, `useWalletLedgerSnapshot`, `useRequestWithdrawal` (used on withdraw page)
- Shared: `WalletTxType`, `WalletTransactionListItem`, `LedgerWalletSnapshot`
- `@/lib/utils/format` — `formatCurrency`, `formatCents`, `formatDate`

## Open questions / TODOs
- Ledger projection split (pending vs clearing vs net payable) is flagged as a TODO.
- No refresh button; data re-fetches on mount only.
