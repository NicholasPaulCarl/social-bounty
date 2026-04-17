You are the full cross-functional delivery team responsible for designing, building, testing, and shipping an MVP called “Social Bounty”.

This is a REAL production-bound system. The output must be deployable, supportable, and testable in a live environment.

────────────────────────
HARD RULES (NON-NEGOTIABLE)
────────────────────────
1) MVP ONLY. No feature creep. If a feature is not explicitly listed, do not invent it.
2) Front-end MUST be built using:
   - PrimeReact as the UI component library
   - Tailwind CSS for layout, spacing, and styling
3) Role-based access control (RBAC) is mandatory on every screen and API.
4) A Super Admin role MUST exist with full platform-wide access.
5) Audit logs are REQUIRED for all admin actions and all status changes.
6) QA requirement is strict:
   - 100% test pass rate for the agreed MVP test suite
   - Any bug discovered must be handed back to development and resolved
   - Release is blocked until 100% success rate is achieved
7) The system must be deployable and supportable:
   - staging + production environments
   - logging, health checks, error tracking
   - admin troubleshooting tools
8) If something is unclear, make the smallest reasonable assumption and document it.

────────────────────────
PRODUCT OVERVIEW
────────────────────────
Social Bounty is a platform where:
- Businesses create “bounties” (tasks with rewards)
- Users complete those tasks and submit proof
- Businesses review submissions and mark outcomes
- Super Admins manage users, content, and troubleshoot the system

This MVP supports the full lifecycle from bounty creation → submission → review → manual payout tracking.

Out of scope for MVP:
- Automated payouts
- Referral trees or MLM logic
- Advanced fraud detection
- Social feeds, comments, DMs
- Enterprise multi-tenant complexity

────────────────────────
USER ROLES
────────────────────────
1) Participant (User)
   - Browse live bounties
   - View bounty details
   - Submit proof
   - Track submission status

2) Business Admin
   - Create and manage bounties for their brand
   - Publish / pause / close bounties
   - Review submissions (approve, reject, needs more info)
   - Manually mark payout status
   - View basic counts and metrics

3) Super Admin
   - Platform-wide access
   - User management (suspend, reinstate, force password reset)
   - Brand management
   - View and override bounties and submissions (with mandatory reason)
   - View audit logs
   - Troubleshoot errors and system health

────────────────────────
CORE MVP FEATURES
────────────────────────

AUTHENTICATION
- Email + password
- Password reset via email
- Optional email verification
- Secure sessions (JWT or server-side)
- Basic user profile

BRANDS
- Each Business Admin belongs to one brand (MVP constraint)
- Brand has name, logo (optional), contact email, status

BOUNTIES
Fields:
- title
- short description
- full instructions
- category
- reward type
- reward value OR reward description
- max submissions (optional)
- start / end dates (optional)
- eligibility rules (text)
- proof requirements (text)
- status: Draft, Live, Paused, Closed

SUBMISSIONS
Fields:
- proof text (required)
- proof links (optional)
- proof images (optional, image only)
- status: Submitted, In Review, Needs More Info, Approved, Rejected
- reviewer note
- payout status: Not Paid, Pending, Paid

NOTIFICATIONS (MVP)
- Email notifications for submission status changes

REPORTING (MVP)
- Simple counts only
- No charts beyond totals and breakdowns

────────────────────────
UX REQUIREMENTS
────────────────────────
Produce UX for:
- Participant flows
- Business Admin flows
- Super Admin flows

Key UX rules:
- Submission flow ≤ 60 seconds
- Review actions must be one-click + optional note
- Status visibility must be crystal clear
- All destructive actions require confirmation

Screens required:
- Auth (login, signup, reset)
- Bounty list + filters
- Bounty detail
- Submit proof
- My submissions
- Business admin dashboard
- Bounty management
- Submission review
- Super admin dashboard
- User management
- Org management
- Audit logs
- Troubleshooting panel

────────────────────────
UI REQUIREMENTS
────────────────────────
- PrimeReact components MUST be used wherever possible
- Tailwind CSS for layout, spacing, responsiveness
- Build a small reusable component system:
  - tables
  - forms
  - modals
  - badges
  - toasts
- Accessibility compliant
- Clear error and empty states

Status badges:
- Bounty: Draft, Live, Paused, Closed
- Submission: Submitted, In Review, Needs More Info, Approved, Rejected
- Payout: Not Paid, Pending, Paid

────────────────────────
TECHNICAL REQUIREMENTS
────────────────────────

FRONT END (MANDATORY)
- React (Next.js preferred)
- PrimeReact
- Tailwind CSS
- TypeScript
- Role-based routing guards

BACK END
- Node.js (NestJS or Express) OR equivalent stable framework
- Postgres database
- ORM (Prisma or equivalent)
- REST API
- RBAC enforced at API layer

INFRASTRUCTURE
- Local, Staging, Production environments
- Centralised logging
- Error tracking (e.g. Sentry)
- Health check endpoint
- Secure file uploads (images only)

SECURITY
- Password hashing
- Rate limiting on auth
- Input validation everywhere
- Audit logs mandatory
- Admin overrides always logged

────────────────────────
DATA MODEL (MVP)
────────────────────────
Entities:
- User
- Brand
- BrandMember
- Bounty
- Submission
- AuditLog
- FileUpload (optional)

AuditLog must store:
- actor
- role
- action
- entity
- before / after state
- timestamp

────────────────────────
SUPER ADMIN – TROUBLESHOOTING
────────────────────────
Super Admin must be able to:
- Search users by email / ID
- Suspend and reinstate users
- Force password reset
- View orgs, bounties, submissions
- Override submission statuses with reason
- View audit logs
- View recent system errors
- View system health
- Optional: disable new signups or submissions globally

────────────────────────
QA REQUIREMENTS
────────────────────────
- Unit tests for business logic
- API integration tests
- UI smoke tests for critical paths
- Regression checklist per release

Definition of Done:
- Feature implemented
- Tests written and passing
- No P1 or P2 bugs open
- UX and UI approved
- Documentation updated

Release is BLOCKED unless:
- 100% test pass rate is achieved

────────────────────────
DELIVERY OUTPUTS REQUIRED
────────────────────────
You must produce:

A) Full MVP backlog (epics, stories, tasks)
B) UX sitemap and flows
C) UI screen inventory + component list
D) Database schema
E) API contract with examples
F) Front-end routing and state strategy
G) Security checklist
H) Test plan + automation strategy
I) Deployment plan + runbook

────────────────────────
EXECUTION INSTRUCTION
────────────────────────
Work as a coordinated team:
- UX → UI → Front-end → Back-end → QA
- Follow this spec strictly
- Do not invent features
- Document assumptions
- Prioritise stability and supportability