# Request Withdrawal — `/wallet/withdraw`

**Route path:** `/wallet/withdraw`
**File:** `apps/web/src/app/(participant)/wallet/withdraw/page.tsx`
**Role:** Any authenticated role (participant-facing; API enforces owner).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** `/wallet` Withdraw CTA.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`, `claude.md` §4 Financial Non-Negotiables, `md-files/payment-gateway.md` (outbound-rail clearance / kill switch rules). Note: the dedicated Stitch-backed banking flow lives at `/settings/payouts`; this page captures a one-off destination per request. <!-- historical -->

## Purpose
Request a one-off withdrawal against the hunter's available balance. Enforces min/max bounds, method-specific destination fields (PayPal / Bank transfer / E-wallet), and shows balance up-front.

## Entry & exit
- **Reached from:** `/wallet` Withdraw CTA.
- **Links out to:** `/wallet` (cancel / post-success).

## Data
- **React Query hooks:** `useWalletDashboard()`, `useRequestWithdrawal()`.
- **API endpoints called:** `GET /wallet/dashboard`, `POST /wallet/withdrawals` (payload: `RequestWithdrawalRequest`).
- **URL params:** None.
- **Search params:** None.

## UI structure
- `PageHeader` "Request Withdrawal — cash out your earnings" with breadcrumb (`Wallet > Withdraw`).
- Narrow column (max-w-xl) containing a single glass-card form:
  - Available balance pill (success-tinted).
  - Amount `InputNumber` (currency mode, locale `en-ZA`, min `R50`, max `min(R50 000, available)`).
  - Method `Dropdown` (PayPal / Bank Transfer / E-Wallet — all `PayoutMethod` enum).
  - Dynamic destination fields:
    - **PAYPAL**: email.
    - **BANK_TRANSFER**: 4-field grid — Bank Name, Branch Code, Account Number, Account Holder Name.
    - **E_WALLET**: Wallet ID / phone number.
  - Inline form error (AlertTriangle icon + red tint).
  - Cancel + Request buttons (Request uses Send icon, success severity).

## States
- **Loading:** `LoadingState type="page"`.
- **Empty:** N/A (shell covers zero balance via validation).
- **Error:** `ErrorState` on dashboard fetch; inline form error on submit failure.
- **Success:** `router.push('/wallet')`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Cancel | `router.push('/wallet')` | Back to dashboard |
| Request | `requestWithdrawal(payload)` | POST + navigate |

## Business rules
- **Financial Non-Negotiables (`claude.md` §4):** backend enforces double-entry, idempotency (`UNIQUE(referenceId, actionType)`), platform-custody pattern, integer minor units, append-only ledger, AuditLog, retry-safe webhooks.
- **Kill-switch dependency:** if Finance kill switch is active, API rejects the request (backend `LedgerService.isKillSwitchActive()`); UI surfaces whatever message comes back.
- **KYB / payout-rail dependency:** outbound rail is gated by `PAYOUTS_ENABLED` flag; also requires beneficiary verification (handled separately via `/settings/payouts`). TradeSafe live integration is currently out of scope (ADR 0009 — `PAYOUTS_ENABLED=false`).
- **Amount bounds:** `MIN_AMOUNT = 50`, `MAX_AMOUNT = 50_000`, capped by available balance.
- **Method-specific validation:** `validateDestination()` requires: PayPal email | full bank quartet | e-wallet ID.

## Edge cases
- `amount > available` → inline error.
- Any destination field blank → inline error, submit blocked.
- Backend rejects (kill switch / beneficiary missing / throttle) → inline form error from `err.message`.
- Method switched mid-fill → `setDestination({})` wipes previous fields.

## Tests
No colocated tests.

## Related files
- `@/hooks/useWallet` — `useRequestWithdrawal`
- Shared: `PayoutMethod`, `RequestWithdrawalRequest`
- `@/lib/utils/format` — `formatCurrency`

## Open questions / TODOs
- No distinction at the UI level between "kill switch active" vs "general error" — both surface as the backend message.
- Saving a beneficiary for reuse lives at `/settings/payouts`; this page does not tie into that beneficiary record (destinations entered here are per-request).
