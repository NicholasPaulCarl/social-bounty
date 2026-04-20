# Manage Bounties — `/business/bounties`

**Route path:** `/business/bounties`
**File:** `apps/web/src/app/business/bounties/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.Bounties`
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
List of every bounty on the active brand with inline status transitions (Publish, Pause, Resume, Close, Revert-to-Draft) and direct entry to the Stitch hosted-checkout flow for DRAFT→LIVE transitions.

## Entry & exit
- **Reached from:** Sidebar nav, dashboard stat-card clicks.
- **Links out to:** `/business/bounties/new`, `/business/bounties/{id}`, `/business/bounties/{id}/edit`, Stitch hosted checkout via `redirectToHostedCheckout`.

## Data
- **React Query hooks:** `useBounties(params)`, `useDeleteBounty()` (from `hooks/useBounties.ts`); `bountyApi.updateStatus`, `bountyApi.fundBounty` (direct calls).
- **API endpoints called:** `GET /api/v1/bounties` (filtered by active brand), `PATCH /api/v1/bounties/:id/status`, `POST /api/v1/bounties/:bountyId/fund`, `DELETE /api/v1/bounties/:id`.
- **URL params:** none
- **Search params:** via `usePagination()` — `page`, `limit`; plus local state for filters (`search`, `rewardType`, `sortBy`, status tab).

## UI structure
- `PageHeader` — title, subtitle, Create-bounty action, 5 status tabs (All / Draft / Live / Paused / Closed), toolbar with search + 2 dropdown filters.
- `DataTable` (PrimeReact) with columns: Title (sortable), Status (`StatusBadge`), Reward (`formatCurrency`), Submissions count, Created date, Actions.
- Actions column (width 18rem): View, Edit, contextual status buttons per status (see state-machine below), Delete (DRAFT only).
- `Paginator` below table.
- `EmptyState` (Megaphone icon) when no bounties.
- `ConfirmAction` dialogs for delete + status transitions, `PaymentDialog` for legacy embedded-Stripe path.

## States
- **Loading:** `<LoadingState type="table" />`
- **Empty:** `<EmptyState title="No bounties yet" ...>` CTA → `/business/bounties/new`.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** Table + Paginator.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Create bounty | `router.push` | `/business/bounties/new` |
| View | `router.push` | `/business/bounties/{id}` |
| Edit | `router.push` | `/business/bounties/{id}/edit` |
| Publish (DRAFT → LIVE) | Fund flow | DRAFT + unpaid → Stitch hosted checkout; PAID → PATCH `/status` to LIVE |
| Pause (LIVE → PAUSED) | PATCH `/status` | Status flips. |
| Close (LIVE/PAUSED → CLOSED) | PATCH `/status` | Destructive confirm. |
| Resume (PAUSED → LIVE) | PATCH `/status` | Status flips. |
| Revert to draft (PAUSED → DRAFT) | PATCH `/status` | Back to editable state. |
| Delete | DELETE `/bounties/:id` | DRAFT-only. Hard Rule #6 confirm. |

## Business rules
- **Bounty state machine:** DRAFT ↔ PAUSED (reversible via revert-to-draft) ↔ LIVE → CLOSED (terminal).
- **DRAFT→LIVE funding gate (CLAUDE.md §4):** cannot flip to LIVE until `paymentStatus === PAID`. Clicking Publish on unpaid DRAFT calls `POST /bounties/:id/fund` to mint a Stitch hosted checkout URL and redirects. On webhook settlement the `paymentStatus` flips server-side; status transition to LIVE happens on return via `/business/bounties/funded`.
- Delete only permitted on DRAFT (funded bounties cannot be deleted — ledger preserved).
- All status actions require confirmation (Hard Rule #6).
- Status filter tab uses `activeTabIndex`; `statusTabs[0]` has `value = undefined` (All).

## Edge cases
- DRAFT + already-PAID (previous attempt): Publish skips fund call and goes straight to status PATCH.
- Fund call fails: toast error; bounty stays DRAFT.
- Hosted checkout opens in new tab in dev (iframe-sandbox preview) vs same-page redirect in prod (see `redirect-to-hosted-checkout.ts`).
- Kill-switch active: inbound funding webhook rejects the payment — Stitch side accepts, settlement does not fire in ledger. Recovery via reconciliation.
- BA not on this brand: server filters the list.

## Tests
None colocated.

## Related files
- `hooks/useBounties.ts`, `hooks/usePagination.ts`, `hooks/useToast.ts`, `hooks/useAuth.ts`
- `lib/api/bounties.ts`
- `lib/utils/redirect-to-hosted-checkout.ts`
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `ConfirmAction.tsx`, `EmptyState.tsx`
- `components/payment/PaymentDialog.tsx` (legacy — retained for embedded Stripe path)

## Open questions / TODOs
- `PaymentDialog` is only ever reached via the `clientSecret` state that's set nowhere in this file — looks like dead code since the Stitch hosted-checkout refactor (`bd2480b`).
