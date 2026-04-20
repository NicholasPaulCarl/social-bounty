# For Hunters — `/join/hunter`

**Route path:** `/join/hunter`
**File:** `apps/web/src/app/(marketing)/join/hunter/page.tsx`
**Role:** public
**Access:** public (no guard)
**Nav entry:** marketing nav ("For hunters") + footer (Hunters "Browse bounties") + homepage CTAs
**Layout:** `apps/web/src/app/(marketing)/layout.tsx`

See `docs/architecture/sitemap.md` §1.

## Purpose
Marketing pitch aimed at hunters / participants. Explains the 4-step claim-to-earn flow, answers "why this vs other gig platforms", shows earnings potential + Hunter tier pricing, and funnels into `/signup`.

## Entry & exit
- **Reached from:** marketing nav "For hunters", footer "Browse bounties" / "Join as hunter", marketing home hunter-split card "Browse bounties"
- **Links out to:** `/signup` (every primary CTA), `/pricing` ("View full feature comparison →")

## Data
- **React Query hooks:** — None
- **API endpoints called:** — None (static page)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. Hero — eyebrow "For hunters", H1 "Your internet time, finally worth something.", lead, single CTA "Create your hunter account" + "Free to join. Takes 30 seconds." assurance; phone mockup on right (4 mock bounty cards, bottom tab bar)
2. How-it-works — 4 alternating-side steps (Browse / Claim / Submit / Get reward) with numbered pink pills and connector lines
3. Why hunters love it — 3-column `WHY_CARDS` grid: real daily income (`DollarSign`), no follower minimums (`UserCheck`), transparent requirements (`Eye`), fair review process (`Check`), work from anywhere (`Laptop`), build portfolio (`Star`)
4. Earning potential — dark slate-900 band with mock "Example week" table (TikTok review R150 + Instagram story R50 + Google review R75) and pink weekly-total row summing 3 example payouts
5. Free vs Pro Hunter comparison — 2-column tier cards (Free R0 / Pro R350) with feature bullets, "Recommended" badge on Pro, link to `/pricing`
6. Final CTA — pink-100 star icon, H2, "Create your hunter account" button with "Free forever. No credit card. No follower check."

Uses same `FadeUp`/`useInView` pattern as `/join/business`. Phone mockup is pure JSX (slate-900 frame with notch, 4 bounty rows, bottom Home/Search/Mail/Circle nav).

## States
- **Loading:** — None
- **Empty:** — None
- **Error:** — None
- **Success:** — None

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Create your hunter account | Link | `/signup` |
| Get started free / Upgrade to Pro | Link | `/signup` |
| View full feature comparison → | Link | `/pricing` |

## Business rules
- Hunter pricing hardcoded: Free = R0 / 20% commission / 3-day clearance; Pro = R350/mo / 10% commission / same-day payout. Keep aligned with `/pricing` + `md-files/payment-gateway.md`.
- "Based on typical bounty values" disclaimer below the Example Week table is marketing, not a commitment.

## Edge cases
- IntersectionObserver unsupported → stuck-at-hidden (same as other marketing pages).
- No `prefers-reduced-motion`.

## Tests
No colocated tests.

## Related files
- `apps/web/src/app/(marketing)/layout.tsx`
- `lucide-react`: `DollarSign`, `UserCheck`, `Eye`, `Check`, `Laptop`, `Star`, `Home`, `Search`, `Mail`, `Circle`
- Design-system classes: `btn btn-primary btn-lg`, `card card-feature`, `eyebrow`, `gradient-text`, `badge badge-brand`, `font-mono tabular-nums`

## Open questions / TODOs
- Same fee-%-hardcoded-in-three-places concern as `/join/business`.
- "Same-day payouts" for Pro Hunters needs to reconcile with the 3-day T+3 clearance rule in `md-files/payment-gateway.md` — the Pro-tier payout acceleration is a separate product decision that may need spec clarification.
