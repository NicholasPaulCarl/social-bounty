# Create Brand — `/create-brand`

**Route path:** `/create-brand`
**File:** `apps/web/src/app/(shared)/create-brand/page.tsx`
**Role:** any-authenticated
**Access:** `AuthGuard` without `allowedRoles` (any logged-in user, no role filter) — see `(shared)/layout.tsx`
**Nav entry:** out-of-nav by design (deep-linked from signup flow, participant profile CTA, empty states)
**Layout:** `apps/web/src/app/(shared)/layout.tsx` — `AuthGuard` + `MainLayout` (sidebar based on current role)

See `docs/architecture/sitemap.md` §2.

## Purpose
Lets a signed-in participant (or staff member acting on behalf of a user) upgrade into a Business Admin by creating a brand. On success, the user becomes `BUSINESS_ADMIN` and is routed to `/business/dashboard`.

## Entry & exit
- **Reached from:** signup flow when the brand toggle was left OFF and the user later wants to list bounties, participant profile "Become a brand" CTA, empty states encouraging brand creation — **not in any nav section**
- **Links out to:** `/business/dashboard` (on success), `router.back()` (Cancel button — previous page)

## Data
- **React Query hooks:** `useCreateBrand()` (mutation; from `@/hooks/useBrand`)
- **API endpoints called:**
  - `POST /api/v1/brands` — PARTICIPANT, BUSINESS_ADMIN (creates brand + logo upload, per `brands.controller.ts`)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. `PageHeader` — title "Create Brand", subtitle "Set up your business to start creating bounties"
2. Inline `Message severity="error"` banner when `error` is non-empty
3. Form inside `glass-card`:
   - Brand Name (required, text input)
   - Contact Email (required, email input)
   - Logo (optional, `FileUpload mode="basic"` with `accept="image/*"` and `maxFileSize={2000000}` = 2 MB)
   - Row of two buttons: "Create Brand" (submit, `Check` icon, loading = `createBrand.isPending`) + "Cancel" (secondary outlined, `router.back()`)
4. Toast notifications via `useToast` on success / error

## States
- **Loading:** `createBrand.isPending` → PrimeReact `Button loading` prop
- **Empty:** — None (form page)
- **Error:** inline `Message` banner with `error` state; `useToast.showError` fires too. Non-`ApiError` shows "Couldn't create brand. Try again." toast.
- **Success:** `useToast.showSuccess('Brand created! You are now a Business Admin.')` → `router.push('/business/dashboard')`

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Create Brand | `handleSubmit` → `createBrand.mutateAsync` | on success: toast + push `/business/dashboard` |
| Cancel | `router.back()` | previous route |

## Business rules
- Server-side role promotion: on brand creation the user's role flips to `BUSINESS_ADMIN` (current implementation in `BrandsService.create`); JWT must be refreshed for the new role to take effect client-side (the `useCreateBrand` hook returns an updated session or the layout re-fetches on next navigation — confirm in `useBrand.ts`).
- Logo upload: image type only, 2 MB cap.
- No KYB enforcement at creation time (`/business/brands/kyb` is a separate post-creation step — see business-surface spec).
- Per `CLAUDE.md` HEAD banner: the Organisation→Brand rename is complete; legacy route `/create-organisation` was renamed to `/create-brand` in commit `c055b2a`.

## Edge cases
- Empty name or contact email → inline `setError('Name and contact email are required')` fires before API call.
- Logo >2 MB → PrimeReact `FileUpload` rejects client-side.
- Duplicate brand name (if handle-generation collides) → `ApiError` from backend surfaces in banner.
- Race with signup — if a participant taps the brand-signup path at `/signup` and this page simultaneously, backend enforces user-brand uniqueness (one owner per user).
- Network / 5xx → toast "Couldn't create brand. Try again." and inline banner.

## Tests
No colocated tests.

## Related files
- `apps/web/src/hooks/useBrand.ts` — `useCreateBrand` mutation
- `apps/web/src/hooks/useToast.ts`
- `apps/web/src/components/common/PageHeader.tsx`
- `apps/web/src/lib/api/client.ts` — `ApiError`
- `lucide-react`: `Check`
- PrimeReact: `InputText`, `FileUpload`, `Button`, `Message`

## Open questions / TODOs
- Confirm whether `useCreateBrand` refreshes the JWT / user session client-side so `getNavSections(user.role)` flips to `businessSections` immediately on `/business/dashboard` load — otherwise the user lands with participant chrome until next page load.
- No brand-handle input — derived server-side (or prompted later on `/business/brands/edit`).
- No KYB inline step — the `/business/brands/kyb` page must be reached separately.
