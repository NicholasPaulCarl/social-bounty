# Social Bounty MVP -- Release Plan

> **Version**: 1.0
> **Date**: 2026-02-07
> **Source Backlog**: `docs/backlog/mvp-backlog.md`
> **Spec**: `md-files/social-bounty-mvp.md`

---

## Overview

This release plan organizes the MVP backlog into six sequential phases. Each phase has a clear scope, a definition of done, and a set of milestones. The phases are designed so that each one builds on the previous, enabling incremental validation and testing.

**Release gate**: No phase is considered complete until its definition of done is met. The final release is blocked until 100% test pass rate is achieved across the full MVP test suite.

---

## Phase 0: Project Scaffolding

**Goal**: Set up the monorepo structure, tooling, database, and CI foundation so all teams can start building.

### Scope

| Epic | Stories |
|------|---------|
| Epic 10: Infrastructure | 10.1 (Health Check), 10.3 (Logging), 10.4 (Environment Config), 10.7 (Database Migrations) |

### Deliverables
- Monorepo structure created (`apps/web`, `apps/api`, `packages/shared`, `packages/prisma`)
- Next.js app bootstrapped with PrimeReact and Tailwind CSS
- NestJS app bootstrapped with Prisma
- Prisma schema defined for all 7 entities with initial migration
- `.env.example` with all required variables documented
- Configuration validation on startup (fail fast)
- Structured JSON logging configured
- `GET /health` endpoint returning database connectivity and uptime
- Seed script for initial Super Admin user
- Shared types package with role enums, status enums, and common interfaces

### Definition of Done
- [ ] Monorepo builds successfully (`npm run build` across all packages)
- [ ] Database migration runs without errors
- [ ] Health check endpoint returns 200 with database status
- [ ] Seed script creates Super Admin user
- [ ] TypeScript strict mode enabled everywhere
- [ ] Linting passes with zero errors

### Milestone
**M0**: "Skeleton runs" -- the app boots, connects to the database, and the health endpoint is reachable.

---

## Phase 1: Authentication and User Management

**Goal**: Users can sign up, log in, log out, reset passwords, and manage their basic profiles.

### Scope

| Epic | Stories |
|------|---------|
| Epic 1: Authentication | 1.1 (Signup), 1.2 (Login), 1.3 (Logout), 1.4 (Password Reset), 1.5 (Email Verification) |
| Epic 2: User Profile | 2.1 (View Profile), 2.2 (Edit Profile) |

### Deliverables
- Signup flow with validation and password hashing
- Login flow with JWT issuance and role-based redirect
- Logout with token invalidation
- Password reset via email with time-limited tokens
- Email verification flow (optional, non-blocking)
- Rate limiting on all auth endpoints
- Profile view and edit pages
- Password change with current password verification
- Auth guard middleware protecting all non-public routes
- RBAC middleware skeleton (roles checked on every request)
- Audit log entries for: signup, login, password reset, password change

### Definition of Done
- [ ] A user can sign up, log in, log out, and reset their password end-to-end
- [ ] Suspended users cannot log in
- [ ] Rate limiting blocks excessive auth attempts
- [ ] All auth endpoints have passing integration tests
- [ ] Profile view and edit work correctly
- [ ] Auth guard rejects unauthenticated requests with 401
- [ ] RBAC middleware rejects unauthorized requests with 403

### Milestone
**M1**: "Users can authenticate" -- full auth lifecycle works end-to-end including password reset emails.

---

## Phase 2: Organisations and Bounties

**Goal**: Business Admins can create organisations and manage bounties through their full lifecycle. Participants can browse and view live bounties.

### Scope

| Epic | Stories |
|------|---------|
| Epic 3: Organisations | 3.1 (Create Org), 3.2 (View Org), 3.3 (Edit Org), 3.4 (Manage Members) |
| Epic 4: Bounties | 4.1 (Create Bounty), 4.2 (Edit Bounty), 4.3 (Status Transitions), 4.4 (Browse Bounties), 4.5 (Bounty Detail), 4.6 (Delete Draft Bounty) |
| Epic 10: Infrastructure | 10.5 (Secure File Uploads) |

### Deliverables
- Organisation CRUD with membership management
- Organisation logo upload (image only)
- Org member invitation via email
- Role upgrade to Business Admin on org creation/join
- Bounty CRUD scoped to organisation
- Bounty status state machine: Draft -> Live -> Paused -> Closed
- Bounty list with filters, sorting, and pagination (participant view)
- Bounty detail page with conditional submit button
- Draft bounty deletion with confirmation dialog
- Secure file upload endpoint with MIME validation and size limits
- Audit log entries for all org and bounty actions

### Definition of Done
- [ ] A user can create an org and become a Business Admin
- [ ] Business Admin can create, edit, publish, pause, and close bounties
- [ ] Invalid status transitions are rejected
- [ ] Participants can browse live bounties with filters
- [ ] Bounty detail page shows all fields and conditional submit button
- [ ] Only org members can manage their org's bounties (RBAC)
- [ ] File uploads accept only valid image types within size limits
- [ ] All endpoints have passing integration tests
- [ ] Confirmation dialogs appear for destructive actions (close bounty, delete draft)

### Milestone
**M2**: "Bounties are live" -- a Business Admin can publish a bounty and a Participant can find it.

---

## Phase 3: Submissions and Review

**Goal**: Participants can submit proof, track their submissions, and resubmit when asked. Business Admins can review submissions and track payouts.

### Scope

| Epic | Stories |
|------|---------|
| Epic 5: Submissions | 5.1 (Submit Proof), 5.2 (My Submissions), 5.3 (Submission Detail), 5.4 (Update Submission) |
| Epic 6: Business Admin | 6.1 (Dashboard), 6.2 (Bounty Management List), 6.3 (Review Submissions), 6.4 (Payout Tracking) |

