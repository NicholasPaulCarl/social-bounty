# Architect Agent Reference

> Database schema, API contracts, system design decisions

## Responsibilities

- Design and maintain the Prisma database schema (`packages/prisma/schema.prisma`)
- Define API contracts (endpoints, request/response shapes, status codes)
- Own the shared types package (`packages/shared/`)
- Make cross-cutting architectural decisions (auth strategy, caching, error handling)
- Enforce consistency between frontend and backend via shared DTOs

## Monorepo Structure

```
social-bounty/
  apps/
    api/              # NestJS REST API (port 3001)
    web/              # Next.js frontend (port 3000)
  packages/
    shared/           # Enums, DTOs, constants — consumed by both apps
    prisma/           # Prisma schema, migrations, seed script
```

- Workspace manager: **npm workspaces** (root `package.json`)
- `packages/shared` is referenced as `@social-bounty/shared` — both apps import from it
- `packages/prisma` owns the schema; the API app imports `@prisma/client`

---

## Data Model

### Enums (Prisma + shared TS mirror)

| Enum | Values |
|---|---|
| UserRole | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN |
| UserStatus | ACTIVE, SUSPENDED |
| OrgStatus | ACTIVE, SUSPENDED |
| OrgMemberRole | OWNER, MEMBER |
| BountyStatus | DRAFT, LIVE, PAUSED, CLOSED |
| RewardType | CASH, PRODUCT, SERVICE, OTHER |
| SubmissionStatus | SUBMITTED, IN_REVIEW, NEEDS_MORE_INFO, APPROVED, REJECTED |
| PayoutStatus | NOT_PAID, PENDING, PAID |

### Models

**User** — `@@map("users")`
- `id` (UUID PK), `email` (unique), `passwordHash`, `firstName`, `lastName`
- `role` (UserRole, default PARTICIPANT), `status` (UserStatus, default ACTIVE)
- `emailVerified` (bool, default false), `createdAt`, `updatedAt`
- Relations: submissions, reviewedSubmissions, organisationMemberships, createdBounties, auditLogs, fileUploads
- Indexes: email, role, status

**Organisation** — `@@map("organisations")`
- `id` (UUID PK), `name`, `logo?`, `contactEmail`, `status` (OrgStatus), timestamps
- Relations: members, bounties

**OrganisationMember** — `@@map("organisation_members")`
- `id` (UUID PK), `userId`, `organisationId`, `role` (OrgMemberRole), `joinedAt`
- Unique constraint: `[userId, organisationId]`
- User delete: Restrict. Org delete: Cascade.

**Bounty** — `@@map("bounties")`
- `id`, `organisationId`, `createdById`, `title`, `shortDescription`
- `fullInstructions` (Text), `category`, `rewardType`, `rewardValue` (Decimal(12,2)?), `rewardDescription?`
- `maxSubmissions?`, `startDate?`, `endDate?`, `eligibilityRules` (Text), `proofRequirements` (Text)
- `status` (BountyStatus, default DRAFT), `deletedAt?`, timestamps
- Indexes: organisationId, status, category, createdById, [startDate, endDate]

**Submission** — `@@map("submissions")`
- `id`, `bountyId`, `userId`, `proofText` (Text), `proofLinks` (Json?)
- `status` (SubmissionStatus), `reviewerNote?` (Text), `reviewedById?`
- `payoutStatus` (PayoutStatus, default NOT_PAID), timestamps
- Relations: bounty (cascade), user (restrict), reviewedBy (set null), proofImages

**AuditLog** — `@@map("audit_logs")`
- `id`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`
- `beforeState` (Json?), `afterState` (Json?), `reason?` (Text), `ipAddress?`, `createdAt`
- Indexes: actorId, [entityType, entityId], action, createdAt

**FileUpload** — `@@map("file_uploads")`
- `id`, `submissionId`, `userId`, `fileName`, `fileUrl`, `mimeType`, `fileSize`, `createdAt`

### Status Transition Rules

**Bounty**: DRAFT -> LIVE -> PAUSED | CLOSED; PAUSED -> LIVE | CLOSED
- Only DRAFT bounties can be hard-deleted
- LIVE bounties have restricted editability

**Submission**: SUBMITTED -> IN_REVIEW -> NEEDS_MORE_INFO | APPROVED | REJECTED
- NEEDS_MORE_INFO -> SUBMITTED (resubmit)
- Approved/Rejected are terminal for the review flow
- PayoutStatus tracks separately: NOT_PAID -> PENDING -> PAID

---

## API Contract

**Base URL**: `/api/v1`
**Auth**: Bearer JWT in `Authorization` header
**Error format**: `{ statusCode, error, message, details?: [{ field, message }] }`

### Auth (`/auth`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Create account |
| POST | `/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/auth/logout` | Authenticated | Invalidate refresh token |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/verify-email` | Public | Verify email address |
| POST | `/auth/resend-verification` | Authenticated | Resend verification email |
| POST | `/auth/refresh` | Public | Exchange refresh token |

### Users (`/users`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/users/me` | All roles | Get current user profile |
| PATCH | `/users/me` | All roles | Update profile |
| POST | `/users/me/change-password` | All roles | Change password |

### Bounties (`/bounties`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/bounties` | All roles | List bounties (filtered by role) |
| GET | `/bounties/:id` | All roles | Get bounty details |
| POST | `/bounties` | BA, SA | Create bounty |
| PATCH | `/bounties/:id` | BA, SA | Update bounty |
| PATCH | `/bounties/:id/status` | BA, SA | Update bounty status |
| DELETE | `/bounties/:id` | BA, SA | Soft-delete (DRAFT only) |

