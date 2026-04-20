# Marketing Home — `/`

**Route path:** `/`
**File:** `apps/web/src/app/(marketing)/page.tsx`
**Role:** public
**Access:** public (no guard) — reached outside `AuthGuard`
**Nav entry:** marketing nav (logo link + footer)
**Layout:** `apps/web/src/app/(marketing)/layout.tsx` (sticky marketing nav + dark slate footer; no role gate)

See `docs/architecture/sitemap.md` §1 for context.

## Purpose
Primary landing page for unauthenticated visitors. Pitches the bounty-board concept to both hunters and brands and funnels them to `/signup` via dual CTAs.

## Entry & exit
- **Reached from:** direct URL, organic search, every "Social Bounty" logo link in the marketing layout, all marketing nav items, footer links
- **Links out to:** `/signup` (primary CTAs, "Start hunting", "See all bounties" bottom link), `/join/business` (secondary CTA "Post a bounty", "Post your first bounty" brand card), `/join/hunter` ("Browse bounties" hunter card), `/#how-it-works` (anchor from nav), `/login`, `/pricing`, `/contact`, `/privacy`, `/terms` (all via layout chrome)

## Data
- **React Query hooks:** — None
- **API endpoints called:** — None (static page)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. `HeroSection` — eyebrow, H1 "Post a task. Pay for results.", dual CTAs (Start hunting / Post a bounty), animated live-count-up ("2,000+ hunters earning daily"), floating stacked bounty-card mockup with decorative pink blobs
2. `HowItWorksSection` — anchor `#how-it-works`, three numbered steps (Post / Hunters deliver / Review and pay)
3. `DualSplitSection` — two side-by-side feature cards ("For hunters" / "For brands"), each with 4-bullet value prop and CTA to `/join/hunter` or `/join/business`
4. `StatsSection` — dark slate band with four animated count-up stats (hunters, bounties completed, rewards earned, avg first-submission time)
5. `BountiesPreviewSection` — horizontal snap-scrolling row of 5 mocked live bounty cards with Live/neutral badges and reward amounts; "See all bounties" link to `/signup`
6. `TestimonialsSection` — three quote cards with left pink border, avatar + name + role
7. `FinalCTASection` — pink-600 band with noise texture, "Ready to hunt?" H2, dual CTAs repeated

Uses `useInView` IntersectionObserver hook and custom `useCountUp` for fade-up reveal + number-count animations. Reveal wrapper applied to every block.

## States
- **Loading:** — None (client-rendered, animates on scroll in)
- **Empty:** — None
- **Error:** — None
- **Success:** — None

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Start hunting | Link | `/signup` |
| Post a bounty | Link | `/join/business` |
| Browse bounties (hunter card) | Link | `/join/hunter` |
| Post your first bounty (brand card) | Link | `/join/business` |
| See all bounties | Link | `/signup` |

## Business rules
- Purely marketing; no financial, RBAC, or kill-switch considerations.
- Counter targets hardcoded in component (`2000` hunters, `10000` bounties, `$250K` rewards) — cosmetic only, not backed by API.

## Edge cases
- IntersectionObserver unsupported → components render in their "hidden" state (opacity 0, translateY 28px) and never fade in. Extremely rare.
- `prefers-reduced-motion` not honoured — decorative floats + count-ups play regardless.

## Tests
No colocated tests.

## Related files
- `apps/web/src/app/(marketing)/layout.tsx` — sticky nav, mobile hamburger, dark footer with social icons
- `lucide-react` icons: `ArrowRight`, `Quote`
- Design-system utility classes: `btn-primary`, `btn-secondary`, `badge-success`, `badge-neutral`, `card card-feature card-interactive`, `eyebrow`, `gradient-text`, `avatar`, `font-mono tabular-nums`

## Open questions / TODOs
- Stats are hardcoded placeholders — needs a decision on whether the hero/stat-band numbers should eventually read real API counts (e.g. live `GET /api/v1/bounties?status=LIVE` count, total-payouts rollup).
