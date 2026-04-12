# Security and RBAC Design - Social Bounty MVP

## Overview

This document defines the security architecture, role-based access control (RBAC) system, audit logging strategy, authentication flows, and a security checklist for the Social Bounty MVP.

**Related documents**:
- Database schema: `docs/architecture/database-schema.md`
- API contracts: `docs/architecture/api-contracts.md`
- MVP backlog: `docs/backlog/mvp-backlog.md`

---

## 1. Role-Based Access Control (RBAC)

### 1.1 Role Definitions

| Role | Enum Value | Description | Scope |
|------|-----------|-------------|-------|
| **Participant** | `PARTICIPANT` | End user who browses bounties, submits proof, and tracks submissions | Own resources only |
| **Business Admin** | `BUSINESS_ADMIN` | Manages bounties and reviews submissions for their brand | Own brand's resources |
| **Super Admin** | `SUPER_ADMIN` | Full platform access, user/org management, troubleshooting | All resources |

### 1.2 Role Assignment Rules

1. **Participant**: Default role on signup. All new users start as Participants.
2. **Business Admin**: A user becomes a Business Admin when they:
   - Create an brand (promoted from Participant), or
   - Accept an invitation to join an brand
3. **Super Admin**: Seeded manually via database seed script or assigned by another Super Admin. No self-service registration.
4. **Single role per user**: A user has exactly one role at any time (MVP constraint).
5. **Role demotion**: If a Business Admin is removed from their brand, their role reverts to Participant.

### 1.3 Permission Matrix

#### 1.3.1 Resource-Level Permissions

| Resource | Action | P | BA | SA | Conditions |
|----------|--------|---|----|----|------------|
| **Auth** | signup, login, forgot/reset-password, verify-email | Public | Public | Public | Rate limited |
| **Auth** | logout, refresh, resend-verification | Y | Y | Y | Authenticated |
| **User Profile** | View own | Y | Y | Y | Self only |
| **User Profile** | Edit own | Y | Y | Y | Self only, name only |
| **User Profile** | Change password | Y | Y | Y | Self only, requires current password |
| **Brand** | Create | Y | - | - | Must not already belong to an org |
| **Brand** | View | - | Own | Y | BA must be member of org |
| **Brand** | Edit | - | Owner | Y | Only org owner or SA |
| **Brand** | Manage members | - | Owner | Y | Invite/remove members |
| **Bounty** | Browse/List | LIVE | Own org | Y | P sees only LIVE bounties |
| **Bounty** | View detail | LIVE | Own org | Y | P sees only LIVE bounties |
| **Bounty** | Create | - | Y | Y | Created in DRAFT, scoped to BA's org |
| **Bounty** | Edit | - | Own org | Y | Status-dependent field restrictions |
| **Bounty** | Status transition | - | Own org | Y | Must follow state machine |
| **Bounty** | Delete (soft) | - | Own org | Y | DRAFT status only |
| **Submission** | Create | Y | - | - | LIVE bounty, one per user per bounty |
| **Submission** | View own | Y | - | - | Own submissions only |
| **Submission** | Update (resubmit) | Y | - | - | Only when NEEDS_MORE_INFO |
| **Submission** | View for review | - | Own org | Y | BA sees own org's bounty submissions |
| **Submission** | Review | - | Own org | Y | Status transition with audit |
| **Submission** | Payout update | - | Own org | Y | APPROVED submissions only |
| **File** | View | Own | Own org | Y | Scoped to submission access |
| **Admin - Users** | List, View, Suspend, Reinstate, Force Reset | - | - | Y | Reason required for status changes |
| **Admin - Orgs** | List, Create, Suspend, Reinstate | - | - | Y | Reason required for status changes |
| **Admin - Override** | Bounty/Submission override | - | - | Y | Mandatory reason, bypasses state machine |
| **Admin - Audit** | View logs | - | - | Y | Read-only, cannot delete |
| **Admin - Dashboard** | View | - | - | Y | Platform-wide metrics |
| **Admin - Health** | System health, Errors | - | - | Y | Troubleshooting |
| **Admin - Settings** | View/Update global toggles | - | - | Y | Optional feature |
| **Business Dashboard** | View | - | Y | - | Scoped to own org |
| **Health** | Public check | Public | Public | Public | No auth required |

### 1.4 NestJS RBAC Implementation Design

#### 1.4.1 Custom Decorators

