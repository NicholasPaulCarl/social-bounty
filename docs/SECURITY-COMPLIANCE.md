# Security Compliance Audit — Social Bounty

**Document Type:** Compliance Audit Record
**Audit Date:** 2026-03-27
**Auditor:** Security Engineer (Sprint 1 Security Hardening Review)
**Scope:** Full-stack application — `apps/api`, `apps/web`, `packages/`, CI/CD pipeline, infrastructure configuration
**Framework Reference:** OWASP Application Security Verification Standard (ASVS) 4.0, internal security policy
**Next Audit Date:** 2026-06-27 (quarterly)

---

## Summary

| Status | Count |
|---|---|
| PASS | 10 |
| PARTIAL | 5 |
| FAIL | 2 |
| **Total Areas Audited** | **17** |

---

## Audit Results

### Area 1 — Dependency Vulnerability Management

| | |
|---|---|
| **Status** | PARTIAL |
| **Evidence** | `docs/SECURITY-AUDIT.md §1`; `npm audit` output |

**Finding:** `npm audit fix` was run and resolved all automatically-fixable vulnerabilities. 28 vulnerabilities remain, all requiring semver-breaking upgrades. Three are in production runtime paths (multer, nodemailer, next). The remainder are in development/build tooling only.

**Remediation Plan:**
1. Upgrade `multer` to 2.1.1 and `nodemailer` to 8.0.4 before production deploy.
2. Upgrade `@nestjs/cli` to v11 (resolves 14 dev-tool vulnerabilities) in Sprint N+2.
3. Upgrade Next.js to v16 before production after frontend regression testing.
4. Upgrade Prisma to resolve `@prisma/config` AsyncLocalStorage issue (medium-term).

**Dependabot:** `.github/dependabot.yml` now configured for weekly automated dependency PRs.

---

### Area 2 — Security Response Headers

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/main.ts` lines 26–40 |

**Finding:** Helmet is applied globally at bootstrap. The following headers are confirmed active:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (explicitly overridden from Helmet default SAMEORIGIN) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-DNS-Prefetch-Control` | `off` |
| `Cross-Origin-Resource-Policy` | `cross-origin` |
| `Content-Security-Policy` | Disabled (API is JSON-only; CSP delegated to Next.js) |

No gaps identified. HSTS requires TLS termination upstream in production — this is documented in an inline comment in `main.ts`.

---

### Area 3 — CORS Configuration

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/main.ts` lines 42–56 |

**Finding:** CORS is explicitly configured with enumerated methods (`GET`, `POST`, `PATCH`, `DELETE`) and enumerated allowed headers. `credentials: true` correctly requires an explicit origin list; wildcard origins are incompatible and not set. `maxAge: 86400` reduces preflight overhead. Production guidance is documented inline.

No gaps identified.

---

### Area 4 — Password Hashing

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/modules/auth/auth.service.ts` line 22 |

**Finding:** bcrypt is used with cost factor 12 (`BCRYPT_ROUNDS = 12`), meeting the OWASP minimum recommendation. Applied consistently in `signup()` and `resetPassword()`.

No gaps identified.

---

### Area 5 — JWT Token Security

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/modules/auth/jwt.strategy.ts`; `apps/api/src/modules/auth/auth.service.ts` |

**Finding:** Access tokens carry `sub`, `email`, `role`, `brandId`, and `type: 'access'`. Refresh tokens carry `sub`, `type: 'refresh'`, and `jti` (UUID v4). `ignoreExpiration: false` is set in `JwtStrategy`. `validate()` explicitly checks `payload.type !== 'access'` and throws `UnauthorizedException` for type confusion attacks. Access token TTL is 15 minutes; refresh token TTL is 7 days.

No gaps identified.

---

### Area 6 — Refresh Token Storage and Invalidation

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/modules/auth/token-store.service.ts`; `apps/api/src/modules/auth/auth.service.ts` |

