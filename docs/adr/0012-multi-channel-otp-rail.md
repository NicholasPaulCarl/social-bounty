# ADR 0012 — Multi-Channel OTP Rail (Email + SMS via Brevo)

**Status:** Accepted, 2026-04-25
**Extends:** Auth architecture established in the existing email-OTP flow (`apps/api/src/modules/auth/`)
**Related:** ADR 0011 (TradeSafe unified rail — payment spec), `CLAUDE.md` Auth section, `docs/INCIDENT-RESPONSE.md §5.6`

## Context

The existing auth flow issues OTP codes exclusively via email (Brevo SMTP relay, `noreply@socialbounty.cash`). Three problems converged at the production cutover (2026-04-25):

1. **Email deliverability tail.** Gmail and Outlook route cold-sender mail to spam, causing 2–10 minute delivery delays against a 5-minute Redis TTL. Domain authentication for `socialbounty.cash` (SPF / DKIM / DMARC) is on the deferred list pending registrar DNS access — until it lands, every newly-mailed OTP risks the spam folder.

2. **South African launch market.** The majority of launch traffic is expected from South Africa, where SMS deliverability tends to beat email's spam tail. Mobile-first behaviour is dominant and users expect SMS for auth codes.

3. **Brevo already integrated.** Brevo is the existing SMTP relay. Brevo also exposes a `POST /v3/transactionalSMS/sms` REST endpoint on the same API key account. Adding SMS requires no new vendor, no new billing relationship, and no new secrets vault entry beyond `BREVO_API_KEY` (which may already be set for the SMTP path via a different credential — see §Operational facts).

**Wave 0.5 live smoke test (2026-04-25):** endpoint confirmed at `POST https://api.brevo.com/v3/transactionalSMS/sms`, `api-key` header, sender `SocBounty` (alphanumeric, 11 chars max). HTTP 201 returned; delivery to a ZA mobile confirmed within seconds. Brevo reported ~10.2 credits per SA SMS. A 1100-credit purchase yields ~107 deliverable SMS — cost model is viable for an MVP daily cap of 10 per phone.

## Decision

Add SMS as a **sibling OTP delivery rail** alongside email. Both channels coexist permanently — neither supersedes the other.

### 1. Channel model

- Login identifier stays email address. Channel is **OTP delivery only** — it has no bearing on the user identity model.
- A new `OtpChannel` enum (`EMAIL` | `SMS`) is added to the shared types.
- `POST /auth/request-otp` gains an optional `channel` field (defaults to `EMAIL` when absent for backward compatibility).
- A new `POST /auth/switch-otp-channel` endpoint lets a user swap delivery channel for an in-flight OTP without re-requesting a fresh code from the start.

### 2. Phone number handling

- `User.phoneNumber` (`String? @unique`) is collected at signup (required field in the registration form) and stored unverified.
- Phone is verified on the **first successful SMS-OTP login** (`User.phoneVerified = true`) — the same verified-on-first-use pattern as email (`User.emailVerified`). No separate phone-verify step.
- Silent-on-missing-phone: a `request-otp { channel: 'SMS' }` call for a user with no phone on file returns the same generic "if an account exists, a code has been sent" response as the email path — anti-enumeration parity.
- `request-otp { channel: 'SMS' }` for a user whose phone is not `E.164`-valid is also silently handled (validation at signup means this should be unreachable in practice, but the handler must not surface the validation failure to an unauthenticated caller).

### 3. Channel-switch endpoint

`POST /auth/switch-otp-channel` rules:

- Requires an active OTP record for the email address (called mid-flow, not before `request-otp`).
- Throttled at **3 requests per minute per IP** (its own throttle; separate from the `request-otp` throttle).
- Maximum **2 switches per OTP record** — a counter on the OTP row (`switchCount`). Reset to 0 on each fresh `POST /auth/request-otp`.
- **Cooldown exempt** — channel-switch does not trigger the inter-request cooldown that `request-otp` carries. Rationale: the user is already in the OTP flow and the OTP is already issued; a channel switch is a delivery retry, not a new code request.
- Issues a **fresh OTP** on switch (new code, new TTL) and invalidates the prior OTP. The switch does not extend the session beyond a normal OTP TTL.
- All four critical auth events are AuditLog'd: `OTP_REQUESTED`, `OTP_VERIFIED_LOGIN`, `OTP_CHANNEL_SWITCHED`, `SIGNUP_COMPLETED`.

### 4. Per-phone daily SMS cap

Redis key `sms:daily:{e164Phone}` with `INCR` + `EXPIRE 86400`. Cap: **10 SMS per phone per 24-hour window**.

Rationale: ~10.2 credits per SA SMS — a single bad-actor phone exhausting the cap burns ~102 credits/day. At MVP scale this is an acceptable bound. The cap is tunable in code (`SMS_DAILY_CAP` constant) without a schema change; see §Consequences OQ-2.

