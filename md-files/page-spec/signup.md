# Signup — `/signup`

**Route path:** `/signup`
**File:** `apps/web/src/app/(auth)/signup/page.tsx`
**Role:** public
**Access:** public (no guard) — rendered under `AuthLayout`
**Nav entry:** marketing nav "Sign up" button, every marketing-page CTA ("Start hunting", "Post a bounty", etc.), "Don't have an account?" link from `/login`
**Layout:** `apps/web/src/app/(auth)/layout.tsx` → `AuthLayout`

See `docs/architecture/sitemap.md` §1.

## Purpose
Two-step OTP signup. Collects name + email (+ optional brand details), issues OTP, verifies, then creates account. The "Register as a brand" toggle additionally creates a `Brand` row and assigns the user the BUSINESS_ADMIN role in a single atomic call.

## Entry & exit
- **Reached from:** marketing nav "Sign up", every CTA across marketing pages (`/`, `/join/*`, `/pricing`, `/contact` error-state hint), `/login` "Sign up" link
- **Links out to:** `/login` (bottom "Already have an account?"), role-specific landing (via `login(response)` post-signup)

## Data
- **React Query hooks:** `useAuth()` (for the `login(response)` helper)
- **API endpoints called:**
  - `POST /api/v1/auth/request-otp` — throttled 5/min
  - `POST /api/v1/auth/signup` — throttled 5/min (includes optional brand payload)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. `AuthLayout` branding strip (Social Bounty wordmark + tagline)
2. Glass card, `step` state controls which form renders:
   - **Step `details`:** eyebrow "Get started", H2 "Create your account"
     - First name + Last name (grid 2-col on sm+)
     - Email
     - **"Register as a brand" switch** (`InputSwitch` + copy "Create a brand profile to post bounties")
     - Conditional brand block (pink-tinted panel) when toggle on: Brand name + Brand contact email
     - "Continue" button (requests OTP)
   - **Step `otp`:** "We sent a 6-digit code to `{email}`", 6-char OTP input (monospace, 0.3em tracking, auto-focus), "Create account" button, "Use a different email" + "Resend code" row
3. Top error banner (`ApiError.message`) with `AlertCircle`
4. Per-field errors populated from `err.details` array and rendered as `<small className="text-danger-600 text-xs">` under each input
5. Bottom link to `/login`

## States
- **Loading:** `loading` → swap button icon to `Loader2`, disable button.
- **Empty:** — None
- **Error:** Both top-level banner and per-field small messages. `validate()` runs client-side first (names + email + brand fields if toggle on).
- **Success:** `login(response)` after `authApi.signup` — writes tokens + routes by role.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Continue (details step) | `validate()` + `authApi.requestOtp` | advance to `otp` step, start 60s cooldown |
| Create account (otp step) | `authApi.signup` (incl. optional brand payload) | `login(response)` → role landing |
| Use a different email | reset step + otp + error | back to `details` |
| Resend code | `authApi.requestOtp` | reset 60s cooldown |
| Log in | Link | `/login` |

## Business rules
- Registering with "Register as a brand" ON results in atomic creation of `User` + `Brand` + membership, user role = BUSINESS_ADMIN. Without it, role = PARTICIPANT (defaults set server-side).
- OTP-only auth (passwordless) — same rail as login.
- Rate limits: 5/min on request-otp, 5/min on signup.
- Client-side validation: name/email/brand-fields required when brand-toggle on. Server-side validation re-runs and can return field-level `details`.
- `docs/architecture/sitemap.md` §2 notes participant-initiated brand creation also exists at `/create-brand` post-signup — the toggle here is the signup-time fast path; `/create-brand` is the late-bind alternative.

## Edge cases
- Email already registered → `ApiError` surfaces as top banner with provider-specific message.
- OTP expired / wrong → error banner, user can "Use a different email" or "Resend code".
- "Register as a brand" toggled ON but brand name empty → client-side `validate()` blocks submission at step 1.
- Signup succeeds but brand creation fails (theoretical) → backend uses a transaction; either both commit or both roll back.
- Duplicate brand name → API returns field-level error `brandName` mapped into `fieldErrors` via `err.details.forEach`.

## Tests
No colocated tests.

## Related files
- `apps/web/src/hooks/useAuth.ts` — `login(response)` + role-based redirect
- `apps/web/src/lib/api/auth.ts` — `authApi.requestOtp`, `authApi.signup`
- `apps/web/src/lib/api/client.ts` — `ApiError` with `details: { field, message }[]`
- `apps/web/src/components/layout/AuthLayout.tsx`
- `lucide-react`: `AlertCircle`, `ArrowRight`, `Loader2`, `UserPlus`
- PrimeReact: `InputText`, `InputSwitch`

## Open questions / TODOs
- No ToS / Privacy consent checkbox — per `/terms` §2 users must be 18+; no age gate is present here.
- No referral code field — if / when a referral program ships.
- No captcha — relies on throttles (5/min).
- Brand handle auto-derivation: `/brands/check-handle/:handle` endpoint exists but handle isn't collected here; generated server-side from `brandName` presumably (confirm in `BrandsService`).