**Finding:** Refresh tokens are stored in Redis keyed as `refresh:{userId}:{token}` with a configured TTL. Token rotation is implemented: on each refresh, the old token is deleted and a new one is issued. Theft detection is active: if a rotated token is used again, `invalidateAllUserTokens()` flushes all refresh tokens for the user. Logout uses atomic deletion via Redis DEL.

No gaps identified.

---

### Area 7 — Password Reset Token Security

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/modules/auth/token-store.service.ts`; `apps/api/src/modules/auth/auth.service.ts` |

**Finding:** Reset tokens are UUID v4 (122 bits of entropy). Stored in Redis with a 1-hour TTL. `getAndDeleteResetToken()` uses atomic `GETDEL` — tokens are single-use and cannot be replayed. `forgotPassword()` returns a generic success message regardless of whether the email exists, preventing email enumeration.

No gaps identified.

---

### Area 8 — Email Verification Token Security

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/modules/auth/token-store.service.ts` |

**Finding:** Verification tokens are UUID v4. Stored in Redis with a 24-hour TTL. `getAndDeleteVerificationToken()` uses the same atomic `GETDEL` pattern as reset tokens — single-use enforced.

No gaps identified.

---

### Area 9 — Brute-Force and Rate Limiting

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/modules/auth/auth.service.ts` lines 24–25; Redis key pattern `login_attempts:{email}` |

**Finding:** Failed login attempts are tracked per-email in Redis. After 5 failures (`MAX_LOGIN_ATTEMPTS = 5`), a 15-minute lockout is applied (`LOGIN_LOCKOUT_TTL = 900`). TTL resets on each failed attempt (sliding window). Successful login clears the counter. Account suspension status is checked independently.

**Minor observation (not a failure):** The count of remaining attempts before lockout is included in the error response. This leaks lockout proximity to attackers. Recommendation: log server-side only; return a generic message.

---

### Area 10 — Input Sanitization

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/common/pipes/sanitize.pipe.ts` |

**Finding:** `SanitizePipe` is applied globally at bootstrap. It uses the `sanitize-html` library (not regex) with `allowedTags: []` and `allowedAttributes: {}` — all HTML is stripped from string inputs in request bodies. This is applied recursively to nested objects and arrays. The previous regex-based approach flagged in `AUDIT-REPORT.md §3.3` has been replaced.

No gaps identified.

---

### Area 11 — Input Validation

| | |
|---|---|
| **Status** | PASS |
| **Evidence** | `apps/api/src/main.ts` lines 60–70 |

**Finding:** `ValidationPipe` is applied globally with `whitelist: true` (strips undeclared properties), `forbidNonWhitelisted: true` (rejects requests with undeclared properties), and `transform: true`. This enforces DTO contracts at the API boundary for all routes.

No gaps identified.

---

### Area 12 — Role-Based Access Control (RBAC)

| | |
|---|---|
| **Status** | PARTIAL |
| **Evidence** | `apps/api/src/common/guards/roles.guard.ts`; `apps/api/src/common/guards/user-status.guard.ts` |

**Finding:** `RolesGuard` is implemented and checks decorator-specified roles against `request.user.role`. `UserStatusGuard` blocks suspended users from accessing protected routes. RBAC is applied at the controller level across all modules.

**Gap:** No role hierarchy is defined (see `AUDIT-REPORT.md §3.9`). Each role must be listed explicitly in every `@Roles()` decorator. A `SUPER_ADMIN` role does not automatically include `BUSINESS_ADMIN` permissions — this must be handled manually and creates a risk of authorization gaps as the permission surface grows.

**Remediation Plan:**
- Define a `hasRole()` utility in `packages/shared` that evaluates implied roles (e.g., `SUPER_ADMIN` implies all permissions).
- Audit all `@Roles()` decorators to confirm correct role sets are specified.
- Target: Sprint N+2.

---

### Area 13 — Audit Logging

| | |
|---|---|
| **Status** | PARTIAL |
| **Evidence** | `apps/api/src/modules/audit/audit.service.ts`; `AUDIT-REPORT.md §5.7` |

