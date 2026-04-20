# Edit Single-Brand — `/business/brands/edit`

**Route path:** `/business/brands/edit`
**File:** `apps/web/src/app/business/brands/edit/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only.
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Minimal edit form for the BA's active brand (`user.brandId`). Single-brand path. The richer multi-brand edit lives at `/business/brands/[id]/edit`. Per CLAUDE.md "Brand route consolidation" 2026-04-16 (commit `8e4c21f`), `/business/brands/edit/` (single-brand) and `/business/brands/[id]/edit/` (multi-brand) coexist intentionally.

## Entry & exit
- **Reached from:** Deep-link. Not surfaced in current nav (older nav entries from pre-consolidation may linger).
- **Links out to:** `/business/brands` on success / cancel.

## Data
- **React Query hooks:** `useBrand(brandId)` where `brandId = user.brandId`, `useUpdateBrand(brandId)`, `useAuth`.
- **API endpoints called:** `GET /api/v1/brands/:id`, `PATCH /api/v1/brands/:id` (multipart with optional logo).
- **URL params:** none (active brand from JWT)
- **Search params:** none

## UI structure
- `PageHeader` — Edit Brand, breadcrumbs (Brands / Edit).
- `glass-card` form with three fields: Brand Name*, Contact Email*, Logo (shows current logo inline if present, PrimeReact `FileUpload` mode=basic).
- Footer: Cancel + Save Changes.

## States
- **Loading:** `<LoadingState type="form" />`
- **Empty:** `return null` if no brand.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Saving:** button spinner.
- **Validation error:** inline `formError` (name + email required).
- **Success:** toast + navigate to `/business/brands`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Cancel | `router.push` | `/business/brands` |
| Save Changes | `updateBrand.mutate({data, logo})` | Name + email + optional logo update. |

## Business rules
- Scoped to `user.brandId` — BAs with multiple brands edit the currently-active one.
- No handle / bio / social-links / cover-photo / interests editing here — the full edit is `/business/brands/[id]/edit`.
- KYB / members / subscription are separate sibling routes — `/business/brands/{kyb,members,subscription}`, all scoped to the active brand.

## Edge cases
- `user.brandId` empty: `useBrand('')` returns nothing; page renders nothing. No defensive "no active brand" message.
- Logo larger than 5MB: PrimeReact `FileUpload` enforces `maxFileSize={5000000}` client-side.
- Direct-URL logo `brand.logo` rendered in `<img>` (not `next/image` — raw URL).

## Tests
None colocated.

## Related files
- `hooks/useBrand.ts` (`useBrand`, `useUpdateBrand`)
- `hooks/useAuth.ts`
- `components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`

## Open questions / TODOs
- This page is redundant with `/business/brands/[id]/edit` when the active brand is the only one. Kept for the single-brand-BA happy path, but the richer [id]/edit form supersedes it feature-wise.
- No handle-availability check, no social links, no target interests — minimal by design.
