# My Brands — `/business/brands`

**Route path:** `/business/brands`
**File:** `apps/web/src/app/business/brands/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.Brands`
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Multi-brand management — list all brands the BA belongs to, show the active brand, allow switching between them, and deep-link to per-brand edit / public profile.

## Entry & exit
- **Reached from:** Sidebar nav.
- **Links out to:** `/business/brands/create`, `/business/brands/{id}/edit`, `/brands/{handle || id}` (public profile).

## Data
- **React Query hooks:** `useMyBrands()`, `useAuth` (for `user.brandId`, `switchBrand`).
- **API endpoints called:** `GET /api/v1/brands/mine`, `POST /api/v1/auth/switch-brand` (via `switchBrand` from `useAuth`).
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` with Create brand action.
- 3-col responsive grid (`md:2 lg:3`) of `glass-card` brand cards. Active brand gets `ring-2 ring-pink-600 shadow-glow-brand` ring.
- Each card: logo (or initial-letter fallback), name + active chip + `@handle`, `StatusBadge type="brand"`, "N bounties", role (OWNER / ADMIN / MEMBER). Actions: Switch (non-active), Edit, View.
- `EmptyState` (Building2) with Create-brand CTA when no brands.

## States
- **Loading:** `<LoadingState type="cards-grid" cards={3} />`
- **Empty:** EmptyState.
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Success:** grid of cards.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Create brand | `router.push` | `/business/brands/create` |
| Switch | `switchBrand(id)` → JWT re-mint | Active brand becomes this one; toast success. |
| Edit | `router.push` | `/business/brands/{id}/edit` |
| View | `router.push` | `/brands/{handle \|\| id}` (public brand profile) |

## Business rules
- `switchBrand` calls `POST /auth/switch-brand` to issue a new JWT with the new brand-id claim (BUSINESS_ADMIN + SUPER_ADMIN only — matches CLAUDE.md JWT compat shim in `auth.service.ts:428-430`).
- Role in this context is the *brand-membership* role (OWNER / ADMIN / MEMBER), not the platform role.
- No destructive action on this page — delete-brand isn't exposed.

## Edge cases
- User has only one brand: Switch button hidden.
- Brand with no logo: first-letter avatar.
- Brand with no handle: View button goes to `/brands/{id}`.

## Tests
None colocated.

## Related files
- `hooks/useBrand.ts` (`useMyBrands`)
- `hooks/useAuth.ts` (`switchBrand`)
- `lib/api/client.ts` (`getUploadUrl`)
- `components/common/PageHeader.tsx`, `StatusBadge.tsx`, `EmptyState.tsx`

## Open questions / TODOs
- No way to reorder / star a primary brand — user has to switch manually each session.
