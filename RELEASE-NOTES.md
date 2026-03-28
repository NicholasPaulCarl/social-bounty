# Social Bounty v1.0.0 — Release Notes & Feature Reference

> **Release Date:** 2026-03-28
> **Version:** 1.0.0 (MVP)
> **Codename:** NeoGlass

---

## What is Social Bounty?

Social Bounty is a bounty-based marketplace where businesses create tasks with rewards, real people complete them and submit proof, businesses review and approve submissions, and platform administrators manage the entire ecosystem.

---

## Platform Overview

| Role | Purpose | Access |
|------|---------|--------|
| **Participant** | Browse bounties, submit proof, track earnings | Default role on signup |
| **Business Admin** | Create bounties, review submissions, manage payouts | Gained by creating an organisation |
| **Super Admin** | Full platform control, user management, system oversight | Seeded manually |

---

## 1. Authentication & Account Management

These features are available to **all users** regardless of role.

### 1.1 Account Creation

| Function | Description |
|----------|-------------|
| **Sign Up** | Create an account with email, password, first name, and last name. Password must be at least 8 characters with uppercase, lowercase, and a number. |
| **Email Verification** | After signup, a verification email is sent. Click the link to verify your account. You can resend the verification email if needed. |
| **Demo Mode** | When enabled, the login page shows quick-access buttons for three demo accounts (Participant, Business Admin, Super Admin). |

### 1.2 Sign In & Session Management

| Function | Description |
|----------|-------------|
| **Login** | Sign in with email and password. Access tokens last 15 minutes and refresh automatically. Refresh tokens last 7 days. |
| **Brute Force Protection** | After 5 failed login attempts, the account is temporarily locked for 15 minutes. Remaining attempts are shown in the error message. |
| **Auto-Refresh** | Sessions refresh silently every 14 minutes. No need to re-login during active use. |
| **Logout** | Ends your session and invalidates your refresh token on the server. |

### 1.3 Password Management

| Function | Description |
|----------|-------------|
| **Forgot Password** | Enter your email to receive a password reset link. The link expires after 1 hour and can only be used once. |
| **Reset Password** | Set a new password using the token from the reset email. |
| **Change Password** | Change your password from your profile page. Requires your current password for verification. |

### 1.4 Profile Management

| Function | Description |
|----------|-------------|
| **View Profile** | See your name, email, role, and email verification status. |
| **Edit Profile** | Update your first name and last name. |

---

## 2. Participant Features

Participants browse available bounties, submit proof of completed tasks, and track their submissions and earnings.

### 2.1 Bounty Marketplace

| Function | Description |
|----------|-------------|
| **Browse Bounties** | View all live bounties in a grid or list layout. Cards show the title, description, reward value, category, and time remaining. |
| **Search** | Search bounties by title or description. Search is debounced (300ms) to avoid excessive requests. |
| **Filter by Category** | Filter bounties by category chips: Social Media, Content Creation, Reviews, Referrals, Surveys, or Other. |
| **Filter by Reward Type** | Filter by reward type: Cash, Product, Service, or Other. |
| **Sort** | Sort by newest, highest reward, ending soon, or title. |
| **Pagination** | Navigate through bounties with pagination (12 per page in grid, configurable in list). |

### 2.2 Bounty Detail

| Function | Description |
|----------|-------------|
| **View Bounty** | See full bounty details including title, instructions, reward breakdown, proof requirements, eligibility rules, and deadlines. |
| **Social Media Requirements** | View required channels (Instagram, Facebook, TikTok), post formats, and visibility rules (must not remove, minimum duration). |
| **Engagement Requirements** | See engagement thresholds (views, likes, comments) and tag account requirements. |
| **Brand Assets** | Download brand logos, images, or guidelines provided by the business for use in submissions. |
| **Eligibility Rules** | View who can participate (predefined and custom eligibility criteria). |

### 2.3 Submit Proof

| Function | Description |
|----------|-------------|
| **Submit Proof** | Submit proof of task completion with text description, proof links (URLs to social media posts), and image uploads. |
| **Image Upload** | Upload up to 5 images (JPEG, PNG, GIF, WebP), max 5MB each. |
| **Proof Links** | Add multiple URLs pointing to your completed work (social media posts, content, etc.). |
| **Reported Metrics** | Report engagement metrics (views, likes, comments) if required by the bounty. |

