# Admin bounty detail — `/admin/bounties/[id]`

**Route path:** `/admin/bounties/[id]`
**File:** `apps/web/src/app/admin/bounties/[id]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** deep-link only
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `md-files/social-bounty-mvp.md` (bounty state machine), CLAUDE.md (accessType wire fix commit `da71b0a`).

## Purpose
Read-mostly admin view of a single bounty with full content, metadata, and a single admin mutation: "Override status" (forces any status transition, with mandatory reason).

## Entry & exit
- **Reached from:** `/admin/bounties` row; `/admin/brands/[id]` Bounties tab; `/admin/submissions/[id]` Bounty link; dispute context panel.
- **Links out to:** none direct (Brand name is text-only, not linked in current code).

## Data
- **React Query hooks:** `useAdminBountyDetail(id)`, `useOverrideBountyStatus(id)`.
- **API endpoints called:** `GET /api/v1/admin/bounties/:id`, `PATCH /api/v1/admin/bounties/:id/override`.
- **URL params:** `id` (bounty UUID).
- **Search params:** none.

## UI structure
- `PageHeader` with breadcrumbs (Bounties → title) + right-action "Override status" (warning severity, AlertTriangle icon).
- Two-column `grid lg:grid-cols-3 gap-6`:
  - Left (`span-2`): single `glass-card` — status badge (large) + formatted reward + reward-type enum label; "Description" (`shortDescription`); "Full Instructions" (`fullInstructions`, pre-wrap).
  - Right: `glass-card` "Details" dl — Brand name, Created By (full name), Created timestamp, End date (optional), Total Submissions.
- `<OverrideModal>` (from `components/common/OverrideModal.tsx`) — Dropdown of bounty statuses (DRAFT/LIVE/PAUSED/CLOSED) + reason textarea.

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** N/A (detail always has body).
- **Error:** `ErrorState` with `refetch()`.
- **Success:** detail view + override button.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Override status | `overrideStatus.mutate({ status, reason })` | PATCH `/override`; toast success; refetch; AuditLog |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Override is destructive (Hard Rule #6)** — `OverrideModal` forces reason capture; backend stores it in AuditLog.
- **Audit log mandatory (Hard Rule #3)** — backend persists `OVERRIDE bounty.status`.
- Admin override bypasses normal state-machine checks (e.g., can move CLOSED → LIVE) — this is the designed super-admin escape hatch.
- Bounty in PAID/EXPIRED terminal state: override still allowed (admin escape hatch).

## Edge cases
- Bounty in terminal state (CLOSED, PAID) — override still enabled but should be used with care; backend has its own guards.
- `bounty.createdBy` null (brand deleted user) — renders `-`.
- `bounty.endDate` null — End row omitted.
- Currency formatting via `formatCurrency(rewardValue, currency)` — falls back safely for 0/null.
- `bounty.accessType` (PUBLIC/CLOSED) not surfaced directly in this view, but `BountyDetailResponse` now carries it post-`da71b0a`.
- Visibility-ack toggle **removed** end-to-end (commit `29a3b72` 2026-04-17); detail response no longer carries `visibilityAcknowledged`.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminBountyDetail`, `useOverrideBountyStatus`.
- `apps/web/src/components/common/OverrideModal.tsx` — shared status-override dialog.
- `apps/web/src/lib/utils/format.ts` — `formatEnumLabel`, `formatCurrency`.

## Open questions / TODOs
- No submissions drilldown inline (admin has to navigate back to `/admin/submissions?bountyId=`).
- Brand name is not wrapped in a link to `/admin/brands/[brandId]` — improvement opportunity.
- Verification/eligibility preview from Phase 2B/3C lives on business detail, not admin detail.
