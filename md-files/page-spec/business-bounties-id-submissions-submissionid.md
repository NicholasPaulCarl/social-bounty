# Submission Review (per-bounty path) — `/business/bounties/[id]/submissions/[submissionId]`

**Route path:** `/business/bounties/[id]/submissions/[submissionId]`
**File:** `apps/web/src/app/business/bounties/[id]/submissions/[submissionId]/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only.
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Review a single submission with full proof (text, links, images), scraped verification report, review action bar, and payout action bar (for APPROVED submissions). Polls while any URL scrape is in-flight.

## Entry & exit
- **Reached from:** `/business/bounties/{id}/submissions`.
- **Links out to:** `/business/bounties/{id}` (Bounty link in sidebar).

## Data
- **React Query hooks:** `useSubmissionWithPolling(submissionId)`, `useBounty(bountyId)`, `useReviewSubmission(submissionId)`, `useUpdatePayout(submissionId)`.
- **API endpoints called:** `GET /api/v1/submissions/:id`, `GET /api/v1/bounties/:id`, `PATCH /api/v1/submissions/:id/review`, `PATCH /api/v1/submissions/:id/payout`.
- **URL params:** `id` (bountyId), `submissionId`
- **Search params:** none

## UI structure
- `PageHeader` — Review Submission, breadcrumbs (Bounties / bounty title / Submissions / Submission #xxx), status badges in actions slot.
- Left column (`lg:col-span-2`):
  - Proof of Completion card: Text Proof, Links (pink-600 hyperlinks), Images (PrimeReact Image with preview).
  - `<VerificationReportPanel urlScrapes={...} reportedMetrics={...} />` — scrape report, per-URL checks.
  - `<ReviewActionBar currentStatus onAction loading urlScrapes />` — hard approval gate (see below).
  - `<PayoutActionBar>` — only when `submission.status === APPROVED`.
- Right column: Details card (hunter, submitted, reviewedBy, reviewer note), Bounty Info card (link back to bounty).

## States
- **Loading:** `<LoadingState type="detail" />`
- **Polling:** `useSubmissionWithPolling` polls every 3s while any `urlScrape.status` is PENDING/IN_PROGRESS; stops once settled.
- **Empty:** `return null` if no submission.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** full review page.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Approve | PATCH `/review` `{status: APPROVED}` | Gated — see approval gate below. |
| Reject | PATCH `/review` `{status: REJECTED, reviewerNote}` | Refund-eligible downstream. |
| Needs More Info | PATCH `/review` `{status: NEEDS_MORE_INFO, reviewerNote}` | Auto-prefilled with failure reasons from scrape report. |
| Mark paid / processing / failed | PATCH `/payout` | Only when status = APPROVED. |

## Business rules
- **Hard approval gate (CLAUDE.md "Hunter submission verification"):** Approve is disabled in `<ReviewActionBar>` unless every `urlScrape.status === VERIFIED`. Empty `urlScrapes` array is vacuously true — no-rule bounties remain approvable. Backend enforces the same gate (`SubmissionsService.review` rejects APPROVED with 400 if any URL is not VERIFIED).
- **Per-URL resubmit flow:** NEEDS_MORE_INFO triggers hunter-side resubmit that re-scrapes only PENDING/FAILED URLs (VERIFIED scrapes cached).
- Review mutation posts an AuditLog (Hard Rule #3).
- Payout mutation does NOT mutate the ledger; it tracks the external payout status (manual or TradeSafe adapter). Actual payout flow is SUPER_ADMIN-driven via `/admin/finance/payouts`.
- `reviewerNote` auto-prefill uses a one-shot `useRef` flag in `<ReviewActionBar>` to avoid clobbering once the user edits.

## Edge cases
- Submission mid-scrape: polling resumes on mount; UI shows spinner + "Verifying social posts..." until all settled.
- Scrape FAILED: error surfaces in the panel; hunter must resubmit via `/bounties/{id}/submit` (auto-detects NEEDS_MORE_INFO state and switches to resubmit mode).
- Reviewing another brand's submission: server 403.
- Kill-switch active: review mutation not blocked (no ledger write). Payout mutation is status-only — ledger payout flow is SUPER_ADMIN territory.

## Tests
`VerificationReportPanel`, `ReviewActionBar`, `PayoutActionBar` behaviour tested in `components/features/submission/**/*.test.tsx`.

## Related files
- `hooks/useSubmissions.ts` (`useSubmissionWithPolling`, `useReviewSubmission`, `useUpdatePayout`)
- `hooks/useBounties.ts`
- `components/features/submission/ReviewActionBar.tsx`
- `components/features/submission/PayoutActionBar.tsx`
- `components/features/submission/VerificationReportPanel.tsx`
- `components/common/StatusBadge.tsx`

## Open questions / TODOs
- Duplicates most behaviour of `/business/review-center/{id}`. Main difference: this one renders bounty context in the sidebar by explicit `useBounty(bountyId)` lookup; review-center uses `submission.bounty` inline. Worth consolidating if maintenance becomes an issue.
