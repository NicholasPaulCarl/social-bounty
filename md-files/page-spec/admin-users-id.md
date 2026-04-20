# Admin user detail — `/admin/users/[id]`

**Route path:** `/admin/users/[id]`
**File:** `apps/web/src/app/admin/users/[id]/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** deep-link only
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, `docs/architecture/security-and-rbac.md`, `docs/reviews/2026-04-15-team-lead-audit-batch-13.md` (password-auth roadmap gap).

## Purpose
Per-user drill-down: profile fields, activity snapshot, submission history, and audit trail — with Suspend/Activate mutations gated by `ConfirmAction` + mandatory reason.

## Entry & exit
- **Reached from:** `/admin/users` row Eye button; `/admin/submissions/[id]` participant click; `/admin/brands/[id]` member links.
- **Links out to:** `/admin/submissions/[id]` (row click on Submissions tab).

## Data
- **React Query hooks:** `useAdminUserDetail(id)`, `useUpdateUserStatus(id)`, `useAdminSubmissions({ userId, limit: 20 })`, `useAuditLogs({ actorId: userId, limit: 20 })`.
- **API endpoints called:** `GET /api/v1/admin/users/:id`, `PATCH /api/v1/admin/users/:id/status`, `GET /api/v1/admin/submissions?userId=…`, `GET /api/v1/admin/audit-logs?actorId=…`.
- **URL params:** `id` (user UUID).
- **Search params:** none (tab state is local).

## UI structure
- `PageHeader` with breadcrumbs (Users → email) + title (`firstName lastName` or fallback to email) + right-side actions: Suspend (danger outlined) when `status === 'ACTIVE'`, Activate (success outlined) when suspended.
- `TabView` with 3 tabs:
  1. **Overview** — two-column: left "User Information" (email, name, role, status, email verified, created), right "Activity" (brand name + link, submission count, approved count).
  2. **Submissions** — `DataTable` of user's submissions (id truncated, bounty title, status badge, payout badge, submitted date); row click → `/admin/submissions/[id]`.
  3. **Audit Activity** — `DataTable` of audit entries where this user was actor (action, entity type, entity id truncated, timestamp).
- Two `ConfirmAction` dialogs: Suspend (danger, `requireReason`) + Activate (success, `requireReason`).

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty (sub-tables):** "No submissions found for this user." / "No audit activity found for this user."
- **Error:** `ErrorState` with `refetch()`.
- **Success:** full tabbed view.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Suspend | `updateStatus.mutate({ status: SUSPENDED, reason })` | Confirm dialog; toast success; `refetch()`; AuditLog `UPDATE user.status` |
| Activate | `updateStatus.mutate({ status: ACTIVE, reason })` | Confirm dialog; toast success; `refetch()`; AuditLog |
| Row click (Submissions) | `router.push('/admin/submissions/:id')` | Submission drill-down |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Destructive-action confirmation required (Hard Rule #6)** — `ConfirmAction` with `requireReason` on every status change. Reason copied to audit log.
- **Audit log mandatory (Hard Rule #3 + CLAUDE.md §4.6)** — backend persists `AuditLog` entry on `PATCH /admin/users/:id/status`.
- Impersonation UI is **not** present here (not in MVP scope per `docs/reviews/2026-04-15-team-lead-audit-batch-13.md`).
- Wallet drill-down is via the separate `/admin/wallets/[userId]` route — no inline wallet panel here.

## Edge cases
- User has no assigned brand (`user.brand` null) — Brand row hidden from Activity panel.
- Legacy `user.firstName`/`lastName` may be null — title falls back to email; dd cells show `-`.
- Suspended user re-activation still requires `requireReason` (even though it's a positive action) — forces audit trail.
- `useAdminUserDetail` returns `submissionCount` / `approvedSubmissionCount`; these may be 0 for never-active users.
- Role downgrade (PARTICIPANT ↔ BUSINESS_ADMIN ↔ SUPER_ADMIN) is **not wired** on this page — MVP only supports status changes.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts`.
- `apps/web/src/components/common/ConfirmAction.tsx` — destructive-action dialog with reason.
- `apps/web/src/components/common/StatusBadge.tsx` — `user` + `role` + `submission` + `payout` types.
- `apps/api/src/modules/admin/admin.service.ts` — `updateUserStatus`.

## Open questions / TODOs
- No wallet-balance or open-withdrawals inline summary (would save a hop to `/admin/wallets/[userId]`).
- Role change UI deferred to post-MVP.
- No "send password reset" admin action; CLAUDE.md notes password auth is roadmap.