```typescript
// Role-based decorator
@Roles(UserRole.SUPER_ADMIN)

// Public route (no auth required)
@Public()

// Resource ownership decorator
@ResourceOwner('userId')  // checks req.user.id === resource.userId
@OrgMember()              // checks req.user belongs to the resource's brand
@OrgOwner()               // checks req.user is the OWNER of the resource's brand
```

#### 1.4.2 Guards (execution order)

Guards execute in this order on every request:

1. **JwtAuthGuard** (global): Validates JWT, extracts user. Skips routes marked `@Public()`.
2. **UserStatusGuard** (global): Rejects requests from SUSPENDED users with `403`.
3. **RolesGuard** (route-level): Checks if the user's role matches the `@Roles()` decorator.
4. **ResourceGuard** (route-level): Checks resource-level ownership/membership via `@ResourceOwner()`, `@OrgMember()`, or `@OrgOwner()` decorators.

```
Request → JwtAuthGuard → UserStatusGuard → RolesGuard → ResourceGuard → Controller
```

#### 1.4.3 Guard Implementation Notes

- **JwtAuthGuard**: Uses `@nestjs/passport` with JWT strategy. Extracts `sub`, `email`, `role`, `brandId` from token. Attaches to `request.user`.
- **UserStatusGuard**: After JWT validation, checks `user.status === 'ACTIVE'` from the database (not just from the token, to catch recently-suspended users). Uses a lightweight cache (TTL: 60 seconds) to avoid hitting the DB on every request.
- **RolesGuard**: Reads `@Roles()` metadata. If no roles are specified, allows all authenticated users. If roles are specified, checks `request.user.role` against the list.
- **ResourceGuard**: For ownership checks, loads the resource and verifies the relationship. For org membership, checks `request.user.brandId` against the resource's `brandId`.

#### 1.4.4 Example Controller Usage

```typescript
@Controller('bounties')
export class BountyController {
  // Any authenticated user can list (filtering applied in service layer)
  @Get()
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  list(@Request() req) { ... }

  // Only BA and SA can create
  @Post()
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  create(@Request() req, @Body() dto: CreateBountyDto) { ... }

  // BA must be in the bounty's org; SA can access any
  @Patch(':id')
  @Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  @OrgMember()
  update(@Param('id') id: string, @Body() dto: UpdateBountyDto) { ... }
}
```

### 1.5 Frontend Route Guard Strategy

#### 1.5.1 Next.js Middleware

A Next.js middleware at `middleware.ts` runs on every request and:

1. Checks for a valid JWT in cookies/headers
2. Redirects unauthenticated users to `/login` for protected routes
3. Redirects authenticated users away from auth pages (login, signup)
4. Enforces role-based route access:

| Route Pattern | Allowed Roles | Redirect Target |
|--------------|---------------|-----------------|
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Public (unauthenticated) | Dashboard (if logged in) |
| `/bounties`, `/bounties/:id` | P, BA, SA | `/login` |
| `/submit/:bountyId` | P | `/login` or `/403` |
| `/my-submissions` | P | `/login` or `/403` |
| `/business/*` | BA | `/login` or `/403` |
| `/admin/*` | SA | `/login` or `/403` |
| `/profile` | P, BA, SA | `/login` |

#### 1.5.2 Client-Side Auth Context

```typescript
interface AuthContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
    brandId: string | null;
    status: UserStatus;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

#### 1.5.3 Role-Based UI Rendering

Components use the auth context to conditionally render:

```typescript
// Example: Only show admin nav items for Super Admins
{user?.role === 'SUPER_ADMIN' && <AdminNavItems />}

// Example: Show submit button only for Participants on LIVE bounties
{user?.role === 'PARTICIPANT' && bounty.status === 'LIVE' && !userSubmission && <SubmitButton />}
```

**Important**: Frontend guards are a UX convenience only. All authorization is enforced server-side. A user bypassing frontend guards will still be rejected by API RBAC.

---

## 2. Authentication Design

### 2.1 JWT Structure

**Access Token** (short-lived, 15 minutes):

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "PARTICIPANT",
  "brandId": "org-uuid | null",
  "type": "access",
  "iat": 1700000000,
  "exp": 1700000900
}
```

**Refresh Token** (long-lived, 7 days):

```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "jti": "unique-token-id",
  "iat": 1700000000,
  "exp": 1700604800
}
```

### 2.2 Token Lifecycle

