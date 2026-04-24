# Pricing — `/pricing`

**Route path:** `/pricing`
**File:** `apps/web/src/app/(marketing)/pricing/page.tsx`
**Role:** public
**Access:** public (no guard)
**Nav entry:** marketing nav + footer (Company)
**Layout:** `apps/web/src/app/(marketing)/layout.tsx`

See `docs/architecture/sitemap.md` §1.

## Purpose
Canonical pricing page for both Hunter and Brand tiers. Shows tier cards, a full feature comparison table, FAQ, and a final CTA band.

## Entry & exit
- **Reached from:** marketing nav "Pricing", footer "Pricing", "View full feature comparison →" links on `/join/hunter` and `/join/business`
- **Links out to:** `/signup` (all CTAs)

## Data
- **React Query hooks:** — None
- **API endpoints called:** — None (static page)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. Hero — eyebrow "Pricing", H1 "Simple plans. Real savings.", lead "Start free… cancel anytime"
2. Hunter plans — 2-column card grid on slate-50: Free (R0, 20% commission, 3-day payout) / Pro Hunter (R350/mo, 10% commission, same-day payout, verified badge, "Most popular" pink badge)
3. Brand plans — 2-column card grid on white: Free (R0, 15% admin fee, public-only) / Pro Brand (R950/mo, 5% admin fee, closed bounties + application management, "Best value" pink badge)
4. Feature comparison — white card on slate-50, two stacked tables:
   - Hunter plans (7 rows: commission / payout / public / closed / badge / support / price)
   - Brand plans (6 rows: admin fee / public / closed / application mgmt / support / price)
   Uses `yes()` and `no()` helper functions that render emerald-tinted ✓ or slate-tinted — chips
5. FAQ — 6 expandable rows with `Plus` icon rotating to X on open, controlled by local `openFaq` state (single-open accordion)
6. Final CTA — dark slate-900 band with "Ready to level up?" + dual CTAs (both point to `/signup`)

`FadeUp`/`useInView` stagger throughout.

## States
- **Loading:** — None
- **Empty:** — None
- **Error:** — None
- **Success:** — None

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Get started free (Free tier cards) | Link | `/signup` |
| Upgrade to Pro (Pro tier cards) | Link | `/signup` |
| Start hunting / Post a bounty (final CTA) | Link | `/signup` |
| FAQ row | `setOpenFaq(idx)` | Expand/collapse single row |

## Business rules
- **Canonical tier pricing**: the numbers on this page must stay aligned with `md-files/payment-gateway.md` and the fee-snapshot logic in `md-files/financial-architecture.md`. Hunter pro = R350/mo / 10% commission; Brand pro = R950/mo / 5% admin fee; global 3.5% platform fee is separate and handled in the ledger per `CLAUDE.md §4` rule 10.
- FAQ #6 states "We accept all major credit and debit cards via Stripe" — **stale copy**: the live provider is Stitch Express (per the HEAD banner), Stripe is legacy. <!-- historical -->
- "Same-day payouts" for Pro Hunters needs to square with the 3-day T+3 clearance path (same open question as `/join/hunter`).

## Edge cases
- IntersectionObserver unsupported → stuck-hidden blocks.
- Accordion doesn't honour deep-link anchors (no `#faq-billing` etc.) — if a support agent shares a link to a specific FAQ question, the row will be closed on land.

## Tests
No colocated tests.

## Related files
- `apps/web/src/app/(marketing)/layout.tsx`
- `lucide-react`: `Plus`
- Design-system classes: `card card-feature`, `eyebrow`, `gradient-text`, `badge badge-brand`, `btn btn-primary`, `btn btn-secondary`, `font-mono tabular-nums`

## Open questions / TODOs
- **FAQ copy is stale** — mentions Stripe. Should be "Stitch Express". See `CLAUDE.md` Tech Stack block. <!-- historical -->
- "Same-day payouts" — needs spec confirmation; T+3 clearance is the default rule.
- No deep-linkable FAQ anchors — add `id={faq.id}` + scroll-to-hash if customers link to specific questions.
- Currency is ZAR only ("R350/mo") — if international expansion happens, this and `join-hunter` / `join-business` will need i18n.
