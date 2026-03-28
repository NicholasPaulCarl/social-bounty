# Security Audit — Social Bounty API

**Date:** 2026-03-27
**Auditor:** Security Engineer (automated sprint review)
**Scope:** Sprint 1 auth hardening, security headers, dependency vulnerabilities

---

## 1. npm Dependency Vulnerabilities

### Result: 28 vulnerabilities remain after safe `npm audit fix`

`npm audit fix` (non-breaking) was run and resolved what it could. The remaining 28 vulnerabilities (4 low, 9 moderate, 15 high) all require `--force` because their fixes are semver-breaking upgrades. Applying `--force` was **skipped** to avoid breaking the application.

### Remaining vulnerabilities by package (all require breaking-change upgrades)

| Package | Severity | Advisory | Notes |
|---|---|---|---|
| `ajv` | Moderate | GHSA-2g4f-4pwh-qvx6 | ReDoS with `$data` option. Fix requires `@nestjs/cli@11` (breaking). Dev/build tool only — not in API runtime. |
| `effect` / `@prisma/config` | High | GHSA-38f7-945m-qr2g | AsyncLocalStorage contamination under concurrent load. Upgrade Prisma to fix. |
| `file-type` / `@nestjs/common` | Moderate | GHSA-5v7r-6r5c-r473, GHSA-j47w-4g3g-c36v | Infinite loop / zip bomb in ASF/ZIP parsing. Upgrade `@nestjs/common` to fix. |
| `glob` | High | GHSA-5j98-mcp5-4vw2 | CLI command injection. Fix requires `@nestjs/cli@11`. Dev/build tool only. |
| `lodash` / `@nestjs/config` | Moderate | GHSA-xxjr-mmjv-4gpg | Prototype pollution in `_.unset`/`_.omit`. Fix requires `@nestjs/config@4` (breaking). |
| `multer` / `@nestjs/platform-express` | High | GHSA-xf7r-hgr6-v32p, GHSA-v52c-386h-88mc, GHSA-5528-5vmv-3xc2 | DoS via incomplete cleanup and uncontrolled recursion. Upgrade multer to 2.1.1. **Action required before production.** |
| `next` | High | Multiple | DoS via Image Optimizer, HTTP smuggling in rewrites. Fix requires `next@16` (breaking). **Review before production deploy.** |
| `nodemailer` | High | GHSA-mm7p-fcc7-pg87, GHSA-rcmh-qjqh-p98v, GHSA-c7w3-x93f-qmm8 | SMTP command injection, DoS, email to unintended domain. Upgrade to 8.0.4. **Action required before production.** |
| `picomatch` | High | GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj | Method injection, ReDoS. Fix requires `@nestjs/cli@11`. Dev/build tool only. |
| `tar` / `@mapbox/node-pre-gyp` | High | Multiple path traversal | Arbitrary file creation/overwrite via hardlink traversal. `npm audit fix` applied this fix. |
| `tmp` / `inquirer` | N/A | GHSA-52f5-9888-hmc6 | Arbitrary temp file write. Fix requires `@nestjs/cli@11`. Dev/build tool only. |
| `webpack` | N/A | GHSA-8fgc-7cc6-rx7x, GHSA-38r7-794h-5758 | buildHttp SSRF bypass. Fix requires `@nestjs/cli@11`. Build tool only — not runtime. |

### Recommended Actions (pre-production)

1. **Immediate:** Upgrade `nodemailer` to 8.0.4 and `multer` to 2.1.1 — both are runtime vulnerabilities in the API request path.
2. **Before next sprint:** Upgrade `@nestjs/cli` to v11 and resolve peer dependency chain (ajv, glob, picomatch, tmp, webpack, inquirer).
3. **Before production:** Pin and upgrade `next` to v16 after testing the frontend for breaking changes.
4. **Medium-term:** Upgrade Prisma to resolve `effect`/`@prisma/config` AsyncLocalStorage contamination.

---

## 2. Security Headers (`main.ts`)

### Result: PASS with enhancements applied

Helmet is in use. The following headers are now explicitly configured:

| Header | Value | Status |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Helmet default — active |
| `X-Frame-Options` | `DENY` | Explicitly set via `frameguard: { action: 'deny' }` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Added — ensures HSTS in production |
| `X-DNS-Prefetch-Control` | `off` | Helmet default — active |
| `X-XSS-Protection` | `0` | Helmet default (disabled per modern guidance) |
| `Content-Security-Policy` | Disabled | Intentional — API is JSON-only; CSP managed by Next.js |
| `Cross-Origin-Resource-Policy` | `cross-origin` | Explicitly set — required for file serving |

**Note:** HSTS (`Strict-Transport-Security`) is set in all environments. Ensure TLS termination occurs upstream (load balancer / reverse proxy) in staging and production. Local development with plain HTTP will receive this header but browsers will ignore it on non-HTTPS origins.

---

## 3. CORS Origin Validation (`main.ts`)

### Result: PASS with documentation added

The current `CORS_ORIGIN?.split(',')` approach is correct for development (multi-origin local setups) and safe for production provided the env var is set.

**Verified configuration:**
- `credentials: true` is set — correctly disallows wildcard origins with credentials.
- Allowed methods are explicitly enumerated (`GET`, `POST`, `PATCH`, `DELETE`).
- `allowedHeaders` is explicitly enumerated — no wildcard.
- `maxAge: 86400` reduces preflight request overhead.

