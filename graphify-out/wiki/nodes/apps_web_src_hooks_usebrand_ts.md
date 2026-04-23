# `useBrand.ts`

> TanStack Query hooks for the brand surface — detail, members, create, update, invite, KYB.

## What it does

`useBrand.ts` exports the hook bundle driving `/business/brands/*`: `useBrand(id)` (detail read), `useBrandMembers(id)` (member list), `useCreateBrand` (mutation — form + optional logo upload), `useUpdateBrand(id)` (mutation — invalidates the full brands branch to sync both id-keyed and handle-keyed caches, preventing stale public-profile renders after a handle change), `useInviteMember(brandId)`, `useAcceptInvitation`, `useSubmitKyb(brandId)` (KYB document submission). Types flow from `@social-bounty/shared` (`CreateBrandRequest`, `UpdateBrandRequest`, `InviteMemberRequest`, `BrandListParams`, `SubmitKybRequest`). The mutations all call `queryClient.invalidateQueries({ queryKey: queryKeys.brands.all })` on success — branch invalidation rather than narrow key invalidation, because handle/id dual-indexing would otherwise leave one cache stale.

## Why it exists

The Organisation→Brand rename (commit `539467e` 2026-04-15, route consolidation `8e4c21f` 2026-04-16, end-to-end sweep `c055b2a` + `55cb3b8` + `cb388a2` 2026-04-17) moved this file from `useOrganisation.ts` to `useBrand.ts` and renamed hooks across ~35 files. The dual-index invalidation pattern here is the non-obvious bit worth preserving — without it, a BUSINESS_ADMIN changing their brand handle would see the old handle persist in the public-profile route until a hard refresh. Multi-brand support (a BUSINESS_ADMIN with multiple `BrandMember` rows via the multi-brand JWT claim) is orthogonal to this file; `switchBrand` lives elsewhere.

## How it connects

- **`brandsApi`** — the underlying fetch client in `lib/api/brands.ts`.
- **`BrandsService` (API)** — the server-side counterpart.
- **`queryKeys.brands.*`** — the cache-key factory; `all`, `detail(id)`, `members(id)`, `byHandle(handle)`.
- **`authApi`** — consumed because `useCreateBrand` may refresh the user token on success (new brand-id claim).
- **`@social-bounty/shared`** — DTO types.
- **`/business/brands`, `/business/brands/create`, `/business/brands/[id]/edit`, `/business/brands/kyb` page.tsx** — the consumers.
- **`useAdmin.ts`** — admin brand-management hooks live there, not here; `useBrand.ts` is the business-admin surface.

---
**degree:** 19 • **community:** "React query hooks" (ID 2) • **source:** `apps/web/src/hooks/useBrand.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** the `invalidateQueries({ queryKey: queryKeys.brands.all })` branch-nuke on update is slightly conservative but correct. Finer-grained invalidation (narrow key list) would require tracking which hooks are keyed by handle vs. id — not worth the complexity at current scale.