### Submissions (`/submissions`, `/bounties/:bountyId/submissions`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/bounties/:bountyId/submissions` | Participant | Create submission |
| GET | `/submissions/me` | Participant | List my submissions |
| GET | `/bounties/:bountyId/submissions` | BA, SA | List submissions for bounty |
| GET | `/submissions/:id` | Owner/Reviewer | Get submission details |
| PATCH | `/submissions/:id` | Participant | Update (if not terminal) |
| PATCH | `/submissions/:id/review` | BA, SA | Review submission |
| PATCH | `/submissions/:id/payout` | BA, SA | Update payout status |
| POST | `/submissions/:id/files` | Participant | Upload proof images |

### Organisations (`/organisations`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/organisations` | Participant | Create org (becomes owner, role -> BA) |
| GET | `/organisations/:id` | BA, SA | Get org details |
| PATCH | `/organisations/:id` | BA, SA | Update org |
| GET | `/organisations/:id/members` | BA, SA | List members |
| POST | `/organisations/:id/members` | BA, SA | Invite member |
| DELETE | `/organisations/:id/members/:userId` | BA, SA | Remove member |

### Business (`/business`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/business/dashboard` | BA | Business dashboard stats |

### Admin (`/admin`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | SA | Platform dashboard stats |
| GET | `/admin/users` | SA | List all users |
| GET | `/admin/users/:id` | SA | User details |
| PATCH | `/admin/users/:id/status` | SA | Suspend/activate user |
| POST | `/admin/users/:id/force-password-reset` | SA | Force password reset |
| GET | `/admin/organisations` | SA | List all orgs |
| POST | `/admin/organisations` | SA | Create org |
| PATCH | `/admin/organisations/:id/status` | SA | Suspend/activate org |
| PATCH | `/admin/bounties/:id/override` | SA | Override bounty status |
| PATCH | `/admin/submissions/:id/override` | SA | Override submission status |
| GET | `/admin/audit-logs` | SA | List audit logs |
| GET | `/admin/audit-logs/:id` | SA | Audit log detail |
| GET | `/admin/settings` | SA | Get platform settings |
| PATCH | `/admin/settings` | SA | Update settings |
| GET | `/admin/recent-errors` | SA | Recent errors |
| GET | `/admin/system-health` | SA | System health |

### Health (`/health`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Health check |

### Files (`/files`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/files/:filename` | Authenticated | Serve uploaded file |

---

## Shared Package (`packages/shared/`)

### Exports (from `src/index.ts`)

- **Enums**: UserRole, UserStatus, OrgStatus, OrgMemberRole, BountyStatus, RewardType, SubmissionStatus, PayoutStatus
- **Constants**: PAGINATION_DEFAULTS, PASSWORD_RULES, FILE_UPLOAD_LIMITS, FIELD_LIMITS, RATE_LIMITS, JWT_CONFIG, AUDIT_ACTIONS, ENTITY_TYPES
- **Common types**: SortOrder, PaginationParams, PaginationMeta, PaginatedResponse, ApiErrorDetail, ApiErrorResponse, MessageResponse
- **DTOs**: ~143 request/response types across auth, user, bounty, submission, organisation, admin, business, health

### Key Constants

```
PAGINATION_DEFAULTS = { PAGE: 1, LIMIT: 20, MAX_LIMIT: 100, SORT_ORDER: 'desc', SORT_BY: 'createdAt' }
PASSWORD_RULES = { MIN_LENGTH: 8, REQUIRE_UPPERCASE: true, REQUIRE_LOWERCASE: true, REQUIRE_NUMBER: true }
FILE_UPLOAD_LIMITS = { MAX_FILE_SIZE: 5MB, MAX_LOGO_SIZE: 2MB, MAX_FILES_PER_SUBMISSION: 5, MAX_PROOF_LINKS: 10 }
AUDIT_ACTIONS = { USER_STATUS_CHANGE, BOUNTY_CREATE, SUBMISSION_REVIEW, ... } (20 actions)
ENTITY_TYPES = { USER, ORGANISATION, BOUNTY, SUBMISSION, SETTINGS }
```

---

## Key Architectural Decisions

1. **JWT auth with in-memory refresh tokens** — access token (15m), refresh token (7d). Refresh tokens stored in a Map on the API server. Use Redis in production.
2. **Guard execution order**: JwtAuthGuard -> UserStatusGuard (60s TTL cache) -> RolesGuard -> ThrottlerGuard. Registered as global APP_GUARDs in `app.module.ts`.
3. **Fire-and-forget audit logs** — `AuditService.log()` does not `await` the Prisma write. Errors are caught and logged to console but don't block the response.
4. **Global input sanitization** — `SanitizePipe` strips HTML from all request bodies before validation.
5. **Consistent error format** — `HttpExceptionFilter` normalises all errors to `{ statusCode, error, message, details? }`.
6. **Soft delete for bounties** — `deletedAt` field; hard delete only for DRAFT status.
7. **Single org per Business Admin** (MVP constraint) — organisationId baked into JWT payload.

## Security Model

- **helmet()** — sets security headers
- **CORS** — configurable origins via `CORS_ORIGIN` env var
- **SanitizePipe** — strips HTML/script tags from all body strings (XSS prevention)
- **ValidationPipe** — whitelist + forbidNonWhitelisted (mass assignment prevention)
- **bcrypt** — cost factor 12 for password hashing
- **Rate limiting** — ThrottlerGuard with per-endpoint overrides via `RATE_LIMITS` constants

## MVP Scope Boundaries

**In scope**: Auth (email+password), RBAC (3 roles), bounty CRUD, submission workflow, audit logs, file uploads (images only), email notifications, simple dashboard counts.

**Out of scope**: Automated payouts, referral/MLM logic, advanced fraud detection, social features (feeds/comments/DMs), multi-tenant enterprise, charts/analytics, OAuth/social login.
