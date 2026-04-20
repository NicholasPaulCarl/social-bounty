# Dispute Detail — `/my-disputes/[id]`

**Route path:** `/my-disputes/[id]`
**File:** `apps/web/src/app/(participant)/my-disputes/[id]/page.tsx`
**Role:** Any authenticated role (API scopes to filer / brand counterparty / admin).
**Access:** `AuthGuard` via participant layout; API enforces RBAC.
**Nav entry:** `/my-disputes` row click.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Full dispute view: details, message thread (two-way, with internal/system markers), evidence list, metadata sidebar, status history timeline. Includes Escalate + Withdraw actions (confirmed via Dialogs) and a message composer when the case is open.

## Entry & exit
- **Reached from:** `/my-disputes` row click, notification links.
- **Links out to:** `/my-disputes` (on withdraw success).

## Data
- **React Query hooks:** `useDispute(id)`, `useSendDisputeMessage(id)`, `useEscalateDispute(id)`, `useWithdrawDispute(id)`, `useToast()`.
- **API endpoints called:** `GET /disputes/:id`, `POST /disputes/:id/messages`, `POST /disputes/:id/escalate`, `POST /disputes/:id/withdraw`.
- **URL params:** `id` — dispute UUID.
- **Search params:** None.

## UI structure
- `PageHeader` title `{dispute.disputeNumber}` with breadcrumb. Action cluster: Escalate (AlertTriangle/warning) if `ESCALATABLE_STATUSES` includes status; Withdraw (Undo2/danger) if `WITHDRAWABLE_STATUSES` includes status.
- Meta row: `StatusBadge type="dispute"`, category pill (slate), reason line.
- Two-column grid (lg:grid-cols-3):
  - Main (2-span): Details card (description, desired outcome, related submission with status badge). Messages card (bubble list — system messages centered; own messages right/pink; counterparty left/elevated; internal messages warning-tinted with "Internal" tag; composer + Send when !closed). Evidence card (per-evidence type icon + label + file/link/description).
  - Sidebar: Info card (filed, response deadline, escalatedAt, resolvedAt, resolutionType, resolutionSummary). Status history card (timeline dots).
- Escalate Dialog — textarea for reason, Cancel + Escalate buttons.
- Withdraw Dialog — optional reason `InputText`, Cancel + Withdraw buttons.

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** N/A.
- **Error:** `ErrorState` with retry.
- **Success:** Toasts — "Message sent", "Bumped to our team for review.", "Dispute withdrawn. Case closed."

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Send message | `sendMessage.mutate({ content })` | Appends to thread |
| Escalate (dialog confirm) | `escalate.mutate({ reason })` | Flips to ESCALATED |
| Withdraw (dialog confirm) | `withdraw.mutate({ reason? })` | Flips to WITHDRAWN + route to `/my-disputes` |

## Business rules
- Withdraw allowed only from `DRAFT | OPEN`.
- Escalate allowed only from `OPEN | UNDER_REVIEW | AWAITING_RESPONSE`.
- Composer suppressed when `status in {RESOLVED, CLOSED, WITHDRAWN}`.
- Internal messages rendered with warning styling + "Internal" badge (marker for admin-participant signalling).
- System messages auto-generated on state transitions; no composer action creates them.

## Edge cases
- Non-owner accessing → API 403 → `ErrorState`.
- Empty messages list → "No messages yet." placeholder.
- Evidence items with neither `fileName` nor `url` render description-only row.
- Escalate confirmation requires non-empty reason.

## Tests
No colocated tests.

## Related files
- `@/hooks/useDisputes` — all four hooks
- `@/components/common/StatusBadge`, `LoadingState`, `ErrorState`
- Shared: `DisputeStatus`, `DisputeMessageType`, `DisputeMessageResponse`, `DisputeStatusHistoryResponse`, `DisputeEvidenceResponse`

## Open questions / TODOs
- No ability to upload additional evidence from this page (API supports it but UI missing).
- `authorRole === 'PARTICIPANT'` hard-coded for bubble alignment — if an admin also files, the logic needs rework (admin disputes land here only for participant's own records).
