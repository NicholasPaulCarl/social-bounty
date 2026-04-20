# Bounty Detail — `/business/bounties/[id]`

**Route path:** `/business/bounties/[id]`
**File:** `apps/web/src/app/business/bounties/[id]/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only.
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Single-bounty detail page with inline status transitions (including Go Live funding gate), edit/preview/submissions navigation, refund-before-approval request, and auto-verification-preview surface.

## Entry & exit
- **Reached from:** `/business/bounties` (View action), Save Draft redirect from `/business/bounties/new`, funded-return page.
- **Links out to:** `/business/bounties/{id}/edit`, `/business/bounties/{id}/submissions`, `/bounties/{id}?preview=1` (new tab preview), Stitch hosted checkout.

## Data
- **React Query hooks:** `useBounty(id)`, `useUpdateBountyStatus(id)`, `useDeleteBounty()` (from `hooks/useBounties.ts`); `bountyApi.fundBounty`, `bountyApi.requestRefundBeforeApproval` direct calls.
- **API endpoints called:** `GET /api/v1/bounties/:id`, `PATCH /api/v1/bounties/:id/status`, `POST /api/v1/bounties/:id/fund`, `DELETE /api/v1/bounties/:id`, `POST /api/v1/refunds/bounties/:bountyId/before-approval`.
- **URL params:** `id`
- **Search params:** none

## UI structure
- `PageHeader` — title (bounty.title); action buttons (Preview, contextual status buttons, Edit, Submissions, Request refund when eligible, Delete on DRAFT).
- Left column (`lg:col-span-2`, glass-cards): Title/status/reward header → Description → Full Instructions → Proof Requirements → Reward Details → Channels → Rewards table → Eligibility Rules → Payout Metrics → Brand Assets (with per-asset download button).
- Right column: Details (created / ends / max subs / total subs / currency / AI permitted / payment status Tag), Post Visibility card, Engagement card.
- `<VerificationReportPanel previewMode audience="brand" previewChecks={derivePreviewChecks(bounty)} />` — auto-verification preview at the bottom of the left column.
- Three `ConfirmAction` dialogs (status change, delete, refund) + `PaymentDialog` (legacy, rendered only if `clientSecret` state is set).

## States
- **Loading:** `<LoadingState type="detail" />`
- **Empty:** `return null` if `bounty` is falsy.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** Two-column detail with contextual action bar.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Preview | `window.open(/bounties/{id}?preview=1)` | Hunter-facing view in new tab. |
| Go Live (DRAFT) | `bountyApi.fundBounty` + `redirectToHostedCheckout` | Stitch hosted checkout. On settlement webhook → `paymentStatus=PAID` → user returns to `/business/bounties/funded`. |
| Pause (LIVE) / Close (LIVE/PAUSED) / Resume (PAUSED) / Revert to Draft (PAUSED) | PATCH `/status` via `useUpdateBountyStatus` | With `ConfirmAction`. |
| Edit | `router.push` | `/business/bounties/{id}/edit` |
| Submissions | `router.push` | `/business/bounties/{id}/submissions` |
| Request refund | `POST /refunds/bounties/:bountyId/before-approval` | Warning confirm. Only offered when `paymentStatus === PAID && status !== CLOSED`. |
| Delete | DELETE `/bounties/:id` | DRAFT-only. Navigates to `/business/bounties`. |

## Business rules
- **Bounty state machine:** DRAFT → (Go Live + funded) → LIVE ↔ PAUSED → CLOSED. Revert-to-Draft from PAUSED.
- **DRAFT→LIVE funding gate (CLAUDE.md §4):** same as the list page. Payment must be PAID before the LIVE flip; flow routes DRAFT + unpaid through Stitch hosted checkout.
- **Refund-before-approval gate (CLAUDE.md §4 #5 compensating entries):** allowed when PAID and no submission has been approved yet. Backend is authoritative — the UI only surfaces the button based on `paymentStatus === PAID && status !== CLOSED`; if an approved submission exists the API returns an error.
- Delete only on DRAFT (protected ledger history).
- All status / refund / delete actions routed through `ConfirmAction` (Hard Rule #6).

## Edge cases
- Fund call fails: error toast; bounty stays DRAFT; button clears loading state.
- Refund requested after an approval landed: server returns error; surfaced via toast.
- Preview opens with `noopener,noreferrer`.
- Kill-switch active: fund / refund requests rejected server-side.
- KYB not approved: fund call may fail (TradeSafe beneficiary check).

## Tests
None colocated.

## Related files
- `hooks/useBounties.ts`, `hooks/useAuth.ts`, `hooks/useToast.ts`
- `lib/api/bounties.ts`, `lib/utils/redirect-to-hosted-checkout.ts`
- `lib/utils/bounty-preview-checks.ts` — `derivePreviewChecks`
- `components/features/submission/VerificationReportPanel.tsx`
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `ConfirmAction.tsx`
- `components/payment/PaymentDialog.tsx` (legacy Stripe — retained, likely dead)

## Open questions / TODOs
- `PaymentDialog` only renders when `clientSecret` state is truthy, but the code never sets it (same dead-path as `/business/bounties`).
- Proof Requirements rendering has a shape-mismatch branch — the DB stores it as a structured set but the UI also handles the old comma-joined string (`'url'`, `'screenshot'`, `'url,screenshot'`, ...). Legacy format retained defensively.
