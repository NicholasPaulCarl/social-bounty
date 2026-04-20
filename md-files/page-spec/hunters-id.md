# Hunter Profile — `/hunters/[id]`

**Route path:** `/hunters/[id]`
**File:** `apps/web/src/app/hunters/[id]/page.tsx`
**Role:** PARTICIPANT + BUSINESS_ADMIN + SUPER_ADMIN (per API `GET /api/v1/hunters/:id`)
**Access:** `AuthGuard` (no `allowedRoles`) via `hunters/layout.tsx` — any logged-in user
**Nav entry:** deep-link only — from `/hunters` card "View Profile", `/brands/[id]` reach context, submission / application detail pages
**Layout:** `apps/web/src/app/hunters/layout.tsx` — `AuthGuard` + `MainLayout`

See `docs/architecture/sitemap.md` §6.

## Purpose
Public-ish hunter profile for brands/admins/other hunters to view. Shows avatar, bio, social channels with verification status, interests, activity stats, and an "Invite to Bounty" CTA (for brand viewers).

## Entry & exit
- **Reached from:** `/hunters` card, submission-review context, brand/admin deep-links
- **Links out to:** External social-link URLs (`target="_blank"`), `Invite to Bounty` button currently has no handler (no `onClick` / `href` wired)

## Data
- **React Query hooks:** `usePublicProfile(id)` (from `@/hooks/useHunters`)
- **API endpoints called:**
  - `GET /api/v1/hunters/:id` — PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN
- **URL params:** `id` (hunter user UUID; passed via `params: { id: string }` page prop — **note: the file uses non-async Next 14 `params` directly rather than the `useParams()` hook pattern seen on the brand page; both are valid in the `app/` router today but may need `await params` under Next 15**)
- **Search params:** — None

## UI structure
2-column responsive layout (stacked on mobile, 2/3 + 1/3 on `lg+`):

**Left column:**
1. Profile card (`glass-card`) — 24×24 avatar (initials fallback), name H1, `emailVerified` badge (`BadgeCheck`), bio, "Member since" with `Calendar` icon
2. Social Channels list — one `SocialLinkRow` per `profile.socialLinks[]`: platform icon + handle + `Verified` mini-badge (if `isVerified`) + follower/post counts; opens external link with `ExternalLink` icon
3. Interests — wrap of pink-tinted chips

**Right column:**
4. Statistics — 3 stacked `StatCard`s: Total Submissions (`Send`, pink), Approved Submissions (`CheckCircle2`, success), Completed Bounties (`Star`, warning)
5. CTA card — "Work with this hunter" + "Invite to Bounty" button (currently unwired)

## States
- **Loading:** `LoadingState type="detail"`
- **Empty:** — None (route always has a hunter if matched)
- **Error:** **Fallback to `MOCK_PROFILE`** — when the API errors or returns no data, the page renders a mocked profile (Jordan Blake, 45.2K IG / 128K TikTok) so the layout is never blank. **This is explicit dev-scaffolding and should be removed before launch.**
- **Success:** renders `HunterProfileContent` with real data

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Social link row | External link | new tab to hunter's social profile |
| Invite to Bounty | **(unwired)** | No `onClick` handler — renders a PrimeReact `<Button>` without action |

## Business rules
- `emailVerified` badge shown only when `true`.
- Social-link `isVerified` comes from the `UserSocialHandle` row — verified at login via Apify scraper per `CLAUDE.md` Phase 1/2 spec.
- Stats come from the profile API response (`totalSubmissions`, `approvedSubmissions`, `completedBounties`).
- Follower-count formatting handles `null`, 1K/1M thresholds.

## Edge cases
- API error OR no data → silent fallback to hardcoded `MOCK_PROFILE`. **This hides real 404 / 403 errors from the user.**
- Private-by-user fields (e.g. email) not exposed on this endpoint.
- Social link platform not in `PLATFORM_CONFIG` → `SocialLinkRow` returns `null` (graceful skip).
- `params` is the sync Next-14 shape; under Next 15 async params this will need `await params`. Current HEAD uses Next 14 per `CLAUDE.md`.

## Tests
No colocated tests.

## Related files
- `apps/web/src/hooks/useHunters.ts` — `usePublicProfile`
- `apps/web/src/components/common/LoadingState.tsx`, `ErrorState.tsx`
- `apps/web/src/lib/api/client.ts` — `getUploadUrl`
- `apps/web/src/lib/utils/format.ts` — `formatDate`
- `packages/shared/src/...` — `SocialChannel`, `PublicHunterProfile`, `SocialLinkResponse`
- `lucide-react`: `Camera`, `Music2`, `ThumbsUp`, `BadgeCheck`, `ExternalLink`, `Calendar`, `Send`, `CheckCircle2`, `Star`
- PrimeReact: `Button`

## Open questions / TODOs
- **"Invite to Bounty" button is unwired** — needs an `onClick` that opens a bounty-selector modal and calls `POST /api/v1/bounties/:bountyId/invitations`. Currently dead UI.
- **Mock profile fallback** is a dev convenience — remove before launch so real API errors surface via `ErrorState`.
- Non-BUSINESS_ADMIN viewers also see "Invite to Bounty" — should be gated to role = BUSINESS_ADMIN (or hidden for participants / self-view).
- No "this is me" differentiation — a hunter viewing their own `/hunters/{self-id}` sees the invite button pointed at them.
- `params: { id }` sync shape will break under Next 15 async-params migration — flag for the Next 15 upgrade PR.
