# REST API Contracts - Social Bounty MVP

## Overview

This document defines all REST API endpoints for the Social Bounty MVP. Each endpoint specifies the HTTP method, path, request/response bodies, status codes, and RBAC rules.

**Base URL**: `/api/v1`

**Source alignment**: This contract is aligned with the MVP backlog at `docs/backlog/mvp-backlog.md` and the database schema at `docs/architecture/database-schema.md`.

---

## Conventions

### Authentication

All endpoints (except Auth and Health) require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The JWT payload contains:

```json
{
  "sub": "uuid",
  "email": "user@example.com",
  "role": "PARTICIPANT | BUSINESS_ADMIN | SUPER_ADMIN",
  "brandId": "uuid | null",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### Pagination

All list endpoints support offset-based pagination via query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max 100) |
| `sortBy` | string | `createdAt` | Field to sort by |
| `sortOrder` | string | `desc` | `asc` or `desc` |

Paginated responses use a standard envelope:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response Format

All errors use a consistent format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "must be a valid email address" }
  ]
}
```

### RBAC Legend

| Abbreviation | Role |
|--------------|------|
| **P** | Participant |
| **BA** | Business Admin |
| **SA** | Super Admin |
| **Public** | No authentication required |
| **Self** | Authenticated user acting on their own resource |
| **OrgOwner** | Business Admin who is the Owner of the relevant brand |

---

## 1. Auth Endpoints (`/api/v1/auth`)

### POST `/auth/signup`

Register a new user account. (Backlog: Story 1.1)

- **Access**: Public
- **Rate Limit**: 5 requests/minute per IP
- **Blocked when**: Global signup toggle is disabled (see Admin Settings)

**Request Body**:

```json
{
  "email": "jane@example.com",
  "password": "SecureP@ss1",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Validation Rules**:
- `email`: required, valid email, unique (case-insensitive)
- `password`: required, min 8 characters, must contain uppercase, lowercase, number
- `firstName`: required, 1-100 characters
- `lastName`: required, 1-100 characters

**Response** `201 Created`:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "PARTICIPANT",
  "emailVerified": false,
  "createdAt": "2026-02-07T10:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error (invalid email, weak password, etc.)
- `403` - Signups are currently disabled (global toggle)
- `409` - Email already registered
- `429` - Rate limit exceeded

---

### POST `/auth/login`

Authenticate and receive a JWT. (Backlog: Story 1.2)

- **Access**: Public
- **Rate Limit**: 10 requests/minute per IP

**Request Body**:

```json
{
  "email": "jane@example.com",
  "password": "SecureP@ss1"
}
```

**Response** `200 OK`:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 86400,
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "PARTICIPANT",
    "status": "ACTIVE",
    "emailVerified": false,
    "brandId": null
  }
}
```

**Error Responses**:
- `400` - Validation error
- `401` - Invalid credentials (generic message, no info leakage)
- `403` - Account suspended ("Your account has been suspended")
- `429` - Rate limit exceeded

---

### POST `/auth/logout`

Terminate the current session. (Backlog: Story 1.3)

- **Access**: P, BA, SA

**Request Body**:

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response** `200 OK`:

```json
{
  "message": "Logged out successfully."
}
```

**Note**: Invalidates the refresh token. The access token remains valid until expiry (short-lived). Subsequent API calls with the invalidated refresh token are rejected.

**Error Responses**:
- `401` - Not authenticated

---

### POST `/auth/forgot-password`

Request a password reset email. (Backlog: Story 1.4)

- **Access**: Public
- **Rate Limit**: 3 requests/minute per IP

**Request Body**:

```json
{
  "email": "jane@example.com"
}
```

**Response** `200 OK`:

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Note**: Always returns 200 to prevent email enumeration. Reset token expires in 1 hour.

---

### POST `/auth/reset-password`

Reset password using token from email. (Backlog: Story 1.4)

- **Access**: Public
- **Rate Limit**: 5 requests/minute per IP

**Request Body**:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecureP@ss2"
}
```

**Response** `200 OK`:

```json
{
  "message": "Password has been reset successfully."
}
```

**Note**: Used tokens cannot be reused. Audit log entry is created.

**Error Responses**:
- `400` - Invalid or expired token, weak password
- `429` - Rate limit exceeded

---

### POST `/auth/verify-email`

Verify user email address using token from email. (Backlog: Story 1.5)

- **Access**: Public

**Request Body**:

```json
{
  "token": "verification-token-from-email"
}
```

**Response** `200 OK`:

```json
{
  "message": "Email verified successfully."
}
```

**Error Responses**:
- `400` - Invalid or expired token

---

### POST `/auth/resend-verification`

Resend the email verification link. (Backlog: Story 1.5)

- **Access**: P, BA, SA
- **Rate Limit**: 3 requests/minute per user

**Request Body**: None (uses authenticated user's email)

**Response** `200 OK`:

```json
{
  "message": "Verification email sent."
}
```

**Error Responses**:
- `400` - Email already verified
- `429` - Rate limit exceeded

---

### POST `/auth/refresh`

Refresh an expiring JWT.

- **Access**: Authenticated (P, BA, SA)

**Request Body**:

```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response** `200 OK`:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "bmV3cmVmcmVzaHRva2Vu...",
  "expiresIn": 86400
}
```

**Note**: Implements refresh token rotation -- old refresh token is invalidated and a new one is issued.

**Error Responses**:
- `401` - Invalid or expired refresh token

---

## 2. User Endpoints (`/api/v1/users`)

### GET `/users/me`

Get the authenticated user's profile. (Backlog: Story 2.1)

- **Access**: P, BA, SA

**Response** `200 OK`:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "PARTICIPANT",
  "status": "ACTIVE",
  "emailVerified": true,
  "brand": null,
  "createdAt": "2026-02-07T10:00:00.000Z",
  "updatedAt": "2026-02-07T10:00:00.000Z"
}
```

**Note**: If user is a BA, `brand` includes `{ "id": "...", "name": "...", "role": "OWNER|MEMBER" }`.

---

### PATCH `/users/me`

Update the authenticated user's profile. (Backlog: Story 2.2)

- **Access**: P, BA, SA (Self only)

**Request Body** (all fields optional):

```json
{
  "firstName": "Janet",
  "lastName": "Smith"
}
```

**Validation Rules**:
- `firstName`: 1-100 characters
- `lastName`: 1-100 characters
- Cannot change email, role, or status through this endpoint