When the cap is hit, the handler returns the same generic response — the user is not told they have hit a cap (abuse-surface reduction).

### 5. `SmsService` design

`SmsService` mirrors the `MailService` pattern:

- Constructor accepts the Brevo base URL, API key, sender name, and default region as injected config values.
- `onModuleInit()` boot probe: calls a lightweight Brevo account-info endpoint; logs structured success (`SMS rail enabled — Brevo, sender=<sender>`) or failure. Non-blocking (`void`, no `await`); non-fatal so dev environments without Brevo creds can boot normally. When `SMS_ENABLED=false` the probe logs a warning and returns early.
- `sendOtpSms(phone, code)` — fire-and-forget, wrapped in try/catch, logs errors via NestJS `Logger`. Returns `void` so auth-service latency is unaffected.
- Phone numbers validated with `libphonenumber-js`, default region `ZA`, before every send. Invalid numbers are logged and silently dropped (no throw — same fail-closed pattern as MailService).

### 6. Kill switch

`SMS_ENABLED` environment variable (boolean, parsed at module init). When `false`:

- `sendOtpSms` returns early and logs a warning.
- The channel-switch endpoint still accepts requests (no change to the response contract), but SMS sends silently no-op. Users receive the generic response and can click "Try Email instead".
- Kill switch is **fail-closed in scope**: disabling SMS leaves email-OTP entirely unaffected. There is no platform-wide auth degradation from flipping `SMS_ENABLED=false`.

### 7. libphonenumber-js validation

- International E.164 numbers accepted (`+27...`, `+1...`, etc.).
- Default region `ZA` for parsing bare local numbers (e.g. `0821234567` → `+27821234567`).
- Validation runs at signup (stored in E.164 in DB) and again inside `SmsService.sendOtpSms` as a defence-in-depth guard.

## Operational facts

From Wave 0.5 smoke test (2026-04-25):

- **Brevo SMS endpoint:** `POST https://api.brevo.com/v3/transactionalSMS/sms`
- **Auth header:** `api-key: <BREVO_API_KEY>` (same header key as the marketing email API; note this is a different credential type from the SMTP password used by `MailService` — the SMTP password is set in `SMTP_PASS`, while the REST API key is set separately in `BREVO_API_KEY`)
- **Sender:** alphanumeric ID `SocBounty` (11 chars). ZA telcos may require pre-registration of alphanumeric senders. Smoke test was accepted (HTTP 201) and delivered — but operators reserve the right to reject at scale post-acceptance.
- **Cost:** ~10.2 credits per SA SMS. At current Brevo credit pricing a 1100-credit purchase yields ~107 SMS. With a 10-SMS-per-phone daily cap, a single high-volume user can burn ~102 credits/day. Budget accordingly.
- **`BREVO_SMS_DEFAULT_REGION`:** defaults to `ZA` in code; override via env if international rollout requires a different default parser region.

**New env vars (all `sync: false` in render.yaml, set in Render dashboard):**

| Var | Purpose | Prod value |
|---|---|---|
| `SMS_ENABLED` | Kill switch — set `false` until ZA sender pre-registered | `false` |
| `BREVO_API_KEY` | Brevo REST API key (different from SMTP password) | `<set in Render>` |
| `BREVO_SMS_SENDER` | Alphanumeric sender ID, max 11 chars | `SocBounty` |
| `BREVO_SMS_DEFAULT_REGION` | libphonenumber-js default region for bare local numbers | `ZA` |

## Failure modes

| Failure | Behaviour | User impact |
|---|---|---|
| Brevo API key revoked or expired | `sendOtpSms` catches HTTP 401; logs error; returns void | User receives generic "code sent" message; picks "Try Email instead" |
| ZA telco rejects alphanumeric sender post-acceptance | SMS not delivered; no API error (202 accepted but silently dropped) | User waits, switches to email | 
| Per-phone daily cap hit | Redis INCR ≥ 10; handler returns generic response without sending | User falls back to email |
| `SMS_ENABLED=false` | Boot probe logs warning; `sendOtpSms` returns early | Channel toggle renders; SMS silently no-ops |
| Brevo platform outage | HTTP 5xx; `sendOtpSms` logs + returns void | Users fall back to email; flip kill switch if volume is high |
| `libphonenumber-js` parse failure | Logged; SMS silently dropped | User falls back to email; phone number should have been validated at signup |

Mass-failure mitigation: `SMS_ENABLED=false` is the kill switch. Unlike TradeSafe's financial kill switch (persisted in `SystemSetting`), this is an env-var toggle — a Render environment variable change + redeploy (~2 min) is the operator procedure. See `docs/INCIDENT-RESPONSE.md §5.6` for the runbook.