### 2.4 My Submissions

| Function | Description |
|----------|-------------|
| **Submissions Dashboard** | View all your submissions with earnings summary cards showing total earned, pending payout, submission count, and approved count. |
| **Filter Submissions** | Filter by status (Submitted, In Review, Needs More Info, Approved, Rejected) and payout status (Not Paid, Pending, Paid). |
| **Submission Detail** | View full submission details including proof text, links, images, reviewer notes, and status timeline. |
| **Update Submission** | Edit your submission when the status is Needs More Info — add additional proof, links, or images. |

### 2.5 Earnings Tracking

| Function | Description |
|----------|-------------|
| **Total Earned** | See the sum of all approved and paid submission rewards. |
| **Pending Payout** | See the sum of approved but not-yet-paid rewards. |
| **Submission Count** | Total submissions, approved count, and rejected count. |

---

## 3. Business Admin Features

Business Admins create and manage bounties, review participant submissions, handle payouts, and manage their organisation.

### 3.1 Business Dashboard

| Function | Description |
|----------|-------------|
| **Dashboard Overview** | Key metrics at a glance: total bounties, active bounties, pending reviews, total submissions. Data is cached for 5 minutes for fast loading. |
| **Quick Actions** | Jump to create a new bounty or review pending submissions directly from the dashboard. |

### 3.2 Bounty Management

| Function | Description |
|----------|-------------|
| **Create Bounty** | Multi-section form to create a new bounty with full configuration. |
| **Draft Saving** | Save bounties as drafts and come back to edit them later. Progress tracked per section. |
| **Edit Bounty** | Update bounty details. When live, only eligibility, proof requirements, max submissions, and end date can be edited. |
| **Duplicate Bounty** | Clone an existing bounty as a new draft with the same configuration. |
| **Delete Bounty** | Delete draft bounties (soft delete). Published bounties cannot be deleted, only closed. |
| **Status Tabs** | Filter your bounties by status: All, Draft, Live, Paused, Closed. |

#### Bounty Configuration Options

| Section | Options |
|---------|---------|
| **Basic Info** | Title (200 chars), short description (500 chars), full instructions (10,000 chars), category |
| **Channels** | Select social channels (Instagram, Facebook, TikTok) with post format requirements |
| **Content Rules** | AI content permission toggle, content guidelines |
| **Rewards** | Up to 10 reward lines with type (Cash, Product, Service, Other), name, and monetary value. Multi-currency support (ZAR, USD, GBP, EUR). |
| **Eligibility** | Predefined rules + up to 5 custom eligibility criteria |
| **Proof Requirements** | Define what proof participants must submit |
| **Post Visibility** | Rules for post duration: Must Not Remove or Minimum Duration (hours, days, weeks) |
| **Engagement** | Minimum views, likes, comments thresholds; tag account requirements |
| **Payout Metrics** | Configure payout calculation metrics |
| **Schedule** | Start date and end date |
| **Max Submissions** | Limit the number of submissions accepted |
| **Brand Assets** | Upload up to 10 files (10MB each) — logos, images, PDFs for participants to use |

### 3.3 Bounty Status Workflow

```
DRAFT ──→ LIVE ──→ PAUSED ──→ LIVE (resume)
                │              │
                └──→ CLOSED ←──┘
```

| Transition | When |
|------------|------|
| Draft → Live | Bounty is ready for participants (payment may be required) |
| Live → Paused | Temporarily stop accepting submissions |
| Paused → Live | Resume accepting submissions |
| Live → Closed | Permanently close the bounty |
| Paused → Closed | Close a paused bounty |

### 3.4 Review Center

| Function | Description |
|----------|-------------|
| **Review Queue** | Centralized queue of all submissions across your organisation's bounties. Filter by status, bounty, and payout status. |
| **Review Submission** | View full submission proof (text, links, images, metrics) and take action. |
| **Approve** | Mark submission as approved. Triggers email notification to participant. |
| **Request More Info** | Ask participant for additional proof. Triggers email notification. Participant can update and resubmit. |
| **Reject** | Reject submission with optional reason. Triggers email notification to participant. |
| **Reviewer Notes** | Add notes (up to 5,000 characters) explaining your review decision. |

### 3.5 Submission Status Workflow

