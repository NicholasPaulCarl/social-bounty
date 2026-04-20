# Hunter Directory — `/hunters`

**Route path:** `/hunters`
**File:** `apps/web/src/app/hunters/page.tsx`
**Role:** BUSINESS_ADMIN + SUPER_ADMIN (per API `GET /api/v1/hunters`); **layout enforces any-authenticated via `AuthGuard`**
**Access:** `AuthGuard` (no `allowedRoles`) — any logged-in user hits this layout; the API, however, restricts the `GET /api/v1/hunters` endpoint to BUSINESS_ADMIN + SUPER_ADMIN. A participant landing here will see the page shell but the hook will 403.
**Nav entry:** business nav ("Hunters") + admin nav ("Hunters") per `navigation.ts`
**Layout:** `apps/web/src/app/hunters/layout.tsx` — `AuthGuard` + `MainLayout`

See `docs/architecture/sitemap.md` §6.

## Purpose
Directory of hunters on the platform for brands / admins to browse and discover. Supports search (debounced 350ms) and interest filtering.

## Entry & exit
- **Reached from:** business nav "Hunters", admin nav "Hunters", brand-detail and submission-review contexts where admins may want to browse hunter profiles
- **Links out to:** `/hunters/[id]` via per-card "View Profile" link

## Data
- **React Query hooks:** `useHunters(params)` (from `@/hooks/useHunters`)
- **API endpoints called:**
  - `GET /api/v1/hunters` — BUSINESS_ADMIN, SUPER_ADMIN — accepts `page`, `limit`, `search`, `interest` query params; returns `{ data: HunterListItem[], meta }`
- **URL params:** — None
- **Search params:** — None consumed via `useSearchParams`; state-local `search` + `selectedInterest`

## UI structure
1. `PageHeader` — title "Hunter Directory", subtitle "Browse and discover talented Hunters"
2. Search row — `InputText` with `Search` icon, 350ms debounce
3. Interest filter chips — `HUNTER_INTERESTS` array, single-select toggles; "Clear" (`X` icon) when one is active
4. Grid of `HunterCard` — 1/md2/lg3 col:
   - Avatar (profilePictureUrl or initials) with `ring-2 ring-glass-border`
   - First + last name, bio (line-clamp-2)
   - Top 3 `interests` pills + "+N" chip if more
   - Top 3 social links with platform icons (`Camera`/`Music2`/`ThumbsUp` per ICONS.md policy) + formatted follower count
   - "View Profile" link → `/hunters/[id]`
5. Paging footer — "Showing N of M hunters" when `totalPages > 1` (no prev/next controls — single-page `limit=24`)

## States
- **Loading:** `LoadingState type="cards-grid" cards={6}`
- **Empty:** `EmptyState Icon={Users}` — "No hunters found" (context-aware message based on whether filters are active)
- **Error:** `ErrorState error={error} onRetry={refetch}` — a participant landing here will hit 403 and see the error state
- **Success:** grid + optional paging footer

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Search | `setSearch` + debounce | refetch w/ `search` query param |
| Interest chip toggle | `handleInterestToggle` | refetch w/ `interest` query param |
| Clear filter | `setSelectedInterest(null)` | clears filter |
| View Profile | Link | `/hunters/[id]` |

## Business rules
- API gate: BUSINESS_ADMIN + SUPER_ADMIN only. The layout doesn't filter by role, so a participant can technically load the page and will see the 403 error surfaced via `ErrorState`.
- `HUNTER_INTERESTS` is the canonical list from `@social-bounty/shared` — must match the list on `/profile/edit` and `/brands`.
- `formatFollowers` helper: 1.2M / 45.2K / 234.

## Edge cases
- Participant user loads the page → API 403 → `ErrorState`. No preemptive role-based redirect.
- Empty directory → `EmptyState` with friendly copy.
- 429 (rare — not a `@Public` throttle) → `ErrorState` with retry.
- Platform icon missing for a channel value not in `PLATFORM_ICONS` → falls back to `Link2` icon.
- `hunter.socialLinks` with `followerCount === null` → just shows icon without count.

## Tests
No colocated tests.

## Related files
- `apps/web/src/hooks/useHunters.ts` — `useHunters` hook
- `apps/web/src/components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx`
- `apps/web/src/lib/api/client.ts` — `getUploadUrl`
- `packages/shared/src/...` — `HUNTER_INTERESTS`, `SocialChannel`, `HunterListItem`
- `lucide-react`: `Camera`, `Music2`, `ThumbsUp`, `Link2`, `ArrowRight`, `Search`, `X`, `Users`
- PrimeReact: `InputText`

## Open questions / TODOs
- Participant users shouldn't even reach this page from nav, but if they deep-link they hit 403 — consider `AuthGuard allowedRoles={[BUSINESS_ADMIN, SUPER_ADMIN]}` on `hunters/layout.tsx` for a cleaner 403 UX (redirect to `/bounties`).
- No pagination UI beyond `showing N of M` — fixed at `limit=24`.
- Social-link platform icons: Lucide 1.8 dropped brand glyphs; current mapping is `Camera` → IG, `Music2` → TikTok, `ThumbsUp` → FB (per ICONS.md policy).
