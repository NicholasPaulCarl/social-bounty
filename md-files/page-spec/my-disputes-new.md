# File a Dispute — `/my-disputes/new`

**Route path:** `/my-disputes/new`
**File:** `apps/web/src/app/(participant)/my-disputes/new/page.tsx`
**Role:** PARTICIPANT (only they can file NON_PAYMENT disputes; category hard-coded).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** `/my-disputes` File CTA, or EmptyState CTA on the list.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
4-step wizard to file a non-payment dispute against an APPROVED submission. Steps: select submission → choose reason → fill description/desired outcome → review & submit.

## Entry & exit
- **Reached from:** `/my-disputes` list, EmptyState CTA.
- **Links out to:** `/my-disputes/:newDispute.id` (post-create), `/my-disputes` (cancel/step-1 back), `/bounties` (inline if no approved submissions).

## Data
- **React Query hooks:** `useMySubmissions({ status: APPROVED, limit: 100 })`, `useCreateDispute()`, `useToast()`.
- **API endpoints called:** `GET /submissions/mine?status=APPROVED&limit=100`, `POST /disputes`.
- **URL params:** None.
- **Search params:** None.

## UI structure
- `PageHeader` with breadcrumb (`My disputes > File`).
- `StepIndicator` at top (4 circles, pink tint + checks on complete).
- Step 1 — Select submission: PrimeReact `Dropdown` (filterable), selected-submission preview card with title + status + submitted date. Inline EmptyState ("No approved submissions yet") with "Browse bounties" button if none.
- Step 2 — Category (locked to NON_PAYMENT, pink-tinted info pill) + Reason dropdown (Inspired by `DISPUTE_REASON_CATEGORIES.NON_PAYMENT`), with per-reason helper text.
- Step 3 — Description (min 50 chars, max `DISPUTE_LIMITS.DESCRIPTION_MAX`, live pass indicator) + Desired outcome (required trim >= 10) with char counts.
- Step 4 — Review grid (submission, category, reason), description, desired outcome, warning info pill about the review process.
- Footer: Cancel/Back on left (X/ArrowLeft), Next/Submit on right (ArrowRight/Flag). `canAdvance()` gates Next.

## States
- **Loading:** `LoadingState type="form"` when fetching submissions.
- **Empty:** Inline (step 1) — Inbox icon + "No approved submissions yet" + Browse CTA.
- **Error:** Toast via `useToast`.
- **Success:** Toast "Dispute raised." + `router.push('/my-disputes/:id')`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Cancel (step 1) | `router.push('/my-disputes')` | Back |
| Back (steps 2-4) | `setStep(step-1)` | Previous step |
| Next | `setStep(step+1)` | Advance when `canAdvance()` |
| Submit | `createDispute.mutate({ submissionId, category: NON_PAYMENT, reason, description, desiredOutcome })` | Route to `:id` |
| Browse bounties (empty state) | `router.push('/bounties')` | Marketplace |

## Business rules
- Category is hard-coded to `DisputeCategory.NON_PAYMENT` — the only category available to participants.
- Minimums: description trim >= 50, desired outcome trim >= 10. Max lengths from `DISPUTE_LIMITS.DESCRIPTION_MAX` + `DESIRED_OUTCOME_MAX`.
- Only APPROVED submissions selectable — other statuses filtered via the hook query.

## Edge cases
- Zero approved submissions → step 1 shows empty state with Browse CTA (no Next enabled).
- Description char-count overflow is prevented by `maxLength`.
- No submission selected → Next disabled on step 1.
- Backend rejection (duplicate dispute etc.) → toast error, state preserved.

## Tests
No colocated tests.

## Related files
- `@/hooks/useDisputes`, `useSubmissions`
- Shared: `DisputeCategory`, `DisputeReason`, `DISPUTE_REASON_CATEGORIES`, `DISPUTE_LIMITS`, `SubmissionStatus`
- `@/components/common/StatusBadge`, `LoadingState`

## Open questions / TODOs
- No evidence/attachment upload in wizard — added later on the detail page (messages thread).
- Draft not persisted across reload.
