# Terms of Service — `/terms`

**Route path:** `/terms`
**File:** `apps/web/src/app/(marketing)/terms/page.tsx`
**Role:** public
**Access:** public (no guard)
**Nav entry:** footer only (Company > Terms of service)
**Layout:** `apps/web/src/app/(marketing)/layout.tsx`

See `docs/architecture/sitemap.md` §1.

## Purpose
Static terms-of-service page covering eligibility, account rules, bounty participation, payments, content ownership, prohibited conduct, dispute resolution, and liability limits. Server-rendered.

## Entry & exit
- **Reached from:** marketing footer (all pages), bottom-of-page divider on `/privacy`, signup flow consent (future)
- **Links out to:** `/contact` ("Go to Contact page" CTA in the Contact section), `/privacy` (footer divider link)

## Data
- **React Query hooks:** — None
- **API endpoints called:** — None (static page)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. Header — H1 "Terms of Service", "Last updated: March 2026", intro paragraph
2. 11 sections, each with an `id` for anchor-linking:
   - `#acceptance`
   - `#eligibility`
   - `#account-registration`
   - `#bounty-participation`
   - `#payments-rewards`
   - `#content-ownership`
   - `#prohibited-conduct`
   - `#dispute-resolution`
   - `#limitation-of-liability`
   - `#modifications`
   - `#contact` (has `cta: true` → renders "Go to Contact page" link)
3. Footer divider — © 2026 + link to `/privacy`

Rendered from a `SECTIONS` array identical in shape to `/privacy`. `export const metadata` sets the document title / description.

## States
- **Loading:** — None (server-rendered)
- **Empty:** — None
- **Error:** — None
- **Success:** — None

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Go to Contact page | Link | `/contact` |
| Privacy Policy (footer divider) | Link | `/privacy` |

## Business rules
- Legal copy; changes gated by Team Lead sign-off.
- §Eligibility requires users be 18+. Signup page currently does NOT gate on this — no age field.
- §Bounty Participation references "Brands" / "Hunters" terminology consistent with the Organisation→Brand rename (`CLAUDE.md` HEAD banner).
- §Payments & Rewards line "Brands must fund their bounty reward pool before a bounty goes live. Funds are held in escrow by Social Bounty" — this aligns with the Stitch Express inbound rail + platform-custody rule in `CLAUDE.md §4` (Financial Non-Negotiables #8).
- §Limitation of Liability cap is the greater of 12 months' fees paid or **USD $100** — ZAR rest of platform; USD here is a copy inconsistency.
- Disputes must be raised within **14 days** — enforceable in `md-files/knowledge-base.md` / Disputes module, worth validating.

## Edge cases
- Anchor `#section-id` navigation is native; no smooth-scroll.
- "Last updated" is hardcoded, must be bumped on edit.

## Tests
No colocated tests.

## Related files
- `apps/web/src/app/(marketing)/layout.tsx`
- Inline SVG for the arrow-right glyph (Lucide not imported here)

## Open questions / TODOs
- **Age verification** — §Eligibility requires 18+ but signup collects no DOB. Either add a gate or remove the hard number.
- **Currency mismatch** — §Limitation of Liability says "USD $100" on an otherwise ZAR platform.
- **"Escrow by Social Bounty"** — wording suggests a TradeSafe-style escrow layer, but ADR 0003 + the current implementation uses platform-custody via Stitch. Align copy with `md-files/payment-gateway.md`.
- **14-day dispute window** — confirm enforced in Disputes state machine (`disputes.controller.ts` / `disputes.service.ts`).
- Email `legal@socialbounty.com` must exist before launch.
