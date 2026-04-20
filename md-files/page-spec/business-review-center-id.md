# Review Center Detail — `/business/review-center/[id]`

**Route path:** `/business/review-center/[id]`
**File:** `apps/web/src/app/business/review-center/[id]/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (row click from queue).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Review a single submission surfaced from the Review Center queue. Nearly identical to `/business/bounties/{id}/submissions/{submissionId}` — this one doesn't poll and renders a Review History timeline.

## Entry & exit
- **Reached from:** `/business/review-center`.
- **Links out to:** `/business/review-center` (Back button), `/business/bounties/{submission.bountyId}` (bounty title link).

## Data
- **React Query hooks:** `useSubmission(submissionId)` (NOT polling), `useReviewSubmission(submissionId)`, `useUpdatePayout(submissionId)`.
- **API endpoints called:** `GET /api/v1/submissions/:id`, `PATCH /api/v1/submissions/:id/review`, `PATCH /api/v1/submissions/:id/payout`.
- **URL params:** `id` (submission id)
- **Search params:** none

## UI structure
- `PageHeader` — Review Submission, breadcrumbs (Review Center / Submission #xxx), Back button.
- Header row: ID (truncated), submission status badge, payout status badge, submitted timestamp.
- Left column (`lg:col-span-2`): Proof of Completion (text / links / images), `<ReviewActionBar>`, `<PayoutActionBar>` (when APPROVED), Review History timeline (when `reviewHistory` present — cast off `submission` via local `reviewHistory?: ReviewHistoryEntry[]`).
- Right column: Hunter card, Bounty Info card (pink-600 link to `/business/bounties/:bountyId`), Details card (submitted / last updated / reviewedBy / reviewerNote).

## States
- **Loading:** `<LoadingState type="detail" />`
- **Empty:** `return null` if no submission.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** full detail page.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Approve / Reject / Needs More Info | PATCH `/review` | Same mutations as `/business/bounties/{id}/submissions/{submissionId}`. |
| Mark paid / processing / failed | PATCH `/payout` | Only when APPROVED. |
| Back | `router.push` | `/business/review-center` |
| Bounty title (sidebar) | `router.push` | `/business/bounties/{submission.bountyId}` |

## Business rules
- Same hard approval gate as the per-bounty review page (all URL scrapes VERIFIED → Approve enabled) — enforced inside `<ReviewActionBar>` + backend.
- Review + payout mutations write AuditLog (Hard Rule #3).
- Does NOT poll — scraper state may be stale; use the per-bounty review page for live scrape status.
- Review History block renders chronological status changes; `changedBy` may be absent for system-driven changes.

## Edge cases
- Review History data shape cast via `as unknown as { reviewHistory?: ReviewHistoryEntry[] }` — the shared `SubmissionDetailResponse` may or may not include it. If missing, timeline is hidden.
- Bounty link navigates to the brand-specific bounty detail — requires the same brand scope (server 403 on mismatch).
- Kill-switch active: review mutation unblocked (no ledger). Payout mutation is status-only.

## Tests
`ReviewActionBar` / `PayoutActionBar` covered in `components/features/submission/**/*.test.tsx`.

## Related files
- `hooks/useSubmissions.ts` (`useSubmission`, `useReviewSubmission`, `useUpdatePayout`)
- `components/features/submission/ReviewActionBar.tsx`, `PayoutActionBar.tsx`
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`

## Open questions / TODOs
- Doesn't use `useSubmissionWithPolling` — poll-free in the review-center surface is by choice (CLAUDE.md "wired only on the brand review page"). Might trip reviewers who expect the scrape panel to refresh here.
- Duplicates the per-bounty review page. No `<VerificationReportPanel>` here — surprising given the approval gate depends on scrape status.
