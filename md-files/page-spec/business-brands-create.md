# Create Brand — `/business/brands/create`

**Route path:** `/business/brands/create`
**File:** `apps/web/src/app/business/brands/create/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (CTA from `/business/brands`).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Create an additional brand the BA will own. Used when a BA manages multiple brands (per CLAUDE.md "Brand route consolidation" 2026-04-16 — multi-brand path). Also auto-switches to the new brand on success.

## Entry & exit
- **Reached from:** `/business/brands` Create-brand CTA.
- **Links out to:** `/business/brands` on success.

## Data
- **React Query hooks:** `useCreateBrand()`, `useAuth` (for `switchBrand`).
- **API endpoints called:** `POST /api/v1/brands` (multipart, with optional logo), `POST /api/v1/brands/:id/cover-photo` (optional, separate call), `POST /api/v1/auth/switch-brand` (on success), `GET /api/v1/brands/check-handle/:handle` (debounced availability check).
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` — Create Brand.
- Basic Info section: Name*, Contact Email*, Handle (with live availability indicator — `Loader2` / `CheckCircle2` / `XCircle`), Bio (maxLength + counter), Logo (file input → `<ImageCropDialog aspect=1>`), Cover Photo (file input → `<ImageCropDialog aspect=3>`).
- Online Presence section: Website URL, Instagram / TikTok / Facebook / X handles (2-col grid on sm+).
- Target Interests section: pill toggles from shared `HUNTER_INTERESTS`. Selected pills are `bg-pink-600 text-bg-void border-pink-600 shadow-glow-brand`.
- Footer: Cancel + Create Brand buttons.

## States
- **Loading (handle check):** `handleStatus = 'checking'` during 500ms debounce.
- **Handle available:** green check.
- **Handle taken:** red X + error in `errors.handle`.
- **Saving:** button spinner.
- **Success:** upload cover photo (non-blocking on failure), `switchBrand(org.id)` (non-blocking on failure), toast + navigate to `/business/brands`.
- **Error:** inline `errors` object for field-level messages; fallback toast on mutation error.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Cancel | `router.push` | `/business/brands` |
| Create Brand | `createOrg.mutate` + cover upload + switchBrand + redirect | New brand, active, redirected. |

## Business rules
- Handle: lowercased input, regex `^[a-zA-Z0-9_-]+$`, length bounded by `BRAND_PROFILE_LIMITS.HANDLE_MIN/MAX`.
- Bio length bounded by `BRAND_PROFILE_LIMITS.BIO_MAX`.
- Brand creation gate: `POST /api/v1/brands` is permitted for PARTICIPANT + BUSINESS_ADMIN (so a participant can self-onboard into a brand — see `(shared)/create-brand/page.tsx`).
- Cover photo is uploaded via a separate endpoint (not part of the multipart on create).
- Logo optional — uploaded via multipart on create if provided.

## Edge cases
- Handle empty → no availability indicator (idle).
- Logo file selected but cancelled in crop dialog: no staged file.
- Auto-switch to new brand on success may fail silently (wrapped in try/catch). User can still manually switch.
- Cover-photo upload failure post-create: toast "Cover photo upload failed. You can add it later." — brand still created.

## Tests
None colocated.

## Related files
- `hooks/useBrand.ts` (`useCreateBrand`)
- `hooks/useAuth.ts` (`switchBrand`)
- `lib/api/brands.ts` (`checkHandle`, `uploadCoverPhoto`)
- `components/common/ImageCropDialog.tsx`
- Shared: `HUNTER_INTERESTS`, `BRAND_PROFILE_LIMITS`, `BrandSocialLinks`.

## Open questions / TODOs
- No ConfirmAction wrapping — Create is directly on form submit. Destructive-action rule doesn't apply here (non-destructive), but the flow auto-switches active context which is potentially surprising.
