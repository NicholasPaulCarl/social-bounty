# Login — `/login`

**Route path:** `/login`
**File:** `apps/web/src/app/(auth)/login/page.tsx`
**Role:** public
**Access:** public (no guard) — rendered under `AuthLayout` (centered glass card with mesh-drift background)
**Nav entry:** marketing nav "Log in" button + "Already have an account?" link from `/signup`
**Layout:** `apps/web/src/app/(auth)/layout.tsx` → `AuthLayout` (branding + centered card, no sidebar / no role gate)

See `docs/architecture/sitemap.md` §1.

## Purpose
Two-step OTP login. User enters email → receives a 6-digit code by email → submits code → JWT issued + routed to their role landing page.

## Entry & exit
- **Reached from:** marketing layout nav "Log in", `/signup` bottom link, unauthenticated `AuthGuard` redirects
- **Links out to:** `/signup` (bottom "Don't have an account? Sign up"), role-specific landing (via `login(response)` from `useAuth` → participant dashboard / `/business/dashboard` / `/admin/dashboard`)

## Data
- **React Query hooks:** `useAuth()` (provides `login(response)` that writes tokens + routes by role)
- **API endpoints called:**
  - `POST /api/v1/auth/request-otp` — throttled 5/min (via `authApi.requestOtp`)
  - `POST /api/v1/auth/verify-otp` — throttled 10/min (via `authApi.verifyOtp`)
- **URL params:** — None
- **Search params:** — None

## UI structure
1. Branding strip (in `AuthLayout`) — "Social Bounty" wordmark + tagline
2. Glass card with two conditional forms driven by `step` state:
   - **Step `email`:** eyebrow "Welcome back", H2 "Log in", email input, "Continue" button with `ArrowRight`/`Loader2` swap
   - **Step `otp`:** "We sent a 6-digit code to `{email}`", 6-char OTP input (monospace, wide tracking, auto-focus), "Log in" button with `LogIn`/`Loader2`, "Use a different email" + "Resend code" (with `cooldown` countdown) row
3. Inline error banner with `AlertCircle` above the form when `error` is non-empty
4. Bottom link to `/signup`

## States
- **Loading:** `loading` boolean flips button icon to `Loader2` animate-spin; button disabled.
- **Empty:** — None (no list data)
- **Error:** `ApiError.message` rendered in a danger-600 tinted banner at top of card. Non-ApiError shows "Something went wrong. Try again." / "Couldn't resend the code. Try again."
- **Success:** `login(response)` called — writes tokens, routes to role landing. No toast / no in-page success state on this page.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Continue (email step) | `handleRequestOtp` → `authApi.requestOtp` | switch to `otp` step, start 60s cooldown |
| Log in (otp step) | `handleVerifyOtp` → `authApi.verifyOtp` | `login(response)` → route by role |
| Use a different email | `handleChangeEmail` | reset to `email` step, clear otp + error |
| Resend code | `handleResend` → `authApi.requestOtp` | reset cooldown (60s) |
| Sign up | Link | `/signup` |

## Business rules
- OTP-only auth (passwordless) — per `CLAUDE.md` Tech Stack ("Password-auth implementation is roadmap — see `docs/reviews/2026-04-15-team-lead-audit-batch-13.md`").
- Rate-limits enforced server-side: 5/min on request-otp, 10/min on verify-otp (per `docs/architecture/sitemap.md` API table).
- Button disabled until `otp.length >= 6`.
- Resend cooldown is UI-side (60s ticking down); backend throttle is independent and will 429 if abused.

## Edge cases
- 429 rate-limit → error banner shows Api error message. Cooldown continues independently.
- Invalid OTP → "Something went wrong. Try again." from `ApiError` or generic fallback.
- Expired OTP (>5 min, per Svix / canonical auth spec) → same error banner; user can "Use a different email" or "Resend code".
- User deleted / status BLOCKED → `verifyOtp` returns 403; error banner shows backend message.
- User already authenticated — this page does NOT redirect away. A logged-in user landing on `/login` will see the login form. Consider adding redirect in future.

## Tests
No colocated tests.

## Related files
- `apps/web/src/hooks/useAuth.ts` — `login(response)` handler + role-based routing
- `apps/web/src/lib/api/auth.ts` — `authApi.requestOtp`, `authApi.verifyOtp`
- `apps/web/src/lib/api/client.ts` — `ApiError` class (includes `details` for field-level errors)
- `apps/web/src/components/layout/AuthLayout.tsx` — mesh-drift gradient card shell
- `lucide-react`: `AlertCircle`, `ArrowRight`, `Loader2`, `LogIn`
- PrimeReact: `InputText`

## Open questions / TODOs
- No "already-authenticated" redirect on this page.
- No "remember this device" or refresh-token UX — relies on cookie-based rotation behind the scenes.
- Deep-link `/login?next=/some/page` not supported; after login the user always lands on their role default.
