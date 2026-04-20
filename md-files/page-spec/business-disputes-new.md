# File Dispute (Brand) — `/business/disputes/new`

**Route path:** `/business/disputes/new`
**File:** `apps/web/src/app/business/disputes/new/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (CTA from disputes list).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
4-step wizard for filing a dispute against an approved / paid submission. Steps: Select Submission → Category & Reason → Description → Review & Submit.

## Entry & exit
- **Reached from:** `/business/disputes` File-dispute CTA.
- **Links out to:** `/business/disputes/{id}` (on success).

## Data
- **React Query hooks:** `useCreateDispute()`, `useBounties({limit: 100})`, `useSubmissionsForBounty(bountyId, {status: APPROVED, limit: 100})`.
- **API endpoints called:** `GET /api/v1/bounties`, `GET /api/v1/bounties/:bountyId/submissions?status=APPROVED`, `POST /api/v1/disputes`.
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with breadcrumbs.
- PrimeReact `<Steps>` component (readOnly) showing 4-step progress.
- Step 0 — Bounty picker `<Dropdown>` (searchable), then DataTable of APPROVED submissions (selection-mode=single); confirmation banner when a row is selected.
- Step 1 — Category + Reason dropdowns. Suggested category inferred from payout status (PAID → POST_NON_COMPLIANCE, otherwise POST_QUALITY). Reason options sourced from `DISPUTE_REASON_CATEGORIES[category]`.
- Step 2 — Description (min 20 chars, max 10k) + Desired Outcome (min 10 chars, max 5k) textareas with char counters.
- Step 3 — Read-only review panel with Back + File dispute (danger severity) buttons.

## States
- **Loading (bounties):** `<LoadingState type="inline" />` in the bounty picker.
- **Loading (submissions):** `<LoadingState type="table" />` below the bounty picker.
- **No eligible submissions:** "No eligible submissions found. Only approved or paid submissions can be disputed."
- **Per-step validation gate:** `canProceedStep0/1/2` booleans disable Next button.
- **Submit success:** toast + `router.push(/business/disputes/{id})`.
- **Submit failure:** error toast; stays on step 3.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Next (step 0-2) | local state | Advance step. |
| Back (step 1-3) | local state | Previous step. |
| File dispute | POST `/disputes` | Creates dispute, redirects to detail. |

## Business rules
- Only APPROVED / PAID submissions are disputable (UI filter: `SubmissionStatus.APPROVED`; backend further constrained).
- `DisputeCategory` enum: NON_PAYMENT / POST_QUALITY / POST_NON_COMPLIANCE.
- Submitting a dispute creates a message thread + evidence container in the same transaction (see `DisputesService.create`); AuditLog (Hard Rule #3).
- Rate limited server-side: `POST /disputes` has `throttled 5/min`.
- Disputes do NOT immediately move money — they can later resolve into a ledger refund (SUPER_ADMIN resolution). CLAUDE.md §4 compensating-entry rule.

## Edge cases
- No bounties: bounty picker empty; step 0 is dead-ended.
- No APPROVED submissions: helper text displayed.
- Category switch clears selected Reason (to stay consistent).
- Short description / outcome: Next disabled; no inline error beyond the char counter.

## Tests
None colocated.

## Related files
- `hooks/useDisputes.ts` (`useCreateDispute`)
- `hooks/useBounties.ts`, `hooks/useSubmissions.ts`
- `lib/constants/disputes.ts`
- Shared: `DISPUTE_REASON_CATEGORIES`, `DisputeCategory`, `DisputeReason`.
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `LoadingState.tsx`

## Open questions / TODOs
- The 4-step flow loads a max of 100 bounties and 100 submissions per bounty — brands with larger catalogues will hit this ceiling silently.
- No confirm dialog before submit — "cannot be undone" note in step 3 is textual only.
