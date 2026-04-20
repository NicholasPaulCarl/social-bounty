# My Profile — `/profile`

**Route path:** `/profile`
**File:** `apps/web/src/app/(participant)/profile/page.tsx`
**Role:** Any authenticated role.
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Sidebar Profile (participant).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Read-only profile overview: avatar + name + verification state + role badge, bio, interests, social links (with follower/post counts cached from Apify). Encourages profile completion via banner + "Complete now" CTA.

## Entry & exit
- **Reached from:** Sidebar, profile nudge in `/bounties/[id]` apply flow, welcome flow.
- **Links out to:** `/profile/edit`, `/hunters/:id` (public view — new tab), email verification flow.

## Data
- **React Query hooks:** `useProfile()`, `useSocialLinks()`, `useAuth()`.
- **API endpoints called:** `GET /profile`, `GET /profile/social-links`.
- **URL params:** None.
- **Search params:** None.

## UI structure
- `PageHeader` "My profile" with actions: View public (`/hunters/:id`, `target="_blank"`, ExternalLink icon) + Edit (Pencil icon).
- Email unverified → warn `Message`.
- Profile completion banner (when < 100%): BarChart3 icon, percentage (mono), progress bar, prompt listing missing fields ("Add your bio, profile picture, interests, social links to get noticed by brands.").
- Account details card: Avatar/initials, name, StatusBadge role, email with verified/unverified chip.
- Bio card (if present).
- Interests card (if non-empty): pink pill chips.
- Social links card (if non-empty): per-link row with platform icon (Link2/Music2 fallback per DS ICONS.md), platform label + `@handle`, link, follower/post counts (mono).

## States
- **Loading:** `LoadingState type="detail"`.
- **Empty:** N/A (profile always exists post-signup).
- **Error:** `ErrorState` with retry.
- **Success:** All cards render.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Edit | `Link href="/profile/edit"` | Editor |
| View public | `Link target="_blank"` | `/hunters/:id` |
| Complete now | `Link href="/profile/edit"` | Editor |

## Business rules
- `computeCompletion`: 25% each for bio + profile picture + interests + social links. Progress bar hidden at 100%.
- Role shown via `StatusBadge type="role"` — participant, business admin, super admin.
- Social link icons limited by Lucide 1.8 inventory (Instagram/Facebook use neutral Link2 fallback per ICONS.md policy).

## Edge cases
- No profile picture → pink initials circle.
- `followerCount` / `postCount` null → cell suppressed.
- Email unverified → warn banner; no CTA button.

## Tests
No colocated tests.

## Related files
- `@/hooks/useProfile`, `useAuth`
- `@/lib/api/client` — `getUploadUrl`
- `@/lib/utils/format` — `formatCount`
- `@/components/common/StatusBadge`, `PageHeader`
- Shared: `SocialChannel`

## Open questions / TODOs
- No social-handle verification CTA (e.g. "re-scrape"). Refresh happens at login per `useSocialHandles` flow.
- Brand-specific surfaces not handled here; this page is primarily for HUNTERs but renders harmlessly for brand admins too.
