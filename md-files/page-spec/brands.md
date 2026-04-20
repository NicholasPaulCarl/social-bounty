# Brand Directory — `/brands`

**Route path:** `/brands`
**File:** `apps/web/src/app/brands/page.tsx`
**Role:** any-authenticated OR public (role-ambiguous per `sitemap.md` §6)
**Access:** **No `AuthGuard`** on `brands/layout.tsx` — unauthenticated users get a bare centered layout, authenticated users get the full app shell with role-appropriate sidebar. Public-crawlable.
**Nav entry:** participant nav "Browse Brands" (appears in `navigation.ts`'s `participantSections`); also reachable by any logged-in role
**Layout:** `apps/web/src/app/brands/layout.tsx` — conditional: `MainLayout` for authenticated users, plain centered `<main>` for unauthenticated

See `docs/architecture/sitemap.md` §6 for the route-group quirk note.

## Purpose
Public directory listing brands on the platform. Supports search (debounced 350ms) and interest-tag filtering.

## Entry & exit
- **Reached from:** participant sidebar "Brands", search-engine crawl, any role via deep link
- **Links out to:** `/brands/[id]` (or `/brands/[handle]` if present) via per-card "View Profile" link

## Data
- **React Query hooks:** `useBrandsPublicList(params)` (from `@/hooks/useBrand`)
- **API endpoints called:**
  - `GET /api/v1/brands/public` — `@Public`, throttled 30/min — returns `{ data: BrandListItem[], meta }` with `page=1, limit=24` + optional `search`, `interest` query params
- **URL params:** — None
- **Search params:** — None consumed via `useSearchParams`, but local state `search`, `selectedInterest` drive the query

## UI structure
1. `PageHeader` — title "Brand Directory", subtitle "Browse and discover brands on Social Bounty"
2. Search row — `InputText` with `Search` icon, 350ms debounce into `debouncedSearch`
3. Interest filter chips — horizontal wrap of `HUNTER_INTERESTS` (from `@social-bounty/shared`) rendered as toggleable pills; single-select (selecting a new one replaces prior); "Clear" button with `X` appears when one is active
4. Grid of `BrandCard` components — 1-col / md 2-col / lg 3-col
   - Logo (Image via `getUploadUrl`) or fallback pink initials tile
   - Name + `@handle`
   - Bio (line-clamp-2)
   - Top 3 `targetInterests` pills + "+N" if more
   - "X bounties" count with `Megaphone` icon
   - "View Profile" link → `/brands/[handle||id]`
5. Paging footer — "Showing N of M brands" when `totalPages > 1` (no next/prev controls — single-page limit=24)

## States
- **Loading:** `LoadingState type="cards-grid" cards={6}`
- **Empty:** `EmptyState Icon={Building2}` — "No brands found" + context message ("Try adjusting your search or filters." vs "No brands have joined the platform yet.")
- **Error:** `ErrorState` component with retry
- **Success:** grid renders + optional paging footer

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Search input | `setSearch(value)` + debounce | refetch with `search` query param |
| Interest pill toggle | `handleInterestToggle` | refetch with `interest` query param; unselects if re-clicked |
| Clear filter | `setSelectedInterest(null)` | clears interest filter |
| View Profile | Link | `/brands/[handle||id]` |

## Business rules
- Endpoint is `@Public` + 30/min throttle, so even unauthenticated users see the directory.
- `limit=24` hardcoded; no pagination controls wired — relying on server's returned `totalPages` meta but only ever showing page 1.
- Only brands with `public` visibility are returned; backend filtering handled in `BrandsService.listPublic`.

## Edge cases
- Throttled (429) → `useBrandsPublicList` surfaces error; `ErrorState` shown with retry.
- Logo URL broken / 404 → `next/image` will fail; no explicit fallback beyond the server-rendered `getUploadUrl`. Consider adding `onError` swap.
- `targetInterests` undefined / null → defensively coalesced via `(brand.targetInterests || []).slice(0, 3)`.
- Authenticated vs public layout: the same page renders in both shells; when unauthenticated there is no sidebar so the content sits in a `max-w-7xl` centered container.

## Tests
No colocated tests.

## Related files
- `apps/web/src/hooks/useBrand.ts` — `useBrandsPublicList`
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx`
- `apps/web/src/lib/api/client.ts` — `getUploadUrl` helper
- `packages/shared/src/...` — `HUNTER_INTERESTS`, `BrandListItem` type
- `lucide-react`: `Megaphone`, `ArrowRight`, `Search`, `X`, `Building2`
- PrimeReact: `InputText`

## Open questions / TODOs
- No pagination controls for >24 brands (the `meta.totalPages > 1` text is informational only).
- Linking via `brand.handle || brand.id` — handle-only URLs don't guarantee backward compat if a brand renames.
- No sort controls (alphabetical / most active) — may matter as directory scales.
- Authenticated users see the normal sidebar; the empty-layout for unauth users has no marketing nav (unlike `(marketing)/*` pages) — which means a deep-link via Google yields a bare page. Consider adding a minimal marketing header/footer for public hits.