## Consequences

**Positive.**

- Auth flow now has a fallback when SMTP deliverability is degraded — removes the 2–10 minute OTP-in-spam problem for ZA users.
- No new vendor surface — Brevo is already integrated.
- All four critical auth events now AuditLog'd (`OTP_REQUESTED`, `OTP_VERIFIED_LOGIN`, `OTP_CHANNEL_SWITCHED`, `SIGNUP_COMPLETED`) — closes the prior zero-audit gap on the auth flow.
- `SmsService.onModuleInit` boot probe surfaces Brevo misconfigurations at startup (same pattern that caught the SMTP key/password confusion at production cutover on 2026-04-25).

**Negative.**

- Each SMS costs ~10.2 Brevo credits. At scale, SMS-heavy usage increases variable cost. Per-phone daily cap bounds worst-case spend; tune once real-traffic data is available.
- ZA alphanumeric sender pre-registration is a prerequisite for production traffic. Until registered, `SMS_ENABLED=false` is enforced.
- `User.phoneNumber` collected at signup increases friction for users who have no phone or prefer not to share it. Mitigated: phone is required at signup to unlock the SMS toggle, but users without SMS enabled can still authenticate via email-only.
- Channel-switch endpoint adds a new attack surface for rate-limit probing. Mitigated by the 3/min IP throttle and the max-2-switches-per-OTP guard.

**Neutral.**

- `User.phoneNumber @unique` means a phone can only be on one account. This is a deliberate anti-abuse design (prevents mass multi-account registration from one SIM).
- AuditLog schema is additive — new `action` enum values, no breaking migration.
- Hard Rules 1–10 from `CLAUDE.md` continue to apply. This ADR creates no exceptions.

**Open questions.**

**OQ-1 — Existing users (no phone on file).** Currently they see the SMS toggle in the UI but it silently no-ops on SMS. A settings flow to add/update a phone number is NOT in this PR. Deferred — track in the backlog as "add phone from profile settings." Until then, all pre-sms-login users authenticate email-only.

**OQ-2 — Per-phone cap tuning.** The 10-SMS daily cap is a first estimate. Review after one week of real-traffic data. The constant `SMS_DAILY_CAP` in `SmsService` is the single edit point — no migration required to adjust.

**OQ-3 — Multi-region rollout.** Brevo SMS coverage outside SA is not audited here. International numbers validate at signup and `E.164` store, but delivery to non-SA telcos is unproven. Default region `ZA` only affects bare-number parsing (not E.164 numbers which are region-independent).

**OQ-4 — Switch limit.** Max 2 switches per OTP record may be too restrictive for users with genuine bad luck on both channels. The escape hatch is a fresh `POST /auth/request-otp` which resets `switchCount` to 0. If support tickets indicate this is a friction point, increase the constant.

## Pre-launch operational blockers

1. **ZA alphanumeric sender ID pre-registration.** Contact Brevo support to pre-register `SocBounty` (or chosen sender) with ZA telcos (MTN, Vodacom, Cell C, Telkom Mobile). Smoke test passed, but production-scale traffic is more likely to surface telco rejections. `SMS_ENABLED=false` in prod until this is confirmed.
2. **`BREVO_API_KEY` set in Render dashboard.** The Brevo REST API key is distinct from the SMTP credentials (`SMTP_USER` / `SMTP_PASS`). It lives in the **SMTP & API → API Keys tab** in the Brevo dashboard (not the SMTP tab, which caused confusion at production cutover).

## References

**Implementation.**

- `apps/api/src/modules/auth/sms.service.ts` — `SmsService` (Brevo REST wrapper, boot probe, fire-and-forget send, daily cap check).
- `apps/api/src/modules/auth/auth.service.ts` — `requestOtp`, `verifyOtp`, `switchOtpChannel` updated to honour `OtpChannel`.
- `apps/api/src/modules/auth/auth.controller.ts` — `/auth/switch-otp-channel` endpoint.
- `packages/shared/src/enums/otp-channel.enum.ts` — `OtpChannel` enum.
- `packages/prisma/migrations/` — migration adding `User.phoneNumber`, `User.phoneVerified`, `Otp.switchCount`.
- Commit `277f84a` (HEAD, 2026-04-25, branch `sms-login`) — Wave 3M base; ADR 0012 write-up.

**Prior ADRs.**

- ADR 0011 — TradeSafe unified payment rail. Auth architecture is independent of the payment rail; this ADR adds no payment implications.

**Canonical specs.**

- `CLAUDE.md` Auth section — email-OTP pattern this ADR extends.
- `docs/INCIDENT-RESPONSE.md §5.6` — SMS rail outage runbook.
- `md-files/knowledge-base.md` — for logging any recurring SMS delivery failures as KB entries.