### Deliverables
- Submission creation with proof text, links, and image uploads
- Duplicate submission prevention (one per user per bounty)
- Max submissions enforcement
- Submission list for participants with status and payout badges
- Submission detail page
- Submission update flow for "Needs More Info" status
- Business Admin dashboard with summary counts
- Bounty management list (org-scoped, all statuses)
- Submission review page with one-click actions + optional notes
- Submission status state machine: Submitted -> In Review -> Approved/Rejected/Needs More Info
- Payout status tracking: Not Paid -> Pending -> Paid
- Confirmation dialogs for approve/reject actions
- Audit log entries for all submission and review actions

### Definition of Done
- [ ] Participant can submit proof for a live bounty within 60 seconds
- [ ] Participant cannot submit twice to the same bounty
- [ ] Participant can view and track all their submissions
- [ ] Participant can update a submission marked "Needs More Info"
- [ ] Business Admin dashboard shows accurate counts
- [ ] Business Admin can review submissions with approve/reject/needs-more-info
- [ ] Payout status can be updated on approved submissions
- [ ] All status transitions are validated and logged
- [ ] All endpoints have passing integration tests

### Milestone
**M3**: "Full bounty lifecycle works" -- a bounty can go from creation to submission to approval to payout tracking.

---

## Phase 4: Super Admin and Platform Management

**Goal**: Super Admins have full platform visibility and control, including user management, org management, overrides, audit logs, and system health.

### Scope

| Epic | Stories |
|------|---------|
| Epic 7: Super Admin | 7.1 (Dashboard), 7.2 (User Management), 7.3 (Org Management), 7.4 (Overrides), 7.5 (Audit Logs), 7.6 (System Health), 7.7 (Global Toggles - optional) |
| Epic 8: Notifications | 8.1 (Submission Notifications), 8.2 (Payout Notifications) |
| Epic 9: Reporting | 9.1 (Business Admin Reports), 9.2 (Super Admin Reports) |

### Deliverables
- Super Admin dashboard with platform-wide counts
- User management: search, view, suspend, reinstate, force password reset
- Organisation management: search, view, suspend, reinstate
- Bounty and submission overrides with mandatory reason
- Audit log viewer: search, filter, detail view
- System health and troubleshooting panel
- Global toggles for disabling signups/submissions (optional)
- Email notifications for submission and payout status changes
- Business Admin reports (org-scoped counts)
- Super Admin reports (platform-wide counts)
- All Super Admin actions logged with reason

### Definition of Done
- [ ] Super Admin can search and manage users (suspend, reinstate, force reset)
- [ ] Super Admin can manage organisations (suspend, reinstate)
- [ ] Super Admin can override bounty and submission statuses with reason
- [ ] Audit log viewer shows all logged actions with filtering
- [ ] System health panel shows health status and recent errors
- [ ] Email notifications are sent for submission and payout status changes
- [ ] Reports show accurate counts for both Business Admin and Super Admin
- [ ] All actions require confirmation dialogs with mandatory reason fields
- [ ] All endpoints have passing integration tests
- [ ] RBAC prevents non-Super-Admins from accessing admin endpoints

### Milestone
**M4**: "Platform is manageable" -- Super Admins can manage the full platform, all notifications work, and reporting is functional.

---

## Phase 5: QA, Polish, and Release

**Goal**: Achieve 100% test pass rate, fix all bugs, finalize CI/CD, integrate error tracking, and prepare for production deployment.

### Scope

| Epic | Stories |
|------|---------|
| Epic 10: Infrastructure | 10.2 (Error Tracking / Sentry), 10.6 (CI/CD Pipeline) |
| Cross-cutting | Full regression testing, bug fixes, UX polish |

### Deliverables
- Sentry integration in API and web app with sensitive data scrubbing
- CI/CD pipeline: lint, type check, unit tests, integration tests on every push
- Staging deployment on merge to main
- Production deployment with manual gate
- Full manual regression test execution
- All discovered bugs triaged and resolved
- UI smoke tests for critical paths
- Final security review (input validation, RBAC, rate limiting)
- Deployment runbook

### Definition of Done
- [ ] 100% test pass rate across the full MVP test suite
- [ ] No P1 or P2 bugs open
- [ ] CI pipeline blocks merge on test failure
- [ ] Sentry captures unhandled exceptions with context
- [ ] Staging environment is deployed and functional
- [ ] Production deployment process is documented and tested
- [ ] Deployment runbook is complete
- [ ] Security checklist is reviewed and all items pass

### Milestone
**M5**: "Ready to ship" -- the MVP is deployed to staging, all tests pass, no critical bugs remain, and the production deployment process is validated.

---

## Phase Summary

| Phase | Name | Key Milestone | Dependencies |
|-------|------|---------------|--------------|
| 0 | Project Scaffolding | M0: Skeleton runs | None |
| 1 | Authentication & Profiles | M1: Users can authenticate | Phase 0 |
| 2 | Organisations & Bounties | M2: Bounties are live | Phase 1 |
| 3 | Submissions & Review | M3: Full bounty lifecycle works | Phase 2 |
| 4 | Super Admin & Platform | M4: Platform is manageable | Phase 3 |
| 5 | QA, Polish & Release | M5: Ready to ship | Phase 4 |

---

## Release Gate

Per the spec, release is **blocked** unless:
- 100% test pass rate is achieved
- No P1 or P2 bugs are open
- All UX and UI is approved
- Documentation is updated
- Security checklist is reviewed

---

*This release plan is derived from the MVP backlog at `docs/backlog/mvp-backlog.md` and follows the spec at `md-files/social-bounty-mvp.md` strictly.*
