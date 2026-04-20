# Brand Members — `/business/brands/members`

**Route path:** `/business/brands/members`
**File:** `apps/web/src/app/business/brands/members/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link (not in `businessSections` nav — typically reached from brand detail / settings sub-nav).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
List members of the active brand; invite new members by email; remove members (non-OWNER only). Scoped to `user.brandId` (single-brand path).

## Entry & exit
- **Reached from:** Deep-link.
- **Links out to:** none.

## Data
- **React Query hooks:** `useBrandMembers(brandId)`, `useInviteMember(brandId)`, `useRemoveMember(brandId)`.
- **API endpoints called:** `GET /api/v1/brands/:id/members`, `POST /api/v1/brands/:id/members`, `DELETE /api/v1/brands/:id/members/:userId`.
- **URL params:** none (uses `user.brandId`)
- **Search params:** none

## UI structure
- `PageHeader` — Brand Members, breadcrumbs, Invite member action.
- `DataTable` columns: Name (firstName + lastName), Email, Role (`StatusBadge type="orgMemberRole"`), Joined date, Actions (Trash icon — suppressed for OWNER).
- Invite dialog (PrimeReact `Dialog`): InputText for email, Cancel + Send invite.
- `ConfirmAction` remove-member confirm.
- `EmptyState` (Users) with Invite CTA when no members.

## States
- **Loading:** `<LoadingState type="table" />`
- **Empty:** `<EmptyState title="No members" ...>` — CTA to open Invite dialog.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** table.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Invite member | open dialog → POST `/members` `{email}` | Member invited; appears in list on next fetch. |
| Remove member (trash icon) | DELETE `/members/:userId` | After Hard Rule #6 confirm. |

## Business rules
- Brand-member role enum: OWNER / ADMIN / MEMBER (represented by `StatusBadge type="orgMemberRole"`).
- OWNER rows have no Actions column (cannot self-remove; there's no transfer-ownership flow).
- Invite sends a notification / email (server-side; no UI flow for setting password — OTP login is the default).
- AuditLog on add / remove (Hard Rule #3) — server-side.

## Edge cases
- Inviting an already-a-member email: server rejects → error toast.
- Inviting self: server rejects.
- Empty email: Send button disabled.
- Member tries to remove OWNER: UI hides button; server enforces.

## Tests
None colocated.

## Related files
- `hooks/useBrand.ts` (`useBrandMembers`, `useInviteMember`, `useRemoveMember`)
- `hooks/useAuth.ts`, `hooks/useToast.ts`
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `ConfirmAction.tsx`, `EmptyState.tsx`

## Open questions / TODOs
- No role-change UI — members are invited at a fixed role set server-side (likely ADMIN).
- No pending-invitation list — invites silently land in the member list on acceptance (server-dependent).
