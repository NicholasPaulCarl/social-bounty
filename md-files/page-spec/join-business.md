# For Brands — `/join/business`

**Route path:** `/join/business`
**File:** `apps/web/src/app/(marketing)/join/business/page.tsx`
**Role:** public
**Access:** public (no guard)
**Nav entry:** marketing nav ("For brands") + footer (Brands) + homepage dual-split / hero CTAs
**Layout:** `apps/web/src/app/(marketing)/layout.tsx`

See `docs/architecture/sitemap.md` §1.

## Purpose
Marketing pitch aimed at brands / businesses. Contrasts the Social Bounty model with agency UGC, walks through the 3-step brand flow, surfaces tier pricing, and funnels into `/signup`.

## Entry & exit
- **Reached from:** marketing nav "For brands", footer "Post a bounty" / "Join as business", marketing home hero "Post a bounty" CTA, marketing home brand-split card "Post your first bounty"
- **Links out to:** `/signup` (every primary CTA), `/pricing` ("View full feature comparison →")

## Data
- **React Query hooks:** — None
- **API endpoints called:** — None (static page)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. Hero — eyebrow "For brands and businesses", H1 "UGC without the agency.", lead, single CTA "Create your brand account" + "Free to start. No contracts." assurance; dashboard mockup on right (mock bounty-form screenshot)
2. Comparison table — "Same results. Fraction of the cost." — 5 rows (cost, time to first submission, content control, minimum commitment, payment model). Left column "The old way (agencies)" on slate-100, right column "The Social Bounty way" on pink-600 with Check icons per row
3. How-it-works — 3 numbered steps (Create a bounty / Hunters get to work / Review and pay)
4. Benefit cards — 2×2 grid: first submissions in under 24h (`Zap`), pay only for approved results (`Check`), full creative control (`Square`), scale without headcount (`Triangle`)
5. Testimonial block — dark slate-900 band with Tom K. marketing-lead quote, 5-star row, avatar
6. Free vs Pro Brand comparison — 2-column tier cards (Free R0 / Pro R950) with feature bullets, "Best value" badge on Pro, link to `/pricing`
7. Final CTA — pink-100 star icon, H2, "Create your brand account" button with "Free to start. No contracts. No minimum spend."

Uses `FadeUp` wrapper with `useInView` IntersectionObserver for per-section stagger (60–200ms delays).

## States
- **Loading:** — None (static)
- **Empty:** — None
- **Error:** — None
- **Success:** — None

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Create your brand account (hero, CTA, Pro card, final CTA) | Link | `/signup` |
| Get started free (Free card) | Link | `/signup` |
| Upgrade to Pro (Pro card) | Link | `/signup` |
| View full feature comparison → | Link | `/pricing` |

## Business rules
- Pricing data is **hardcoded**: Free = R0 / 15% admin fee; Pro = R950/mo / 5% admin fee. Keep in sync with `/pricing` and the canonical fee table in `md-files/payment-gateway.md`.
- The numbers `R1,500 – R5,000+ per asset`, `40 pieces of UGC in a week`, `2–4 weeks` are marketing copy, not tied to live data.

## Edge cases
- IntersectionObserver unsupported → all blocks stuck at opacity 0 (same behaviour as root page).
- No `prefers-reduced-motion` handling.
- Mobile `<md`: the `DashboardMockup` still renders at full width — works, but the connector lines between the 3 how-steps are hidden on mobile.

## Tests
No colocated tests.

## Related files
- `apps/web/src/app/(marketing)/layout.tsx`
- `lucide-react`: `Zap`, `Check`, `Square`, `Triangle`, `Star`
- Design-system classes: `btn btn-primary btn-lg`, `card card-feature`, `eyebrow`, `gradient-text`, `badge badge-brand`, `font-mono tabular-nums`, `avatar`

## Open questions / TODOs
- Fee %s hardcoded in three places (this page, `/join/hunter`, `/pricing`) — consider moving to `md-files/payment-gateway.md` constant or a shared JSON if they ever change.
- Dashboard mockup is pure JSX; consider replacing with a real screenshot when the create-bounty form is visually finalised.