```
Login → Access Token (15min) + Refresh Token (7d)
         ↓                        ↓
    Used for API calls     Stored securely (httpOnly cookie)
         ↓                        ↓
    Expires after 15min    Used to get new Access Token
         ↓                        ↓
    Call /auth/refresh     New Access Token + New Refresh Token (rotation)
                                  ↓
                           Old Refresh Token invalidated
```

### 2.3 Token Storage

| Token | Storage | Notes |
|-------|---------|-------|
| Access Token | In-memory (React state) | Never in localStorage. Short-lived. |
| Refresh Token | httpOnly, Secure, SameSite=Strict cookie | Not accessible to JavaScript. Sent automatically with requests to `/auth/refresh`. |

### 2.4 Refresh Token Rotation

- Each call to `/auth/refresh` issues a new refresh token and invalidates the old one.
- If a revoked refresh token is used, ALL refresh tokens for that user are invalidated (potential token theft detection).
- Refresh tokens are stored in the database with `jti` (JWT ID) for revocation tracking.

### 2.5 Password Security

| Aspect | Implementation |
|--------|---------------|
| Hashing algorithm | bcrypt with cost factor 12 |
| Minimum length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 number |
| Storage | Only the hash is stored (`passwordHash` field) |
| Comparison | Constant-time comparison via bcrypt.compare() |
| Reset tokens | Cryptographically random, 64 bytes, hex-encoded |
| Reset token expiry | 1 hour |
| Reset token usage | Single-use, deleted after successful reset |

### 2.6 Session Management

- Suspended users are rejected at the UserStatusGuard level (checked every request with 60s cache).
- Forced password reset: Sets a flag on the user record. On next login attempt, user is redirected to the password reset flow.
- Logout: Invalidates the refresh token. Access token continues to work until its short 15-minute expiry.

---

## 3. Audit Logging Strategy

### 3.1 What Gets Logged

Every action that changes state on a protected resource is logged. See the Audit Log Action Reference in `api-contracts.md` for the complete list.

**Summary of audited actions:**

| Category | Actions |
|----------|---------|
| User | password_change, password_reset, status_change, force_password_reset |
| Brand | create, update, status_change, member_add, member_remove |
| Bounty | create, update, status_change, delete, override |
| Submission | create, update, review, payout_change, override |
| Settings | update (global toggles) |

### 3.2 Audit Log Format

Each audit log entry follows the `AuditLog` model from the database schema:

```json
{
  "id": "uuid",
  "actorId": "user-uuid",
  "actorRole": "SUPER_ADMIN",
  "action": "submission.override",
  "entityType": "Submission",
  "entityId": "submission-uuid",
  "beforeState": { "status": "REJECTED" },
  "afterState": { "status": "APPROVED" },
  "reason": "Valid proof provided via support ticket",
  "ipAddress": "192.168.1.100",
  "createdAt": "2026-02-07T17:00:00.000Z"
}
```

### 3.3 Implementation Strategy

- **NestJS Interceptor**: A global `AuditLogInterceptor` captures audit data from controller responses that are decorated with `@Audited()`.
- **Decorator**: `@Audited(action: string, entityType: string)` marks endpoints that require audit logging.
- **Async write**: Audit logs are written asynchronously to avoid blocking the main request. Use a simple event emitter or queue.
- **IP Address**: Extracted from `request.ip` (with `X-Forwarded-For` support for proxied environments).
- **Before/After state**: The service layer captures the entity's state before and after the mutation, passing both to the audit logger.

```typescript
// Example usage
@Patch(':id/status')
@Audited('bounty.status_change', 'Bounty')
@Roles(UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
async updateStatus(@Param('id') id: string, @Body() dto: UpdateBountyStatusDto) {
  // Service captures before/after state and returns audit metadata
  return this.bountyService.updateStatus(id, dto);
}
```

### 3.4 Retention and Access

- Audit logs are **append-only**. No update or delete endpoints exist.
- Audit logs are never cascade-deleted (the `Restrict` rule on the User relation prevents this).
- Indexed on `actorId`, `[entityType, entityId]`, `action`, and `createdAt` for efficient querying.
- Only Super Admins can view audit logs via `GET /admin/audit-logs`.

---

## 4. Rate Limiting