```
SUBMITTED ──→ IN_REVIEW ──→ APPROVED ──→ (payout)
                  │
                  ├──→ NEEDS_MORE_INFO ──→ (participant updates) ──→ IN_REVIEW
                  │
                  └──→ REJECTED
```

### 3.6 Payout Management

| Function | Description |
|----------|-------------|
| **Update Payout Status** | Transition payout from Not Paid → Pending → Paid. |
| **Payout Notes** | Add notes (up to 2,000 characters) for payout tracking. |
| **Auto-Payout** | Approved submissions past their verification deadline are automatically marked as Paid (runs every 10 minutes). |
| **Email Notification** | Participants receive an email when their payout status changes to Paid. |

### 3.7 Payment (Stripe Integration)

| Function | Description |
|----------|-------------|
| **Fund Bounty** | Create a Stripe payment intent to fund a bounty before publishing. |
| **Payment Confirmation** | Stripe webhooks automatically confirm payment and transition bounty from Draft to Live. |
| **Idempotency** | Duplicate payment requests are prevented using idempotency keys. |
| **Payment Failure Handling** | Failed payments are logged and the bounty remains in Draft status. |

### 3.8 Organisation Management

| Function | Description |
|----------|-------------|
| **Create Organisation** | Set up your business with a name, contact email, and optional logo. Creating an organisation promotes your role from Participant to Business Admin. |
| **Edit Organisation** | Update organisation name, contact email, and logo. |
| **View Members** | See all organisation members and their roles (Owner, Member). |
| **Invite Member** | Send an email invitation for another user to join your organisation as a Business Admin. |
| **Remove Member** | Revoke a member's access to the organisation. |

---

## 4. Super Admin Features

Super Admins have full platform access for user management, troubleshooting, compliance, and system configuration.

### 4.1 Admin Dashboard

| Function | Description |
|----------|-------------|
| **Platform Metrics** | Total users, organisations, bounties, and submissions with status breakdowns. |
| **System Health** | Real-time status of Database, Redis, and File Storage services. |
| **Recent Activity** | Live feed of recent platform actions from the audit log. |

### 4.2 User Management

| Function | Description |
|----------|-------------|
| **List Users** | Paginated list of all users with search, filter by role and status. |
| **User Detail** | View full user profile, organisation memberships, and activity. |
| **Suspend User** | Suspend a user account with a required reason. Suspended users cannot log in. |
| **Reinstate User** | Restore a suspended user to active status. |
| **Force Password Reset** | Require a user to reset their password on next login. |

### 4.3 Organisation Oversight

| Function | Description |
|----------|-------------|
| **List Organisations** | Paginated list of all organisations with search and status filter. |
| **Organisation Detail** | View full organisation details, members, and associated bounties. |
| **Create Organisation** | Create an organisation directly (without going through participant signup). |
| **Suspend Organisation** | Suspend an organisation (ACTIVE → SUSPENDED). Requires reason. |
| **Reactivate Organisation** | Restore a suspended organisation. |

### 4.4 Bounty & Submission Oversight

| Function | Description |
|----------|-------------|
| **View All Bounties** | Browse all bounties across the platform with filtering and sorting. |
| **View All Submissions** | Browse all submissions platform-wide with filtering by status, payout, user, and organisation. |
| **Bounty Detail** | View full bounty details from any organisation. |
| **Submission Detail** | View full submission details for any user. |

### 4.5 Emergency Overrides

| Function | Description |
|----------|-------------|
| **Override Bounty Status** | Force-change a bounty's status (e.g., close a harmful bounty). Requires a reason. Fully audit logged with before/after state. |
| **Override Submission Status** | Force-change a submission's status (e.g., force-approve a stuck submission). Requires a reason. Fully audit logged. |

### 4.6 Audit Logs

| Function | Description |
|----------|-------------|
| **Browse Audit Logs** | Paginated, filterable log of all administrative and sensitive actions on the platform. |
| **Filter** | Filter by actor, action type, entity type, entity ID, and date range. |
| **Audit Detail** | View full audit entry: who did what, when, from which IP, with before/after state snapshots. |

**Actions Tracked:**
- User: password changes, resets, suspensions, reinstatements
- Organisation: creation, updates, status changes, member additions/removals
- Bounty: creation, updates, status transitions, overrides, brand asset changes
- Submission: creation, reviews, payout changes, overrides
- Settings: platform configuration changes
- Payments: Stripe payment success/failure events

