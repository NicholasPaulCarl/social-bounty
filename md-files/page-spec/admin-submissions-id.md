# Admin submission detail — `/admin/submissions/[id]`

**Route path:** `/admin/submissions/[id]`
**File:** `apps/web/src/app/admin/submissions/[id]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** deep-link only
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `docs/adr/0010-auto-refund-on-visibility-failure.md`, CLAUDE.md (Phase 3B admin visibility-failure surface, `consecutiveVisibilityFailures` SUPER_ADMIN-gated).

## Purpose
Full submission detail with proof artefacts, status block, and **two** override mutations (submission status + payout status). Surfaces the Phase 3B **Visibility check status** panel with the "threshold reached" warning when auto-refund is imminent.

## Entry & exit
- **Reached from:** `/admin/submissions` row; `/admin/users/[id]` Submissions tab; `/admin/brands/[id]` Submissions tab; disputes; finance drilldowns.
- **Links out to:** `/admin/bounties/[id]` (Bounty link), `/admin/finance/visibility-failures` ("View all visibility failures →" link when the visibility panel is visible).

## Data
- **React Query hooks:** `useAdminSubmissionDetail(id)`, `useOverrideSubmissionStatus(id)`, `useOverridePayoutStatus(id)`.
- **API endpoints called:** `GET /api/v1/admin/submissions/:id`, `PATCH /api/v1/admin/submissions/:id/override` (for both status + payout — same endpoint, differs by payload shape: `{ status, reason }` vs `{ payoutStatus, reason }`).
- **URL params:** `id` (submission UUID).
- **Search params:** none.

## UI structure
- `PageHeader` breadcrumbs (Bounties → `Submission #<id-8>`) + two right-actions: "Override status" (warning) + "Override payout" (warning outlined).
- Two-column `grid lg:grid-cols-3 gap-6`:
  - Left (`span-2`): `glass-card` "Proof of Completion" — `proofText` (pre-wrap), proof links list, proof images grid (`primereact/Image preview`).
  - Right column:
    - `glass-card` "Status" — Submission Status + Payout Status badges.
    - `glass-card` "Details" — Participant, Bounty (clickable → `/admin/bounties/[bountyId]`), submitted timestamp, Reviewed By (if set), Review Note.
    - **Conditional** `glass-card` "Visibility check status" (visible only when `submission.consecutiveVisibilityFailures > 0`): EyeOff icon + "N consecutive" Tag (danger when ≥2, warning when 1); dl with approved-at + last-visibility-check; red callout "Threshold reached — auto-refund will be issued by the next visibility scheduler tick (ADR 0010)." when count ≥ 2; footer link to `/admin/finance/visibility-failures`.
- Two `OverrideModal` dialogs (submission status + payout status).

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty (proof):** proofLinks/proofImages absent → their blocks hidden.
- **Error:** `ErrorState` with `refetch()`.
- **Success:** full detail.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Override status | `overrideSubmission.mutate({ status, reason })` | PATCH; toast; refetch; AuditLog |
| Override payout | `overridePayout.mutate({ payoutStatus, reason })` | PATCH; toast; refetch; AuditLog |
| Bounty link | `router.push('/admin/bounties/:bountyId')` | Parent bounty detail |
| Visibility panel link | `/admin/finance/visibility-failures` | Admin visibility-failures list |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Destructive overrides (Hard Rule #6)** — `OverrideModal` mandatory reason.
- **Audit log mandatory (Hard Rule #3)** — both override paths.
- **Visibility panel role gating:** `consecutiveVisibilityFailures` is SUPER_ADMIN-gated inside the response builder (`submissions.service.ts`); the `count > 0` check is a sufficient role+data guard for this surface — BUSINESS_ADMIN would never see this field come through and thus never see the panel.
- Auto-refund trigger: 2 consecutive visibility failures → `RefundService.requestAfterApproval` via `SubmissionVisibilityScheduler` on next tick (ADR 0010). This page does **not** trigger the refund itself; it only surfaces the signal.
- **Kill-switch respected:** visibility scheduler itself is gated by `LedgerService.isKillSwitchActive()` per ADR 0010.

## Edge cases
- **Submission with no `urlScrapes`** (pre-verification bounty / old bounty with zero rules) — the approval gate behaves differently in the brand review page; on this admin surface there's no gate (admin can override regardless).
- `consecutiveVisibilityFailures` is `undefined` for BUSINESS_ADMIN or pre-Phase-2A submissions — `(submission.consecutiveVisibilityFailures ?? 0) > 0` collapses both to false.
- Submission in terminal state (APPROVED+PAID) — override still enabled (admin escape hatch).
- `submission.reviewedBy` null → "Reviewed By" row hidden.
- Proof images list uses `primereact/Image preview` for lightbox; acceptable when `proofImages` length is reasonable.
- `submission.approvedAt` / `lastVisibilityCheckAt` may be null even when count > 0 (data migration edge) — rendered as "—".

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminSubmissionDetail`, `useOverrideSubmissionStatus`, `useOverridePayoutStatus`.
- `apps/web/src/components/common/OverrideModal.tsx`.
- `apps/api/src/modules/submissions/submission-visibility.scheduler.ts` — auto-refund trigger (ADR 0010).

## Open questions / TODOs
- No inline per-URL `urlScrapes` panel (the `<VerificationReportPanel>` from the brand review page) — would help admins see why a submission failed auto-verification.
- No "trigger auto-refund now" admin action for the visibility failure — must wait for the cron.
- No dispute-creation shortcut from here (admin could open a dispute on behalf of a party).