### 4.1 Configuration

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| `POST /auth/signup` | 5 | 1 minute | Per IP |
| `POST /auth/login` | 10 | 1 minute | Per IP |
| `POST /auth/forgot-password` | 3 | 1 minute | Per IP |
| `POST /auth/reset-password` | 5 | 1 minute | Per IP |
| `POST /auth/resend-verification` | 3 | 1 minute | Per user |
| All other authenticated endpoints | 100 | 1 minute | Per user |

### 4.2 Implementation

- Use `@nestjs/throttler` for rate limiting.
- Rate limit headers are included in responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- When exceeded, return `429 Too Many Requests` with a `Retry-After` header.

### 4.3 Rate Limit Storage

- **Local development**: In-memory store.
- **Staging/Production**: Redis-backed store for distributed rate limiting across multiple server instances.

---

## 5. Security Checklist

### 5.1 Input Validation

| Rule | Implementation |
|------|---------------|
| Validate all input at API boundary | Use `class-validator` decorators on all DTOs |
| Reject unknown fields | Enable `whitelist: true` and `forbidNonWhitelisted: true` in `ValidationPipe` |
| Sanitize strings | Strip HTML tags from all text inputs (except explicitly rich-text fields, of which there are none in MVP) |
| Validate file uploads | Check MIME type (not just extension), enforce size limits, reject non-image files |
| Validate UUIDs | All ID parameters validated as UUID format |
| Validate enums | All enum values validated against defined enums |
| Validate dates | Ensure endDate > startDate, dates are valid ISO 8601 |
| Validate URLs | Proof links validated as well-formed URLs |
| Max lengths | All text fields have explicit max length constraints |

### 5.2 CORS Configuration

```typescript
{
  origin: [
    'https://app.socialbounty.com',     // Production
    'https://staging.socialbounty.com',  // Staging
    'http://localhost:3000',             // Local development
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Required for httpOnly cookie refresh tokens
  maxAge: 86400,      // Preflight cache: 24 hours
}
```

### 5.3 CSRF Protection

- Access token is sent via `Authorization` header (not cookies), which is inherently CSRF-safe.
- Refresh token is in an httpOnly cookie with `SameSite=Strict`, which prevents CSRF for the refresh endpoint.
- No additional CSRF tokens are needed for this architecture.

### 5.4 XSS Prevention

| Layer | Measure |
|-------|---------|
| API | Strip HTML from all text inputs via sanitization middleware |
| API | Content-Type headers set to `application/json` for all API responses |
| Frontend | React's built-in JSX escaping prevents DOM-based XSS |
| Frontend | Never use `dangerouslySetInnerHTML` |
| Frontend | CSP header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: https:; connect-src 'self' https://api.socialbounty.com` |
| Headers | `X-Content-Type-Options: nosniff` |
| Headers | `X-Frame-Options: DENY` |
| Headers | `Referrer-Policy: strict-origin-when-cross-origin` |

### 5.5 File Upload Security

| Rule | Implementation |
|------|---------------|
| Allowed types | image/jpeg, image/png, image/gif, image/webp only |
| Validation method | Validate MIME type by reading file magic bytes, not just the `Content-Type` header or extension |
| Max file size | 5MB per file |
| Max files per submission | 5 images |
| Max logo size | 2MB |
| File naming | Rename uploaded files to UUID-based names (prevent path traversal) |
| Storage path | Files stored outside the web root, served via authenticated API endpoint |
| Virus scanning | Out of scope for MVP. Document as a post-MVP security improvement. |
| Image processing | Optionally strip EXIF metadata for privacy (post-MVP enhancement) |

### 5.6 SQL Injection Prevention

- **Prisma ORM**: All database queries go through Prisma, which uses parameterized queries by default.
- **No raw SQL**: Do not use `$queryRaw` or `$executeRaw` unless absolutely necessary. If needed, always use parameterized queries.
- **Input validation**: All inputs are validated before reaching the service layer.

### 5.7 Authentication Security

| Rule | Implementation |
|------|---------------|
| Password hashing | bcrypt with cost factor 12 |
| Token signing | HMAC-SHA256 with a strong secret (min 256 bits) from environment variable |
| Token storage | Access token in memory, refresh token in httpOnly cookie |
| Token expiry | Access: 15 minutes, Refresh: 7 days |
| Refresh token rotation | New refresh token on each refresh; old one invalidated |
| Token theft detection | If a revoked refresh token is reused, invalidate all tokens for that user |
| Email enumeration | Login and forgot-password return generic messages |
| Password reset tokens | Cryptographically random, single-use, 1-hour expiry |
| Session termination | Logout invalidates refresh token; user status check on every request |
| Suspended user check | Checked on every request (cached 60s) |

