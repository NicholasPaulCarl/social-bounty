# Privacy Policy — `/privacy`

**Route path:** `/privacy`
**File:** `apps/web/src/app/(marketing)/privacy/page.tsx`
**Role:** public
**Access:** public (no guard)
**Nav entry:** footer only (Company > Privacy policy)
**Layout:** `apps/web/src/app/(marketing)/layout.tsx`

See `docs/architecture/sitemap.md` §1.

## Purpose
Static privacy-policy / data-handling disclosure. Server-rendered; no client-side state.

## Entry & exit
- **Reached from:** marketing footer (all pages), signup flow consent (future), bottom-of-page divider on `/terms`
- **Links out to:** `/contact` ("Go to Contact page" CTA in Contact Us section), `/terms` (footer divider link)

## Data
- **React Query hooks:** — None
- **API endpoints called:** — None (static page)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. Header — H1 "Privacy Policy", "Last updated: March 2026", intro paragraph
2. 7 sections, each with an `id` for anchor-linking:
   - `#information-we-collect`
   - `#how-we-use-it`
   - `#data-sharing`
   - `#data-retention`
   - `#your-rights`
   - `#cookies`
   - `#contact` (has `cta: true` → renders "Go to Contact page" link)
3. Footer divider — © 2026 + link to `/terms`

Rendered from a `SECTIONS` array; no client interactivity. `export const metadata` sets the document title / description.

## States
- **Loading:** — None (server-rendered)
- **Empty:** — None
- **Error:** — None
- **Success:** — None

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Go to Contact page | Link | `/contact` |
| Terms of Service (footer divider) | Link | `/terms` |

## Business rules
- Content is legal copy and should only change via Team Lead sign-off (per `CLAUDE.md` Hard Rules §7 "don't invent requirements").
- "Last updated: March 2026" is hardcoded — must be bumped whenever copy changes.

## Edge cases
- Anchor links `#section-id` resolve natively from contact form / emails; no smooth-scroll behaviour is wired.
- No table-of-contents — a future enhancement if the policy grows.

## Tests
No colocated tests.

## Related files
- `apps/web/src/app/(marketing)/layout.tsx`
- Inline SVG for the arrow-right glyph in the CTA (Lucide not imported here)

## Open questions / TODOs
- "Last updated: March 2026" needs a maintenance process — consider sourcing from git-commit date or a CMS field.
- Email addresses (`privacy@socialbounty.com`) need to exist before launch.
- Cookie consent banner is not wired on the marketing layout — referenced in §Cookies but no UI counterpart yet.
