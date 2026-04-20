# Contact — `/contact`

**Route path:** `/contact`
**File:** `apps/web/src/app/(marketing)/contact/page.tsx`
**Role:** public
**Access:** public (no guard)
**Nav entry:** marketing nav + footer (Company)
**Layout:** `apps/web/src/app/(marketing)/layout.tsx`

See `docs/architecture/sitemap.md` §1.

## Purpose
Lets visitors send a message to the team with category routing (support / sales / general), shows direct-line contact details, and answers common questions via FAQ.

## Entry & exit
- **Reached from:** marketing nav, footer "Contact", Privacy and Terms pages' "Go to Contact page" CTAs, "contact us" copy in other pages
- **Links out to:** `/` ("Browse bounties" after successful submit), `mailto:hello@socialbounty.com`, `https://twitter.com/socialbounty`, `https://instagram.com/socialbounty`

## Data
- **React Query hooks:** — None
- **API endpoints called:** — None (form submission is simulated with `setTimeout` + `Math.random()` — no backend endpoint wired yet)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. Hero — eyebrow "Contact", H1 "Let's talk.", lead paragraph
2. Three category cards (Hunter / Brand / Something else) — clicking pre-selects the form's category and smooth-scrolls to the form
3. Contact form card — Name, Email, Category (support/sales/general select), Message textarea (minLength 10), Submit button with loading + error + success states
4. Quick Links & FAQ — left column: email + social icons + "response within 24 hours" pill; right column: 3 expandable FAQ items (`FaqItem` with `ChevronDown` rotate)

Uses custom `useFadeUp` hook (timer-based, not scroll-based) to stagger the hero / cards / form / info sections.

## States
- **Loading:** button shows `Loader2` spinner + "Sending…" while `formState === 'submitting'`
- **Empty:** — None
- **Error:** red-tinted inline banner with `AlertTriangle` + mailto fallback link (triggered 5% of the time by the simulated handler)
- **Success:** form replaced with "Sent. We'll be in touch within 24 hours." card featuring a `Check` circle + "Browse bounties" link back to `/`

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Get help / Talk to us / Reach out (category cards) | scroll to form + set `formData.category` | scroll-to `formRef` |
| Send it | `handleSubmit` | simulated 1.5s wait, 95% success / 5% error |
| hello@socialbounty.com | mailto link | system mail client |
| Twitter / Instagram / FAQ chevrons | link / toggle | external / collapse state |

## Business rules
- Purely marketing; no financial, RBAC, or kill-switch considerations.
- Form is **not wired to a real endpoint** — `handleSubmit` uses `setTimeout(..., 1500)` and `Math.random() > 0.05` to simulate success. Replace with a real API call before launch (marked inline: "replace with real API call when backend is ready").

## Edge cases
- Random simulated error — the error banner's mailto fallback (`hello@socialbounty.com`) is the only real contact path until backend wiring is done.
- No spam / captcha protection — backend will need rate-limit (compare `/api/v1/auth/request-otp` throttled 5/min pattern).
- Client-side validation only relies on HTML5 `required` + `minLength={10}`; malformed emails not caught beyond browser native validation.

## Tests
No colocated tests.

## Related files
- `apps/web/src/app/(marketing)/layout.tsx`
- `lucide-react`: `ArrowRight`, `ChevronDown`, `Check`, `Mail`, `AlertTriangle`, `Loader2`
- Inline SVG `TwitterIcon` + `InstagramIcon` (Lucide dropped brand glyphs — ICONS.md policy)
- Design-system classes: `card card-interactive`, `input`, `textarea`, `btn btn-primary btn-lg`, `eyebrow`

## Open questions / TODOs
- **Wire form to backend** — no contact endpoint exists in `docs/architecture/sitemap.md` API table. Needs a new `POST /api/v1/contact` (or similar) + mail-service plumbing.
- Add real spam protection (rate limit + honeypot + potentially reCAPTCHA).
- Consider email verification or at least storing inbound messages in a `ContactMessage` table for audit.
