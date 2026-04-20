# Bounty Funded Return — `/business/bounties/funded`

**Route path:** `/business/bounties/funded`
**File:** `apps/web/src/app/business/bounties/funded/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only — external redirect target (Stitch hosted-checkout return URL).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4 (flagged as out-of-nav by design).

## Purpose
Landing page for the Stitch hosted-checkout return. Polls `GET /payments/funding-status` until the payment is confirmed (webhook flips `paymentStatus` to PAID) or times out.

## Entry & exit
- **Reached from:** Stitch hosted-checkout redirect (external). Stitch may or may not include identifier params on the return URL, so the page falls back to `sessionStorage.stitchFundingBountyId` stashed by `redirectToHostedCheckout` before leaving.
- **Links out to:** `/business/bounties/{id}` (confirmed), `/business/bounties` (back).

## Data
- **React Query hooks:** none (custom polling loop with `useEffect` + `setTimeout`).
- **API endpoints called:** `GET /api/v1/payments/funding-status` via `bountyApi.fundingStatus(identifiers)`.
- **URL params:** none
- **Search params:** `bountyId`, `stitchPaymentId` / `paymentId` / `id`, `merchantReference` / `reference` — any one of them suffices; else falls back to `sessionStorage`.

## UI structure
- PrimeReact `Card` with dynamic title (`Finalising funding...` / `Funding confirmed`).
- `ProgressSpinner` while polling; `Message` banner for success / info / warn / error.
- Action buttons: View bounty, Back to bounties, Refresh (after timeout).

## States
- **Loading (polling):** spinner + "Waiting for Stitch to confirm settlement. This usually completes within a minute."
- **No identifier:** info banner — "We couldn't pick up your bounty from the return URL, but your payment will be reconciled automatically."
- **Paid:** success message with bounty title and CTAs.
- **Timed out** (30 polls × 3s ≈ 90s): warn banner with Refresh button (resets `pollCount`).
- **Error:** `Message severity="error"` showing API error.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| View bounty | `router.push` | `/business/bounties/{bountyId}` (PAID state only) |
| Back to bounties | `router.push` | `/business/bounties` |
| Refresh | reset `pollCount` → re-fetch | Retries up to another 90s. |

## Business rules
- Payment settlement is an async Stitch webhook; this page is eventual-consistency. No UI writes to the ledger.
- On PAID detection the server has already flipped `paymentStatus` and posted the inbound funding ledger group (via `StitchWebhookHandler` + `LedgerService.postTransactionGroup`) — this page is purely presentational.
- Payment timeouts don't void the settlement — Stitch webhook catches up; reconciliation closes any drift.

## Edge cases
- Return URL stripped of params + no sessionStorage fallback: shows "can't pick up bounty, reconciliation will fix" panel.
- User closes tab mid-poll: webhook still lands server-side; no user-visible state lost.
- Poll succeeds but webhook hasn't fired yet: `paymentStatus` stays PENDING; page times out → user retries/refreshes.
- Kill-switch active during Stitch settlement: webhook handler rejects; `paymentStatus` never flips; page times out. Recovery via reconciliation + manual ledger override (SUPER_ADMIN).

## Tests
None colocated.

## Related files
- `lib/api/bounties.ts` (`fundingStatus` method)
- `lib/utils/redirect-to-hosted-checkout.ts` (stashes `sessionStorage.stitchFundingBountyId` before leaving)

## Open questions / TODOs
- `MAX_POLLS = 30` / 3s interval is a local constant; not centrally configured. If Stitch settlement slows past 90s in prod this would need bumping.
