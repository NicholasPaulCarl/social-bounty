# Social Bounty MVP Backlog

> **Version**: 1.0
> **Date**: 2026-02-07
> **Source**: `md-files/social-bounty-mvp.md`
> **Rule**: MVP scope only. No feature creep. If it is not in the spec, it is not built.

---

## Table of Contents

- [Assumptions](#assumptions)
- [Epic 1: Authentication](#epic-1-authentication)
- [Epic 2: User Profile](#epic-2-user-profile)
- [Epic 3: Organisations](#epic-3-organisations)
- [Epic 4: Bounties](#epic-4-bounties)
- [Epic 5: Submissions](#epic-5-submissions)
- [Epic 6: Business Admin](#epic-6-business-admin)
- [Epic 7: Super Admin](#epic-7-super-admin)
- [Epic 8: Notifications](#epic-8-notifications)
- [Epic 9: Reporting](#epic-9-reporting)
- [Epic 10: Infrastructure](#epic-10-infrastructure)

---

## Assumptions

These assumptions are documented per the project rule: "If something is unclear, make the smallest reasonable assumption and document it."

1. **Single organisation per Business Admin**: The spec states "Each Business Admin belongs to one organisation (MVP constraint)." A user cannot be a Business Admin of multiple orgs.
2. **Role assignment**: Super Admins are seeded or manually assigned. There is no self-service Super Admin registration. Business Admins are assigned their role when they create or are invited to an organisation.
3. **Participants cannot be Business Admins simultaneously**: A user has a single primary role for MVP. Role separation is enforced.
4. **Email verification is optional**: The spec says "Optional email verification." We will implement the flow but it will not block access.
5. **File uploads are images only**: The spec explicitly limits proof images to image files only. No video, PDF, or other file types.
6. **Payout is manual tracking only**: No payment gateway integration. Business Admins manually update payout status (Not Paid, Pending, Paid).
7. **Categories are a flat list**: Bounty categories are a predefined flat list managed by Super Admins. No nested categories.
8. **Reward types**: "Reward type" and "reward value OR reward description" imply two modes: a fixed monetary/point value, or a freeform text description (e.g., "Gift card", "Swag bag").
9. **One submission per user per bounty**: Unless the spec says otherwise, a participant can submit once per bounty.
10. **"Needs More Info" allows resubmission**: When a submission is marked "Needs More Info," the participant can update and resubmit their proof.
11. **No real-time notifications**: Email only. No WebSocket or push notifications for MVP.
12. **Audit log viewer is read-only for Super Admins**: Logs cannot be edited or deleted.
13. **"Disable new signups or submissions globally" is optional**: The spec marks this as "Optional." We include it but mark it as lower priority.
14. **Rate limiting scope**: Rate limiting on auth applies to login, signup, and password reset endpoints.

---

## Epic 1: Authentication

**Goal**: Users can create accounts, log in, reset passwords, and maintain secure sessions.

### Story 1.1: User Signup

**As a** visitor, **I want to** create an account with my email and password, **so that** I can access the platform.

**Acceptance Criteria**:
- [ ] Signup form collects: email, password, confirm password, full name
- [ ] Email must be unique (case-insensitive)
- [ ] Password must meet minimum strength requirements (8+ characters, at least 1 uppercase, 1 lowercase, 1 number)
- [ ] On success, user is created with role "Participant" and redirected to login or dashboard
- [ ] On failure, clear validation errors are displayed
- [ ] Passwords are hashed before storage (bcrypt or argon2)
- [ ] Rate limiting is applied to the signup endpoint

**Tasks**:
- T1.1.1: Create `POST /auth/signup` endpoint with input validation
- T1.1.2: Implement password hashing service
- T1.1.3: Build signup page UI with PrimeReact form components
- T1.1.4: Add rate limiting middleware to auth routes
- T1.1.5: Write unit tests for signup validation logic
- T1.1.6: Write API integration test for signup flow

### Story 1.2: User Login

**As a** registered user, **I want to** log in with my email and password, **so that** I can access my account.

**Acceptance Criteria**:
- [ ] Login form collects: email, password
- [ ] On success, a JWT (or session) is issued and user is redirected to role-appropriate dashboard
- [ ] On failure, a generic "Invalid credentials" error is shown (no information leakage)
- [ ] Suspended users see a "Your account has been suspended" message and cannot log in
- [ ] Rate limiting is applied to the login endpoint
- [ ] Session/token has a configurable expiry

**Tasks**:
- T1.2.1: Create `POST /auth/login` endpoint
- T1.2.2: Implement JWT token generation and validation service
- T1.2.3: Build login page UI
- T1.2.4: Implement auth guard middleware for protected routes
- T1.2.5: Write unit tests for login logic
- T1.2.6: Write API integration test for login flow

### Story 1.3: User Logout

**As a** logged-in user, **I want to** log out, **so that** my session is terminated securely.

**Acceptance Criteria**:
- [ ] Logout button is visible in the navigation when logged in
- [ ] On logout, the token/session is invalidated
- [ ] User is redirected to the login page
- [ ] Subsequent API calls with the old token are rejected

**Tasks**:
- T1.3.1: Create `POST /auth/logout` endpoint
- T1.3.2: Implement token invalidation (blacklist or session destroy)
- T1.3.3: Add logout button to navigation component
- T1.3.4: Write integration test for logout flow

### Story 1.4: Password Reset

**As a** user who forgot my password, **I want to** reset it via email, **so that** I can regain access to my account.

**Acceptance Criteria**:
- [ ] "Forgot password" link on login page leads to reset request form
- [ ] User enters email; if account exists, a reset email is sent
- [ ] Response is always "If an account exists, a reset email has been sent" (no information leakage)
- [ ] Reset link contains a secure, time-limited token (expires in 1 hour)
- [ ] Reset page validates token and allows setting a new password
- [ ] On success, user is redirected to login with a confirmation message
- [ ] Used tokens cannot be reused
- [ ] Rate limiting is applied to the reset request endpoint
- [ ] Audit log entry is created for password resets

**Tasks**:
- T1.4.1: Create `POST /auth/forgot-password` endpoint
- T1.4.2: Create `POST /auth/reset-password` endpoint
- T1.4.3: Implement password reset token generation and validation
- T1.4.4: Integrate email sending service for reset emails
- T1.4.5: Build forgot-password and reset-password UI pages
- T1.4.6: Write unit tests for token generation/validation
- T1.4.7: Write API integration tests for full reset flow

### Story 1.5: Email Verification (Optional)

**As a** newly registered user, **I want to** verify my email address, **so that** the platform can confirm my identity.

**Acceptance Criteria**:
- [ ] After signup, a verification email is sent with a secure, time-limited link
- [ ] Clicking the link marks the email as verified
- [ ] Verification status is visible on the user profile
- [ ] Unverified users can still access the platform (verification does not block access)
- [ ] Expired verification links show an appropriate message with a "resend" option

**Tasks**:
- T1.5.1: Create `POST /auth/verify-email` endpoint
- T1.5.2: Create `POST /auth/resend-verification` endpoint
- T1.5.3: Implement verification token generation and email sending
- T1.5.4: Build verification confirmation page
- T1.5.5: Write integration tests for verification flow

---

## Epic 2: User Profile

**Goal**: Users can view and manage their basic profile information.

### Story 2.1: View Profile

**As a** logged-in user, **I want to** view my profile information, **so that** I can see what is stored about me.

**Acceptance Criteria**:
- [ ] Profile page displays: full name, email, role, email verification status, account creation date
- [ ] Profile page is accessible from the navigation menu
- [ ] Page is protected by authentication guard

**Tasks**:
- T2.1.1: Create `GET /users/me` endpoint
- T2.1.2: Build profile page UI with PrimeReact components
- T2.1.3: Write API integration test for profile retrieval

### Story 2.2: Edit Profile

**As a** logged-in user, **I want to** update my name and password, **so that** I can keep my information current.

**Acceptance Criteria**:
- [ ] User can update their full name
- [ ] User can change their password (must provide current password)
- [ ] New password must meet the same strength requirements as signup
- [ ] On success, a confirmation toast is shown
- [ ] Password change creates an audit log entry
- [ ] Email cannot be changed by the user (MVP constraint)

**Tasks**:
- T2.2.1: Create `PATCH /users/me` endpoint with validation
- T2.2.2: Create `POST /users/me/change-password` endpoint
- T2.2.3: Build edit profile form UI
- T2.2.4: Write unit tests for profile update validation
- T2.2.5: Write API integration tests for profile update and password change

---

## Epic 3: Organisations

**Goal**: Business Admins can create and manage their organisation. Super Admins can manage all organisations.

### Story 3.1: Create Organisation

**As a** user, **I want to** create an organisation, **so that** I can manage bounties as a Business Admin.

**Acceptance Criteria**:
- [ ] Form collects: organisation name, contact email, logo (optional image upload)
- [ ] On creation, the user's role is changed to Business Admin
- [ ] The creating user is added as an OrganisationMember with "owner" role
- [ ] Organisation is created with status "active"
- [ ] A user who already belongs to an organisation cannot create another one
- [ ] Audit log entry is created for organisation creation

**Tasks**:
- T3.1.1: Create `POST /organisations` endpoint with validation
- T3.1.2: Implement organisation creation service with membership logic
- T3.1.3: Build create organisation page UI
- T3.1.4: Handle logo image upload (optional)
- T3.1.5: Write unit tests for creation logic
- T3.1.6: Write API integration tests

### Story 3.2: View Organisation Details

**As a** Business Admin, **I want to** view my organisation's details, **so that** I can see the current state.

**Acceptance Criteria**:
- [ ] Organisation detail page shows: name, logo, contact email, status, member list, creation date
- [ ] Only members of the organisation can view the details (RBAC)
- [ ] Super Admins can view any organisation's details

**Tasks**:
- T3.2.1: Create `GET /organisations/:id` endpoint with RBAC
- T3.2.2: Build organisation detail page UI
- T3.2.3: Write API integration test

### Story 3.3: Edit Organisation

**As a** Business Admin (owner), **I want to** update my organisation's details, **so that** information stays current.

**Acceptance Criteria**:
- [ ] Owner can update: name, contact email, logo
- [ ] Only the organisation owner can edit (RBAC)
- [ ] On success, a confirmation toast is shown
- [ ] Audit log entry is created for changes

**Tasks**:
- T3.3.1: Create `PATCH /organisations/:id` endpoint with RBAC and validation
- T3.3.2: Build edit organisation form UI
- T3.3.3: Write API integration tests

### Story 3.4: Manage Organisation Members

**As a** Business Admin (owner), **I want to** invite and remove members from my organisation, **so that** my team can manage bounties.

**Acceptance Criteria**:
- [ ] Owner can invite users by email to join the organisation
- [ ] Invited user receives an email invitation
- [ ] Invited user who accepts is added as a member with "member" role
- [ ] Owner can remove members (with confirmation dialog)
- [ ] Members gain Business Admin role for the organisation
- [ ] Removed members lose Business Admin privileges for that organisation
- [ ] Audit log entry is created for member additions and removals

**Tasks**:
- T3.4.1: Create `POST /organisations/:id/members` (invite) endpoint
- T3.4.2: Create `DELETE /organisations/:id/members/:userId` endpoint
- T3.4.3: Implement invitation email and acceptance flow
- T3.4.4: Build member management UI (list, invite, remove)
- T3.4.5: Write unit tests for membership logic
- T3.4.6: Write API integration tests

---

## Epic 4: Bounties

**Goal**: Business Admins can create and manage bounties. Participants can browse and view live bounties.

### Story 4.1: Create Bounty

**As a** Business Admin, **I want to** create a bounty, **so that** participants can complete tasks for rewards.

**Acceptance Criteria**:
- [ ] Form collects all bounty fields: title, short description, full instructions, category, reward type, reward value or reward description, max submissions (optional), start/end dates (optional), eligibility rules, proof requirements
- [ ] Bounty is created in "Draft" status
- [ ] Bounty is associated with the Business Admin's organisation
- [ ] Input validation on all fields (required fields, date ordering, positive reward values)
- [ ] Audit log entry is created

**Tasks**:
- T4.1.1: Create `POST /bounties` endpoint with validation and RBAC
- T4.1.2: Implement bounty creation service
- T4.1.3: Build create bounty form UI (multi-field PrimeReact form)
- T4.1.4: Write unit tests for bounty validation logic
- T4.1.5: Write API integration tests

### Story 4.2: Edit Bounty

**As a** Business Admin, **I want to** edit a bounty I created, **so that** I can correct or update details.

**Acceptance Criteria**:
- [ ] All fields except status can be edited
- [ ] Only bounties in Draft or Paused status can have all fields edited
- [ ] Live bounties can only have limited fields edited (eligibility rules, proof requirements, max submissions, end date)
- [ ] Only members of the bounty's organisation can edit (RBAC)
- [ ] Audit log entry is created with before/after state

**Tasks**:
- T4.2.1: Create `PATCH /bounties/:id` endpoint with RBAC and status-dependent validation
- T4.2.2: Build edit bounty form UI
- T4.2.3: Write unit tests for edit rules
- T4.2.4: Write API integration tests

### Story 4.3: Bounty Status Transitions

**As a** Business Admin, **I want to** publish, pause, and close bounties, **so that** I can control their lifecycle.

**Acceptance Criteria**:
- [ ] Valid transitions: Draft -> Live, Live -> Paused, Paused -> Live, Live -> Closed, Paused -> Closed
- [ ] Invalid transitions are rejected with a clear error message
- [ ] Publishing (Draft -> Live) requires all mandatory fields to be filled
- [ ] Closing a bounty triggers a confirmation dialog
- [ ] Closed bounties cannot be reopened
- [ ] Audit log entry is created for each status change

**Tasks**:
- T4.3.1: Create `POST /bounties/:id/transition` endpoint with state machine validation
- T4.3.2: Implement bounty status state machine service
- T4.3.3: Add status transition buttons to bounty management UI
- T4.3.4: Add confirmation dialog for closing bounties
- T4.3.5: Write unit tests for state machine transitions
- T4.3.6: Write API integration tests for all valid and invalid transitions

### Story 4.4: Browse Live Bounties (Participant)

**As a** participant, **I want to** browse live bounties with filters, **so that** I can find tasks I want to complete.

**Acceptance Criteria**:
- [ ] Bounty list page shows all bounties with status "Live"
- [ ] Each list item shows: title, short description, category, reward type/value, organisation name
- [ ] Filters available: category, reward type, keyword search
- [ ] Pagination is implemented (server-side)
- [ ] Sorting by: newest, reward value, ending soon
- [ ] Empty state shown when no bounties match filters

**Tasks**:
- T4.4.1: Create `GET /bounties` endpoint with filtering, sorting, and pagination
- T4.4.2: Build bounty list page UI with PrimeReact DataTable or Card list
- T4.4.3: Build filter panel UI
- T4.4.4: Write API integration tests for filtering and pagination

### Story 4.5: View Bounty Detail

**As a** participant, **I want to** view full bounty details, **so that** I can decide whether to submit.

**Acceptance Criteria**:
- [ ] Detail page shows all bounty fields: title, full instructions, category, reward, eligibility rules, proof requirements, organisation name, start/end dates, remaining submissions (if max is set)
- [ ] A "Submit Proof" button is visible if the bounty is Live and the user has not already submitted
- [ ] If the user has already submitted, their submission status is shown instead
- [ ] Closed or Paused bounties show appropriate status badges but no submit button

**Tasks**:
- T4.5.1: Create `GET /bounties/:id` endpoint (public for Live bounties)
- T4.5.2: Build bounty detail page UI
- T4.5.3: Conditionally render submit button based on user state
- T4.5.4: Write API integration tests

### Story 4.6: Delete Bounty (Draft Only)

**As a** Business Admin, **I want to** delete a draft bounty, **so that** I can remove bounties that will never be published.

**Acceptance Criteria**:
- [ ] Only bounties in "Draft" status can be deleted
- [ ] Confirmation dialog is required before deletion
- [ ] Only the organisation's members can delete (RBAC)
- [ ] Audit log entry is created
- [ ] Soft delete (mark as deleted, do not purge from database)

**Tasks**:
- T4.6.1: Create `DELETE /bounties/:id` endpoint with RBAC and status check
- T4.6.2: Add delete button to bounty management UI with confirmation dialog
- T4.6.3: Write API integration tests

---

## Epic 5: Submissions

**Goal**: Participants can submit proof for bounties and track their submission status. Business Admins can review submissions.

### Story 5.1: Submit Proof

**As a** participant, **I want to** submit proof for a bounty, **so that** I can earn the reward.

**Acceptance Criteria**:
- [ ] Submission form collects: proof text (required), proof links (optional), proof images (optional, images only)
- [ ] Submission is only allowed on Live bounties
- [ ] A user can submit only once per bounty
- [ ] If the bounty has reached max submissions, new submissions are blocked with a clear message
- [ ] Submission is created with status "Submitted" and payout status "Not Paid"
- [ ] Submission flow must be completable within 60 seconds (UX requirement)
- [ ] On success, user is redirected to their submissions list with a confirmation toast
- [ ] Audit log entry is created

**Tasks**:
- T5.1.1: Create `POST /bounties/:id/submissions` endpoint with validation and RBAC
- T5.1.2: Implement submission creation service with duplicate and max-submission checks
- T5.1.3: Implement image upload handling (images only, size limits)
- T5.1.4: Build submit proof page UI
- T5.1.5: Write unit tests for submission validation logic
- T5.1.6: Write API integration tests

### Story 5.2: View My Submissions

**As a** participant, **I want to** see all my submissions, **so that** I can track their status.

**Acceptance Criteria**:
- [ ] "My Submissions" page lists all submissions by the logged-in user
- [ ] Each item shows: bounty title, submission date, status badge, payout status badge
- [ ] Submissions are sorted by newest first
- [ ] Clicking a submission opens the submission detail view
- [ ] Pagination is implemented
- [ ] Empty state shown when user has no submissions

**Tasks**:
- T5.2.1: Create `GET /users/me/submissions` endpoint with pagination
- T5.2.2: Build "My Submissions" page UI with status badges
- T5.2.3: Write API integration tests

### Story 5.3: View Submission Detail

**As a** participant, **I want to** see the full details of my submission, **so that** I can understand the review outcome.

**Acceptance Criteria**:
- [ ] Detail page shows: proof text, proof links, proof images, status, reviewer note (if any), payout status, submission date
- [ ] Only the submitter, the bounty's organisation members, and Super Admins can view (RBAC)
- [ ] If status is "Needs More Info", an "Update Submission" button is shown

**Tasks**:
- T5.3.1: Create `GET /submissions/:id` endpoint with RBAC
- T5.3.2: Build submission detail page UI
- T5.3.3: Write API integration tests

### Story 5.4: Update Submission (Needs More Info)

**As a** participant, **I want to** update my submission when more info is requested, **so that** my submission can be re-reviewed.

**Acceptance Criteria**:
- [ ] Only submissions with status "Needs More Info" can be updated
- [ ] User can update: proof text, proof links, proof images
- [ ] On update, submission status changes back to "Submitted"
- [ ] Audit log entry is created for the update

**Tasks**:
- T5.4.1: Create `PATCH /submissions/:id` endpoint with status check and RBAC
- T5.4.2: Build update submission form UI (pre-filled with existing data)
- T5.4.3: Write unit tests for update rules
- T5.4.4: Write API integration tests

---

## Epic 6: Business Admin

**Goal**: Business Admins have a dashboard and tools to manage bounties, review submissions, and track payouts.

### Story 6.1: Business Admin Dashboard

**As a** Business Admin, **I want to** see an overview dashboard, **so that** I can quickly understand the state of my bounties and submissions.

**Acceptance Criteria**:
- [ ] Dashboard shows summary counts: total bounties by status, total submissions by status, pending reviews
- [ ] Dashboard is the default landing page for Business Admins after login
- [ ] Only Business Admins can access (RBAC)
- [ ] Data is scoped to the Business Admin's organisation only

**Tasks**:
- T6.1.1: Create `GET /organisations/:id/dashboard` endpoint with RBAC
- T6.1.2: Build Business Admin dashboard page UI with PrimeReact cards/stats
- T6.1.3: Write API integration tests

### Story 6.2: Bounty Management List

**As a** Business Admin, **I want to** see all bounties for my organisation, **so that** I can manage them.

**Acceptance Criteria**:
- [ ] List shows all bounties for the organisation, regardless of status
- [ ] Each item shows: title, status badge, submission count, creation date
- [ ] Filters available: status
- [ ] Sorting by: newest, title, status
- [ ] Actions available per bounty: edit, transition status, view submissions
- [ ] Pagination is implemented

**Tasks**:
- T6.2.1: Create `GET /organisations/:id/bounties` endpoint with RBAC, filtering, pagination
- T6.2.2: Build bounty management list page UI with PrimeReact DataTable
- T6.2.3: Write API integration tests

### Story 6.3: Review Submissions

**As a** Business Admin, **I want to** review submissions for my bounties, **so that** I can approve or reject proof.

**Acceptance Criteria**:
- [ ] Submission review page shows all submissions for a specific bounty
- [ ] Each submission shows: participant name, proof text, proof links, proof images, status badge, submission date
- [ ] Reviewer can take actions: Approve, Reject, Needs More Info
- [ ] Each action is one-click with an optional note field
- [ ] Status transitions are validated: Submitted -> In Review, In Review -> Approved/Rejected/Needs More Info
- [ ] When a reviewer opens a submission, its status changes to "In Review" (if currently "Submitted")
- [ ] Confirmation dialog is shown for Approve and Reject actions
- [ ] Only the bounty's organisation members can review (RBAC)
- [ ] Audit log entry is created for every review action with before/after state

**Tasks**:
- T6.3.1: Create `POST /submissions/:id/review` endpoint with action, note, and RBAC
- T6.3.2: Implement submission review service with state machine
- T6.3.3: Build submission review page UI with action buttons
- T6.3.4: Add confirmation dialogs for approve/reject
- T6.3.5: Write unit tests for review state machine
- T6.3.6: Write API integration tests

### Story 6.4: Payout Tracking

**As a** Business Admin, **I want to** manually track payout status for approved submissions, **so that** I can record which participants have been paid.

**Acceptance Criteria**:
- [ ] Payout status can be updated only on approved submissions
- [ ] Valid payout transitions: Not Paid -> Pending, Pending -> Paid, Not Paid -> Paid
- [ ] Payout update includes optional note
- [ ] Payout status badge is visible on submission list and detail
- [ ] Only the bounty's organisation members can update payout status (RBAC)
- [ ] Audit log entry is created for payout status changes

**Tasks**:
- T6.4.1: Create `POST /submissions/:id/payout` endpoint with validation and RBAC
- T6.4.2: Add payout status controls to submission review UI
- T6.4.3: Write unit tests for payout transition rules
- T6.4.4: Write API integration tests

---

## Epic 7: Super Admin

**Goal**: Super Admins can manage the entire platform, including users, organisations, bounties, submissions, audit logs, and system health.

### Story 7.1: Super Admin Dashboard

**As a** Super Admin, **I want to** see a platform-wide dashboard, **so that** I can monitor the overall state of the system.

**Acceptance Criteria**:
- [ ] Dashboard shows platform-wide summary counts: total users, total organisations, total bounties by status, total submissions by status
- [ ] Dashboard is the default landing page for Super Admins after login
- [ ] Only Super Admins can access (RBAC)

**Tasks**:
- T7.1.1: Create `GET /admin/dashboard` endpoint with RBAC
- T7.1.2: Build Super Admin dashboard page UI
- T7.1.3: Write API integration tests

### Story 7.2: User Management

**As a** Super Admin, **I want to** search, view, suspend, reinstate, and force-reset passwords for users, **so that** I can manage the user base.

**Acceptance Criteria**:
- [ ] User list with search by email or user ID
- [ ] Each user entry shows: name, email, role, status (active/suspended), email verification status, creation date
- [ ] Actions: Suspend user (with confirmation dialog), Reinstate user (with confirmation dialog), Force password reset
- [ ] Suspended users cannot log in
- [ ] Force password reset sends a password reset email to the user
- [ ] All actions create audit log entries with mandatory reason field
- [ ] Pagination is implemented

**Tasks**:
- T7.2.1: Create `GET /admin/users` endpoint with search and pagination
- T7.2.2: Create `POST /admin/users/:id/suspend` endpoint with reason
- T7.2.3: Create `POST /admin/users/:id/reinstate` endpoint with reason
- T7.2.4: Create `POST /admin/users/:id/force-password-reset` endpoint
- T7.2.5: Build user management page UI with PrimeReact DataTable
- T7.2.6: Add confirmation dialogs for suspend/reinstate
- T7.2.7: Write unit tests for suspend/reinstate logic
- T7.2.8: Write API integration tests for all user management actions

### Story 7.3: Organisation Management

**As a** Super Admin, **I want to** view and manage all organisations, **so that** I can oversee the platform.

**Acceptance Criteria**:
- [ ] Organisation list with search by name
- [ ] Each entry shows: name, contact email, status, member count, bounty count, creation date
- [ ] Super Admin can view any organisation's details
- [ ] Super Admin can suspend/reinstate organisations (with confirmation and mandatory reason)
- [ ] Suspended organisations' bounties are automatically paused
- [ ] All actions create audit log entries
- [ ] Pagination is implemented

**Tasks**:
- T7.3.1: Create `GET /admin/organisations` endpoint with search and pagination
- T7.3.2: Create `POST /admin/organisations/:id/suspend` endpoint with reason
- T7.3.3: Create `POST /admin/organisations/:id/reinstate` endpoint with reason
- T7.3.4: Build organisation management page UI
- T7.3.5: Write API integration tests

### Story 7.4: Bounty and Submission Overrides

**As a** Super Admin, **I want to** view and override bounty and submission statuses, **so that** I can resolve disputes and issues.

**Acceptance Criteria**:
- [ ] Super Admin can view any bounty's full details
- [ ] Super Admin can view any submission's full details
- [ ] Super Admin can override bounty status (any valid status) with a mandatory reason
- [ ] Super Admin can override submission status (any valid status) with a mandatory reason
- [ ] Override reason is stored and visible in audit logs
- [ ] Confirmation dialog with reason field is required for all overrides
- [ ] Audit log entry is created with before/after state and override reason

**Tasks**:
- T7.4.1: Create `POST /admin/bounties/:id/override` endpoint with reason and RBAC
- T7.4.2: Create `POST /admin/submissions/:id/override` endpoint with reason and RBAC
- T7.4.3: Build override UI with mandatory reason modals
- T7.4.4: Write unit tests for override logic
- T7.4.5: Write API integration tests

### Story 7.5: Audit Log Viewer

**As a** Super Admin, **I want to** view all audit logs, **so that** I can track changes and investigate issues.

**Acceptance Criteria**:
- [ ] Audit log page shows a searchable, filterable list of all audit entries
- [ ] Each entry shows: timestamp, actor (name + email), role, action, entity type, entity ID, summary of change
- [ ] Filters: actor, action type, entity type, date range
- [ ] Clicking an entry shows full before/after state details
- [ ] Logs are read-only (cannot be edited or deleted)
- [ ] Pagination is implemented
- [ ] Only Super Admins can access (RBAC)

**Tasks**:
- T7.5.1: Create `GET /admin/audit-logs` endpoint with filtering and pagination
- T7.5.2: Create `GET /admin/audit-logs/:id` endpoint for detail view
- T7.5.3: Build audit log list page UI with PrimeReact DataTable
- T7.5.4: Build audit log detail view
- T7.5.5: Write API integration tests

### Story 7.6: System Health and Troubleshooting

**As a** Super Admin, **I want to** view system health and recent errors, **so that** I can troubleshoot issues.

**Acceptance Criteria**:
- [ ] Troubleshooting panel shows: system health status (up/down), recent error log entries (from Sentry or similar), database connection status
- [ ] Health check information is fetched from the health endpoint
- [ ] Recent errors show: timestamp, error message, stack trace summary, affected endpoint
- [ ] Only Super Admins can access (RBAC)

**Tasks**:
- T7.6.1: Create `GET /admin/system-health` endpoint with RBAC
- T7.6.2: Create `GET /admin/recent-errors` endpoint (integrates with error tracking)
- T7.6.3: Build troubleshooting panel UI
- T7.6.4: Write API integration tests

### Story 7.7: Global Toggles (Optional/Lower Priority)

**As a** Super Admin, **I want to** disable new signups or submissions globally, **so that** I can manage platform access during incidents.

**Acceptance Criteria**:
- [ ] Toggle switches for: disable new signups, disable new submissions
- [ ] When signups are disabled, the signup endpoint returns a "Signups temporarily disabled" message
- [ ] When submissions are disabled, the submission endpoint returns a "Submissions temporarily disabled" message
- [ ] Toggle state is persisted and survives restarts
- [ ] Only Super Admins can change toggles (RBAC)
- [ ] Audit log entry is created for toggle changes

**Tasks**:
- T7.7.1: Create `GET /admin/settings` and `PATCH /admin/settings` endpoints
- T7.7.2: Implement global settings service with database persistence
- T7.7.3: Add toggle checks to signup and submission endpoints
- T7.7.4: Build settings panel UI
- T7.7.5: Write API integration tests

---

## Epic 8: Notifications

**Goal**: Users receive email notifications for important submission status changes.

### Story 8.1: Submission Status Change Notifications

**As a** participant, **I want to** receive email notifications when my submission status changes, **so that** I stay informed without checking the platform constantly.

**Acceptance Criteria**:
- [ ] Email is sent when submission status changes to: In Review, Needs More Info, Approved, Rejected
- [ ] Email includes: bounty title, new status, reviewer note (if any), link to view submission
- [ ] Emails are sent asynchronously (do not block the review action)
- [ ] Email failures are logged but do not cause the review action to fail
- [ ] Emails use a consistent template with Social Bounty branding

**Tasks**:
- T8.1.1: Set up email service integration (SMTP or transactional email provider)
- T8.1.2: Create email templates for each status change
- T8.1.3: Implement async email dispatch on submission status change events
- T8.1.4: Add error handling and logging for email failures
- T8.1.5: Write unit tests for email template generation
- T8.1.6: Write integration tests for email dispatch flow

### Story 8.2: Payout Status Notifications

**As a** participant, **I want to** receive email notifications when my payout status changes, **so that** I know when to expect payment.

**Acceptance Criteria**:
- [ ] Email is sent when payout status changes to: Pending, Paid
- [ ] Email includes: bounty title, payout status, note (if any)
- [ ] Same async and error-handling behavior as Story 8.1

**Tasks**:
- T8.2.1: Create email templates for payout status changes
- T8.2.2: Implement async email dispatch on payout status change events
- T8.2.3: Write integration tests

---

## Epic 9: Reporting

**Goal**: Business Admins and Super Admins can view simple counts and breakdowns for their scope.

### Story 9.1: Business Admin Reports

**As a** Business Admin, **I want to** see simple counts and breakdowns for my organisation, **so that** I can understand activity levels.

**Acceptance Criteria**:
- [ ] Reports show: total bounties by status, total submissions by status, total approved submissions, total payouts by status
- [ ] Data is scoped to the Business Admin's organisation only
- [ ] No charts -- just numbers and simple tabular breakdowns
- [ ] Only Business Admins can access (RBAC)

**Tasks**:
- T9.1.1: Create `GET /organisations/:id/reports` endpoint with RBAC
- T9.1.2: Build reports section on Business Admin dashboard
- T9.1.3: Write API integration tests

### Story 9.2: Super Admin Reports

**As a** Super Admin, **I want to** see platform-wide counts and breakdowns, **so that** I can monitor overall platform health.

**Acceptance Criteria**:
- [ ] Reports show: total users by role, total organisations by status, total bounties by status, total submissions by status, total payouts by status
- [ ] No charts -- just numbers and simple tabular breakdowns
- [ ] Only Super Admins can access (RBAC)

**Tasks**:
- T9.2.1: Create `GET /admin/reports` endpoint with RBAC
- T9.2.2: Build reports section on Super Admin dashboard
- T9.2.3: Write API integration tests

---

## Epic 10: Infrastructure

**Goal**: The platform is deployable, monitorable, and supportable in production.

### Story 10.1: Health Check Endpoint

**As a** DevOps engineer, **I want** the API to expose a health check endpoint, **so that** monitoring tools can verify the system is running.

**Acceptance Criteria**:
- [ ] `GET /health` returns 200 with JSON body including: status, database connectivity, uptime, version
- [ ] Endpoint is unauthenticated
- [ ] Returns 503 if the database is unreachable

**Tasks**:
- T10.1.1: Implement `GET /health` endpoint with database connectivity check
- T10.1.2: Write integration test for health endpoint

### Story 10.2: Error Tracking Integration

**As a** DevOps engineer, **I want** unhandled errors to be reported to Sentry, **so that** the team can investigate production issues.

**Acceptance Criteria**:
- [ ] Sentry SDK is integrated in both the API and the web app
- [ ] Unhandled exceptions are captured with context (user ID, request URL, stack trace)
- [ ] Sentry DSN is configured via environment variables
- [ ] Sensitive data (passwords, tokens) is scrubbed from error reports

**Tasks**:
- T10.2.1: Install and configure Sentry SDK in NestJS API
- T10.2.2: Install and configure Sentry SDK in Next.js web app
- T10.2.3: Implement global exception filter that reports to Sentry
- T10.2.4: Configure sensitive data scrubbing
- T10.2.5: Write test to verify Sentry captures exceptions

### Story 10.3: Centralized Logging

**As a** DevOps engineer, **I want** structured, centralized logging, **so that** logs can be searched and analyzed.

**Acceptance Criteria**:
- [ ] All API requests are logged with: timestamp, method, path, status code, response time, user ID (if authenticated)
- [ ] Logs are structured JSON format
- [ ] Log level is configurable via environment variable
- [ ] Sensitive data (passwords, tokens) is not logged

**Tasks**:
- T10.3.1: Set up structured logging library (e.g., pino or winston)
- T10.3.2: Implement request logging middleware
- T10.3.3: Configure log levels per environment
- T10.3.4: Verify sensitive data is excluded from logs

### Story 10.4: Environment Configuration

**As a** DevOps engineer, **I want** clear environment-based configuration, **so that** the app works correctly in local, staging, and production.

**Acceptance Criteria**:
- [ ] All secrets and environment-specific values come from environment variables
- [ ] `.env.example` file documents all required variables
- [ ] Application fails fast with a clear error if required variables are missing
- [ ] Separate configurations for: local, staging, production

**Tasks**:
- T10.4.1: Create `.env.example` with all required variables
- T10.4.2: Implement configuration validation on startup (fail fast)
- T10.4.3: Document environment setup in deployment runbook

### Story 10.5: Secure File Uploads

**As a** developer, **I want** file uploads to be secure and restricted to images, **so that** the platform is safe from malicious file uploads.

**Acceptance Criteria**:
- [ ] Only image files are accepted (JPEG, PNG, GIF, WebP)
- [ ] File size limit is enforced (e.g., 5MB per image)
- [ ] File type is validated by MIME type, not just extension
- [ ] Uploaded files are stored securely (local filesystem for MVP, with path to S3/cloud later)
- [ ] Uploaded files are served via a secure, authenticated endpoint
- [ ] FileUpload record is created in the database linking to the file

**Tasks**:
- T10.5.1: Implement file upload endpoint with MIME validation and size limits
- T10.5.2: Implement file storage service (local filesystem for MVP)
- T10.5.3: Implement file serving endpoint with authentication
- T10.5.4: Create FileUpload model in Prisma schema
- T10.5.5: Write unit tests for file validation
- T10.5.6: Write API integration tests for upload and retrieval

### Story 10.6: CI/CD Pipeline

**As a** DevOps engineer, **I want** a CI/CD pipeline, **so that** code is tested and deployed consistently.

**Acceptance Criteria**:
- [ ] Pipeline runs on every push: lint, type check, unit tests, integration tests
- [ ] Pipeline blocks merge if any test fails
- [ ] Staging deployment is triggered on merge to main
- [ ] Production deployment is manual (triggered by tag or manual approval)

**Tasks**:
- T10.6.1: Set up CI configuration (GitHub Actions or similar)
- T10.6.2: Configure lint and type check steps
- T10.6.3: Configure test steps (unit + integration)
- T10.6.4: Configure staging deployment step
- T10.6.5: Configure production deployment step with manual gate

### Story 10.7: Database Migrations

**As a** developer, **I want** database migrations to be managed via Prisma, **so that** schema changes are versioned and reproducible.

**Acceptance Criteria**:
- [ ] Prisma schema is the single source of truth for the database
- [ ] Migrations are generated from schema changes
- [ ] Migrations can be applied in local, staging, and production
- [ ] Seed script exists for initial Super Admin user and reference data

**Tasks**:
- T10.7.1: Define complete Prisma schema for all entities
- T10.7.2: Generate initial migration
- T10.7.3: Create seed script for Super Admin user and reference data
- T10.7.4: Document migration workflow in deployment runbook

---

## Story Dependency Map

The following dependencies exist between epics and should guide implementation order:

```
Epic 10 (Infrastructure) ──> Foundation for all epics
Epic 1 (Authentication)  ──> Required by all other epics
Epic 2 (User Profile)    ──> Depends on Epic 1
Epic 3 (Organisations)   ──> Depends on Epic 1
Epic 4 (Bounties)        ──> Depends on Epic 1, Epic 3
Epic 5 (Submissions)     ──> Depends on Epic 1, Epic 4
Epic 6 (Business Admin)  ──> Depends on Epic 3, Epic 4, Epic 5
Epic 7 (Super Admin)     ──> Depends on Epic 1, Epic 3, Epic 4, Epic 5
Epic 8 (Notifications)   ──> Depends on Epic 5
Epic 9 (Reporting)       ──> Depends on Epic 4, Epic 5
```

## Recommended Implementation Phases

### Phase 1: Foundation
- Epic 10: Infrastructure (Stories 10.1, 10.3, 10.4, 10.5, 10.7)
- Epic 1: Authentication (all stories)
- Epic 2: User Profile (all stories)

### Phase 2: Core Domain
- Epic 3: Organisations (all stories)
- Epic 4: Bounties (all stories)
- Epic 5: Submissions (all stories)

### Phase 3: Admin & Review
- Epic 6: Business Admin (all stories)
- Epic 7: Super Admin (all stories)

### Phase 4: Polish & Ship
- Epic 8: Notifications (all stories)
- Epic 9: Reporting (all stories)
- Epic 10: Infrastructure (Stories 10.2, 10.6 -- CI/CD and error tracking finalization)

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Epics | 10 |
| User Stories | 30 |
| Acceptance Criteria | ~180 |
| Tasks | ~130 |

---

*This backlog follows the spec at `md-files/social-bounty-mvp.md` strictly. No features outside the spec have been added. All assumptions are documented at the top of this document.*
