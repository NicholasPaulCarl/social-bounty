# Admin dispute detail — `/admin/disputes/[id]`

**Route path:** `/admin/disputes/[id]`
**File:** `apps/web/src/app/admin/disputes/[id]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** deep-link only
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/social-bounty-mvp.md` (dispute lifecycle + messaging).

## Purpose
Full-surface dispute workspace: description, message thread (including internal-only admin notes), evidence, status transitions, assignment, resolution, escalation, force-close, and status-history timeline.

## Entry & exit
- **Reached from:** `/admin/disputes` row; `/admin/submissions/[id]` (if a link existed — currently none wired); `/admin/brands/[id]` (no direct link yet).
- **Links out to:** `/admin/submissions/[d.submission.id]` ("View submission"); `/admin/brands/[d.brandId]` ("View brand").

## Data
- **React Query hooks:** `useDispute(id)`, `useSendDisputeMessage(id)`, `useEscalateDispute(id)`, `useAdminTransitionDispute(id)`, `useAdminAssignDispute(id)`, `useAdminResolveDispute(id)`.
- **API endpoints called:** `GET /api/v1/disputes/:id`, `POST /api/v1/disputes/:id/messages`, `POST /api/v1/disputes/:id/escalate`, `PATCH /api/v1/admin/disputes/:id/transition`, `PATCH /api/v1/admin/disputes/:id/assign`, `PATCH /api/v1/admin/disputes/:id/resolve`.
- **URL params:** `id` (dispute UUID).
- **Search params:** none.

## UI structure
- `PageHeader` breadcrumbs (Disputes → disputeNumber) + title + subtitle "Category · Status".
- Two-column `grid xl:grid-cols-3 lg:grid-cols-3 gap-6`:
  - Left (`span-2`):
    - `glass-card` "Dispute Details" — Category Tag (coloured), Reason Tag, Status badge, Description (pre-wrap), Desired Outcome.
    - `glass-card` "Messages" — list of `MessageBubble` (own bubble right-side pink, admin internal notes styled warning with `Lock` icon "Internal — not visible to parties"; system messages centre-chip); add-message form with "Internal Note (admin only)" checkbox + textarea + submit (label swaps between "Send message" / "Add note").
    - `glass-card` "Evidence" (only when `d.evidence.length > 0`) — list of `EvidenceCard` with link/image/file icon, name, description, uploader, created date, external-link action.
  - Right column:
    - `glass-card` "Change Status" — Dropdown (OPEN / UNDER_REVIEW / AWAITING_RESPONSE / ESCALATED / CLOSED) + note textarea + "Change status" button.
    - `glass-card` "Assign Admin" — current assignee chip (or "Currently unassigned" italic); user-id input + "Assign" outlined button.
    - `glass-card` "Resolve Dispute" (hidden when already RESOLVED) — Resolution dropdown + summary textarea + "Resolve dispute" (success) — triggers a `ConfirmAction`.
    - `glass-card` "Quick Actions" — Escalate (warning outlined) + Force close (danger outlined) — each goes through a `ConfirmAction`.
    - `glass-card` "Context" — Submission (bounty title + status/payout badges + "View submission" link); Filed By (opener full name + email + role); Brand (name + "View brand" link).
    - `glass-card` "Status History" (if any) — `StatusTimeline` (from→to badges + changedBy + timestamp + note).
- Three `ConfirmAction` dialogs: Resolve (danger), Force Close (danger), Escalate (warning, `requireReason reasonMinLength={10}`).

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty (messages):** "No messages yet." inside the thread card.
- **Empty (evidence):** Evidence card hidden entirely.
- **Error:** `ErrorState` with `refetch()`.
- **Success:** full workspace.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Send message | `sendMessage.mutate({ content, isInternal })` | POST; toast; refetch; messaging system-message appended |
| Add internal note | same hook with `isInternal: true` | Only visible to admins |
| Change status | `transitionStatus.mutate({ status, note })` | PATCH; toast; refetch; AuditLog |
| Assign | `assignAdmin.mutate({ assignedToUserId })` | PATCH; toast |
| Resolve dispute | `resolveDispute.mutate({ resolutionType, resolutionSummary })` | PATCH; toast; dispute → RESOLVED; AuditLog |
| Escalate | `escalate.mutate({ reason })` | POST; toast; status → ESCALATED; AuditLog |
| Force close | `transitionStatus.mutate({ status: CLOSED, note: 'Force closed by admin' })` | PATCH (destructive); toast; AuditLog |
| View submission / View brand | `router.push(...)` | Drilldown |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Destructive-action confirmations (Hard Rule #6)** — Resolve, Force Close, Escalate all go through `ConfirmAction`; Escalate requires `reasonMinLength={10}`; Force Close explicitly flagged destructive.
- **Audit log mandatory (Hard Rule #3)** — every backend state-change endpoint writes an AuditLog.
- Internal notes (`isInternal: true`) visible to SUPER_ADMIN only — `MessageBubble` hides `INTERNAL_NOTE` messages when `!isAdmin`.

## Edge cases
- **Dispute already RESOLVED** — Resolve card hidden; status transitions still allowed (admin can reopen via Change Status → OPEN).
- Force-close on an already-CLOSED dispute — still allowed; backend dedup may no-op.
- Assign UUID invalid → backend returns error, caught by `onError` toast.
- `d.assignedTo` null → "Currently unassigned" italic + no chip.
- `d.statusHistory` empty → History card hidden.
- Evidence entry with both `fileUrl` and `url` set: `fileUrl` takes precedence for the external-link action.

## Tests
Integration-only (dispute flows are covered end-to-end in API specs).

## Related files
- `apps/web/src/hooks/useDisputes.ts` — all dispute hooks.
- `apps/web/src/components/common/StatusBadge.tsx` — `dispute` + `submission` + `payout` types.
- `apps/web/src/components/common/ConfirmAction.tsx` — `requireReason` dialog.
- `apps/web/src/lib/constants/disputes.ts` — category colour/option maps.

## Open questions / TODOs
- Assign Admin input is raw UUID paste — no typeahead of SUPER_ADMIN users.
- No dispute-merge or bulk-resolve actions (out of MVP scope).
- No SLA/breach indicator inline (age is on list view only).
