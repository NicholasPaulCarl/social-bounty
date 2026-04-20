# Admin create brand — `/admin/brands/new`

**Route path:** `/admin/brands/new`
**File:** `apps/web/src/app/admin/brands/new/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** accessed via "Create brand" CTA on `/admin/brands`
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, CLAUDE.md (Organisation→Brand rename).

## Purpose
Admin-only form to create a new brand and assign an owner by User UUID. Used for manual onboarding / back-office provisioning.

## Entry & exit
- **Reached from:** `/admin/brands` → Create brand button.
- **Links out to:** `/admin/brands` on success (list) or cancel.

## Data
- **React Query hooks:** `useAdminCreateOrg()` (hook name retains legacy `Org` prefix; endpoint is `/admin/brands`).
- **API endpoints called:** `POST /api/v1/admin/brands`.
- **URL params:** none.
- **Search params:** none.

## UI structure
- `PageHeader` with breadcrumbs (Brands → Create).
- Single `glass-card` (max-w-2xl): optional error `Message`, then form:
  - Brand Name (InputText, required).
  - Contact Email (InputText, type=email, required).
  - Owner User ID (InputText, required, with help text "The user ID of the person who will be assigned as brand owner.").
  - Footer: Cancel (outlined secondary) + Create brand (submit, Plus icon, loading state).

## States
- **Loading (submit):** Button `loading` true; form stays visible.
- **Empty:** form empty by default.
- **Error:** inline `Message severity="error"` with `formError` text.
- **Success:** toast "Brand created." + `router.push('/admin/brands')`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Cancel | `router.push('/admin/brands')` | Back to list, no save |
| Create brand | `createOrg.mutate({ name, contactEmail, ownerUserId })` | POST; on success redirect + toast; AuditLog entry on backend |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Audit log mandatory (Hard Rule #3)** — backend records `CREATE brand` with actor id.
- Client-side validation: all three fields required; emails not regex-validated client-side (server checks).
- No "send invitation email" step here — owner must already be a registered user (hence manual `ownerUserId`).

## Edge cases
- Owner User ID invalid (doesn't exist / wrong role) — server returns error, shown inline.
- Duplicate contact email — server enforces uniqueness; error surfaces as generic "Couldn't create brand. Try again."
- Whitespace-only fields trip the "All fields are required." guard.
- Non-UUID ownerUserId — server validates format + existence.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminCreateOrg`.
- `apps/web/src/lib/api/admin.ts` — `POST /admin/brands` call.

## Open questions / TODOs
- No autocomplete/typeahead for Owner User ID — pure UUID paste.
- Hook/function naming still carries `Org` (legacy Organisation→Brand rename leftover).
- No KYB/plan defaults surfaced during creation — brand starts in the default tier as set server-side.
