# Submission Detail — `/my-submissions/[id]`

**Route path:** `/my-submissions/[id]`
**File:** `apps/web/src/app/(participant)/my-submissions/[id]/page.tsx`
**Role:** Any authenticated role (API scopes to owner).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Deep-link from `/my-submissions` row.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Render the hunter's view of a single submission — status, payout, proof text, post links, proof images (PrimeReact `Image` with preview), timeline, and reviewer notes. Provides "Update" button when status is `NEEDS_MORE_INFO` — button routes to `/bounties/:bountyId/submit` which auto-detects resubmit mode.

## Entry & exit
- **Reached from:** `/my-submissions` table, notification deep-links.
- **Links out to:** `/bounties/:bountyId/submit` (Update button when `NEEDS_MORE_INFO`).

## Data
- **React Query hooks:** `useSubmission(id)`.
- **API endpoints called:** `GET /submissions/:id`.
- **URL params:** `id` — submission UUID.
- **Search params:** None.

## UI structure
- `PageHeader` title `Submission for {bounty.title}` with breadcrumb (`My Submissions > Submission #{8-char}`) and optional Update action (Pencil icon, when `NEEDS_MORE_INFO`).
- `NEEDS_MORE_INFO` + reviewer note → warn `Message` banner.
- Two-column grid (lg:grid-cols-3):
  - Main (2-span): Status + payout badges row. Proof text (pre-wrap). Links list (rendered links). Proof images grid (PrimeReact `<Image preview>`).
  - Sidebar: Timeline card (submitted, reviewed-by, last updated). Reviewer note card (when present).

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** N/A (404 → error).
- **Error:** `ErrorState` with retry.
- **Success:** All cards render.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Update | `router.push('/bounties/:bountyId/submit')` | Submit page detects `NEEDS_MORE_INFO` and switches to resubmit mode |
| Proof link | `<a target="_blank">` | Opens original post |
| Image | PrimeReact `Image` preview | Zoomed overlay |

## Business rules
- Update only surfaces when `submission.status === 'NEEDS_MORE_INFO'`.
- Legacy `/my-submissions/[id]/update` route was deleted when per-format flow landed (commit `f8c601e`) — Update button now redirects through the new submit page.
- No dispute-filing entry here; disputes go via `/my-disputes/new` (only APPROVED submissions eligible).

## Edge cases
- `submission.proofLinks` rendered as raw strings — legacy DTO shape, not the per-pair `SubmissionUrlScrapeInfo` (the verification panel lives on the brand review page, not here).
- Missing `bounty` or `reviewedBy` → label suppressed.
- Image load failures silently empty.

## Tests
No colocated tests.

## Related files
- `@/hooks/useSubmissions` — `useSubmission(id)`
- `@/components/common/StatusBadge`, `LoadingState`, `ErrorState`, `PageHeader`
- PrimeReact `Image` (preview mode)

## Open questions / TODOs
- No per-URL verification status for hunters here — only brand-facing review panel shows that. Could be added for transparency.
- `submission.proofImages.length` referenced inside alt text when array is empty would throw; guarded by outer `submission.proofImages && length > 0` check.