**Response** `200 OK`:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "jane@example.com",
  "firstName": "Janet",
  "lastName": "Smith",
  "role": "PARTICIPANT",
  "status": "ACTIVE",
  "emailVerified": true,
  "updatedAt": "2026-02-07T11:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error
- `401` - Not authenticated

---

### POST `/users/me/change-password`

Change the authenticated user's password. (Backlog: Story 2.2)

- **Access**: P, BA, SA (Self only)
- **Audit Log**: Yes

**Request Body**:

```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ss2"
}
```

**Validation Rules**:
- `currentPassword`: required
- `newPassword`: required, min 8 characters, must contain uppercase, lowercase, number
- `newPassword` must differ from `currentPassword`

**Response** `200 OK`:

```json
{
  "message": "Password changed successfully."
}
```

**Error Responses**:
- `400` - Weak password, same as current password
- `401` - Current password incorrect

---

## 3. Brand Endpoints (`/api/v1/brands`)

### POST `/brands`

Create a new brand. The creating user becomes the Owner and their role is upgraded to BUSINESS_ADMIN. (Backlog: Story 3.1)

- **Access**: P (Participants who want to become Business Admins)
- **Audit Log**: Yes

**Request Body** (`multipart/form-data` to support logo upload):

```json
{
  "name": "Acme Corp",
  "contactEmail": "admin@acme.com"
}
```

Optional file: `logo` (image/jpeg, image/png, image/webp; max 2MB)

**Validation Rules**:
- `name`: required, 1-200 characters
- `contactEmail`: required, valid email
- `logo`: optional, image file only, max 2MB
- User must not already belong to an brand

**Response** `201 Created`:

```json
{
  "id": "org-uuid-1",
  "name": "Acme Corp",
  "logo": "https://cdn.example.com/logos/org-uuid-1.png",
  "contactEmail": "admin@acme.com",
  "status": "ACTIVE",
  "createdAt": "2026-02-07T10:00:00.000Z",
  "updatedAt": "2026-02-07T10:00:00.000Z"
}
```

**Side Effects**:
- User's role is changed from PARTICIPANT to BUSINESS_ADMIN
- An BrandMember record is created with role OWNER

**Error Responses**:
- `400` - Validation error
- `409` - User already belongs to an brand

---

### GET `/brands/:id`

Get brand details. (Backlog: Story 3.2)

- **Access**: BA (own org), SA

**Response** `200 OK`:

```json
{
  "id": "org-uuid-1",
  "name": "Acme Corp",
  "logo": "https://cdn.example.com/logos/acme.png",
  "contactEmail": "admin@acme.com",
  "status": "ACTIVE",
  "memberCount": 3,
  "bountyCount": 12,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

**Error Responses**:
- `403` - Not a member of this brand (BA), or not SA
- `404` - Brand not found

---

### PATCH `/brands/:id`

Update brand details. (Backlog: Story 3.3)

- **Access**: OrgOwner, SA
- **Audit Log**: Yes

**Request Body** (all fields optional, `multipart/form-data` for logo):

```json
{
  "name": "Acme Corporation",
  "contactEmail": "newemail@acme.com"
}
```

Optional file: `logo` (image/jpeg, image/png, image/webp; max 2MB). Send `logo: null` to remove.

**Validation Rules**:
- `name`: 1-200 characters
- `logo`: valid image file or null
- `contactEmail`: valid email

**Response** `200 OK`:

```json
{
  "id": "org-uuid-1",
  "name": "Acme Corporation",
  "logo": "https://cdn.example.com/logos/acme-new.png",
  "contactEmail": "newemail@acme.com",
  "status": "ACTIVE",
  "updatedAt": "2026-02-07T12:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error
- `403` - Not org owner or SA
- `404` - Brand not found

---

### GET `/brands/:id/members`

List members of an brand. (Backlog: Story 3.4)

- **Access**: BA (own org), SA

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (standard pagination)

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "member-uuid-1",
      "userId": "user-uuid-1",
      "user": {
        "id": "user-uuid-1",
        "email": "john@acme.com",
        "firstName": "John",
        "lastName": "Doe",
        "status": "ACTIVE"
      },
      "role": "OWNER",
      "joinedAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### POST `/brands/:id/members`

Invite a user to join the brand. (Backlog: Story 3.4)

- **Access**: OrgOwner, SA
- **Audit Log**: Yes

**Request Body**:

```json
{
  "email": "newmember@example.com"
}
```

**Validation Rules**:
- `email`: required, valid email
- User must exist and not already belong to an brand
- Invited user will receive an email invitation

**Response** `201 Created`:

```json
{
  "message": "Invitation sent to newmember@example.com.",
  "invitation": {
    "id": "invitation-uuid-1",
    "email": "newmember@example.com",
    "brandId": "org-uuid-1",
    "status": "PENDING",
    "createdAt": "2026-02-07T12:00:00.000Z"
  }
}
```

**Side Effects**:
- An invitation email is sent to the user
- On acceptance, user's role is changed to BUSINESS_ADMIN and an BrandMember record with role MEMBER is created

**Error Responses**:
- `400` - Validation error, user not found
- `403` - Not org owner or SA
- `409` - User already belongs to an brand

---

### DELETE `/brands/:id/members/:userId`

Remove a member from the brand. (Backlog: Story 3.4)

- **Access**: OrgOwner, SA
- **Audit Log**: Yes

**Validation Rules**:
- Cannot remove the Owner (must transfer ownership first, which is out of scope for MVP -- assumption documented)
- The removed user's role reverts to PARTICIPANT

**Response** `200 OK`:

```json
{
  "message": "Member removed from brand."
}
```

**Error Responses**:
- `400` - Cannot remove the brand owner
- `403` - Not org owner or SA
- `404` - Member not found

---

## 4. Bounty Endpoints (`/api/v1/bounties`)

### GET `/bounties`

List bounties with role-based filtering. (Backlog: Stories 4.4, 6.2)

Participants see only LIVE bounties. Business Admins see their brand's bounties in all statuses. Super Admins see all bounties.

- **Access**: P (LIVE only), BA (own org), SA (all)

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (standard pagination)
- `status` - Filter by BountyStatus (e.g., `LIVE`, `DRAFT`)
- `category` - Filter by category string
- `rewardType` - Filter by RewardType enum
- `search` - Full-text search on title and shortDescription
- `brandId` - Filter by brand (SA only)

**Sorting options**: `createdAt` (newest), `rewardValue`, `endDate` (ending soon)

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "bounty-uuid-1",
      "title": "Share our product on Instagram",
      "shortDescription": "Post a photo with our product and tag @acme",
      "category": "Social Media",
      "rewardType": "CASH",
      "rewardValue": "25.00",
      "rewardDescription": null,
      "maxSubmissions": 100,
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2026-03-01T00:00:00.000Z",
      "status": "LIVE",
      "submissionCount": 42,
      "brand": {
        "id": "org-uuid-1",
        "name": "Acme Corp",
        "logo": "https://cdn.example.com/logos/acme.png"
      },
      "createdAt": "2026-01-20T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### GET `/bounties/:id`

Get full bounty details. (Backlog: Story 4.5)

- **Access**: P (LIVE only), BA (own org), SA

**Response** `200 OK`:

```json
{
  "id": "bounty-uuid-1",
  "title": "Share our product on Instagram",
  "shortDescription": "Post a photo with our product and tag @acme",
  "fullInstructions": "1. Take a photo with the product\n2. Post to Instagram\n3. Tag @acme\n4. Submit the post URL as proof",
  "category": "Social Media",
  "rewardType": "CASH",
  "rewardValue": "25.00",
  "rewardDescription": null,
  "maxSubmissions": 100,
  "remainingSubmissions": 58,
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-03-01T00:00:00.000Z",
  "eligibilityRules": "Must have a public Instagram account with at least 100 followers.",
  "proofRequirements": "Submit the URL to your Instagram post. Post must be public and visible.",
  "status": "LIVE",
  "submissionCount": 42,
  "brand": {
    "id": "org-uuid-1",
    "name": "Acme Corp",
    "logo": "https://cdn.example.com/logos/acme.png"
  },
  "createdBy": {
    "id": "user-uuid-1",
    "firstName": "John",
    "lastName": "Doe"
  },
  "userSubmission": {
    "id": "submission-uuid-1",
    "status": "SUBMITTED",
    "payoutStatus": "NOT_PAID"
  },
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-25T10:00:00.000Z"
}
```

**Note**: `remainingSubmissions` is computed from `maxSubmissions - submissionCount` (null if maxSubmissions is not set). `userSubmission` is included for authenticated Participants to show whether they've already submitted (null if not submitted).

**Error Responses**:
- `403` - Participant trying to view non-LIVE bounty, or BA viewing other org's bounty
- `404` - Bounty not found

---

### POST `/bounties`

Create a new bounty. (Backlog: Story 4.1)

- **Access**: BA, SA
- **Audit Log**: Yes

**Request Body**:

```json
{
  "title": "Share our product on Instagram",
  "shortDescription": "Post a photo with our product and tag @acme",
  "fullInstructions": "1. Take a photo with the product\n2. Post to Instagram\n3. Tag @acme\n4. Submit the post URL as proof",
  "category": "Social Media",
  "rewardType": "CASH",
  "rewardValue": 25.00,
  "rewardDescription": null,
  "maxSubmissions": 100,
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-03-01T00:00:00.000Z",
  "eligibilityRules": "Must have a public Instagram account with at least 100 followers.",
  "proofRequirements": "Submit the URL to your Instagram post. Post must be public and visible."
}
```

**Validation Rules**:
- `title`: required, 1-200 characters
- `shortDescription`: required, 1-500 characters
- `fullInstructions`: required, 1-10000 characters
- `category`: required, 1-100 characters
- `rewardType`: required, one of CASH, PRODUCT, SERVICE, OTHER
- `rewardValue`: optional, positive decimal, required if rewardType is CASH
- `rewardDescription`: optional, 1-500 characters
- `maxSubmissions`: optional, positive integer
- `startDate`: optional, ISO 8601 datetime
- `endDate`: optional, ISO 8601 datetime, must be after startDate if both provided
- `eligibilityRules`: required, 1-5000 characters
- `proofRequirements`: required, 1-5000 characters

**Note**: Bounty is created in `DRAFT` status. The `brandId` is derived from the authenticated BA's brand.

**Response** `201 Created`:

```json
{
  "id": "bounty-uuid-new",
  "title": "Share our product on Instagram",
  "shortDescription": "Post a photo with our product and tag @acme",
  "fullInstructions": "...",
  "category": "Social Media",
  "rewardType": "CASH",
  "rewardValue": "25.00",
  "rewardDescription": null,
  "maxSubmissions": 100,
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-03-01T00:00:00.000Z",
  "eligibilityRules": "...",
  "proofRequirements": "...",
  "status": "DRAFT",
  "brandId": "org-uuid-1",
  "createdById": "user-uuid-1",
  "createdAt": "2026-02-07T10:00:00.000Z",
  "updatedAt": "2026-02-07T10:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error
- `403` - Not a BA or SA

---

### PATCH `/bounties/:id`

Update a bounty's fields. Edit rules depend on bounty status. (Backlog: Story 4.2)

- **Access**: BA (own org), SA
- **Audit Log**: Yes (with before/after state)

**Edit rules by status**:
- **DRAFT or PAUSED**: All fields are editable
- **LIVE**: Only these fields are editable: `eligibilityRules`, `proofRequirements`, `maxSubmissions`, `endDate`
- **CLOSED**: No fields are editable

**Request Body** (all fields optional):

```json
{
  "title": "Updated title",
  "shortDescription": "Updated description",
  "fullInstructions": "Updated instructions",
  "category": "Updated Category",
  "rewardType": "PRODUCT",
  "rewardValue": null,
  "rewardDescription": "Free product sample",
  "maxSubmissions": 50,
  "startDate": "2026-02-15T00:00:00.000Z",
  "endDate": "2026-04-01T00:00:00.000Z",
  "eligibilityRules": "Updated rules",
  "proofRequirements": "Updated requirements"
}
```

**Response** `200 OK`: Updated bounty object (same shape as GET `/bounties/:id`)

**Error Responses**:
- `400` - Validation error, field not editable in current status, bounty is CLOSED
- `403` - Not authorized
- `404` - Bounty not found

---

### PATCH `/bounties/:id/status`

Transition a bounty's status. (Backlog: Story 4.3)

- **Access**: BA (own org), SA
- **Audit Log**: Yes

**Allowed Transitions**:
- `DRAFT` -> `LIVE` (requires all mandatory fields to be filled)
- `LIVE` -> `PAUSED`
- `PAUSED` -> `LIVE`
- `LIVE` -> `CLOSED`
- `PAUSED` -> `CLOSED`

**Note**: CLOSED is a terminal state. Closed bounties cannot be reopened.

**Request Body**:

```json
{
  "status": "LIVE"
}
```

**Response** `200 OK`:

```json
{
  "id": "bounty-uuid-1",
  "status": "LIVE",
  "updatedAt": "2026-02-07T12:00:00.000Z"
}
```

**Error Responses**:
- `400` - Invalid status transition, missing mandatory fields for publishing
- `403` - Not authorized
- `404` - Bounty not found

---

### DELETE `/bounties/:id`

Soft-delete a draft bounty. (Backlog: Story 4.6)

- **Access**: BA (own org), SA
- **Audit Log**: Yes

**Validation Rules**:
- Only bounties in `DRAFT` status can be deleted
- Soft delete: bounty is marked as deleted in the database, not purged

**Response** `200 OK`:

```json
{
  "message": "Bounty deleted."
}
```

**Error Responses**:
- `400` - Bounty is not in DRAFT status
- `403` - Not authorized
- `404` - Bounty not found

---

## 5. Submission Endpoints (`/api/v1/submissions`)

### POST `/bounties/:bountyId/submissions`

Submit proof for a bounty. (Backlog: Story 5.1)

- **Access**: P
- **Audit Log**: Yes
- **Blocked when**: Global submissions toggle is disabled (see Admin Settings)

**Request Body** (`multipart/form-data` to support file uploads):

```json
{
  "proofText": "Here is my Instagram post showing the product. I tagged @acme and the post is public.",
  "proofLinks": ["https://instagram.com/p/abc123"]
}
```

Files are uploaded as `proofImages` form fields (image/jpeg, image/png, image/gif, image/webp; max 5MB each, max 5 files).

**Validation Rules**:
- `proofText`: required, 1-10000 characters
- `proofLinks`: optional, array of valid URLs, max 10 links
- `proofImages`: optional, image files only (jpeg, png, gif, webp), max 5MB each, max 5 files
- File type validated by MIME type, not just extension
- Bounty must be in LIVE status
- Bounty must not have reached maxSubmissions
- Bounty endDate must not have passed (if set)
- User must not already have a submission for this bounty (one submission per user per bounty)

**Response** `201 Created`:

```json
{
  "id": "submission-uuid-1",
  "bountyId": "bounty-uuid-1",
  "userId": "user-uuid-participant",
  "proofText": "Here is my Instagram post showing the product...",
  "proofLinks": ["https://instagram.com/p/abc123"],
  "proofImages": [
    {
      "id": "file-uuid-1",
      "fileName": "proof-screenshot.png",
      "fileUrl": "/api/v1/files/file-uuid-1",
      "mimeType": "image/png",
      "fileSize": 245000
    }
  ],
  "status": "SUBMITTED",
  "payoutStatus": "NOT_PAID",
  "createdAt": "2026-02-07T14:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error, bounty not live, max submissions reached, end date passed
- `403` - Not a Participant, or submissions globally disabled
- `404` - Bounty not found
- `409` - User already has a submission for this bounty

---

### GET `/submissions/me`

List the authenticated participant's submissions. (Backlog: Story 5.2)

- **Access**: P

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (standard pagination)
- `status` - Filter by SubmissionStatus
- `payoutStatus` - Filter by PayoutStatus
- `bountyId` - Filter by specific bounty

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "submission-uuid-1",
      "bountyId": "bounty-uuid-1",
      "bounty": {
        "id": "bounty-uuid-1",
        "title": "Share our product on Instagram",
        "rewardType": "CASH",
        "rewardValue": "25.00",
        "brand": {
          "id": "org-uuid-1",
          "name": "Acme Corp"
        }
      },
      "proofText": "Here is my Instagram post...",
      "proofLinks": ["https://instagram.com/p/abc123"],
      "proofImages": [
        {
          "id": "file-uuid-1",
          "fileName": "proof-screenshot.png",
          "fileUrl": "/api/v1/files/file-uuid-1",
          "mimeType": "image/png",
          "fileSize": 245000
        }
      ],
      "status": "APPROVED",
      "reviewerNote": "Great post! Approved.",
      "payoutStatus": "PENDING",
      "createdAt": "2026-02-07T14:00:00.000Z",
      "updatedAt": "2026-02-08T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET `/bounties/:bountyId/submissions`

List submissions for a specific bounty (for review). (Backlog: Story 6.3)

- **Access**: BA (own org's bounty), SA

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (standard pagination)
- `status` - Filter by SubmissionStatus
- `payoutStatus` - Filter by PayoutStatus

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "submission-uuid-1",
      "userId": "user-uuid-participant",
      "user": {
        "id": "user-uuid-participant",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com"
      },
      "proofText": "Here is my Instagram post...",
      "proofLinks": ["https://instagram.com/p/abc123"],
      "proofImages": [
        {
          "id": "file-uuid-1",
          "fileName": "proof-screenshot.png",
          "fileUrl": "/api/v1/files/file-uuid-1",
          "mimeType": "image/png",
          "fileSize": 245000
        }
      ],
      "status": "SUBMITTED",
      "reviewerNote": null,
      "reviewedBy": null,
      "payoutStatus": "NOT_PAID",
      "createdAt": "2026-02-07T14:00:00.000Z",
      "updatedAt": "2026-02-07T14:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Error Responses**:
- `403` - Not authorized to view this bounty's submissions
- `404` - Bounty not found

---

### GET `/submissions/:id`

Get a single submission's details. (Backlog: Story 5.3)

- **Access**: P (own submission), BA (own org's bounty), SA

**Response** `200 OK`:

```json
{
  "id": "submission-uuid-1",
  "bountyId": "bounty-uuid-1",
  "bounty": {
    "id": "bounty-uuid-1",
    "title": "Share our product on Instagram",
    "rewardType": "CASH",
    "rewardValue": "25.00"
  },
  "userId": "user-uuid-participant",
  "user": {
    "id": "user-uuid-participant",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com"
  },
  "proofText": "Here is my Instagram post...",
  "proofLinks": ["https://instagram.com/p/abc123"],
  "proofImages": [
    {
      "id": "file-uuid-1",
      "fileName": "proof-screenshot.png",
      "fileUrl": "/api/v1/files/file-uuid-1",
      "mimeType": "image/png",
      "fileSize": 245000
    }
  ],
  "status": "SUBMITTED",
  "reviewerNote": null,
  "reviewedBy": null,
  "payoutStatus": "NOT_PAID",
  "createdAt": "2026-02-07T14:00:00.000Z",
  "updatedAt": "2026-02-07T14:00:00.000Z"
}
```

**Error Responses**:
- `403` - Not authorized to view this submission
- `404` - Submission not found

---

### PATCH `/submissions/:id`

Update a submission that has been marked "Needs More Info". (Backlog: Story 5.4)

- **Access**: P (own submission only)
- **Audit Log**: Yes

**Request Body** (`multipart/form-data` to support file uploads):

```json
{
  "proofText": "Updated proof with additional details and correct URL.",
  "proofLinks": ["https://instagram.com/p/abc123", "https://instagram.com/p/def456"]
}
```

Optional files: `proofImages` (same rules as submission creation). New images are added; existing images are preserved unless `removeImageIds` is provided.

Additional field:
- `removeImageIds`: optional, array of file UUIDs to remove from the submission

**Validation Rules**:
- Submission must be in `NEEDS_MORE_INFO` status
- Same validation rules as submission creation apply
- Only the original submitter can update

**Side Effect**: Submission status changes back to `SUBMITTED` after update.

**Response** `200 OK`: Updated submission object (same shape as GET `/submissions/:id`)

**Error Responses**:
- `400` - Submission is not in NEEDS_MORE_INFO status, validation error
- `403` - Not the original submitter
- `404` - Submission not found

---

### PATCH `/submissions/:id/review`

Review a submission (approve, reject, or request more info). (Backlog: Story 6.3)

- **Access**: BA (own org's bounty), SA
- **Audit Log**: Yes (with before/after state)

**Request Body**:

```json
{
  "status": "APPROVED",
  "reviewerNote": "Great post! The product is clearly visible and properly tagged."
}
```

**Validation Rules**:
- `status`: required, one of `IN_REVIEW`, `NEEDS_MORE_INFO`, `APPROVED`, `REJECTED`
- `reviewerNote`: optional, 1-5000 characters

**Allowed Transitions**:
- `SUBMITTED` -> `IN_REVIEW`
- `SUBMITTED` -> `APPROVED` (skip review)
- `SUBMITTED` -> `REJECTED` (skip review)
- `SUBMITTED` -> `NEEDS_MORE_INFO`
- `IN_REVIEW` -> `APPROVED`
- `IN_REVIEW` -> `REJECTED`
- `IN_REVIEW` -> `NEEDS_MORE_INFO`
- `NEEDS_MORE_INFO` -> `IN_REVIEW` (re-evaluate)
- `NEEDS_MORE_INFO` -> `APPROVED`
- `NEEDS_MORE_INFO` -> `REJECTED`

**Note**: When a reviewer first opens/accesses a SUBMITTED submission via this endpoint, its status transitions to IN_REVIEW automatically (Story 6.3 AC).

**Response** `200 OK`:

```json
{
  "id": "submission-uuid-1",
  "status": "APPROVED",
  "reviewerNote": "Great post! The product is clearly visible and properly tagged.",
  "reviewedBy": {
    "id": "user-uuid-reviewer",
    "firstName": "John",
    "lastName": "Doe"
  },
  "payoutStatus": "NOT_PAID",
  "updatedAt": "2026-02-08T09:00:00.000Z"
}
```

**Error Responses**:
- `400` - Invalid status transition, validation error
- `403` - Not authorized
- `404` - Submission not found

---

### PATCH `/submissions/:id/payout`

Update the payout status of an approved submission. (Backlog: Story 6.4)

- **Access**: BA (own org's bounty), SA
- **Audit Log**: Yes

**Request Body**:

```json
{
  "payoutStatus": "PAID",
  "note": "Payment sent via bank transfer on 2026-02-09."
}
```

**Validation Rules**:
- `payoutStatus`: required, one of `NOT_PAID`, `PENDING`, `PAID`
- `note`: optional, 1-2000 characters
- Submission must be in `APPROVED` status

**Allowed Transitions**:
- `NOT_PAID` -> `PENDING`
- `NOT_PAID` -> `PAID`
- `PENDING` -> `PAID`
- `PENDING` -> `NOT_PAID` (reversal)

**Response** `200 OK`:

```json
{
  "id": "submission-uuid-1",
  "payoutStatus": "PAID",
  "updatedAt": "2026-02-09T10:00:00.000Z"
}
```

**Error Responses**:
- `400` - Invalid transition, submission not approved
- `403` - Not authorized
- `404` - Submission not found

---

## 6. File Endpoints (`/api/v1/files`)

### GET `/files/:id`

Serve an uploaded file. (Backlog: Story 10.5)

- **Access**: P (own submission's files), BA (own org's submission files), SA

**Response** `200 OK`: Binary file content with appropriate `Content-Type` header.

**Error Responses**:
- `403` - Not authorized to access this file
- `404` - File not found

---

## 7. Admin Endpoints (`/api/v1/admin`)

All admin endpoints require `SUPER_ADMIN` role unless otherwise noted.

### GET `/admin/users`

List all users with filtering. (Backlog: Story 7.2)

- **Access**: SA

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (standard pagination)
- `role` - Filter by UserRole
- `status` - Filter by UserStatus
- `search` - Search by email, firstName, lastName, or user ID

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "PARTICIPANT",
      "status": "ACTIVE",
      "emailVerified": true,
      "brand": null,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-02-07T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 350,
    "totalPages": 18
  }
}
```

---

### GET `/admin/users/:id`

Get detailed user information. (Backlog: Story 7.2)

- **Access**: SA

**Response** `200 OK`:

```json
{
  "id": "user-uuid-1",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "PARTICIPANT",
  "status": "ACTIVE",
  "emailVerified": true,
  "brand": null,
  "submissionCount": 12,
  "approvedSubmissionCount": 8,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-02-07T10:00:00.000Z"
}
```

**Error Responses**:
- `404` - User not found

---

### PATCH `/admin/users/:id/status`

Suspend or reinstate a user. (Backlog: Story 7.2)

- **Access**: SA
- **Audit Log**: Yes (mandatory, with reason)

**Request Body**:

```json
{
  "status": "SUSPENDED",
  "reason": "Violated terms of service by submitting fraudulent proof."
}
```

**Validation Rules**:
- `status`: required, one of `ACTIVE`, `SUSPENDED`
- `reason`: required, 1-2000 characters
- Cannot suspend self
- Cannot suspend another Super Admin

**Response** `200 OK`:

```json
{
  "id": "user-uuid-1",
  "status": "SUSPENDED",
  "updatedAt": "2026-02-07T15:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error, cannot suspend self or another SA
- `404` - User not found

---

### POST `/admin/users/:id/force-password-reset`

Force a password reset for a user (sends reset email). (Backlog: Story 7.2)

- **Access**: SA
- **Audit Log**: Yes (mandatory)

**Request Body**:

```json
{
  "reason": "User reported compromised account."
}
```

**Validation Rules**:
- `reason`: required, 1-2000 characters

**Response** `200 OK`:

```json
{
  "message": "Password reset email sent to user."
}
```

**Error Responses**:
- `400` - Reason is required
- `404` - User not found

---

### GET `/admin/brands`

List all brands. (Backlog: Story 7.3)

- **Access**: SA

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (standard pagination)
- `status` - Filter by BrandStatus
- `search` - Search by name or contactEmail

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "org-uuid-1",
      "name": "Acme Corp",
      "logo": "https://cdn.example.com/logos/acme.png",
      "contactEmail": "admin@acme.com",
      "status": "ACTIVE",
      "memberCount": 3,
      "bountyCount": 12,
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

---

### POST `/admin/brands`

Create a new brand and assign an owner (SA-initiated). (Backlog: Story 7.3)

- **Access**: SA
- **Audit Log**: Yes

**Request Body**:

```json
{
  "name": "New Corp",
  "contactEmail": "admin@newcorp.com",
  "logo": null,
  "ownerUserId": "user-uuid-business-admin"
}
```

**Validation Rules**:
- `name`: required, 1-200 characters
- `contactEmail`: required, valid email
- `logo`: optional, valid URL
- `ownerUserId`: required, must reference an existing user who is not already in an brand

**Side Effects**:
- User's role is changed to BUSINESS_ADMIN
- An BrandMember record is created with role OWNER

**Response** `201 Created`:

```json
{
  "id": "org-uuid-new",
  "name": "New Corp",
  "contactEmail": "admin@newcorp.com",
  "logo": null,
  "status": "ACTIVE",
  "owner": {
    "id": "user-uuid-business-admin",
    "email": "admin@newcorp.com",
    "firstName": "Alice",
    "lastName": "Smith"
  },
  "createdAt": "2026-02-07T10:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error, owner user not found, user already in an org
- `409` - Brand name already exists

---

### PATCH `/admin/brands/:id/status`

Suspend or reinstate an brand. (Backlog: Story 7.3)

- **Access**: SA
- **Audit Log**: Yes (mandatory, with reason)

**Request Body**:

```json
{
  "status": "SUSPENDED",
  "reason": "Brand violated platform policies."
}
```

**Validation Rules**:
- `status`: required, one of `ACTIVE`, `SUSPENDED`
- `reason`: required, 1-2000 characters

**Side Effect**: Suspending an brand automatically pauses all its LIVE bounties. Reinstating does NOT automatically re-publish paused bounties.

**Response** `200 OK`:

```json
{
  "id": "org-uuid-1",
  "status": "SUSPENDED",
  "updatedAt": "2026-02-07T16:00:00.000Z"
}
```

**Error Responses**:
- `400` - Validation error
- `404` - Brand not found

---

### PATCH `/admin/bounties/:id/override`

Override a bounty's status (with mandatory reason). (Backlog: Story 7.4)

- **Access**: SA
- **Audit Log**: Yes (mandatory, with before/after state and reason)

**Request Body**:

```json
{
  "status": "CLOSED",
  "reason": "Bounty violates platform terms. Closing by admin action."
}
```

**Validation Rules**:
- `status`: required, one of BountyStatus values
- `reason`: required, 1-5000 characters (mandatory for all SA overrides)

**Note**: SA overrides bypass normal transition rules. Any status can be set.

**Response** `200 OK`:

```json
{
  "id": "bounty-uuid-1",
  "status": "CLOSED",
  "updatedAt": "2026-02-07T17:00:00.000Z"
}
```

**Error Responses**:
- `400` - Reason is required, validation error
- `404` - Bounty not found

---

### PATCH `/admin/submissions/:id/override`

Override a submission's status (with mandatory reason). (Backlog: Story 7.4)

- **Access**: SA
- **Audit Log**: Yes (mandatory, with before/after state and reason)

**Request Body**:

```json
{
  "status": "APPROVED",
  "reason": "Participant provided valid proof via support ticket. Overriding previous rejection."
}
```

**Validation Rules**:
- `status`: required, one of SubmissionStatus values
- `reason`: required, 1-5000 characters (mandatory for all SA overrides)

**Note**: SA overrides bypass normal transition rules. Any status can be set.

**Response** `200 OK`:

```json
{
  "id": "submission-uuid-1",
  "status": "APPROVED",
  "reviewedBy": {
    "id": "user-uuid-superadmin",
    "firstName": "Admin",
    "lastName": "User"
  },
  "updatedAt": "2026-02-07T17:00:00.000Z"
}
```

**Error Responses**:
- `400` - Reason is required, validation error
- `404` - Submission not found

---

### GET `/admin/audit-logs`

View audit logs with filtering. (Backlog: Story 7.5)

- **Access**: SA

**Query Parameters**:
- `page`, `limit`, `sortBy` (default: `createdAt`), `sortOrder` (default: `desc`)
- `actorId` - Filter by actor user ID
- `action` - Filter by action string (e.g., `bounty.status_change`, `submission.review`)
- `entityType` - Filter by entity type (e.g., `User`, `Bounty`, `Submission`)
- `entityId` - Filter by specific entity ID
- `startDate` - Filter logs from this date (ISO 8601)
- `endDate` - Filter logs until this date (ISO 8601)

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "audit-uuid-1",
      "actorId": "user-uuid-superadmin",
      "actor": {
        "id": "user-uuid-superadmin",
        "email": "admin@socialbounty.com",
        "firstName": "Admin",
        "lastName": "User"
      },
      "actorRole": "SUPER_ADMIN",
      "action": "submission.override",
      "entityType": "Submission",
      "entityId": "submission-uuid-1",
      "beforeState": { "status": "REJECTED" },
      "afterState": { "status": "APPROVED" },
      "reason": "Participant provided valid proof via support ticket.",
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-02-07T17:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "totalPages": 63
  }
}
```

---

### GET `/admin/audit-logs/:id`

Get a single audit log entry with full detail. (Backlog: Story 7.5)

- **Access**: SA

**Response** `200 OK`:

```json
{
  "id": "audit-uuid-1",
  "actorId": "user-uuid-superadmin",
  "actor": {
    "id": "user-uuid-superadmin",
    "email": "admin@socialbounty.com",
    "firstName": "Admin",
    "lastName": "User"
  },
  "actorRole": "SUPER_ADMIN",
  "action": "submission.override",
  "entityType": "Submission",
  "entityId": "submission-uuid-1",
  "beforeState": {
    "status": "REJECTED",
    "reviewerNote": "Proof image is too blurry to verify.",
    "reviewedById": "user-uuid-reviewer"
  },
  "afterState": {
    "status": "APPROVED",
    "reviewerNote": null,
    "reviewedById": "user-uuid-superadmin"
  },
  "reason": "Participant provided valid proof via support ticket.",
  "ipAddress": "192.168.1.100",
  "createdAt": "2026-02-07T17:00:00.000Z"
}
```

**Error Responses**:
- `404` - Audit log entry not found

---

### GET `/admin/dashboard`

Get platform-wide counts and metrics for the Super Admin dashboard. (Backlog: Stories 7.1, 9.2)

- **Access**: SA

**Response** `200 OK`:

```json
{
  "users": {
    "total": 350,
    "active": 340,
    "suspended": 10,
    "byRole": {
      "PARTICIPANT": 320,
      "BUSINESS_ADMIN": 25,
      "SUPER_ADMIN": 5
    }
  },
  "brands": {
    "total": 25,
    "active": 23,
    "suspended": 2
  },
  "bounties": {
    "total": 150,
    "byStatus": {
      "DRAFT": 20,
      "LIVE": 80,
      "PAUSED": 15,
      "CLOSED": 35
    }
  },
  "submissions": {
    "total": 2500,
    "byStatus": {
      "SUBMITTED": 400,
      "IN_REVIEW": 150,
      "NEEDS_MORE_INFO": 50,
      "APPROVED": 1500,
      "REJECTED": 400
    },
    "byPayoutStatus": {
      "NOT_PAID": 500,
      "PENDING": 200,
      "PAID": 800
    }
  }
}
```

---

### GET `/admin/system-health`

Detailed system health for the troubleshooting panel. (Backlog: Story 7.6)

- **Access**: SA

**Response** `200 OK`:

```json
{
  "status": "ok",
  "timestamp": "2026-02-07T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 864000,
  "services": {
    "database": {
      "status": "ok",
      "responseTime": 5
    },
    "fileStorage": {
      "status": "ok",
      "responseTime": 12
    },
    "email": {
      "status": "ok",
      "responseTime": 45
    }
  },
  "memory": {
    "used": 128000000,
    "total": 512000000
  }
}
```

---

### GET `/admin/recent-errors`

View recent system errors from the error tracking integration. (Backlog: Story 7.6)

- **Access**: SA

**Query Parameters**:
- `page`, `limit` (standard pagination)
- `startDate` - Filter from this date (ISO 8601)
- `endDate` - Filter until this date (ISO 8601)

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "error-uuid-1",
      "timestamp": "2026-02-07T09:45:00.000Z",
      "message": "Connection timeout to database",
      "stackTrace": "Error: Connection timeout...",
      "endpoint": "GET /api/v1/bounties",
      "userId": "user-uuid-1",
      "severity": "error"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### GET `/admin/settings`

Get current global platform settings. (Backlog: Story 7.7, optional/lower priority)

- **Access**: SA

**Response** `200 OK`:

```json
{
  "signupsEnabled": true,
  "submissionsEnabled": true,
  "updatedAt": "2026-02-07T10:00:00.000Z",
  "updatedBy": {
    "id": "user-uuid-superadmin",
    "email": "admin@socialbounty.com"
  }
}
```

---

### PATCH `/admin/settings`

Update global platform settings. (Backlog: Story 7.7, optional/lower priority)

- **Access**: SA
- **Audit Log**: Yes

**Request Body** (all fields optional):

```json
{
  "signupsEnabled": false,
  "submissionsEnabled": false
}
```

**Response** `200 OK`:

```json
{
  "signupsEnabled": false,
  "submissionsEnabled": false,
  "updatedAt": "2026-02-07T18:00:00.000Z",
  "updatedBy": {
    "id": "user-uuid-superadmin",
    "email": "admin@socialbounty.com"
  }
}
```

**Error Responses**:
- `400` - Validation error

---

## 8. Business Admin Dashboard Endpoints (`/api/v1/business`)

### GET `/business/dashboard`

Get brand-level counts and metrics for the Business Admin dashboard. (Backlog: Stories 6.1, 9.1)

- **Access**: BA

**Response** `200 OK`:

```json
{
  "brand": {
    "id": "org-uuid-1",
    "name": "Acme Corp"
  },
  "bounties": {
    "total": 12,
    "byStatus": {
      "DRAFT": 2,
      "LIVE": 6,
      "PAUSED": 1,
      "CLOSED": 3
    }
  },
  "submissions": {
    "total": 250,
    "pendingReview": 45,
    "byStatus": {
      "SUBMITTED": 30,
      "IN_REVIEW": 15,
      "NEEDS_MORE_INFO": 5,
      "APPROVED": 150,
      "REJECTED": 50
    },
    "byPayoutStatus": {
      "NOT_PAID": 30,
      "PENDING": 20,
      "PAID": 100
    }
  }
}
```

---

## 9. Health Endpoint (`/api/v1/health`)

### GET `/health`

System health check. (Backlog: Story 10.1)

- **Access**: Public

**Response** `200 OK`:

```json
{
  "status": "ok",
  "timestamp": "2026-02-07T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "ok",
    "fileStorage": "ok"
  }
}
```

**Response** `503 Service Unavailable` (if a service is down):

```json
{
  "status": "degraded",
  "timestamp": "2026-02-07T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "ok",
    "fileStorage": "error"
  }
}
```

---

## Audit Log Action Reference

All actions that generate audit log entries:

| Action String | Trigger | Entity Type |
|---------------|---------|-------------|
| `user.password_change` | User changes own password | User |
| `user.password_reset` | Password reset via email | User |
| `user.status_change` | User suspended/reinstated | User |
| `user.force_password_reset` | SA forces password reset | User |
| `brand.create` | Brand created | Brand |
| `brand.update` | Brand details updated | Brand |
| `brand.status_change` | Brand suspended/reinstated | Brand |
| `brand.member_add` | Member added to brand | Brand |
| `brand.member_remove` | Member removed from brand | Brand |
| `bounty.create` | Bounty created | Bounty |
| `bounty.update` | Bounty fields updated | Bounty |
| `bounty.status_change` | Bounty status transition | Bounty |
| `bounty.delete` | Draft bounty soft-deleted | Bounty |
| `bounty.override` | SA overrides bounty status | Bounty |
| `submission.create` | Submission created | Submission |
| `submission.update` | Submission updated (Needs More Info flow) | Submission |
| `submission.review` | Submission reviewed (status change) | Submission |
| `submission.payout_change` | Payout status changed | Submission |
| `submission.override` | SA overrides submission status | Submission |
| `settings.update` | Global settings changed | Settings |

---

## RBAC Summary Matrix

| Endpoint | P | BA | SA |
|----------|---|----|----|
| **Auth** | | | |
| `POST /auth/signup` | Public | Public | Public |
| `POST /auth/login` | Public | Public | Public |
| `POST /auth/logout` | Y | Y | Y |
| `POST /auth/forgot-password` | Public | Public | Public |
| `POST /auth/reset-password` | Public | Public | Public |
| `POST /auth/verify-email` | Public | Public | Public |
| `POST /auth/resend-verification` | Y | Y | Y |
| `POST /auth/refresh` | Y | Y | Y |
| **Users** | | | |
| `GET /users/me` | Y | Y | Y |
| `PATCH /users/me` | Y | Y | Y |
| `POST /users/me/change-password` | Y | Y | Y |
| **Brands** | | | |
| `POST /brands` | Y | - | - |
| `GET /brands/:id` | - | Own | Y |
| `PATCH /brands/:id` | - | Owner | Y |
| `GET /brands/:id/members` | - | Own | Y |
| `POST /brands/:id/members` | - | Owner | Y |
| `DELETE /brands/:id/members/:userId` | - | Owner | Y |
| **Bounties** | | | |
| `GET /bounties` | LIVE | Own org | Y |
| `GET /bounties/:id` | LIVE | Own org | Y |
| `POST /bounties` | - | Y | Y |
| `PATCH /bounties/:id` | - | Own org | Y |
| `PATCH /bounties/:id/status` | - | Own org | Y |
| `DELETE /bounties/:id` | - | Own org | Y |
| **Submissions** | | | |
| `POST /bounties/:bountyId/submissions` | Y | - | - |
| `GET /submissions/me` | Y | - | - |
| `GET /bounties/:bountyId/submissions` | - | Own org | Y |
| `GET /submissions/:id` | Own | Own org | Y |
| `PATCH /submissions/:id` | Own* | - | - |
| `PATCH /submissions/:id/review` | - | Own org | Y |
| `PATCH /submissions/:id/payout` | - | Own org | Y |
| **Files** | | | |
| `GET /files/:id` | Own | Own org | Y |
| **Admin** | | | |
| `GET /admin/users` | - | - | Y |
| `GET /admin/users/:id` | - | - | Y |
| `PATCH /admin/users/:id/status` | - | - | Y |
| `POST /admin/users/:id/force-password-reset` | - | - | Y |
| `GET /admin/brands` | - | - | Y |
| `POST /admin/brands` | - | - | Y |
| `PATCH /admin/brands/:id/status` | - | - | Y |
| `PATCH /admin/bounties/:id/override` | - | - | Y |
| `PATCH /admin/submissions/:id/override` | - | - | Y |
| `GET /admin/audit-logs` | - | - | Y |
| `GET /admin/audit-logs/:id` | - | - | Y |
| `GET /admin/dashboard` | - | - | Y |
| `GET /admin/system-health` | - | - | Y |
| `GET /admin/recent-errors` | - | - | Y |
| `GET /admin/settings` | - | - | Y |
| `PATCH /admin/settings` | - | - | Y |
| **Business** | | | |
| `GET /business/dashboard` | - | Y | - |
| **Health** | | | |
| `GET /health` | Public | Public | Public |

**Legend**: Y = full access, Own = own resource only, Own* = own resource only + status constraint (NEEDS_MORE_INFO), Own org = own brand's resources, Owner = org owner only, LIVE = only LIVE status bounties, `-` = no access, Public = no auth required

---

## Assumptions

1. **Offset-based pagination**: Using page/limit for simplicity in MVP. Cursor-based pagination can be adopted later for large datasets.
2. **No bulk operations**: MVP does not include bulk approve/reject. Each submission is reviewed individually.
3. **Proof images uploaded with submission**: Proof images are uploaded as part of the submission creation/update (multipart form). A separate authenticated file-serving endpoint is provided for retrieval.
4. **One submission per user per bounty**: Per backlog assumption #9. "Needs More Info" allows the participant to update their existing submission (Story 5.4), not create a new one.
5. **Business Admin dashboard scoped to org**: BA dashboard metrics are automatically scoped to their brand.
6. **Audit log is append-only**: No endpoints to modify or delete audit logs.
7. **SA overrides are distinct from regular operations**: Override endpoints (`/admin/bounties/:id/override`, `/admin/submissions/:id/override`) always require a reason, bypass normal transition rules, and create separate audit actions.
8. **Refresh token rotation**: Login returns both access and refresh tokens. Refresh endpoint rotates the refresh token. Logout invalidates the refresh token.
9. **Brand creation by Participants**: Per Story 3.1, a Participant can create an brand which promotes them to Business Admin. SA can also create brands via the admin endpoint.
10. **Soft delete for bounties**: Draft bounty deletion is a soft delete per Story 4.6. The bounty is marked as deleted but not purged from the database.
11. **Live bounty limited editing**: Per Story 4.2, Live bounties can only have `eligibilityRules`, `proofRequirements`, `maxSubmissions`, and `endDate` edited.
12. **Global toggles are optional/lower priority**: Per backlog Story 7.7. The signup and submission endpoints check toggle state if implemented.
13. **GIF support**: Added image/gif to allowed file types per backlog Story 10.5.
14. **Ownership transfer out of scope**: Per Story 3.4, if an org owner needs to be removed, ownership must be transferred first. Ownership transfer is not in scope for MVP.