**Finding:** `AuditService` is implemented and writes structured records to a dedicated `AuditLog` database table (actor, role, action, entity type, entity ID, before/after state, IP address, timestamp). The service is correctly used in the auth module and several other modules.

**Gap:** The `@Audited` decorator intended to make audit logging declarative is defined but not yet applied to controllers. Audit coverage is inconsistent — some state-changing endpoints call `auditService.log()` directly, others do not call it at all.

**Remediation Plan:**
- Apply `@Audited` decorator to all `POST`, `PATCH`, `DELETE` controller methods.
- Add a CI lint rule or a test assertion that verifies audit coverage on all state-changing routes.
- Target: Sprint N+1.

---

### Area 14 — Error Handling and Information Disclosure

| | |
|---|---|
| **Status** | PARTIAL |
| **Evidence** | `apps/api/src/common/filters/http-exception.filter.ts`; `AUDIT-REPORT.md §5.8` |

**Finding:** `HttpExceptionFilter` is applied globally and structures all error responses. It records errors in the admin system health dashboard.

**Gap:** Error handling is inconsistent across services — some throw NestJS `HttpException` subclasses, others throw raw errors, and some swallow errors silently. Raw errors that reach the global filter may expose stack traces or internal details in non-production error responses. No domain exception hierarchy exists.

**Remediation Plan:**
- Define domain exceptions (e.g., `BountyNotFoundException`, `InsufficientFundsException`) in `packages/shared/exceptions`.
- Update `HttpExceptionFilter` to map domain exceptions to appropriate HTTP responses.
- Audit all services for error swallowing and silent failure patterns.
- Confirm `NODE_ENV` guards prevent stack trace exposure in production responses.
- Target: Sprint N+2.

---

### Area 15 — Secrets and Environment Variable Management

| | |
|---|---|
| **Status** | PARTIAL |
| **Evidence** | `.env.example` (if present); `apps/api/src/modules/auth/auth.service.ts`; `AUDIT-REPORT.md §3.7` |

**Finding:** JWT secrets, database credentials, and Redis configuration are consumed via `ConfigService` — no hardcoded secrets were found in the API codebase. CI uses appropriately scoped test secrets via GitHub Actions environment variables.

**Gap:** Demo/seed account passwords are hardcoded in frontend source code (`apps/web`). These are visible in production JavaScript bundles. (See `AUDIT-REPORT.md §3.7`.)

**Remediation Plan:**
- Remove all hardcoded credentials from frontend code.
- Gate demo mode behind a `NEXT_PUBLIC_DEMO_MODE` environment variable that is explicitly excluded from production builds.
- Move seed scripts to `packages/prisma/seed.ts` with a dev-environment guard.
- Target: Sprint N+1 (pre-production blocker).

---

### Area 16 — Token Storage on Client (XSS Risk)

| | |
|---|---|
| **Status** | FAIL |
| **Evidence** | `apps/web` auth implementation; `AUDIT-REPORT.md §3.1` |

**Finding:** Refresh tokens are stored in `localStorage`, which is accessible to any JavaScript running on the page. A single XSS vulnerability (in application code or a third-party script) allows an attacker to steal long-lived refresh tokens and take over user accounts.

**Risk:** CRITICAL — this is a pre-production blocker.

**Remediation Plan:**
1. Move refresh tokens from `localStorage` to `httpOnly`, `Secure`, `SameSite=Strict` cookies. The API endpoint that issues tokens must set the cookie; the frontend should not handle the token value directly.
2. The API must read the refresh token from the cookie in the `/auth/refresh` and `/auth/logout` endpoints.
3. Implement CSRF protection (double-submit cookie or synchronizer token) once cookies are in use.
4. Remove all `localStorage.setItem`/`getItem` calls for auth tokens from the frontend.
5. **Target: Must complete before production deployment.**

---

### Area 17 — CI/CD Pipeline Security

| | |
|---|---|
| **Status** | FAIL |
| **Evidence** | `.github/workflows/ci.yml`; `AUDIT-REPORT.md §3.8` |