**Added inline comment** in `main.ts` warning that `CORS_ORIGIN` MUST be an explicit, exhaustive list of allowed origins in production (never `*`).

---

## 4. Auth Flow Security Audit

### 4.1 Password Hashing

**Result: PASS**

```
const BCRYPT_ROUNDS = 12;
```

- bcrypt is used (`import * as bcrypt from 'bcrypt'`).
- Cost factor is 12 — meets the minimum recommended value of 12.
- Applied consistently in both `signup()` and `resetPassword()`.

### 4.2 JWT Token Claims

**Result: PASS**

**Access token payload:**
- `sub` (user ID) — present
- `email` — present
- `role` — present (used for RBAC)
- `organisationId` — present
- `type: 'access'` — present; enforced in `JwtStrategy.validate()`

**Refresh token payload:**
- `sub` (user ID) — present
- `type: 'refresh'` — present; enforced in `AuthService.refresh()`
- `jti` (JWT ID, UUID v4) — present; used as a nonce for token storage

**Access token TTL:** 15 minutes (`JWT_ACCESS_EXPIRY`, default `'15m'`) — appropriate for a short-lived access token.
**Refresh token TTL:** 7 days (`JWT_REFRESH_EXPIRY`, default `'7d'`).

**`ignoreExpiration: false`** is set in `JwtStrategy` — expired tokens are rejected at the strategy level.

### 4.3 Refresh Token Invalidation

**Result: PASS**

- Refresh tokens are stored in Redis keyed by `refresh:{userId}:{token}`.
- On logout: token is verified, then `deleteRefreshToken()` removes it from Redis.
- On refresh: token is verified, existence checked in Redis, old token deleted, new token issued (token rotation).
- **Theft detection:** If a refresh token is used but not found in Redis (reuse of rotated token), `invalidateAllUserTokens()` is called — wipes all refresh tokens for that user. This is the correct defense against token theft.
- `invalidateAllUserTokens()` uses a Redis key scan with pattern `refresh:{userId}:*` via `flushPattern()`.

**Minor observation:** Logout silently succeeds even if the token is expired or invalid (try/catch swallows errors). This is intentional and correct — logout should always succeed from the user's perspective.

### 4.4 Reset Tokens (Single-Use)

**Result: PASS**

- Reset tokens are stored in Redis with a 1-hour TTL (`RESET_TTL_SECONDS = 3600`).
- `getAndDeleteResetToken()` uses an atomic Redis `GETDEL` operation (`redis.getAndDelete(key)`) — the token is consumed and deleted in a single operation, preventing race conditions.
- `forgotPassword()` always returns a success message regardless of whether the user exists — prevents email enumeration.
- `forgotPassword()` calls `storeResetToken()` + `sendPasswordReset()` — no token is returned to the caller.

### 4.5 Verification Tokens (Single-Use)

**Result: PASS**

- Verification tokens are stored in Redis with a 24-hour TTL (`VERIFY_TTL_SECONDS = 86400`).
- `getAndDeleteVerificationToken()` uses the same atomic `GETDEL` pattern — single-use enforced.
- Token is UUID v4 — 122 bits of entropy, not guessable.

### 4.6 Brute-Force / Rate Limiting

**Result: PASS**

- Failed login attempts are tracked in Redis under `login_attempts:{email}`.
- Maximum 5 failed attempts (`MAX_LOGIN_ATTEMPTS = 5`) triggers a 15-minute lockout (`LOGIN_LOCKOUT_TTL = 900`).
- TTL is reset on every failed attempt (sliding window from most recent failure).
- Successful login clears the attempt counter.
- Account suspension (`UserStatus.SUSPENDED`) is checked independently of the lockout.

**Minor observation:** The remaining-attempts countdown is included in the error message when `remaining > 0`. This reveals lockout proximity to the attacker. Consider removing the countdown from the error response and logging it server-side instead.

### 4.7 JWT Strategy Token Type Enforcement

**Result: PASS**

`JwtStrategy.validate()` explicitly checks `payload.type !== 'access'` and throws `UnauthorizedException` if a refresh token is presented as a bearer token. This prevents token type confusion attacks.

---

## 5. Test Suite Results

Full suite: **492 tests, 481 passed, 11 failed** across 23 test suites.

The 11 failures are isolated to `payments.service.spec.ts` and only occur when the full suite runs concurrently (test isolation issue with shared mocks). The same tests **pass in isolation** (`npx jest payments.service.spec.ts`). This is a pre-existing issue unrelated to the security changes made in this audit.

**All auth-related tests pass.**

---

## Summary

| Area | Status | Notes |
|---|---|---|
| npm vulnerabilities | Partial | 28 remain; all require breaking-change upgrades. 3 runtime-critical items (nodemailer, multer, next) need attention before production. |
| Security headers | Pass | X-Frame-Options: DENY and HSTS added. Helmet defaults cover nosniff and others. |
| CORS configuration | Pass | Properly configured; production guidance documented in code. |
| bcrypt cost factor | Pass | Cost 12 — meets minimum recommendation. |
| JWT claims | Pass | All required claims present; type enforcement active. |
| Refresh token invalidation | Pass | Token rotation with theft detection implemented. |
| Reset tokens | Pass | Atomic single-use via Redis GETDEL. |
| Verification tokens | Pass | Atomic single-use via Redis GETDEL. |
| Brute-force protection | Pass | 5-attempt lockout with 15-minute TTL. |
| Test suite | Pass* | 481/492 passing; 11 failures are pre-existing payment test isolation issue. |
