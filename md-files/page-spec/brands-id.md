# Brand Profile — `/brands/[id]`

**Route path:** `/brands/[id]` (also accepts handle in lieu of id)
**File:** `apps/web/src/app/brands/[id]/page.tsx`
**Role:** any-authenticated OR public (inherits layout behaviour from `brands/layout.tsx`)
**Access:** **No `AuthGuard`** — same conditional layout as `/brands`
**Nav entry:** deep-link only (reached from `/brands` card's "View Profile" link or any external share)
**Layout:** `apps/web/src/app/brands/layout.tsx` — `MainLayout` for authenticated, bare centered `<main>` for unauthenticated

See `docs/architecture/sitemap.md` §6.

## Purpose
Public brand profile page. Shows cover photo, logo, stats (bounties posted / total rewards / achievement rate), social reach, target interests, website, and a CTA to browse the brand's live bounties.

## Entry & exit
- **Reached from:** `/brands` card click, direct URL / deep link (SEO / sharing), external / social referrals
- **Links out to:** `/bounties?brand={brand.id}` (CTA "Browse Bounties"), brand's external social links (`target="_blank"`), `brand.websiteUrl` (external)

## Data
- **React Query hooks:** `useBrandPublicProfile(idOrHandle)` (from `@/hooks/useBrand`)
- **API endpoints called:**
  - `GET /api/v1/brands/public/:idOrHandle` — `@Public`, throttled 60/min
- **URL params:** `id` (accepts brand UUID or URL-safe handle)
- **Search params:** — None

## UI structure
1. Cover photo hero — 48/64 (md) high `Image` with pink→blue gradient fallback; no breadcrumbs
2. Brand header row:
   - Logo (16×16, rounded-xl) or fallback pink initials tile
   - Name (H1) + `@handle` + joined-date with `Calendar` icon
   - Bio (`max-w-2xl`)
   - Social links row — grayscale icon links (`Camera`→Instagram, `Music2`→TikTok, `ThumbsUp`→Facebook, `Globe`→X+website), opens in new tab (per ICONS.md Lucide 1.8 brand-glyph substitution)
3. Stats cards — 3-col grid: "Bounties Posted", "Total Rewards" (uses `formatCurrency(stats.totalBountyAmount)`, falls back to "No bounties yet"), "Achievement Rate" (percent, same fallback)
4. `BrandSocialReachCard` — embedded component (reads `brand.socialLinks`, `brand.socialAnalytics`)
5. Target Interests chips (skipped if empty)
6. Website link (skipped if empty) — `ExternalLink` icon
7. CTA card — "Interested in this brand's bounties?" + `Search`-icon gradient button linking to `/bounties?brand={brand.id}`

## States
- **Loading:** `LoadingState type="detail"`
- **Empty:** — brand always exists if route matched; empty sub-sections conditionally hide
- **Error:** `ErrorState error={error} onRetry={refetch}` (e.g. 404 on unknown handle, 429 throttle)
- **Success:** renders full profile

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Browse Bounties | Link | `/bounties?brand={brand.id}` |
| Social icon / Website | External link | new tab, `rel="noopener noreferrer"` |

## Business rules
- Public endpoint — no auth needed; throttle 60/min.
- Stats shown conditionally ("No bounties yet" when `bountiesPosted === 0`).
- Cover photo + logo routed through `getUploadUrl()` (S3-like signed-URL helper).
- Uses the CTA gradient `pink-600 → blue-600` — part of the DS "one gradient per view" budget. The cover-photo fallback uses the same pink/blue blur, which could push over the budget if a real cover photo isn't uploaded.

## Edge cases
- Unknown handle → 404 from API → `ErrorState` with retry.
- Brand with 0 bounties → stat cards show "No bounties yet" (but "Bounties Posted" shows the raw `0`).
- Broken cover / logo URL → `next/image` fails silently; gradient fallback still renders under cover.
- `brand.socialAnalytics` null → `BrandSocialReachCard` handles empty state internally.
- CTA link uses `brand.id` regardless of whether route is handle-based — intentional to keep bounty-filter query stable.

## Tests
No colocated tests.

## Related files
- `apps/web/src/hooks/useBrand.ts` — `useBrandPublicProfile`
- `apps/web/src/components/features/brand-profile/BrandSocialReachCard.tsx`
- `apps/web/src/components/common/LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/api/client.ts` — `getUploadUrl`
- `apps/web/src/lib/utils/format.ts` — `formatCurrency`, `formatDate`
- `packages/shared/src/...` — `BrandSocialLinks` type
- `lucide-react`: `Camera`, `Music2`, `ThumbsUp`, `Globe`, `Calendar`, `ExternalLink`, `Search`

## Open questions / TODOs
- Achievement-rate calculation source not obvious from page — confirm formula in `BrandsService.getPublicProfile`.
- Gradient-budget audit (see Business rules): cover-fallback + CTA both use pink→blue; one gradient per view per DS. Consider dropping the fallback gradient in favour of a neutral colour.
- `/bounties?brand={id}` CTA relies on the bounty listing page supporting the `brand` query param — confirm in `(participant)/bounties/page.tsx` (owned by another agent).
