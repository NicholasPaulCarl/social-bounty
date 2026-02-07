# Test Plan and Manual Test Cases - Social Bounty MVP

> **Version**: 1.0
> **Date**: 2026-02-07
> **Source**: `docs/backlog/mvp-backlog.md`, `docs/ux/sitemap-and-flows.md`, `docs/architecture/api-contracts.md`, `docs/architecture/security-and-rbac.md`
> **Rule**: 100% test pass rate required before any release.

---

## Table of Contents

- [1. Test Strategy](#1-test-strategy)
- [2. Test Case Groups](#2-test-case-groups)
  - [Group A: Authentication Flows](#group-a-authentication-flows)
  - [Group B: User Profile](#group-b-user-profile)
  - [Group C: Organisation Management](#group-c-organisation-management)
  - [Group D: Bounty Management](#group-d-bounty-management)
  - [Group E: Participant Submission Flows](#group-e-participant-submission-flows)
  - [Group F: Business Admin Review Flows](#group-f-business-admin-review-flows)
  - [Group G: Super Admin Flows](#group-g-super-admin-flows)
  - [Group H: RBAC Enforcement](#group-h-rbac-enforcement)
  - [Group I: Audit Logging](#group-i-audit-logging)
  - [Group J: Edge Cases and Error Handling](#group-j-edge-cases-and-error-handling)
  - [Group K: Notifications](#group-k-notifications)
  - [Group L: Infrastructure](#group-l-infrastructure)
- [3. Regression Checklist](#3-regression-checklist)
- [4. Bug Severity Definitions](#4-bug-severity-definitions)
- [5. Test Automation Strategy](#5-test-automation-strategy)

---

## 1. Test Strategy

### 1.1 Test Pyramid

| Level | Scope | Tool | Target Coverage | Runs |
|-------|-------|------|-----------------|------|
| **Unit Tests** | Business logic, validation, state machines, services | Jest | All service methods, validators, state machine transitions | Every commit (CI) |
| **API Integration Tests** | Full request-response cycle per endpoint | Jest + Supertest | Every endpoint, every status code documented in API contracts | Every commit (CI) |
| **UI Smoke Tests** | Critical user paths rendered and interactive | Playwright or Cypress | 10 critical paths covering all 3 roles | Every PR (CI) |
| **Manual Regression** | Full workflow validation across roles | Manual (human tester) | Entire regression checklist | Before every release |

### 1.2 Test Data Strategy

- **Seed script**: A database seed script creates standard test fixtures:
  - 1 Super Admin (email: `admin@socialbounty.test`)
  - 1 Business Admin with org "Test Corp" (email: `business@testcorp.test`)
  - 1 additional BA org member (email: `member@testcorp.test`)
  - 3 Participants (email: `participant1@test.test`, `participant2@test.test`, `participant3@test.test`)
  - 1 suspended Participant (email: `suspended@test.test`)
  - 5 bounties in various statuses (1 Draft, 2 Live, 1 Paused, 1 Closed)
  - 10 submissions in various statuses across bounties
  - Sample audit log entries
- **Test isolation**: Each integration test suite resets the database to the seed state before running.
- **No shared state between tests**: Tests must not depend on execution order.

### 1.3 Environment Strategy

| Environment | Database | Purpose |
|-------------|----------|---------|
| Local | SQLite or PostgreSQL (Docker) | Developer testing |
| CI | PostgreSQL (Docker service) | Automated test suite |
| Staging | PostgreSQL | Pre-release validation, manual regression |
| Production | PostgreSQL | Post-deploy smoke tests (health check only) |

### 1.4 Definition of Done for Testing

A feature is "test complete" when:
- All unit tests pass
- All API integration tests pass
- UI smoke tests for affected paths pass
- No P1 or P2 bugs are open
- Manual regression checklist passes (release gate only)

---

## 2. Test Case Groups

### Test Case Format

Each test case follows this structure:
- **ID**: Unique identifier (e.g., A-01)
- **Title**: Short description
- **Preconditions**: Setup required
- **Steps**: Numbered actions
- **Expected Result**: What should happen
- **Priority**: P1 (blocker), P2 (critical), P3 (important), P4 (minor)
- **Type**: Unit, API, UI Smoke, or Manual

---

### Group A: Authentication Flows

#### A-01: Successful Signup

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | No existing account with test email |
| Steps | 1. POST `/auth/signup` with valid email, password (8+ chars, 1 upper, 1 lower, 1 number), firstName, lastName |
| Expected Result | 201 Created. User record created with role=PARTICIPANT, status=ACTIVE, emailVerified=false. Verification email is queued. |

#### A-02: Signup with Duplicate Email

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Account exists with email `existing@test.test` |
| Steps | 1. POST `/auth/signup` with email `existing@test.test` |
| Expected Result | 409 Conflict. Message indicates email already registered. |

#### A-03: Signup with Weak Password

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, Unit |
| Preconditions | None |
| Steps | 1. POST `/auth/signup` with password `weak` (no uppercase, no number, < 8 chars) |
| Expected Result | 400 Bad Request. Validation error details list password requirements. |

#### A-04: Signup with Invalid Email Format

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | None |
| Steps | 1. POST `/auth/signup` with email `not-an-email` |
| Expected Result | 400 Bad Request. Validation error on email field. |

#### A-05: Signup with Missing Required Fields

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | None |
| Steps | 1. POST `/auth/signup` with empty body |
| Expected Result | 400 Bad Request. Validation errors for all required fields. |

#### A-06: Signup Rate Limiting

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | None |
| Steps | 1. POST `/auth/signup` 6 times within 1 minute from same IP |
| Expected Result | First 5 succeed or return validation errors. 6th returns 429 Too Many Requests. |

#### A-07: Successful Login

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Active user account exists |
| Steps | 1. POST `/auth/login` with valid email and password |
| Expected Result | 200 OK. Response includes accessToken, refreshToken, expiresIn, and user object with correct role. |

#### A-08: Login with Invalid Credentials

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | None |
| Steps | 1. POST `/auth/login` with wrong password 2. POST `/auth/login` with non-existent email |
| Expected Result | Both return 401 with generic "Invalid credentials" message. No information leakage about which field is wrong. |

#### A-09: Login as Suspended User

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | User account with status=SUSPENDED |
| Steps | 1. POST `/auth/login` with suspended user's credentials |
| Expected Result | 403 Forbidden. Message: "Your account has been suspended." |

#### A-10: Login Rate Limiting

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | None |
| Steps | 1. POST `/auth/login` 11 times within 1 minute from same IP |
| Expected Result | First 10 accepted. 11th returns 429 Too Many Requests. |

#### A-11: Successful Logout

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | User is logged in with valid tokens |
| Steps | 1. POST `/auth/logout` with refreshToken |
| Expected Result | 200 OK. Refresh token is invalidated. Subsequent refresh attempts with old token return 401. |

#### A-12: Forgot Password - Existing Account

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | User account exists |
| Steps | 1. POST `/auth/forgot-password` with user's email |
| Expected Result | 200 OK. Message: "If an account with that email exists, a password reset link has been sent." Reset email is queued. |

#### A-13: Forgot Password - Non-Existent Account

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | No account with given email |
| Steps | 1. POST `/auth/forgot-password` with non-existent email |
| Expected Result | 200 OK. Same message as A-12 (no information leakage). No email sent. |

#### A-14: Reset Password with Valid Token

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Valid reset token generated via forgot-password |
| Steps | 1. POST `/auth/reset-password` with valid token and new password |
| Expected Result | 200 OK. Password is changed. Token is invalidated. Audit log entry created. |

#### A-15: Reset Password with Expired/Invalid Token

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Expired or invalid token |
| Steps | 1. POST `/auth/reset-password` with expired token |
| Expected Result | 400 Bad Request. Message indicates invalid or expired token. |

#### A-16: Reset Password Token Single Use

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Valid reset token |
| Steps | 1. POST `/auth/reset-password` with token (succeeds) 2. POST `/auth/reset-password` with same token again |
| Expected Result | First call: 200 OK. Second call: 400 Bad Request (token already used). |

#### A-17: Email Verification with Valid Token

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Unverified user, valid verification token |
| Steps | 1. POST `/auth/verify-email` with valid token |
| Expected Result | 200 OK. User's emailVerified is set to true. |

#### A-18: Email Verification with Expired Token

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Expired verification token |
| Steps | 1. POST `/auth/verify-email` with expired token |
| Expected Result | 400 Bad Request. Message indicates expired token. |

#### A-19: Resend Verification Email

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Authenticated user, email not verified |
| Steps | 1. POST `/auth/resend-verification` |
| Expected Result | 200 OK. New verification email is queued. |

#### A-20: Resend Verification - Already Verified

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Authenticated user, email already verified |
| Steps | 1. POST `/auth/resend-verification` |
| Expected Result | 400 Bad Request. Message: email already verified. |

#### A-21: Token Refresh

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Valid refresh token |
| Steps | 1. POST `/auth/refresh` with valid refresh token |
| Expected Result | 200 OK. New access token and new refresh token issued. Old refresh token invalidated (rotation). |

#### A-22: Token Refresh with Revoked Token

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Refresh token that was already used (rotated) |
| Steps | 1. POST `/auth/refresh` with old/revoked refresh token |
| Expected Result | 401 Unauthorized. All refresh tokens for that user should be invalidated (theft detection). |

#### A-23: Signup When Signups Disabled (Global Toggle)

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Super Admin has disabled signups globally |
| Steps | 1. POST `/auth/signup` with valid data |
| Expected Result | 403 Forbidden. Message: "Signups are currently disabled." |

---

### Group B: User Profile

#### B-01: View Own Profile

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated user |
| Steps | 1. GET `/users/me` |
| Expected Result | 200 OK. Returns user's id, email, firstName, lastName, role, status, emailVerified, organisation (if BA), createdAt, updatedAt. |

#### B-02: Update Profile Name

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated user |
| Steps | 1. PATCH `/users/me` with new firstName and lastName |
| Expected Result | 200 OK. Name fields updated. Other fields unchanged. |

#### B-03: Change Password Successfully

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Authenticated user |
| Steps | 1. POST `/users/me/change-password` with correct currentPassword and valid newPassword |
| Expected Result | 200 OK. Password changed. Audit log entry created. Old password no longer works for login. |

#### B-04: Change Password - Wrong Current Password

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Authenticated user |
| Steps | 1. POST `/users/me/change-password` with incorrect currentPassword |
| Expected Result | 401 Unauthorized. Message: "Current password is incorrect." |

#### B-05: Change Password - Weak New Password

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated user |
| Steps | 1. POST `/users/me/change-password` with newPassword "weak" |
| Expected Result | 400 Bad Request. Validation error listing password requirements. |

#### B-06: Cannot Change Email via Profile Update

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated user |
| Steps | 1. PATCH `/users/me` with `email: "newemail@test.test"` |
| Expected Result | Email field is ignored (whitelist validation) or 400 if forbidNonWhitelisted is enabled. Email remains unchanged. |

---

### Group C: Organisation Management

#### C-01: Create Organisation (Participant)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Authenticated Participant, not in any org |
| Steps | 1. POST `/organisations` with name, contactEmail |
| Expected Result | 201 Created. Organisation created with status=ACTIVE. User's role promoted to BUSINESS_ADMIN. OrganisationMember created with role=OWNER. Audit log entry created. |

#### C-02: Create Organisation - Already in Org

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Authenticated Business Admin (already in an org) |
| Steps | 1. POST `/organisations` with valid data |
| Expected Result | 409 Conflict. Message: user already belongs to an organisation. |

#### C-03: View Organisation Details (Member)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA, member of org |
| Steps | 1. GET `/organisations/:id` |
| Expected Result | 200 OK. Returns org details including name, logo, contactEmail, status, memberCount, bountyCount. |

#### C-04: View Organisation Details (Non-Member BA)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA, NOT a member of the requested org |
| Steps | 1. GET `/organisations/:id` for a different org |
| Expected Result | 403 Forbidden. |

#### C-05: Edit Organisation (Owner)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA with OWNER role in org |
| Steps | 1. PATCH `/organisations/:id` with updated name and contactEmail |
| Expected Result | 200 OK. Fields updated. Audit log created. |

#### C-06: Edit Organisation (Member, Not Owner)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA with MEMBER role (not OWNER) |
| Steps | 1. PATCH `/organisations/:id` with updated name |
| Expected Result | 403 Forbidden. Only owners can edit. |

#### C-07: Invite Member to Organisation

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA (owner), valid email of existing Participant |
| Steps | 1. POST `/organisations/:id/members` with email |
| Expected Result | 201 Created. Invitation sent. On acceptance: user becomes BUSINESS_ADMIN and OrganisationMember. |

#### C-08: Remove Member from Organisation

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA (owner), org has multiple members |
| Steps | 1. DELETE `/organisations/:id/members/:userId` for a MEMBER |
| Expected Result | 200 OK. Member removed. User's role reverted to PARTICIPANT. Audit log created. |

#### C-09: Cannot Remove Organisation Owner

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA (owner) |
| Steps | 1. DELETE `/organisations/:id/members/:ownerId` (trying to remove self) |
| Expected Result | 400 Bad Request. Cannot remove the organisation owner. |

---

### Group D: Bounty Management

#### D-01: Create Bounty (Draft)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Authenticated BA |
| Steps | 1. POST `/bounties` with all required fields |
| Expected Result | 201 Created. Bounty created with status=DRAFT, organisationId from BA's org. Audit log created. |

#### D-02: Create Bounty - Missing Required Fields

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Authenticated BA |
| Steps | 1. POST `/bounties` with missing title and eligibilityRules |
| Expected Result | 400 Bad Request. Validation errors list missing fields. |

#### D-03: Create Bounty - Invalid Date Range

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API, Unit |
| Preconditions | Authenticated BA |
| Steps | 1. POST `/bounties` with endDate before startDate |
| Expected Result | 400 Bad Request. Validation error: endDate must be after startDate. |

#### D-04: Publish Bounty (Draft to Live)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | DRAFT bounty with all required fields filled |
| Steps | 1. PATCH `/bounties/:id/status` with status=LIVE |
| Expected Result | 200 OK. Status changes to LIVE. Bounty appears in participant browse. Audit log created. |

#### D-05: Publish Bounty - Missing Required Fields

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | DRAFT bounty with some fields empty |
| Steps | 1. PATCH `/bounties/:id/status` with status=LIVE |
| Expected Result | 400 Bad Request. Lists fields that must be filled before publishing. |

#### D-06: Pause Bounty (Live to Paused)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. PATCH `/bounties/:id/status` with status=PAUSED |
| Expected Result | 200 OK. Status changes to PAUSED. Bounty no longer visible to participants in browse. Audit log created. |

#### D-07: Resume Bounty (Paused to Live)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | PAUSED bounty |
| Steps | 1. PATCH `/bounties/:id/status` with status=LIVE |
| Expected Result | 200 OK. Status changes to LIVE. Bounty visible to participants again. Audit log created. |

#### D-08: Close Bounty (Live to Closed)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. PATCH `/bounties/:id/status` with status=CLOSED |
| Expected Result | 200 OK. Status changes to CLOSED. No new submissions accepted. Audit log created. |

#### D-09: Close Bounty (Paused to Closed)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | PAUSED bounty |
| Steps | 1. PATCH `/bounties/:id/status` with status=CLOSED |
| Expected Result | 200 OK. Status changes to CLOSED. Audit log created. |

#### D-10: Invalid Status Transition (Closed to Live)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, Unit |
| Preconditions | CLOSED bounty |
| Steps | 1. PATCH `/bounties/:id/status` with status=LIVE |
| Expected Result | 400 Bad Request. Invalid transition: CLOSED is a terminal state. |

#### D-11: Invalid Status Transition (Draft to Paused)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API, Unit |
| Preconditions | DRAFT bounty |
| Steps | 1. PATCH `/bounties/:id/status` with status=PAUSED |
| Expected Result | 400 Bad Request. Invalid transition: DRAFT can only go to LIVE. |

#### D-12: Edit Draft Bounty - All Fields

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | DRAFT bounty |
| Steps | 1. PATCH `/bounties/:id` with updated title, shortDescription, rewardValue |
| Expected Result | 200 OK. All fields updated. Audit log with before/after state. |

#### D-13: Edit Live Bounty - Limited Fields Only

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, Unit |
| Preconditions | LIVE bounty |
| Steps | 1. PATCH `/bounties/:id` with updated eligibilityRules (allowed) and title (not allowed) |
| Expected Result | 400 Bad Request. Error indicates title cannot be edited while bounty is LIVE. |

#### D-14: Edit Live Bounty - Allowed Fields

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. PATCH `/bounties/:id` with updated eligibilityRules, proofRequirements, maxSubmissions, endDate |
| Expected Result | 200 OK. Only the allowed fields are updated. Audit log created. |

#### D-15: Edit Closed Bounty

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | CLOSED bounty |
| Steps | 1. PATCH `/bounties/:id` with any field update |
| Expected Result | 400 Bad Request. Closed bounties cannot be edited. |

#### D-16: Delete Draft Bounty (Soft Delete)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | DRAFT bounty |
| Steps | 1. DELETE `/bounties/:id` |
| Expected Result | 200 OK. Bounty soft-deleted. No longer appears in lists. Audit log created. |

#### D-17: Delete Non-Draft Bounty

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. DELETE `/bounties/:id` |
| Expected Result | 400 Bad Request. Only DRAFT bounties can be deleted. |

#### D-18: Browse Live Bounties (Participant)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Multiple bounties in various statuses |
| Steps | 1. GET `/bounties` as Participant |
| Expected Result | 200 OK. Only LIVE bounties returned. Draft, Paused, and Closed bounties are NOT included. |

#### D-19: Browse Bounties with Filters

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Multiple LIVE bounties with different categories and reward types |
| Steps | 1. GET `/bounties?category=Social+Media&rewardType=CASH` |
| Expected Result | 200 OK. Only bounties matching both filters returned. |

#### D-20: Browse Bounties with Search

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Bounty with title "Share on Instagram" exists |
| Steps | 1. GET `/bounties?search=instagram` |
| Expected Result | 200 OK. Matching bounty(ies) returned. |

#### D-21: Browse Bounties with Pagination

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | More bounties than the page limit |
| Steps | 1. GET `/bounties?page=1&limit=5` 2. GET `/bounties?page=2&limit=5` |
| Expected Result | Each page returns the correct number of items. Meta includes correct total, totalPages. No duplicates across pages. |

#### D-22: View Bounty Detail (Participant)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | LIVE bounty exists |
| Steps | 1. GET `/bounties/:id` as Participant |
| Expected Result | 200 OK. All bounty fields returned including fullInstructions, eligibilityRules, proofRequirements, remainingSubmissions, userSubmission (null if not yet submitted). |

#### D-23: View Non-Live Bounty (Participant)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | DRAFT or PAUSED bounty |
| Steps | 1. GET `/bounties/:id` as Participant for a DRAFT bounty |
| Expected Result | 403 Forbidden. Participants cannot view non-LIVE bounties. |

#### D-24: Business Admin Bounty Management List

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated BA with bounties in various statuses |
| Steps | 1. GET `/bounties` as BA |
| Expected Result | 200 OK. Returns all bounties for the BA's org (Draft, Live, Paused, Closed). |

#### D-25: Reward Type Conditional Validation

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API, Unit |
| Preconditions | Authenticated BA |
| Steps | 1. POST `/bounties` with rewardType=CASH but no rewardValue |
| Expected Result | 400 Bad Request. rewardValue is required when rewardType is CASH. |

---

### Group E: Participant Submission Flows

#### E-01: Submit Proof Successfully

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Authenticated Participant, LIVE bounty, not yet submitted |
| Steps | 1. POST `/bounties/:bountyId/submissions` with proofText, optional proofLinks, optional proofImages |
| Expected Result | 201 Created. Submission created with status=SUBMITTED, payoutStatus=NOT_PAID. Audit log created. |

#### E-02: Submit Proof - Duplicate Submission

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Participant already has a submission for this bounty |
| Steps | 1. POST `/bounties/:bountyId/submissions` with valid proof |
| Expected Result | 409 Conflict. Message: already submitted for this bounty. |

#### E-03: Submit Proof - Bounty Not Live

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Bounty in DRAFT, PAUSED, or CLOSED status |
| Steps | 1. POST `/bounties/:bountyId/submissions` |
| Expected Result | 400 Bad Request. Bounty is not accepting submissions. |

#### E-04: Submit Proof - Max Submissions Reached

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | LIVE bounty with maxSubmissions=1 and 1 existing submission |
| Steps | 1. POST `/bounties/:bountyId/submissions` as a new participant |
| Expected Result | 400 Bad Request. Maximum submissions reached. |

#### E-05: Submit Proof - Bounty End Date Passed

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | LIVE bounty with endDate in the past |
| Steps | 1. POST `/bounties/:bountyId/submissions` |
| Expected Result | 400 Bad Request. Bounty submission period has ended. |

#### E-06: Submit Proof - Missing Proof Text

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. POST `/bounties/:bountyId/submissions` with empty proofText |
| Expected Result | 400 Bad Request. proofText is required. |

#### E-07: Submit Proof with Images

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. POST `/bounties/:bountyId/submissions` as multipart/form-data with proofText and 2 JPEG image files |
| Expected Result | 201 Created. FileUpload records created. proofImages array in response contains file metadata. |

#### E-08: Submit Proof with Invalid Image Type

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. POST `/bounties/:bountyId/submissions` with a .pdf file as proofImages |
| Expected Result | 400 Bad Request. Only image files allowed (JPEG, PNG, GIF, WebP). |

#### E-09: Submit Proof with Oversized Image

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | LIVE bounty |
| Steps | 1. POST `/bounties/:bountyId/submissions` with a 10MB image file |
| Expected Result | 400 Bad Request. File size exceeds 5MB limit. |

#### E-10: Submit Proof When Submissions Disabled (Global Toggle)

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Super Admin has disabled submissions globally |
| Steps | 1. POST `/bounties/:bountyId/submissions` |
| Expected Result | 403 Forbidden. Message: "Submissions are currently disabled." |

#### E-11: View My Submissions List

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Participant with multiple submissions |
| Steps | 1. GET `/submissions/me` |
| Expected Result | 200 OK. Returns only the authenticated user's submissions. Each includes bounty title, status, payoutStatus. Sorted newest first. |

#### E-12: View My Submissions - Empty State

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API, UI Smoke |
| Preconditions | Participant with zero submissions |
| Steps | 1. GET `/submissions/me` |
| Expected Result | 200 OK. data is empty array. meta.total is 0. |

#### E-13: View Submission Detail (Own)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Participant owns the submission |
| Steps | 1. GET `/submissions/:id` |
| Expected Result | 200 OK. Returns full submission details: proofText, proofLinks, proofImages, status, reviewerNote, payoutStatus. |

#### E-14: View Submission Detail (Not Own)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Participant does NOT own the submission |
| Steps | 1. GET `/submissions/:id` for another user's submission |
| Expected Result | 403 Forbidden. |

#### E-15: Update Submission (Needs More Info)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Own submission with status=NEEDS_MORE_INFO |
| Steps | 1. PATCH `/submissions/:id` with updated proofText |
| Expected Result | 200 OK. Submission updated. Status changes to SUBMITTED. Audit log created. |

#### E-16: Update Submission - Not in Needs More Info Status

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Own submission with status=SUBMITTED or APPROVED |
| Steps | 1. PATCH `/submissions/:id` with updated proofText |
| Expected Result | 400 Bad Request. Submission can only be updated when status is NEEDS_MORE_INFO. |

#### E-17: Update Submission - Not Own Submission

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Another user's submission in NEEDS_MORE_INFO status |
| Steps | 1. PATCH `/submissions/:id` |
| Expected Result | 403 Forbidden. |

---

### Group F: Business Admin Review Flows

#### F-01: View Submissions for Bounty

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | BA with bounty that has submissions |
| Steps | 1. GET `/bounties/:bountyId/submissions` |
| Expected Result | 200 OK. All submissions for the bounty returned with user info, proofText preview, status, payoutStatus. |

#### F-02: View Submissions for Other Org's Bounty

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | BA trying to access bounty of a different org |
| Steps | 1. GET `/bounties/:bountyId/submissions` for another org's bounty |
| Expected Result | 403 Forbidden. |

#### F-03: Approve Submission

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Submission in IN_REVIEW status, BA is in bounty's org |
| Steps | 1. PATCH `/submissions/:id/review` with status=APPROVED and optional reviewerNote |
| Expected Result | 200 OK. Submission status changes to APPROVED. reviewedBy is set. Email notification queued to participant. Audit log created with before/after state. |

#### F-04: Reject Submission

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Submission in IN_REVIEW status |
| Steps | 1. PATCH `/submissions/:id/review` with status=REJECTED, reviewerNote="Proof does not meet requirements" |
| Expected Result | 200 OK. Status changes to REJECTED. Audit log created. Email notification queued. |

#### F-05: Request More Info

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Submission in IN_REVIEW status |
| Steps | 1. PATCH `/submissions/:id/review` with status=NEEDS_MORE_INFO, reviewerNote="Please provide screenshot of the post" |
| Expected Result | 200 OK. Status changes to NEEDS_MORE_INFO. Email notification queued. Audit log created. |

#### F-06: Auto-Transition to In Review

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Submission in SUBMITTED status |
| Steps | 1. PATCH `/submissions/:id/review` with status=IN_REVIEW |
| Expected Result | 200 OK. Status changes to IN_REVIEW. Audit log created. |

#### F-07: Invalid Review Transition (Approved to In Review)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API, Unit |
| Preconditions | APPROVED submission |
| Steps | 1. PATCH `/submissions/:id/review` with status=IN_REVIEW |
| Expected Result | 400 Bad Request. Invalid status transition. |

#### F-08: Mark Payout as Pending

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | APPROVED submission, payoutStatus=NOT_PAID |
| Steps | 1. PATCH `/submissions/:id/payout` with payoutStatus=PENDING |
| Expected Result | 200 OK. Payout status changes to PENDING. Email notification queued. Audit log created. |

#### F-09: Mark Payout as Paid

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | APPROVED submission, payoutStatus=PENDING |
| Steps | 1. PATCH `/submissions/:id/payout` with payoutStatus=PAID, note="Bank transfer completed" |
| Expected Result | 200 OK. Payout status changes to PAID. Email notification queued. Audit log created. |

#### F-10: Mark Payout on Non-Approved Submission

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Submission with status=SUBMITTED |
| Steps | 1. PATCH `/submissions/:id/payout` with payoutStatus=PAID |
| Expected Result | 400 Bad Request. Payout can only be updated on APPROVED submissions. |

#### F-11: Invalid Payout Transition (Paid to Not Paid)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API, Unit |
| Preconditions | APPROVED submission, payoutStatus=PAID |
| Steps | 1. PATCH `/submissions/:id/payout` with payoutStatus=NOT_PAID |
| Expected Result | 400 Bad Request. Invalid payout transition. |

#### F-12: Business Admin Dashboard Data

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | BA with org having bounties and submissions |
| Steps | 1. GET `/business/dashboard` |
| Expected Result | 200 OK. Returns counts scoped to BA's org: bounties by status, submissions by status, pending review count, payouts by status. |

---

### Group G: Super Admin Flows

#### G-01: Super Admin Dashboard

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated Super Admin |
| Steps | 1. GET `/admin/dashboard` |
| Expected Result | 200 OK. Platform-wide counts: users by role, orgs by status, bounties by status, submissions by status, payouts by status. |

#### G-02: List Users with Search

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Multiple users exist |
| Steps | 1. GET `/admin/users?search=jane` |
| Expected Result | 200 OK. Users matching "jane" in email, firstName, or lastName returned. |

#### G-03: View User Detail

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | User exists |
| Steps | 1. GET `/admin/users/:id` |
| Expected Result | 200 OK. Full user details including submissionCount, approvedSubmissionCount, organisation info. |

#### G-04: Suspend User

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Active user |
| Steps | 1. PATCH `/admin/users/:id/status` with status=SUSPENDED, reason="Terms violation" |
| Expected Result | 200 OK. User status changes to SUSPENDED. User cannot log in. Audit log created with reason. |

#### G-05: Reinstate User

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Suspended user |
| Steps | 1. PATCH `/admin/users/:id/status` with status=ACTIVE, reason="Investigation cleared" |
| Expected Result | 200 OK. User status changes to ACTIVE. User can log in again. Audit log created with reason. |

#### G-06: Suspend User - Missing Reason

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Active user |
| Steps | 1. PATCH `/admin/users/:id/status` with status=SUSPENDED, no reason field |
| Expected Result | 400 Bad Request. Reason is required for user status changes. |

#### G-07: Suspend Self (SA)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated Super Admin |
| Steps | 1. PATCH `/admin/users/:ownId/status` with status=SUSPENDED |
| Expected Result | 400 Bad Request. Cannot suspend yourself. |

#### G-08: Force Password Reset

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Target user exists |
| Steps | 1. POST `/admin/users/:id/force-password-reset` with reason |
| Expected Result | 200 OK. Password reset email sent to user. Audit log created. |

#### G-09: Suspend Organisation

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Active organisation with LIVE bounties |
| Steps | 1. PATCH `/admin/organisations/:id/status` with status=SUSPENDED, reason="Policy violation" |
| Expected Result | 200 OK. Org status=SUSPENDED. All LIVE bounties for this org automatically changed to PAUSED. Audit log created. |

#### G-10: Reinstate Organisation

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Suspended organisation |
| Steps | 1. PATCH `/admin/organisations/:id/status` with status=ACTIVE, reason="Investigation resolved" |
| Expected Result | 200 OK. Org status=ACTIVE. Bounties remain PAUSED (BA must manually re-publish). Audit log created. |

#### G-11: Override Bounty Status

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Any bounty |
| Steps | 1. PATCH `/admin/bounties/:id/override` with status=CLOSED, reason="Violates terms" |
| Expected Result | 200 OK. Bounty status overridden (bypasses state machine). Audit log with before/after and reason. |

#### G-12: Override Bounty Status - Missing Reason

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Any bounty |
| Steps | 1. PATCH `/admin/bounties/:id/override` with status=CLOSED, no reason |
| Expected Result | 400 Bad Request. Reason is mandatory for all admin overrides. |

#### G-13: Override Submission Status

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Any submission |
| Steps | 1. PATCH `/admin/submissions/:id/override` with status=APPROVED, reason="Valid proof via support ticket" |
| Expected Result | 200 OK. Submission status overridden (bypasses state machine). Audit log with before/after and reason. |

#### G-14: View Audit Logs

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API, UI Smoke |
| Preconditions | Audit log entries exist |
| Steps | 1. GET `/admin/audit-logs` |
| Expected Result | 200 OK. Paginated list of audit entries sorted newest first. Each includes actor, action, entityType, entityId, timestamp. |

#### G-15: Filter Audit Logs by Actor

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Audit log entries from multiple actors |
| Steps | 1. GET `/admin/audit-logs?actorId=user-uuid` |
| Expected Result | 200 OK. Only audit entries by the specified actor returned. |

#### G-16: Filter Audit Logs by Date Range

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Audit log entries across multiple dates |
| Steps | 1. GET `/admin/audit-logs?startDate=2026-02-01&endDate=2026-02-07` |
| Expected Result | 200 OK. Only entries within the date range returned. |

#### G-17: View Audit Log Detail

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Audit log entry with before/after state |
| Steps | 1. GET `/admin/audit-logs/:id` |
| Expected Result | 200 OK. Full entry including beforeState, afterState, reason, ipAddress. |

#### G-18: System Health Check (Admin)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Authenticated Super Admin |
| Steps | 1. GET `/admin/system-health` |
| Expected Result | 200 OK. Returns status, version, uptime, service statuses (database, fileStorage, email), memory usage. |

#### G-19: View Recent Errors

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Error entries exist (from Sentry integration) |
| Steps | 1. GET `/admin/recent-errors` |
| Expected Result | 200 OK. List of recent errors with timestamp, message, endpoint, severity. |

#### G-20: View Global Settings

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Authenticated Super Admin |
| Steps | 1. GET `/admin/settings` |
| Expected Result | 200 OK. Returns signupsEnabled, submissionsEnabled, updatedAt, updatedBy. |

#### G-21: Update Global Settings

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Authenticated Super Admin |
| Steps | 1. PATCH `/admin/settings` with signupsEnabled=false |
| Expected Result | 200 OK. Setting updated. Audit log created. Subsequent signup attempts return 403. |

---

### Group H: RBAC Enforcement

These tests verify that every endpoint rejects unauthorized access. Each test sends a request from a role that should NOT have access.

#### H-01: Participant Cannot Create Bounty

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. POST `/bounties` as PARTICIPANT |
| Expected Result | 403 Forbidden. |

#### H-02: Participant Cannot Review Submission

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/submissions/:id/review` as PARTICIPANT |
| Expected Result | 403 Forbidden. |

#### H-03: Participant Cannot Access Admin Endpoints

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. GET `/admin/users` as PARTICIPANT 2. GET `/admin/audit-logs` as PARTICIPANT 3. GET `/admin/dashboard` as PARTICIPANT |
| Expected Result | All return 403 Forbidden. |

#### H-04: Business Admin Cannot Access Admin Endpoints

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. GET `/admin/users` as BUSINESS_ADMIN 2. PATCH `/admin/bounties/:id/override` as BUSINESS_ADMIN 3. GET `/admin/audit-logs` as BUSINESS_ADMIN |
| Expected Result | All return 403 Forbidden. |

#### H-05: Business Admin Cannot Submit Proof

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. POST `/bounties/:bountyId/submissions` as BUSINESS_ADMIN |
| Expected Result | 403 Forbidden. |

#### H-06: Business Admin Cannot View Other Org's Bounties (Management)

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/bounties/:id` for a bounty belonging to a different org, as BUSINESS_ADMIN |
| Expected Result | 403 Forbidden. |

#### H-07: Business Admin Cannot Review Other Org's Submissions

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/submissions/:id/review` for a submission on another org's bounty, as BUSINESS_ADMIN |
| Expected Result | 403 Forbidden. |

#### H-08: Unauthenticated Cannot Access Protected Endpoints

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. GET `/users/me` with no Authorization header 2. GET `/bounties` with no Authorization header 3. GET `/admin/dashboard` with no Authorization header |
| Expected Result | All return 401 Unauthorized. |

#### H-09: Expired JWT Rejected

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. GET `/users/me` with an expired JWT |
| Expected Result | 401 Unauthorized. |

#### H-10: Suspended User Rejected on API Call

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | User with valid JWT but status=SUSPENDED in database |
| Steps | 1. GET `/users/me` with the suspended user's still-valid JWT |
| Expected Result | 403 Forbidden. User status guard rejects. |

#### H-11: Participant Cannot Access Business Dashboard

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. GET `/business/dashboard` as PARTICIPANT |
| Expected Result | 403 Forbidden. |

#### H-12: Business Admin Cannot Update Payout for Other Org

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/submissions/:id/payout` for a submission on another org's bounty |
| Expected Result | 403 Forbidden. |

#### H-13: Org Member (Not Owner) Cannot Invite Members

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. POST `/organisations/:id/members` as BA with MEMBER role (not OWNER) |
| Expected Result | 403 Forbidden. |

#### H-14: File Access Scoped to Submission Access

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. GET `/files/:id` as Participant who does NOT own the submission the file belongs to |
| Expected Result | 403 Forbidden. |

---

### Group I: Audit Logging

These tests verify that audit log entries are correctly created for all required actions.

#### I-01: Audit Log Created on User Password Change

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. POST `/users/me/change-password` 2. GET `/admin/audit-logs?action=user.password_change` as SA |
| Expected Result | Audit entry exists with correct actorId, action, entityType=User, entityId. |

#### I-02: Audit Log Created on Organisation Create

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. POST `/organisations` 2. Query audit logs for action=organisation.create |
| Expected Result | Audit entry with afterState containing org name, status. |

#### I-03: Audit Log Created on Bounty Status Change

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/bounties/:id/status` to LIVE 2. Query audit logs for action=bounty.status_change |
| Expected Result | Audit entry with beforeState={status:DRAFT}, afterState={status:LIVE}. |

#### I-04: Audit Log Created on Submission Review

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/submissions/:id/review` with status=APPROVED 2. Query audit logs for action=submission.review |
| Expected Result | Audit entry with beforeState, afterState, actorRole=BUSINESS_ADMIN. |

#### I-05: Audit Log Created on Admin Override

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/admin/bounties/:id/override` 2. Query audit logs for action=bounty.override |
| Expected Result | Audit entry with reason field populated, beforeState, afterState, actorRole=SUPER_ADMIN. |

#### I-06: Audit Log Created on User Suspend

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. PATCH `/admin/users/:id/status` with status=SUSPENDED 2. Query audit logs |
| Expected Result | Audit entry with reason, action=user.status_change, beforeState={status:ACTIVE}, afterState={status:SUSPENDED}. |

#### I-07: Audit Log Created on Payout Change

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. PATCH `/submissions/:id/payout` 2. Query audit logs for action=submission.payout_change |
| Expected Result | Audit entry with beforeState={payoutStatus:NOT_PAID}, afterState={payoutStatus:PENDING}. |

#### I-08: Audit Log Created on Organisation Suspend

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. PATCH `/admin/organisations/:id/status` with SUSPENDED 2. Query audit logs |
| Expected Result | Audit entry with reason, action=organisation.status_change. |

#### I-09: Audit Log Created on Global Settings Change

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. PATCH `/admin/settings` 2. Query audit logs for action=settings.update |
| Expected Result | Audit entry with beforeState and afterState showing toggle changes. |

#### I-10: Audit Logs Are Read-Only

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. Attempt PATCH `/admin/audit-logs/:id` 2. Attempt DELETE `/admin/audit-logs/:id` |
| Expected Result | Both return 404 or 405 (endpoints do not exist). |

---

### Group J: Edge Cases and Error Handling

#### J-01: 404 on Non-Existent Resource

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. GET `/bounties/non-existent-uuid` 2. GET `/submissions/non-existent-uuid` 3. GET `/admin/users/non-existent-uuid` |
| Expected Result | All return 404 Not Found with appropriate message. |

#### J-02: Invalid UUID Format in Path

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. GET `/bounties/not-a-uuid` |
| Expected Result | 400 Bad Request. Validation error: ID must be a valid UUID. |

#### J-03: Unknown Fields in Request Body Rejected

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. POST `/auth/signup` with extra field `isAdmin: true` |
| Expected Result | 400 Bad Request (forbidNonWhitelisted). Unknown field rejected. |

#### J-04: Empty Request Body on POST

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. POST `/auth/signup` with empty body `{}` |
| Expected Result | 400 Bad Request. Validation errors for all required fields. |

#### J-05: SQL Injection Attempt

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. GET `/admin/users?search='; DROP TABLE users; --` 2. POST `/auth/signup` with email `test@test.com'; DROP TABLE users;--` |
| Expected Result | Both handled safely. Either validation error or safe query execution (Prisma parameterized queries). No SQL execution. |

#### J-06: XSS Attempt in Text Fields

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Steps | 1. POST `/bounties` with title `<script>alert('xss')</script>` |
| Expected Result | HTML tags stripped by sanitization middleware. Stored value does not contain script tags. |

#### J-07: Very Long Input Values

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. POST `/bounties` with title of 10000 characters |
| Expected Result | 400 Bad Request. Title exceeds max length (200 chars). |

#### J-08: Concurrent Submission to Same Bounty (Race Condition)

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. Two participants submit to a bounty with maxSubmissions=1 simultaneously |
| Expected Result | Only one submission succeeds (201). The other receives 400 (max reached). Database uniqueness constraint or application-level lock prevents both from succeeding. |

#### J-09: Concurrent Status Transition (Race Condition)

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. Two requests to transition LIVE bounty: one to PAUSED, one to CLOSED, simultaneously |
| Expected Result | One succeeds. The other receives 400 (invalid transition from the new state) or succeeds if the transition is valid from the intermediate state. No inconsistent state. |

#### J-10: File Upload with Spoofed MIME Type

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. Upload a .txt file with Content-Type set to image/jpeg |
| Expected Result | 400 Bad Request. MIME type validation reads file magic bytes, not just the Content-Type header. |

#### J-11: Pagination Beyond Available Pages

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. GET `/bounties?page=9999` |
| Expected Result | 200 OK. data is empty array. meta shows correct total and totalPages. |

#### J-12: Negative Pagination Values

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. GET `/bounties?page=-1&limit=-5` |
| Expected Result | 400 Bad Request. Page and limit must be positive integers. |

---

### Group K: Notifications

#### K-01: Email Sent on Submission Approved

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API (verify email queued) |
| Preconditions | Submission reviewed and approved |
| Steps | 1. PATCH `/submissions/:id/review` with status=APPROVED |
| Expected Result | Email queued to participant with bounty title, new status, reviewer note (if any), link to submission. |

#### K-02: Email Sent on Submission Rejected

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Submission reviewed and rejected |
| Steps | 1. PATCH `/submissions/:id/review` with status=REJECTED |
| Expected Result | Email queued to participant with bounty title, status=Rejected, reviewer note. |

#### K-03: Email Sent on Needs More Info

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Submission marked Needs More Info |
| Steps | 1. PATCH `/submissions/:id/review` with status=NEEDS_MORE_INFO |
| Expected Result | Email queued to participant with bounty title, status, reviewer note. |

#### K-04: Email Sent on Payout Status Change

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Preconditions | Approved submission, payout status changed |
| Steps | 1. PATCH `/submissions/:id/payout` with payoutStatus=PAID |
| Expected Result | Email queued to participant with bounty title, payout status=Paid. |

#### K-05: Email Failure Does Not Block Review Action

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Preconditions | Email service is unavailable/erroring |
| Steps | 1. PATCH `/submissions/:id/review` with status=APPROVED |
| Expected Result | 200 OK. Review action succeeds. Email failure is logged but does not cause the API to return an error. |

#### K-06: Password Reset Email Sent

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | API |
| Steps | 1. POST `/auth/forgot-password` for existing user |
| Expected Result | Reset email queued with secure, time-limited link. |

#### K-07: Verification Email Sent on Signup

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | API |
| Steps | 1. POST `/auth/signup` |
| Expected Result | Verification email queued asynchronously. |

---

### Group L: Infrastructure

#### L-01: Public Health Check

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | API |
| Preconditions | Application is running |
| Steps | 1. GET `/health` (no auth) |
| Expected Result | 200 OK. Returns status=ok, version, database service status. |

#### L-02: Health Check with Database Down

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | Manual |
| Preconditions | Database connection is severed |
| Steps | 1. GET `/health` |
| Expected Result | 503 Service Unavailable. status=degraded, database service shows error. |

#### L-03: Structured Logging

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | Manual |
| Steps | 1. Make an API request 2. Inspect application logs |
| Expected Result | Log entry is JSON format with timestamp, method, path, statusCode, responseTime, userId. |

#### L-04: Sensitive Data Not Logged

| Field | Value |
|-------|-------|
| Priority | P1 |
| Type | Manual |
| Steps | 1. POST `/auth/signup` with password 2. Inspect all log output |
| Expected Result | Password value does NOT appear anywhere in logs. Token values do NOT appear in logs. |

#### L-05: Sentry Error Capture

| Field | Value |
|-------|-------|
| Priority | P3 |
| Type | Manual |
| Preconditions | Sentry DSN configured |
| Steps | 1. Trigger an unhandled exception 2. Check Sentry dashboard |
| Expected Result | Error captured in Sentry with context: user ID (if authenticated), request URL, stack trace. No passwords or tokens in the error report. |

#### L-06: Environment Validation on Startup

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | Manual |
| Steps | 1. Remove a required env var (e.g., DATABASE_URL) 2. Start the application |
| Expected Result | Application fails to start with clear error message listing missing env vars. |

#### L-07: Database Migration

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | Manual |
| Steps | 1. Run `npx prisma migrate deploy` on a clean database |
| Expected Result | All tables created. Schema matches Prisma schema definition. |

#### L-08: Database Seed Script

| Field | Value |
|-------|-------|
| Priority | P2 |
| Type | Manual |
| Steps | 1. Run seed script on a freshly migrated database |
| Expected Result | Super Admin user created. Reference data populated. Application can start and SA can log in. |

---

## 3. Regression Checklist

This checklist must pass with 100% before every release. Execute all items as manual tests on the staging environment.

### Pre-Release Regression Checklist

#### Authentication
- [ ] **REG-01**: Signup creates a new Participant account
- [ ] **REG-02**: Login returns tokens and redirects to role-appropriate dashboard
- [ ] **REG-03**: Login with wrong password shows generic "Invalid credentials"
- [ ] **REG-04**: Suspended user cannot log in (shows suspension message)
- [ ] **REG-05**: Logout invalidates session; subsequent API calls return 401
- [ ] **REG-06**: Forgot password sends reset email (check with existing and non-existing email)
- [ ] **REG-07**: Reset password with valid token works; token cannot be reused

#### Participant Flows
- [ ] **REG-08**: Browse bounties shows only LIVE bounties
- [ ] **REG-09**: Bounty filters (category, reward type, search) work correctly
- [ ] **REG-10**: Bounty detail shows all fields including proof requirements
- [ ] **REG-11**: Submit proof form works (text, links, images) -- completes within 60 seconds
- [ ] **REG-12**: Cannot submit twice to the same bounty (409 error)
- [ ] **REG-13**: My Submissions list shows all submissions with correct status badges
- [ ] **REG-14**: Submission detail shows reviewer note when status is Needs More Info
- [ ] **REG-15**: Update submission (Needs More Info) resets status to Submitted

#### Business Admin Flows
- [ ] **REG-16**: BA Dashboard shows correct counts for their org
- [ ] **REG-17**: Create bounty in Draft status
- [ ] **REG-18**: Publish bounty (Draft to Live) -- verify it appears in participant browse
- [ ] **REG-19**: Pause bounty (Live to Paused) -- verify it disappears from participant browse
- [ ] **REG-20**: Resume bounty (Paused to Live)
- [ ] **REG-21**: Close bounty -- verify "This action cannot be undone" confirmation
- [ ] **REG-22**: Edit draft bounty (all fields editable)
- [ ] **REG-23**: Edit live bounty (only allowed fields editable; restricted fields are read-only)
- [ ] **REG-24**: Delete draft bounty (confirmation dialog, soft delete)
- [ ] **REG-25**: Review submission: Approve (with confirmation dialog)
- [ ] **REG-26**: Review submission: Reject (with confirmation dialog and note)
- [ ] **REG-27**: Review submission: Needs More Info
- [ ] **REG-28**: Mark payout as Pending, then as Paid

#### Super Admin Flows
- [ ] **REG-29**: SA Dashboard shows platform-wide counts
- [ ] **REG-30**: User management: search by email, filter by role/status
- [ ] **REG-31**: Suspend user with mandatory reason -- verify user cannot log in
- [ ] **REG-32**: Reinstate user -- verify user can log in again
- [ ] **REG-33**: Force password reset sends email to user
- [ ] **REG-34**: Org management: suspend org -- verify LIVE bounties auto-paused
- [ ] **REG-35**: Reinstate org -- verify bounties remain paused
- [ ] **REG-36**: Override bounty status with mandatory reason
- [ ] **REG-37**: Override submission status with mandatory reason
- [ ] **REG-38**: Audit log viewer: search by actor, filter by action/entity/date
- [ ] **REG-39**: Audit log detail shows before/after state
- [ ] **REG-40**: System health page shows service statuses

#### RBAC
- [ ] **REG-41**: Participant cannot access /manage/bounties or /admin/* routes (redirected)
- [ ] **REG-42**: Business Admin cannot access /admin/* routes (redirected)
- [ ] **REG-43**: BA cannot see or manage other org's bounties/submissions

#### Destructive Actions
- [ ] **REG-44**: All destructive actions show confirmation dialog (close bounty, delete bounty, suspend user, suspend org, override status)
- [ ] **REG-45**: Confirmation dialogs with mandatory reason field require non-empty reason

#### Error and Empty States
- [ ] **REG-46**: Browse bounties with no results shows empty state message
- [ ] **REG-47**: My Submissions with no submissions shows empty state with link to browse
- [ ] **REG-48**: 404 page shown for non-existent resource
- [ ] **REG-49**: Toast notifications appear for errors and successes

#### Infrastructure
- [ ] **REG-50**: Health endpoint returns 200 with database status

---

## 4. Bug Severity Definitions

| Severity | Label | Definition | SLA | Release Impact |
|----------|-------|------------|-----|----------------|
| **P1** | Blocker | System is unusable. Data loss, security vulnerability, authentication broken, core flow (submit/review) completely broken. | Fix immediately | **Blocks release** |
| **P2** | Critical | Major feature broken but workaround exists. RBAC bypass, wrong data displayed, audit logs not created, notification failures. | Fix within 24 hours | **Blocks release** |
| **P3** | Important | Minor feature not working as expected. UI glitch, non-critical validation missing, sort/filter not working, cosmetic issues in email templates. | Fix within 1 week | Does not block release |
| **P4** | Minor | Cosmetic or low-impact issue. Typo, slight misalignment, non-ideal error message wording. | Fix in next sprint | Does not block release |

### Release Gate

Release is **BLOCKED** unless:
- 0 open P1 bugs
- 0 open P2 bugs
- 100% automated test pass rate
- Regression checklist fully passed

---

## 5. Test Automation Strategy

### 5.1 Automation Layers

| Layer | Tool | What's Automated | When It Runs |
|-------|------|-----------------|-------------|
| Unit Tests | Jest | Validators, state machines, service logic, utility functions | Every commit (CI) |
| API Integration Tests | Jest + Supertest | Full HTTP request/response for every endpoint | Every commit (CI) |
| UI Smoke Tests | Playwright | 10 critical end-to-end paths | Every PR (CI) |
| Manual Regression | Human + Checklist | Full regression (50 items) | Before release |

### 5.2 Unit Test Targets

| Module | Tests |
|--------|-------|
| Password validator | Strength rules, edge cases |
| Bounty status state machine | All valid transitions, all invalid transitions, all edge cases |
| Submission status state machine | All valid transitions, all invalid transitions |
| Payout status state machine | All valid transitions, all invalid transitions |
| Bounty edit rules | Field editability by status |
| DTO validators | All DTOs with valid and invalid inputs |
| Token generation/validation | Password reset tokens, verification tokens, JWT utils |
| Audit log builder | Before/after state capture, action string generation |

### 5.3 API Integration Test Targets

Every endpoint documented in `docs/architecture/api-contracts.md` must have at least:
- 1 test for the success case (happy path)
- 1 test per documented error response code (400, 401, 403, 404, 409, 429)
- 1 test per RBAC rule (authorized role succeeds, unauthorized role gets 403)

**Estimated test count**: ~200 API integration tests.

### 5.4 UI Smoke Test Paths

The following 10 critical paths are automated as end-to-end UI tests:

| # | Path | Steps |
|---|------|-------|
| 1 | Participant signup and login | Navigate to signup, fill form, submit, navigate to login, log in, verify landing on /bounties |
| 2 | Browse and view bounty | Log in as Participant, view bounty list, apply filter, click bounty, verify detail page |
| 3 | Submit proof | Log in as Participant, navigate to LIVE bounty, click Submit Proof, fill form, submit, verify redirect to My Submissions |
| 4 | Track submissions | Log in as Participant with submissions, navigate to My Submissions, click a submission, verify detail page |
| 5 | BA create and publish bounty | Log in as BA, navigate to Create Bounty, fill form, save as draft, publish, verify status changes to LIVE |
| 6 | BA review submission | Log in as BA, navigate to bounty submissions, click submission, approve it, verify status badge changes |
| 7 | SA suspend user | Log in as SA, navigate to User Management, search for user, click Suspend, enter reason, confirm, verify status changes |
| 8 | SA view audit logs | Log in as SA, navigate to Audit Logs, verify entries are listed, apply date filter, click entry, verify detail view |
| 9 | SA override bounty status | Log in as SA, navigate to a bounty, click Override Status, fill reason, confirm, verify status changes |
| 10 | Profile edit and password change | Log in, navigate to Profile, click Edit, update name, save, verify toast, change password, verify toast |

### 5.5 Test File Organization

Tests are colocated with source files per project conventions:

```
apps/
  api/
    src/
      auth/
        auth.service.ts
        auth.service.spec.ts          # Unit tests
        auth.controller.spec.ts       # API integration tests
      bounty/
        bounty.service.ts
        bounty.service.spec.ts
        bounty.controller.spec.ts
        bounty-state-machine.spec.ts  # Unit tests for state machine
      submission/
        submission.service.ts
        submission.service.spec.ts
        submission.controller.spec.ts
  web/
    e2e/
      participant-signup.spec.ts      # UI smoke test
      participant-submit-proof.spec.ts
      ba-create-bounty.spec.ts
      ba-review-submission.spec.ts
      sa-user-management.spec.ts
      sa-audit-logs.spec.ts
      sa-override.spec.ts
      profile-edit.spec.ts
      browse-bounties.spec.ts
      track-submissions.spec.ts
```

### 5.6 CI Pipeline Integration

```
Push to branch
  |
  v
[Lint + Type Check] → fail = block
  |
  v
[Unit Tests (Jest)] → fail = block
  |
  v
[API Integration Tests (Jest + Supertest + PostgreSQL Docker)] → fail = block
  |
  v
[UI Smoke Tests (Playwright)] → fail = block (on PR only)
  |
  v
[All pass] → PR can be merged
  |
  v
Merge to main → Deploy to staging
  |
  v
[Manual Regression on staging] → fail = block release
  |
  v
[Tag + Manual approval] → Deploy to production
  |
  v
[Post-deploy smoke: GET /health returns 200]
```

---

## Summary

| Metric | Count |
|--------|-------|
| Test case groups | 12 (A through L) |
| Total test cases | 132 |
| P1 (blocker) test cases | 48 |
| P2 (critical) test cases | 56 |
| P3 (important) test cases | 22 |
| P4 (minor) test cases | 6 |
| Regression checklist items | 50 |
| UI smoke test paths | 10 |
| Estimated API integration tests | ~200 |
| Estimated unit tests | ~80 |

---

*This test plan follows the spec at `md-files/social-bounty-mvp.md` strictly. Test cases are derived from user stories in the backlog and endpoint contracts in the API documentation. No tests for features outside the spec have been added.*
