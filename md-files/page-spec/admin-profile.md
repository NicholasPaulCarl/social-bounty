# Admin profile — `/admin/profile`

**Route path:** `/admin/profile`
**File:** `apps/web/src/app/admin/profile/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** System → Profile
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, parallel surfaces `/profile` (participant) and `/business/profile` (BUSINESS_ADMIN).

## Purpose
Admin user's own profile edit (first name + last name). Email is read-only. Minimal parallel to `/business/profile` — the admin role has no extra workspace-level profile fields.

## Entry & exit
- **Reached from:** admin sidebar → Profile; header avatar menu (if wired).
- **Links out to:** none.

## Data
- **React Query hooks:** `useProfile()`, `useUpdateProfile()` (shared with all roles via `apps/web/src/hooks/useProfile.ts`).
- **API endpoints called:** `GET /api/v1/users/me`, `PATCH /api/v1/users/me`.
- **URL params:** none.
- **Search params:** none.

## UI structure
- `PageHeader` title "Profile".
- Max-w-2xl column with a single `glass-card` "Personal Information":
  - Optional `Message severity="error"` above the form.
  - Email input (disabled, filled from `profile.email`).
  - Two-column grid: First Name + Last Name inputs.
  - Footer-right "Save changes" button (Save icon, loading).

## States
- **Loading:** `LoadingState type="form"`.
- **Empty:** N/A (profile always exists for an authenticated admin).
- **Error:** top-level `ErrorState`; form-level `Message` on save failure.
- **Success:** inline form; toast "Profile updated" on save.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Save changes | `updateProfile.mutate({ firstName, lastName })` | PATCH; toast; `refetch()`; AuditLog `UPDATE user` |

## Business rules
- RBAC: SUPER_ADMIN-only (the page shell is; the shared hook itself allows any role).
- **Audit log required (Hard Rule #3)** — backend persists `UPDATE user` on self-edit.
- Not destructive — no `ConfirmAction`.
- Email is immutable from UI (requires a separate verified-change flow per `docs/reviews/2026-04-15-team-lead-audit-batch-13.md`).
- No password, 2FA, or role-change affordances here — intentional MVP narrow scope.

## Edge cases
- First/last name blanked — backend accepts empty strings (no NOT NULL constraint on name).
- Trim happens client-side before mutation.
- Profile hook refetches on success; stale data shouldn't persist.

## Tests
Integration-only (shared with `/profile` and `/business/profile`).

## Related files
- `apps/web/src/hooks/useProfile.ts` — shared profile hooks.
- `apps/api/src/modules/users/users.service.ts`.

## Open questions / TODOs
- No "Change password" flow (password auth is roadmap per CLAUDE.md).
- No 2FA, session management, or API-key issuance for super-admins.
- No avatar / display-name field.
