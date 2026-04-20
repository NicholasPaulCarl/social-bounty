# Edit Brand (Multi-brand) — `/business/brands/[id]/edit`

**Route path:** `/business/brands/[id]/edit`
**File:** `apps/web/src/app/business/brands/[id]/edit/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Deep-link only (Edit action on brand card in `/business/brands`).
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Full-featured edit form for a specific brand by URL param. Multi-brand variant — complements the single-brand `/business/brands/edit`. Exposes everything: Basic Info (name, email, handle with availability, bio, logo, cover), Online Presence (website + 4 social handles), Target Interests pills, Settings (messaging toggle).

## Entry & exit
- **Reached from:** `/business/brands` Edit action on a brand card.
- **Links out to:** `/business/brands` on save / cancel; `/brands/{handle || id}` via breadcrumb.

## Data
- **React Query hooks:** `useBrand(id)`, `useUpdateBrand(id)`, `useQueryClient()` (for cache invalidation).
- **API endpoints called:** `GET /api/v1/brands/:id`, `PATCH /api/v1/brands/:id` (multipart), `POST /api/v1/brands/:id/cover-photo` (when coverPhoto staged), `GET /api/v1/brands/check-handle/:handle` (debounced).
- **URL params:** `id`
- **Search params:** none

## UI structure
- `PageHeader` — Edit Brand, breadcrumbs (Brands / org name / Edit).
- Basic Info card: Name*, Contact Email*, Handle (live availability check; skip-check when unchanged), Bio (counter), Logo input → `<ImageCropDialog aspect=1>`, Cover Photo input → `<ImageCropDialog aspect=3>`.
- Online Presence card: Website URL + 4-up social handle grid.
- Target Interests card: pill toggles from `HUNTER_INTERESTS`.
- Settings card: Messaging toggle (`InputSwitch`) — "Allow hunters to send you direct messages".
- Footer: Cancel + Save Changes.

## States
- **Loading:** `<LoadingState type="detail" />`
- **Empty:** `return null` when no brand.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Form state `initialized`:** one-shot effect hydrates from the fetched brand.
- **Handle check:** skip if unchanged from current brand; otherwise checking / available / taken.
- **Saving:** button spinner; cover-photo upload runs after main save and invalidates the brands cache.
- **Success:** toast + navigate to `/business/brands`.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Cancel | `router.push` | `/business/brands` |
| Save Changes | `updateOrg.mutate({data, logo})` + optional cover upload | Brand updated; cover photo uploaded separately; cache invalidated. |

## Business rules
- Only brand members with appropriate role can edit (RBAC + ownership check server-side).
- Handle skip-check: if `form.handle === org.handle` the availability status is pre-resolved to 'available'.
- `logo === null` vs `logo === undefined`: the undefined case sends no logo (no change); null would mean explicit removal — wired in the mutation layer.
- Messaging toggle controls whether hunters can DM the brand.
- AuditLog on brand update (Hard Rule #3) — server-side.

## Edge cases
- Empty social-links object collapsed to `undefined` before send.
- Empty targetInterests array collapsed to `undefined`.
- Cover-photo upload failure (post-save): toast error but main save still shows success.
- Name / email validation: trim + presence; handle regex.

## Tests
None colocated.

## Related files
- `hooks/useBrand.ts`
- `lib/api/brands.ts` (`checkHandle`, `uploadCoverPhoto`)
- `lib/query-keys.ts` (invalidation)
- `components/common/ImageCropDialog.tsx`
- Shared: `HUNTER_INTERESTS`, `BRAND_PROFILE_LIMITS`, `BrandSocialLinks`.

## Open questions / TODOs
- `initialized` one-shot flag protects against re-hydrating when the query revalidates mid-edit. If the user keeps the tab open for a long time the form won't sync new server data — expected.