### 5.8 HTTP Security Headers

Applied globally via NestJS middleware or helmet:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: https:; connect-src 'self' https://api.socialbounty.com
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 5.9 Logging and Error Handling

| Rule | Implementation |
|------|---------------|
| Structured logging | Use pino or winston with JSON format |
| Request logging | Log method, path, status code, response time, user ID (if authenticated) |
| Error responses | Never expose stack traces or internal details to clients in production |
| Sentry integration | Capture unhandled exceptions with context (user ID, request URL) |
| Sensitive data | Never log passwords, tokens, or full credit card numbers |
| PII in logs | Minimize PII; log user IDs, not emails, in request logs |
| Log levels | ERROR, WARN, INFO, DEBUG. Production: INFO and above. |

### 5.10 Environment and Secrets

| Rule | Implementation |
|------|---------------|
| Secret storage | All secrets in environment variables, never in code |
| `.env.example` | Document all required env vars without actual values |
| Startup validation | App fails fast if required env vars are missing |
| JWT secret | Min 256 bits, unique per environment |
| Database URL | Connection string via `DATABASE_URL` env var |
| CORS origins | Configurable per environment |
| Sentry DSN | Configurable per environment, disabled in local |

### 5.11 Dependency Security

| Rule | Implementation |
|------|---------------|
| Audit dependencies | Run `npm audit` in CI pipeline |
| Lock file | Commit `package-lock.json`, use `npm ci` in CI |
| Update cadence | Review and update dependencies monthly |
| No eval | Never use `eval()`, `Function()`, or dynamic `require()` with user input |

---

## 6. Security Boundaries

### 6.1 Trust Boundaries

```
┌─────────────────────────────────────────────────────┐
│                    Internet                          │
│  ┌──────────────┐                                   │
│  │   Browser     │                                   │
│  │  (Next.js)    │ ← Untrusted: all input validated  │
│  └──────┬───────┘                                   │
│         │ HTTPS only                                 │
│  ┌──────┴───────┐                                   │
│  │  API Gateway  │ ← Rate limiting, CORS             │
│  │  (NestJS)     │ ← JWT validation, RBAC guards     │
│  └──────┬───────┘                                   │
│         │ Internal                                    │
│  ┌──────┴───────┐                                   │
│  │  Database     │ ← Parameterized queries only       │
│  │  (PostgreSQL) │ ← Restricted credentials           │
│  └──────────────┘                                   │
│  ┌──────────────┐                                   │
│  │ File Storage  │ ← Authenticated access only        │
│  │  (Local/S3)   │ ← UUID-named files                 │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

### 6.2 Data Classification

| Classification | Examples | Handling |
|---------------|----------|----------|
| **Public** | Bounty titles/descriptions (LIVE only), org names | Served to unauthenticated Participants via public list |
| **Internal** | Submission details, user profiles, org details | Accessible only to authorized roles per RBAC |
| **Confidential** | Audit logs, user emails, IP addresses | Accessible only to Super Admins |
| **Secret** | Password hashes, JWT secrets, API keys | Never exposed via API; stored in env vars or hashed |

### 6.3 Principle of Least Privilege

- Database user has only the permissions needed (SELECT, INSERT, UPDATE, DELETE on application tables). No DDL permissions in production.
- API service account has no direct filesystem access except the upload directory.
- Super Admin accounts are provisioned manually and audited.
- Business Admins can only access their own brand's data.
- Participants can only access their own submissions and public (LIVE) bounties.

---

## 7. Assumptions

1. **HTTPS enforced**: All environments (staging, production) enforce HTTPS. Local development uses HTTP.
2. **Single server for MVP**: Rate limiting uses in-memory store locally; Redis in staging/production.
3. **No 2FA for MVP**: Two-factor authentication is out of scope.
4. **No OAuth/SSO for MVP**: Only email + password authentication.
5. **No IP whitelisting**: Super Admin access is not IP-restricted in MVP.
6. **Virus scanning out of scope**: File uploads are not scanned for malware in MVP. Documented as a post-MVP improvement.
7. **EXIF stripping optional**: Stripping EXIF metadata from uploaded images is a post-MVP enhancement.
8. **Password complexity**: Spec requires "minimum strength requirements." We implement: 8+ chars, 1 uppercase, 1 lowercase, 1 number. Special characters are encouraged but not required.