### 4.7 Platform Settings

| Function | Description |
|----------|-------------|
| **Enable/Disable Signups** | Toggle whether new users can create accounts. Useful during maintenance or invite-only periods. |
| **Enable/Disable Submissions** | Toggle whether participants can submit proof. Useful during platform-wide review freezes. |
| **Settings Persistence** | Settings are stored in the database and survive server restarts. 30-second cache for performance. |

### 4.8 System Health & Troubleshooting

| Function | Description |
|----------|-------------|
| **System Health** | Real-time status check of Database (PostgreSQL), Redis, and File Storage. |
| **Recent Errors** | View recent system errors with timestamps and details. |
| **Response Time** | Health endpoint reports response time for monitoring. |

---

## 5. Email Notifications

The platform sends automated emails for key events.

| Trigger | Recipient | Content |
|---------|-----------|---------|
| **Account Created** | New user | Welcome email with verification link |
| **Email Verification** | User | Verification link (expires 24h, single-use) |
| **Password Reset** | User | Reset link (expires 1h, single-use) |
| **Submission Approved** | Participant | Notification with bounty name and reviewer notes |
| **Submission Rejected** | Participant | Notification with bounty name and rejection reason |
| **More Info Requested** | Participant | Notification with bounty name and what's needed |
| **Payout Sent** | Participant | Payout confirmation with amount and currency |

All emails use branded HTML templates with retry logic (3 attempts with exponential backoff).

---

## 6. Security Features

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Stateless access tokens (15min) with Redis-backed refresh tokens (7d). |
| **Brute Force Protection** | 5-attempt lockout with 15-minute cooldown, tracked per-email in Redis. |
| **RBAC** | Role-based access control enforced on every API endpoint via guard chain. |
| **Input Sanitization** | All user input sanitized via sanitize-html library to prevent XSS. |
| **Password Hashing** | bcrypt with cost factor 12. |
| **Single-Use Tokens** | Password reset and email verification tokens are atomic get-and-delete (cannot be reused). |
| **Rate Limiting** | Per-endpoint throttling on authentication routes (signup: 5/min, login: 10/min, forgot-password: 3/min). |
| **Security Headers** | Helmet with HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff. |
| **Request Tracking** | Every request gets a unique X-Request-Id for debugging and audit correlation. |
| **Audit Trail** | All administrative actions logged with actor, action, entity, before/after state, IP address, and timestamp. |
| **CORS** | Configured per environment with credentials support. |

---

## 7. Technical Specifications

### API

| Spec | Value |
|------|-------|
| Framework | NestJS 10 |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Cache | Redis 7 |
| Auth | Passport JWT |
| Payments | Stripe |
| Email | Nodemailer + Handlebars templates |
| Tests | 505 unit tests (24 suites), all passing |

### Frontend

| Spec | Value |
|------|-------|
| Framework | Next.js 14 (App Router) |
| UI Library | PrimeReact 10 |
| Styling | Tailwind CSS 3 + NeoGlass design system |
| Data Fetching | TanStack React Query 5 |
| Forms | React Hook Form + Zod |
| E2E Tests | Playwright (37 tests) |
| Theme | Dark-first futuristic (NeoGlass) |

### Infrastructure

| Service | Local | Purpose |
|---------|-------|---------|
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Token storage, caching, rate limiting |
| MailHog | localhost:8025 | Email testing (SMTP on port 1025) |

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Participant | participant@demo.com | DemoPassword123! |
| Business Admin | admin@demo.com | DemoPassword123! |
| Super Admin | superadmin@demo.com | DemoPassword123! |

---

## 8. File Upload Specifications

| Context | Max Files | Max Size | Formats |
|---------|-----------|----------|---------|
| Submission Proof | 5 | 5 MB each | JPEG, PNG, GIF, WebP |
| Brand Assets | 10 | 10 MB each | JPEG, PNG, GIF, WebP, PDF |
| Organisation Logo | 1 | 2 MB | Image formats |

---

## 9. Currency Support

| Currency | Code | Symbol |
|----------|------|--------|
| South African Rand | ZAR | R |
| US Dollar | USD | $ |
| British Pound | GBP | £ |
| Euro | EUR | € |