**Finding:** The CI pipeline runs lint, type-check, unit tests, integration tests (with real PostgreSQL and Redis), and E2E tests. Coverage is uploaded as an artifact. Secrets are managed via GitHub Actions environment variables.

**Gaps:**
1. `npm audit` is not run as a blocking CI step. New vulnerabilities can be introduced undetected.
2. No SAST (static application security testing) tool is configured (e.g., CodeQL, Semgrep).
3. The integration and E2E test steps use `|| true`, meaning test failures do not block merges to main.

**Remediation Plan:**
1. Add `npm audit --audit-level=high` as a blocking step in the CI pipeline. Allow exceptions for known-deferred vulnerabilities via an `.npmrc` audit exemption or a maintained allowlist.
2. Add CodeQL or Semgrep as a non-blocking advisory CI step (graduate to blocking after a 1-sprint evaluation period).
3. Remove `|| true` from integration and E2E test commands so failures are visible — or explicitly mark those jobs as `continue-on-error: true` with a corresponding Slack alert.
4. **Target: npm audit blocker — Sprint N+1. SAST — Sprint N+2.**

---

## Remediation Priority Matrix

| Priority | Area | Severity | Target |
|---|---|---|---|
| 1 | Area 16 — Token storage (localStorage) | CRITICAL | Pre-production blocker |
| 2 | Area 1 — multer + nodemailer CVEs | HIGH | Pre-production blocker |
| 3 | Area 15 — Hardcoded frontend credentials | HIGH | Sprint N+1 |
| 4 | Area 17 — npm audit in CI | HIGH | Sprint N+1 |
| 5 | Area 13 — Audit logging coverage | MEDIUM | Sprint N+1 |
| 6 | Area 14 — Domain exception hierarchy | MEDIUM | Sprint N+2 |
| 7 | Area 12 — Role hierarchy utility | MEDIUM | Sprint N+2 |
| 8 | Area 17 — SAST tooling | LOW | Sprint N+2 |
| 9 | Area 1 — Remaining dev-tool CVEs | LOW | Sprint N+2 |

---

## Audit Evidence Index

| Area | Evidence File | Line / Section |
|---|---|---|
| Dependency vulnerabilities | `docs/SECURITY-AUDIT.md` | §1 |
| Security headers | `apps/api/src/main.ts` | Lines 26–40 |
| CORS configuration | `apps/api/src/main.ts` | Lines 42–56 |
| Password hashing | `apps/api/src/modules/auth/auth.service.ts` | Line 22; BCRYPT_ROUNDS |
| JWT strategy | `apps/api/src/modules/auth/jwt.strategy.ts` | Full file |
| Token storage (Redis) | `apps/api/src/modules/auth/token-store.service.ts` | Full file |
| Rate limiting | `apps/api/src/modules/auth/auth.service.ts` | Lines 24–25 |
| Input sanitization | `apps/api/src/common/pipes/sanitize.pipe.ts` | Full file |
| Input validation | `apps/api/src/main.ts` | Lines 60–70 |
| RBAC guards | `apps/api/src/common/guards/roles.guard.ts` | Full file |
| User status guard | `apps/api/src/common/guards/user-status.guard.ts` | Full file |
| Audit service | `apps/api/src/modules/audit/audit.service.ts` | Full file |
| Error handling | `apps/api/src/common/filters/http-exception.filter.ts` | Full file |
| CI/CD pipeline | `.github/workflows/ci.yml` | Full file |
| Dependabot config | `.github/dependabot.yml` | Full file |
| Broader codebase audit | `AUDIT-REPORT.md` | All sections |

---

## Next Audit

**Scheduled Date:** 2026-06-27
**Scope for Next Audit:**
- Re-audit all FAIL and PARTIAL items from this report
- Add scope: GDPR/POPIA data subject rights implementation
- Add scope: penetration test results review (if external pen test completed)
- Add scope: production monitoring and alerting configuration

---

*Document prepared by the Security Engineer as part of Sprint 1 security hardening. Questions or disputes: open a ticket in the security backlog.*
