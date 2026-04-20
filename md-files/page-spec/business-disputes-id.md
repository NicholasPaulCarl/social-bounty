# Brand Dispute Detail — `/business/disputes/[id]`

**Route path:** `/business/disputes/[id]`
**File:** `apps/web/src/app/business/disputes/[id]/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only.
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Per-dispute detail with a chat thread (visible messages only), evidence list, escalate CTA, status sidebar, and resolution panel (when resolved).

## Entry & exit
- **Reached from:** `/business/disputes` (row click / eye icon).
- **Links out to:** `/business/bounties/{bountyId}` (bounty link), `/business/review-center/{submissionId}` (view submission).

## Data
- **React Query hooks:** `useDispute(id)`, `useSendDisputeMessage(id)`, `useEscalateDispute(id)` (from `hooks/useDisputes.ts`).
- **API endpoints called:** `GET /api/v1/disputes/:id`, `POST /api/v1/disputes/:id/messages`, `POST /api/v1/disputes/:id/escalate`.
- **URL params:** `id` (dispute id)
- **Search params:** none

## UI structure
- `PageHeader` — disputeNumber, breadcrumbs, Escalate action (warning severity).
- Left column (`lg:col-span-2`):
  - Dispute Details card: category + reason Tags, description, desired outcome.
  - Messages card: filtered thread (excludes `INTERNAL_NOTE` messages); `<MessageBubble>` renders SYSTEM messages as centered pills, user messages left/right based on type; reply `<InputTextarea>` + Send button at bottom.
  - Evidence card (only when `d.evidence.length > 0`): list of `<EvidenceCard>` entries with file/link icon + external-link jump.
- Right column:
  - Status card: current status + date rows (Opened / Escalated / Resolved / Response deadline).
  - Submission card: bounty title link + openedBy + "View submission" button.
  - Resolution card (only when `d.resolutionType`): resolution type + summary + resolvedBy.
- `ConfirmAction` for Escalate (requires reason, min length 10).

## States
- **Loading:** `<LoadingState type="detail" />`
- **Empty:** `return null` if no dispute.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** full page.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Send response | POST `/messages` | Appends visible message to the thread. |
| Escalate | POST `/escalate` (reason required) | Status → ESCALATED; SUPER_ADMIN picks up from `/admin/disputes`. |

## Business rules
- Dispute state machine: DRAFT → OPEN ↔ ESCALATED → RESOLVED / WITHDRAWN. Escalate requires a non-empty reason (client min-length 10).
- `INTERNAL_NOTE` messages are hidden from brand view (only Super Admins see them via `/admin/disputes/{id}`).
- Only the brand admin that owns the dispute (or a brand member) can post messages; RBAC + server-side ownership check.
- Resolution (refund / denial / partial) is SUPER_ADMIN territory — not available here.
- AuditLog on message + escalate (Hard Rule #3).

## Edge cases
- Empty thread: "No messages yet." rendered.
- Send disabled when `replyText.trim()` empty.
- Evidence without `fileUrl` and without `url`: external-link icon omitted.
- `responseDeadline` present → warning-coloured date row; past deadline not visually flagged.

## Tests
None colocated.

## Related files
- `hooks/useDisputes.ts` (`useDispute`, `useSendDisputeMessage`, `useEscalateDispute`)
- `lib/constants/disputes.ts`
- Shared: `DisputeMessageType`, `EvidenceType`, `DisputeDetailResponse`.
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `ConfirmAction.tsx`

## Open questions / TODOs
- `DISPUTE_CATEGORY_COLORS` imported but unused in favour of a local `categoryColors` map — minor dead import.
- No attach-evidence button from this page — evidence is ingested via `POST /api/v1/disputes/:id/evidence` but no UI action wired here.
