# Submit Proof (per-format URL coverage) — `/bounties/[id]/submit`

**Route path:** `/bounties/[id]/submit`
**File:** `apps/web/src/app/(participant)/bounties/[id]/submit/page.tsx`
**Role:** PARTICIPANT (any authenticated user by guard; page itself assumes `bounty.userSubmission` shape when it exists).
**Access:** `AuthGuard`; bounty status + access-type enforced server-side in `SubmissionsService.create/update`.
**Nav entry:** From `/bounties/:id` "Submit proof" CTA; from `/my-submissions/:id` "Update submission" button (NEEDS_MORE_INFO → resubmit mode).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`. **Context:** see `claude.md` "Hunter submission verification" — this page implements the 3 locked product decisions (per-format URL coverage / cached-eligibility check / hard approval gate with per-URL retry).

## Purpose
Render one `VerifiedLinkInput` per required (channel, format) pair from `bounty.channels`. Submits a `ProofLinkInput[]` plus notes and optional proof images. Also detects `NEEDS_MORE_INFO` submissions with FAILED URL scrapes and switches into resubmit-mode — verified URLs are locked, failed URLs editable, backend re-scrapes only PENDING/FAILED rows.

## Entry & exit
- **Reached from:** `/bounties/:id` submit CTA, `/my-submissions/:id` update button (redirects here).
- **Links out to:** `/my-submissions` (after create), `/my-submissions/:id` (after resubmit), `/bounties/:id` (cancel).

## Data
- **React Query hooks:** `useBounty(bountyId)`, `useSubmission(existingSubmissionId)`, `useCreateSubmission(bountyId)`, `useUpdateSubmission(existingSubmissionId)`, `useToast()`.
- **API endpoints called:** `POST /submissions` (multipart — `data` is JSON-stringified `{ proofText, proofLinks }` + `images[]`), `PATCH /submissions/:id` (same shape, resubmit mode). Backend triggers `SubmissionScraperService` via `setImmediate`.
- **URL params:** `id` (bounty UUID, param key `id` aliased locally as `bountyId`).
- **Search params:** None.

## UI structure
- `PageHeader` "Submit proof" or "Resubmit proof" with breadcrumb (`Bounties > {title} > Submit|Resubmit`).
- Two-column grid (lg:grid-cols-3):
  - Main (2-span) form card:
    - Resubmit-only `Message severity="warn"` reviewer-note banner.
    - Resubmit-only `Message severity="info"` "Verified URLs are locked" banner.
    - Error-level `Message` if form error.
    - Warn `Message` if bounty has no channels (edge case).
    - Per (channel, format) pair:
      - Label `{ChannelLabel} {FormatLabel} URL *` + optional "Already verified" badge.
      - FAILED rows render prior `errorMessage` above the input.
      - VERIFIED rows render read-only div showing the cached URL.
      - Other rows render `VerifiedLinkInput` with channel-specific placeholder.
      - Per-pair inline error under input.
    - Notes `InputTextarea` (required, max 10000 chars, char count).
    - `FileUpload` (PrimeReact advanced mode, `accept="image/*"`, 5 MB max per file, multi).
    - Submit + Cancel buttons.
  - Sidebar: Bounty requirements card (`bounty.proofRequirements`).

## States
- **Loading:** `LoadingState type="form"` while bounty loads.
- **Empty:** N/A.
- **Error:** `ErrorState` if bounty 404; inline form error + per-pair errors.
- **Success:** Toast "Proof dropped!" (new) or "Resubmitted." (resubmit) + route to `/my-submissions` or `/my-submissions/:id`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Submit | `createSubmission.mutateAsync({ data, images })` | POST + route to `/my-submissions` |
| Resubmit | `updateSubmission.mutateAsync({ data, images })` | PATCH + route to `/my-submissions/:id` |
| Cancel | `router.push('/my-submissions/:id' | '/bounties/:id')` | Context-dependent |

## Business rules
- **Per-format URL coverage**: one URL required per (channel, format) — no extras, no duplicates. Client validator mirrors backend `CHANNEL_URL_PATTERNS` hostname check.
- **Resubmit detection**: `existingSubmission.status === 'NEEDS_MORE_INFO' && any urlScrape.scrapeStatus === 'FAILED'`.
- **Verified URLs** skip re-validation and are sent back from `scrapesByPair` cache — backend never re-scrapes them.
- Notes required (`proofText.trim()` non-empty). API enforces hard approval gate — brand can't approve until all URLs are VERIFIED.
- Submit disabled when bounty has no channels.
- Server-side coverage errors (`err.details[]`) mapped back to per-pair keys best-effort (substring match against channel + format names).

## Edge cases
- Bounty with empty `channels` object → `hasChannels = false`; submit disabled with warn message.
- Existing submission APPROVED/REJECTED/SUBMITTED → `isResubmit = false`; creates new submission (backend should reject via uniqueness).
- Images > 5 MB → `FileUpload` rejects client-side.
- Invalid hostname (wrong channel URL) → per-pair error "URL must be a {channel} link".
- Kill-switch / disputes blocking new submissions → backend 403 surfaces via toast + inline error.

## Tests
No colocated tests; `submission-coverage.validator.ts` (backend) and `compute-verification-checks.ts` cover the rule emission.

## Related files
- `@/components/common/VerifiedLinkInput` — URL input with validation affordance
- `@/components/common/LoadingState`, `ErrorState`, `PageHeader`
- `@/hooks/useSubmissions` — `useCreateSubmission` / `useUpdateSubmission` / `useSubmission`
- Shared: `CHANNEL_URL_PATTERNS`, `PostFormat`, `SocialChannel`, `ProofLinkInput`, `SubmissionUrlScrapeInfo`

## Open questions / TODOs
- Server-side error mapping is best-effort via substring matching. Could stabilize by having the backend return `{pairKey, message}`.
- No draft-persist — refresh during resubmit loses in-progress edits (seeded from existing scrapes on reload).
- Apify verification is async (`setImmediate` after tx commit) — submission detail page polls for scrape status.
