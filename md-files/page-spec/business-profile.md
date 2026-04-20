# Business Profile — `/business/profile`

**Route path:** `/business/profile`
**File:** `apps/web/src/app/business/profile/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.Profile`
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
BA's own user profile — name + email + authentication method. Includes the OTP-based email-change flow.

## Entry & exit
- **Reached from:** Sidebar nav (or header dropdown typically).
- **Links out to:** none.

## Data
- **React Query hooks:** `useProfile()`, `useUpdateProfile()`.
- **API endpoints called:** `GET /api/v1/users/me`, `PATCH /api/v1/users/me`, `POST /api/v1/auth/request-email-change`, `POST /api/v1/auth/verify-email-change`.
- **URL params:** none
- **Search params:** none

## UI structure
- `PageHeader` — Profile.
- Account Details card: First + Last name fields, Email (disabled), Verified / Unverified chip, Change button, Save changes button.
- Security card: static info panel — "This account uses email verification codes (OTP) to sign in. No password is required." Method: Email OTP.
- Change-email Dialog (PrimeReact `Dialog`): two-step — email input → OTP input (6 digits, `replace(/\D/g,'').slice(0,6)`), with Change-email shortcut from OTP step to go back, Cancel + Verify & update.

## States
- **Loading:** `<LoadingState type="form" />`
- **Empty:** `return null` if no profile.
- **Error (load):** `<ErrorState ... onRetry={refetch} />`
- **Saving profile:** button spinner.
- **Email change — step=email:** email input; `emailLoading` while requesting OTP.
- **Email change — step=otp:** 6-digit OTP with large `text-2xl tracking-[0.5em]` centered input; resend by "Change email" button.
- **Success — email change:** toast + dialog closes + `refetch`.
- **Error — email change:** inline `emailError` banner (`Message severity="error"`).

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Save changes | PATCH `/users/me` `{firstName, lastName}` | Toast success. |
| Change (email) | opens dialog | Starts OTP exchange. |
| Send code | `authApi.requestEmailChange(newEmail)` | Step → otp. |
| Verify & update | `authApi.verifyEmailChange(otp)` | Email updated. |

## Business rules
- Password-auth is NOT live — email OTP is the sole auth method (CLAUDE.md: "Password-auth implementation is roadmap — see `docs/reviews/2026-04-15-team-lead-audit-batch-13.md`").
- Email verification state is reflected via `profile.emailVerified`.
- Email-change request and verify are rate-limited server-side (3/min and 5/min respectively per sitemap §auth).
- OTP is fixed at 6 digits; client normalizes to digits-only.
- AuditLog on email change (Hard Rule #3).

## Edge cases
- OTP wrong: `verifyEmailChange` throws; inline error shown.
- User cancels dialog mid-flow: state reset next open (via `openEmailDialog`).
- Empty firstName/lastName: inline `profileError` banner.
- Verified chip shows `<CheckCircle2>` green; Unverified shows `<AlertCircle>` amber.

## Tests
None colocated.

## Related files
- `hooks/useProfile.ts` (`useProfile`, `useUpdateProfile`)
- `lib/api/auth.ts` (`requestEmailChange`, `verifyEmailChange`)
- `components/common/PageHeader.tsx`, `LoadingState.tsx`, `ErrorState.tsx`

## Open questions / TODOs
- No profile-picture upload on the business profile (hunter profile has one). Out of scope for MVP.
- No "Change password" button — by design.
