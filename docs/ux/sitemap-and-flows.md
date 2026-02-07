# UX Sitemap and User Flows - Social Bounty MVP

> **Version**: 1.0
> **Date**: 2026-02-07
> **Source**: `md-files/social-bounty-mvp.md`, `docs/backlog/mvp-backlog.md`, `docs/architecture/database-schema.md`
> **Rule**: MVP scope only. No feature creep.

---

## Table of Contents

- [Assumptions](#assumptions)
- [Part 1: Application Sitemap](#part-1-application-sitemap)
- [Part 2: Navigation Structure](#part-2-navigation-structure)
- [Part 3: Participant Flows](#part-3-participant-flows)
- [Part 4: Business Admin Flows](#part-4-business-admin-flows)
- [Part 5: Super Admin Flows](#part-5-super-admin-flows)
- [Part 6: Shared Flows](#part-6-shared-flows)
- [Part 7: State Machines](#part-7-state-machines)
- [Part 8: Empty States and Error States](#part-8-empty-states-and-error-states)

---

## Assumptions

1. **Role-based landing pages**: After login, users are redirected to their role-specific dashboard. Participants land on the bounty browse page; Business Admins land on their dashboard; Super Admins land on the admin dashboard.
2. **No multi-role switching**: A user has one role at a time. There is no role-switcher in the navigation.
3. **Single sidebar + top bar layout**: The app uses a persistent sidebar for primary navigation and a top bar for user actions (profile, logout). Sidebar items change based on role.
4. **Confirmation dialogs use PrimeReact ConfirmDialog**: All destructive actions show a modal confirmation before proceeding.
5. **Toast notifications use PrimeReact Toast**: Success, error, and info messages appear as toasts in the top-right corner.
6. **Mobile-responsive but desktop-primary**: The MVP targets desktop users. Responsive layout is provided via Tailwind breakpoints but no mobile-specific flows are designed.
7. **Bounty detail page is the hub for submission**: Participants reach the submit proof form directly from the bounty detail page, keeping the flow under 60 seconds.
8. **"Needs More Info" update uses the same form as initial submission**: The update form is pre-filled with existing proof data.

---

## Part 1: Application Sitemap

### Complete Screen Inventory

```
Social Bounty
|
+-- Public (Unauthenticated)
|   +-- /login                          Login page
|   +-- /signup                         Signup page
|   +-- /forgot-password                Request password reset
|   +-- /reset-password?token=xxx       Set new password
|   +-- /verify-email?token=xxx         Email verification landing
|
+-- Participant (role: PARTICIPANT)
|   +-- /bounties                       Browse live bounties (list + filters)
|   +-- /bounties/:id                   Bounty detail
|   +-- /bounties/:id/submit            Submit proof form
|   +-- /my-submissions                 My submissions list
|   +-- /my-submissions/:id             Submission detail
|   +-- /my-submissions/:id/update      Update submission (Needs More Info)
|   +-- /profile                        View profile
|   +-- /profile/edit                   Edit profile
|
+-- Business Admin (role: BUSINESS_ADMIN)
|   +-- /dashboard                      Business Admin dashboard (summary counts)
|   +-- /manage/bounties                Bounty management list (all statuses)
|   +-- /manage/bounties/new            Create bounty form
|   +-- /manage/bounties/:id            View bounty detail (management view)
|   +-- /manage/bounties/:id/edit       Edit bounty form
|   +-- /manage/bounties/:id/submissions  Submissions for a bounty (review list)
|   +-- /manage/submissions/:id         Submission review detail
|   +-- /organisation                   View organisation details
|   +-- /organisation/edit              Edit organisation details
|   +-- /organisation/members           Manage organisation members
|   +-- /profile                        View profile
|   +-- /profile/edit                   Edit profile
|
+-- Super Admin (role: SUPER_ADMIN)
|   +-- /admin/dashboard                Platform-wide dashboard
|   +-- /admin/users                    User management list
|   +-- /admin/users/:id                User detail view
|   +-- /admin/organisations            Organisation management list
|   +-- /admin/organisations/:id        Organisation detail view
|   +-- /admin/bounties                 All bounties (oversight)
|   +-- /admin/bounties/:id             Bounty detail (with override controls)
|   +-- /admin/submissions              All submissions (oversight)
|   +-- /admin/submissions/:id          Submission detail (with override controls)
|   +-- /admin/audit-logs               Audit log list
|   +-- /admin/audit-logs/:id           Audit log entry detail
|   +-- /admin/system                   System health and troubleshooting
|   +-- /admin/settings                 Global toggles (optional)
|   +-- /profile                        View profile
|   +-- /profile/edit                   Edit profile
```

### Screen Count by Role

| Role | Unique Screens | Shared Screens | Total Accessible |
|------|---------------|----------------|-----------------|
| Public (unauthenticated) | 5 | 0 | 5 |
| Participant | 6 | 2 (profile) | 8 |
| Business Admin | 8 | 2 (profile) | 10 |
| Super Admin | 12 | 2 (profile) | 14 |

**Total unique screens**: 33 (including shared profile screens counted once)

---

## Part 2: Navigation Structure

### Top Bar (All Authenticated Users)

```
[Social Bounty Logo]                    [User Name v]
                                          - My Profile
                                          - Logout
```

### Sidebar by Role

**Participant Sidebar:**
```
Browse Bounties      /bounties
My Submissions       /my-submissions
```

**Business Admin Sidebar:**
```
Dashboard            /dashboard
Bounties             /manage/bounties
Organisation         /organisation
```

**Super Admin Sidebar:**
```
Dashboard            /admin/dashboard
Users                /admin/users
Organisations        /admin/organisations
Bounties             /admin/bounties
Submissions          /admin/submissions
Audit Logs           /admin/audit-logs
System Health        /admin/system
Settings             /admin/settings
```

### Navigation Rules

1. Sidebar items are rendered based on the authenticated user's `role` field.
2. Route guards on the frontend reject navigation to unauthorized routes and redirect to the user's default landing page.
3. API endpoints independently enforce RBAC; frontend guards are a UX convenience, not a security boundary.
4. Unauthenticated users accessing any protected route are redirected to `/login` with a `?redirect=` query parameter to return them after login.

---

## Part 3: Participant Flows

### Flow P1: Signup and Email Verification

```
[Visitor]
    |
    v
/signup
    - Form: Full Name, Email, Password, Confirm Password
    - Validation: email uniqueness, password strength (8+ chars, 1 upper, 1 lower, 1 number)
    - On validation error: inline field errors displayed immediately
    |
    | [Submit]
    v
    - Account created (role = PARTICIPANT, status = ACTIVE, emailVerified = false)
    - Verification email sent asynchronously
    - Toast: "Account created successfully"
    - Redirect to /login
    |
    v
/login
    - Form: Email, Password
    - On success: redirect to /bounties (participant default)
    - On failure: "Invalid credentials" (generic, no info leakage)
    - If suspended: "Your account has been suspended. Contact support."
    |
    v
(Optional) User clicks verification link in email
    |
    v
/verify-email?token=xxx
    - Token validated server-side
    - On success: "Email verified" confirmation, link to /bounties
    - On expired token: "Link expired" message with "Resend verification" button
    - On invalid token: "Invalid link" error message
```

**Key UX notes:**
- Signup form uses PrimeReact InputText, Password (with strength meter), and Button components.
- Email verification is non-blocking; unverified users have full access.
- No automatic login after signup (security best practice -- user confirms they can access their email).

---

### Flow P2: Browse Bounties, Filter, View Detail, Submit Proof

**Goal: Complete submission in 60 seconds or less from bounty discovery.**

```
/bounties (Browse Live Bounties)
    - Default view: all Live bounties, sorted by newest
    - Display per item: title, short description, category badge, reward (type + value), org name
    - Filters: Category (dropdown), Reward Type (dropdown), Search (keyword in title/description)
    - Sorting: Newest, Highest Reward, Ending Soon
    - Pagination: server-side, 12 items per page
    - Empty state: "No bounties match your filters. Try adjusting your search."
    |
    | [Click bounty card]
    v
/bounties/:id (Bounty Detail)
    - Full detail view: title, full instructions, category, reward type + value/description,
      eligibility rules, proof requirements, organisation name, start/end dates,
      remaining submissions (if maxSubmissions is set)
    - Status badge: Live / Paused / Closed
    - Conditional elements:
      * [Live + not yet submitted] -> "Submit Proof" button (primary, prominent)
      * [Live + already submitted] -> Submission status badge + link to /my-submissions/:id
      * [Paused] -> "This bounty is currently paused" info banner
      * [Closed] -> "This bounty is closed" info banner
      * [Max submissions reached] -> "Maximum submissions reached" warning banner
    |
    | [Click "Submit Proof"]
    v
/bounties/:id/submit (Submit Proof Form)
    - Pre-filled: bounty title shown as read-only header
    - Form fields:
      * Proof Text (required) -- PrimeReact InputTextarea, autofocus
      * Proof Links (optional) -- dynamic list, add/remove link fields
      * Proof Images (optional) -- PrimeReact FileUpload, images only (JPEG/PNG/GIF/WebP), max 5MB each
    - Validation: proof text required, image MIME type validation
    - On submit:
      * Submission created (status = SUBMITTED, payoutStatus = NOT_PAID)
      * Toast: "Proof submitted successfully!"
      * Redirect to /my-submissions
    - On error: inline validation errors, toast for server errors
    |
    v
/my-submissions (confirmation via toast + appears in list)
```

**60-second UX budget:**
| Step | Target Time | Cumulative |
|------|-------------|------------|
| Click bounty from list | 0s | 0s |
| Read proof requirements | 15s | 15s |
| Click "Submit Proof" | 2s | 17s |
| Type proof text | 25s | 42s |
| Add links/images (optional) | 12s | 54s |
| Click Submit | 2s | 56s |
| **Total** | | **56s** |

Design decisions to hit this target:
- Submit button is on bounty detail page (no intermediate navigation).
- Submit form autofocuses the proof text field.
- Proof requirements are visible inline on the submit form as a reference panel.
- Image upload supports drag-and-drop for speed.
- Minimal required fields (only proof text).

---

### Flow P3: Track Submissions and Respond to "Needs More Info"

```
/my-submissions (My Submissions List)
    - Sorted by newest first
    - Each item displays: bounty title, submission date, status badge, payout status badge
    - Status badges use distinct colors:
      * Submitted: blue
      * In Review: orange
      * Needs More Info: yellow with icon
      * Approved: green
      * Rejected: red
    - Payout badges:
      * Not Paid: gray
      * Pending: orange
      * Paid: green
    - Pagination: server-side, 10 items per page
    - Empty state: "You haven't submitted any proof yet. Browse bounties to get started." + link to /bounties
    |
    | [Click submission row]
    v
/my-submissions/:id (Submission Detail)
    - Shows: bounty title (linked), proof text, proof links, proof images (thumbnails, click to enlarge),
      status badge, reviewer note (if any), payout status badge, submission date, last updated date
    - Conditional elements:
      * [status = NEEDS_MORE_INFO] -> "Update Submission" button + reviewer note highlighted
      * [status = APPROVED, payoutStatus = PAID] -> "Reward paid" confirmation banner
    |
    | [Click "Update Submission"] (only when status = NEEDS_MORE_INFO)
    v
/my-submissions/:id/update (Update Submission Form)
    - Pre-filled with existing proof text, links, images
    - Reviewer note displayed prominently at the top as context
    - Same form fields as initial submission
    - On submit:
      * Submission updated, status changes to SUBMITTED
      * Toast: "Submission updated successfully"
      * Redirect to /my-submissions/:id
```

---

### Flow P4: Edit Profile

```
/profile (View Profile)
    - Displays: full name, email, role badge, email verification status, account creation date
    - "Edit Profile" button
    - If email not verified: "Verify your email" banner with "Resend verification" button
    |
    | [Click "Edit Profile"]
    v
/profile/edit (Edit Profile Form)
    - Editable fields: First Name, Last Name
    - "Change Password" section (expandable):
      * Current Password (required for password change)
      * New Password (with strength meter)
      * Confirm New Password
    - Email is shown read-only (cannot be changed, MVP constraint)
    - On save name: Toast "Profile updated"
    - On save password: Toast "Password changed successfully"
    - On validation error: inline field errors
    - "Cancel" button returns to /profile
```

---

## Part 4: Business Admin Flows

### Flow B1: Login to Dashboard

```
/login
    - Email + Password
    - On success (role = BUSINESS_ADMIN): redirect to /dashboard
    |
    v
/dashboard (Business Admin Dashboard)
    - Summary cards:
      * Total Bounties (with breakdown: Draft / Live / Paused / Closed)
      * Total Submissions (with breakdown: Submitted / In Review / Needs More Info / Approved / Rejected)
      * Pending Reviews (count of submissions in Submitted + In Review status)
      * Payouts (breakdown: Not Paid / Pending / Paid)
    - Quick actions:
      * "Create New Bounty" button -> /manage/bounties/new
      * "Review Submissions" link -> filters submissions needing review
    - Data is scoped to the Business Admin's organisation only
    - All counts are simple numbers (no charts per spec)
```

---

### Flow B2: Create Bounty (Draft to Publish)

```
/dashboard or /manage/bounties
    |
    | [Click "Create New Bounty"]
    v
/manage/bounties/new (Create Bounty Form)
    - Form fields (PrimeReact components):
      * Title (InputText, required)
      * Short Description (InputTextarea, required, max 200 chars)
      * Full Instructions (InputTextarea / Editor, required)
      * Category (Dropdown, required, predefined list)
      * Reward Type (Dropdown: Cash / Product / Service / Other, required)
      * Reward Value (InputNumber, shown when type is Cash)
      * Reward Description (InputText, shown when type is Product/Service/Other)
      * Max Submissions (InputNumber, optional)
      * Start Date (Calendar, optional)
      * End Date (Calendar, optional, must be after start date)
      * Eligibility Rules (InputTextarea, required)
      * Proof Requirements (InputTextarea, required)
    - Form validation: all required fields, date ordering, positive reward values
    - On validation error: inline errors per field
    |
    | [Click "Save as Draft"]
    v
    - Bounty created with status = DRAFT
    - Toast: "Bounty saved as draft"
    - Redirect to /manage/bounties/:id (management detail view)
    |
    v
/manage/bounties/:id (Bounty Management Detail)
    - Shows all bounty fields + status badge
    - Action buttons based on status:
      * [DRAFT]: "Publish" | "Edit" | "Delete"
      * [LIVE]: "Pause" | "Close" | "Edit" (limited fields) | "View Submissions"
      * [PAUSED]: "Resume (Go Live)" | "Close" | "Edit"
      * [CLOSED]: read-only, "View Submissions" only
    |
    | [Click "Publish"]
    v
    - Validation: all mandatory fields must be filled
    - On validation failure: toast listing missing fields
    - On validation pass: status changes to LIVE
    - Toast: "Bounty is now live!"
    - Page refreshes to show LIVE status badge and updated actions
```

---

### Flow B3: Manage Bounties (Pause / Close / Edit)

```
/manage/bounties (Bounty Management List)
    - Shows ALL bounties for the organisation (Draft, Live, Paused, Closed)
    - Each row: title, status badge, submission count, creation date
    - Filters: status dropdown
    - Sorting: newest, title (A-Z), status
    - Pagination: server-side, 10 per page
    - Empty state: "No bounties yet. Create your first bounty." + "Create Bounty" button
    |
    | [Click bounty row]
    v
/manage/bounties/:id (Bounty Management Detail)
    |
    +-- [Click "Pause"] (from LIVE status)
    |     - Confirmation dialog: "Are you sure you want to pause this bounty? It will no longer be visible to participants."
    |     - On confirm: status -> PAUSED, toast "Bounty paused"
    |     - Audit log created
    |
    +-- [Click "Resume"] (from PAUSED status)
    |     - Status -> LIVE, toast "Bounty is live again"
    |     - Audit log created
    |
    +-- [Click "Close"] (from LIVE or PAUSED)
    |     - Confirmation dialog: "Are you sure you want to close this bounty? This action cannot be undone. No new submissions will be accepted."
    |     - On confirm: status -> CLOSED, toast "Bounty closed"
    |     - Audit log created
    |
    +-- [Click "Delete"] (from DRAFT only)
    |     - Confirmation dialog: "Are you sure you want to delete this draft bounty? This action cannot be undone."
    |     - On confirm: soft delete, toast "Draft bounty deleted"
    |     - Redirect to /manage/bounties
    |     - Audit log created
    |
    +-- [Click "Edit"]
          |
          v
        /manage/bounties/:id/edit (Edit Bounty Form)
          - If DRAFT or PAUSED: all fields editable
          - If LIVE: only limited fields editable (eligibility rules, proof requirements, max submissions, end date)
          - Non-editable fields shown as read-only with visual distinction
          - On save: toast "Bounty updated", redirect to detail view
          - Audit log created with before/after state
```

---

### Flow B4: Review Submissions (Approve / Reject / Needs More Info)

```
/manage/bounties/:id (Bounty Management Detail)
    |
    | [Click "View Submissions" or submission count link]
    v
/manage/bounties/:id/submissions (Submission Review List)
    - Shows all submissions for this bounty
    - Each row: participant name, submission date, status badge, payout status badge
    - Filters: status dropdown
    - Sorting: newest first (default), status
    - Pagination: server-side, 10 per page
    - Empty state: "No submissions yet for this bounty."
    |
    | [Click submission row]
    v
/manage/submissions/:id (Submission Review Detail)
    - Displays: participant name, proof text, proof links (clickable), proof images (viewable/expandable),
      status badge, payout status badge, reviewer note (if any), submission date
    - Auto-transition: if status is SUBMITTED, it changes to IN_REVIEW when a reviewer opens this page
    - Review action panel (one-click actions):
      +-----------------------------------------------+
      | Optional Note: [__________________________]   |
      |                                               |
      | [Approve]  [Needs More Info]  [Reject]        |
      +-----------------------------------------------+
    |
    +-- [Click "Approve"]
    |     - Confirmation dialog: "Approve this submission? The participant will be notified."
    |     - On confirm: status -> APPROVED
    |     - Email notification sent to participant (async)
    |     - Toast: "Submission approved"
    |     - Audit log with before/after state
    |     - Payout controls become visible
    |
    +-- [Click "Needs More Info"]
    |     - No confirmation dialog (non-destructive action)
    |     - Note field is highlighted as recommended but not required
    |     - Status -> NEEDS_MORE_INFO
    |     - Email notification sent to participant (async)
    |     - Toast: "Participant notified to provide more info"
    |     - Audit log created
    |
    +-- [Click "Reject"]
          - Confirmation dialog: "Reject this submission? This action is final. The participant will be notified."
          - Note field is highlighted as recommended
          - On confirm: status -> REJECTED
          - Email notification sent to participant (async)
          - Toast: "Submission rejected"
          - Audit log with before/after state
```

**One-click + optional note implementation:**
- The note field is always visible above the action buttons.
- Clicking an action button immediately triggers the action (with confirmation dialog for Approve/Reject).
- Whatever is in the note field at the time of click is attached to the action.
- The note field is never required but is visually encouraged for Reject and Needs More Info.

---

### Flow B5: Mark Payout Status

```
/manage/submissions/:id (Submission Review Detail -- after Approve)
    - Payout status section visible only when submission status = APPROVED
    - Current payout status shown as badge
    - Payout action buttons based on current status:
      * [NOT_PAID]: "Mark as Pending" | "Mark as Paid"
      * [PENDING]: "Mark as Paid"
      * [PAID]: no actions (final state, read-only)
    - Optional payout note field
    |
    +-- [Click "Mark as Pending"]
    |     - Payout status -> PENDING
    |     - Email notification sent to participant (async)
    |     - Toast: "Payout marked as pending"
    |     - Audit log created
    |
    +-- [Click "Mark as Paid"]
          - Confirmation dialog: "Confirm this participant has been paid?"
          - Payout status -> PAID
          - Email notification sent to participant (async)
          - Toast: "Payout marked as paid"
          - Audit log created
```

---

## Part 5: Super Admin Flows

### Flow S1: Login to Dashboard

```
/login
    - Email + Password
    - On success (role = SUPER_ADMIN): redirect to /admin/dashboard
    |
    v
/admin/dashboard (Super Admin Dashboard)
    - Platform-wide summary cards:
      * Total Users (with breakdown by role: Participant / Business Admin / Super Admin)
      * Total Organisations (breakdown: Active / Suspended)
      * Total Bounties (breakdown: Draft / Live / Paused / Closed)
      * Total Submissions (breakdown: Submitted / In Review / Needs More Info / Approved / Rejected)
      * Payouts (breakdown: Not Paid / Pending / Paid)
    - Recent activity panel:
      * Last 10 audit log entries (timestamp, actor, action summary)
      * Link to full audit log viewer
    - All counts are simple numbers (no charts per spec)
```

---

### Flow S2: User Management

```
/admin/users (User Management List)
    - PrimeReact DataTable with columns:
      Name | Email | Role | Status | Email Verified | Created
    - Search: search bar filtering by email or name (server-side)
    - Filters: role dropdown, status dropdown
    - Pagination: server-side, 20 per page
    - Empty state: "No users match your search criteria."
    |
    | [Click user row]
    v
/admin/users/:id (User Detail)
    - Displays: full name, email, role badge, status badge, email verification status,
      creation date, last login date
    - If user is Business Admin: organisation name (linked to org detail)
    - Submission history summary (count by status)
    - Action buttons:
      * [ACTIVE user]: "Suspend User" | "Force Password Reset"
      * [SUSPENDED user]: "Reinstate User" | "Force Password Reset"
    |
    +-- [Click "Suspend User"]
    |     - Confirmation dialog with mandatory reason field:
    |       "Suspend this user? They will be unable to log in."
    |       Reason: [_________________________] (required)
    |     - On confirm (reason provided): status -> SUSPENDED
    |     - Toast: "User suspended"
    |     - Audit log created with reason
    |
    +-- [Click "Reinstate User"]
    |     - Confirmation dialog with mandatory reason field:
    |       "Reinstate this user? They will be able to log in again."
    |       Reason: [_________________________] (required)
    |     - On confirm: status -> ACTIVE
    |     - Toast: "User reinstated"
    |     - Audit log created with reason
    |
    +-- [Click "Force Password Reset"]
          - Confirmation dialog: "Send a password reset email to this user?"
          - On confirm: password reset email sent
          - Toast: "Password reset email sent"
          - Audit log created
```

---

### Flow S3: Organisation Management

```
/admin/organisations (Organisation Management List)
    - PrimeReact DataTable with columns:
      Name | Contact Email | Status | Members | Bounties | Created
    - Search: by organisation name (server-side)
    - Filters: status dropdown
    - Pagination: server-side, 20 per page
    - Empty state: "No organisations match your search criteria."
    |
    | [Click organisation row]
    v
/admin/organisations/:id (Organisation Detail)
    - Displays: name, logo, contact email, status badge, member list (names + roles),
      bounty count, creation date
    - Action buttons:
      * [ACTIVE org]: "Suspend Organisation"
      * [SUSPENDED org]: "Reinstate Organisation"
    |
    +-- [Click "Suspend Organisation"]
    |     - Confirmation dialog with mandatory reason field:
    |       "Suspend this organisation? All its live bounties will be paused automatically."
    |       Reason: [_________________________] (required)
    |     - On confirm:
    |       * Organisation status -> SUSPENDED
    |       * All LIVE bounties for this org -> PAUSED
    |       * Toast: "Organisation suspended. X bounties paused."
    |       * Audit log created with reason
    |
    +-- [Click "Reinstate Organisation"]
          - Confirmation dialog with mandatory reason field:
            "Reinstate this organisation?"
            Reason: [_________________________] (required)
          - On confirm:
            * Organisation status -> ACTIVE
            * Note: bounties remain PAUSED -- Business Admin must manually re-publish
            * Toast: "Organisation reinstated"
            * Audit log created with reason
```

---

### Flow S4: Bounty and Submission Oversight with Overrides

```
/admin/bounties (All Bounties -- Oversight View)
    - PrimeReact DataTable with columns:
      Title | Organisation | Status | Submissions | Created
    - Search: keyword in title
    - Filters: status dropdown, organisation dropdown
    - Pagination: server-side, 20 per page
    |
    | [Click bounty row]
    v
/admin/bounties/:id (Bounty Detail -- Admin View)
    - Full bounty detail (same fields as Business Admin view)
    - Current status badge (prominent)
    - "Override Status" button
    |
    | [Click "Override Status"]
    v
    - Override modal:
      +------------------------------------------+
      |  Override Bounty Status                   |
      |                                           |
      |  Current Status: [LIVE]                   |
      |  New Status: [Dropdown: Draft/Live/       |
      |               Paused/Closed]              |
      |  Reason: [_________________________]      |
      |           (required)                      |
      |                                           |
      |  [Cancel]              [Override Status]  |
      +------------------------------------------+
    - On confirm (reason provided):
      * Status changed to selected value
      * Toast: "Bounty status overridden to [new status]"
      * Audit log created with before/after state and mandatory reason
    - On validation error (no reason): "Reason is required for all admin overrides"

---

/admin/submissions (All Submissions -- Oversight View)
    - PrimeReact DataTable with columns:
      Bounty Title | Participant | Status | Payout | Submitted
    - Search: by participant email or bounty title
    - Filters: status dropdown, payout status dropdown
    - Pagination: server-side, 20 per page
    |
    | [Click submission row]
    v
/admin/submissions/:id (Submission Detail -- Admin View)
    - Full submission detail (same fields as review view)
    - Proof text, links, images
    - Status + payout badges
    - Reviewer note
    - "Override Status" button
    - "Override Payout Status" button (if submission is APPROVED)
    |
    +-- [Click "Override Status"]
    |     - Override modal (same pattern as bounty override):
    |       * New Status dropdown: Submitted / In Review / Needs More Info / Approved / Rejected
    |       * Reason: required text field
    |       * Confirmation: "Override Submission Status"
    |     - Audit log with before/after + reason
    |
    +-- [Click "Override Payout Status"] (only for APPROVED submissions)
          - Override modal:
            * New Payout Status dropdown: Not Paid / Pending / Paid
            * Reason: required text field
            * Confirmation: "Override Payout Status"
          - Audit log with before/after + reason
```

---

### Flow S5: Audit Log Viewer

```
/admin/audit-logs (Audit Log List)
    - PrimeReact DataTable with columns:
      Timestamp | Actor | Role | Action | Entity Type | Entity ID | Summary
    - Filters:
      * Actor: search by name/email
      * Action Type: dropdown (e.g., CREATE, UPDATE, DELETE, STATUS_CHANGE, OVERRIDE, LOGIN, etc.)
      * Entity Type: dropdown (User, Organisation, Bounty, Submission, etc.)
      * Date Range: calendar range picker (start date, end date)
    - Sorting: newest first (default)
    - Pagination: server-side, 25 per page
    - Read-only: no edit or delete actions available
    - Empty state: "No audit log entries match your filters."
    |
    | [Click log entry row]
    v
/admin/audit-logs/:id (Audit Log Detail)
    - Full detail view:
      * Timestamp (formatted)
      * Actor: name, email, role badge
      * Action performed
      * Entity type + entity ID (linked to entity if it exists)
      * Before state (JSON, formatted as readable key-value pairs)
      * After state (JSON, formatted as readable key-value pairs)
      * Reason (if provided, e.g., for overrides)
      * IP address
    - "Back to Audit Logs" button
```

---

### Flow S6: System Health and Troubleshooting

```
/admin/system (System Health and Troubleshooting)
    - Section 1: System Health Status
      * Overall status indicator: green (healthy) / red (unhealthy)
      * Database connection: connected / disconnected
      * API uptime
      * Application version
      * Last health check timestamp
      * "Refresh" button to re-check
    |
    - Section 2: Recent Errors
      * List of recent error entries (from Sentry or error tracking)
      * Each entry: timestamp, error message, affected endpoint, occurrence count
      * Expandable rows showing stack trace summary
      * Sorted by most recent first
      * Pagination: 20 per page
    |
    - Section 3: Global Settings (optional, lower priority)
      * Toggle: Disable New Signups (on/off)
      * Toggle: Disable New Submissions (on/off)
      * Each toggle shows current state and last changed timestamp
      * Toggle changes require confirmation dialog
      * Audit log created for toggle changes
```

---

## Part 6: Shared Flows

### Flow X1: Password Reset (All Roles)

```
/login
    |
    | [Click "Forgot password?"]
    v
/forgot-password
    - Form: Email
    - On submit: always shows "If an account exists with this email, a reset link has been sent."
      (no information leakage regardless of whether account exists)
    - Rate limited
    |
    v
User receives email with reset link
    |
    | [Click link in email]
    v
/reset-password?token=xxx
    - Token validated server-side on page load
    - If token invalid/expired: "This reset link is invalid or has expired. Request a new one." + link to /forgot-password
    - If token valid:
      * Form: New Password, Confirm New Password
      * Password strength requirements enforced
      * On success: "Password reset successfully" + redirect to /login
      * Token is invalidated after use (single-use)
      * Audit log created
```

### Flow X2: Logout (All Roles)

```
[Any page -- top bar user menu]
    |
    | [Click "Logout"]
    v
    - Token/session invalidated server-side
    - Client-side auth state cleared
    - Redirect to /login
    - Toast: "You have been logged out"
```

### Flow X3: Session Expiry (All Roles)

```
[Any page -- API call returns 401]
    |
    v
    - Interceptor detects 401 response
    - Client-side auth state cleared
    - Redirect to /login?redirect=[current-path]
    - Toast: "Your session has expired. Please log in again."
    - After re-login, user is returned to the page they were on
```

---

## Part 7: State Machines

### Bounty Status State Machine

```
                    +-------+
                    | DRAFT |
                    +---+---+
                        |
                   [Publish]
                   (all required
                   fields filled)
                        |
                        v
                    +------+
              +---->| LIVE |<----+
              |     +--+---+    |
              |        |        |
         [Resume]   [Pause]   [Resume]
              |        |        |
              |        v        |
              |   +--------+   |
              +---| PAUSED |---+
                  +----+---+
                       |
                    [Close]
                       |        [Close]
                       v    <---- (also from LIVE)
                  +--------+
                  | CLOSED |
                  +--------+

Valid transitions:
  DRAFT  -> LIVE     (Publish -- requires all mandatory fields)
  LIVE   -> PAUSED   (Pause)
  PAUSED -> LIVE     (Resume)
  LIVE   -> CLOSED   (Close -- confirmation required, irreversible)
  PAUSED -> CLOSED   (Close -- confirmation required, irreversible)
  DRAFT  -> deleted  (Soft delete -- confirmation required)

Super Admin can override to any status (with mandatory reason).
```

### Submission Status State Machine

```
  +-----------+
  | SUBMITTED |<-----------+
  +-----+-----+            |
        |                   |
   [Reviewer opens]    [Participant
        |               updates after
        v               Needs More Info]
  +-----------+            |
  | IN_REVIEW |            |
  +--+--+--+--+            |
     |  |  |               |
     |  |  +---[Needs More Info]----> +------------------+
     |  |                             | NEEDS_MORE_INFO  |---+
     |  |                             +------------------+   |
     |  |                                                    |
     |  +-----[Reject]---->  +----------+                    |
     |                       | REJECTED |                    |
     |                       +----------+                    |
     |                                                       |
     +------[Approve]--->  +----------+                      |
                           | APPROVED |                      |
                           +----------+                      |

Valid transitions:
  SUBMITTED       -> IN_REVIEW        (auto, when reviewer opens)
  IN_REVIEW       -> APPROVED         (Approve -- confirmation required)
  IN_REVIEW       -> REJECTED         (Reject -- confirmation required)
  IN_REVIEW       -> NEEDS_MORE_INFO  (Needs More Info)
  NEEDS_MORE_INFO -> SUBMITTED        (Participant updates proof)

Super Admin can override to any status (with mandatory reason).
```

### Payout Status State Machine

```
  +----------+
  | NOT_PAID |
  +----+-----+
       |
       +--[Mark Pending]--> +----------+
       |                    | PENDING  |
       |                    +----+-----+
       |                         |
       |                    [Mark Paid]
       |                         |
       +---[Mark Paid]---->  +------+
                             | PAID |
                             +------+

Valid transitions:
  NOT_PAID -> PENDING
  NOT_PAID -> PAID    (direct, for immediate payments)
  PENDING  -> PAID

Payout status changes only available when submission status = APPROVED.
Super Admin can override payout status (with mandatory reason).
```

---

## Part 8: Empty States and Error States

### Empty States

Every list/table view must have a meaningful empty state. The pattern is:

| Screen | Empty State Message | Action |
|--------|-------------------|--------|
| Browse Bounties (no results) | "No bounties match your filters. Try adjusting your search." | Clear filters link |
| Browse Bounties (none exist) | "No bounties are available right now. Check back soon!" | -- |
| My Submissions (none) | "You haven't submitted any proof yet. Browse bounties to get started." | Link to /bounties |
| Bounty Management (none) | "No bounties yet. Create your first bounty." | "Create Bounty" button |
| Submission Review (none) | "No submissions yet for this bounty." | -- |
| User Management (no results) | "No users match your search criteria." | Clear search link |
| Org Management (no results) | "No organisations match your search criteria." | Clear search link |
| Audit Logs (no results) | "No audit log entries match your filters." | Clear filters link |
| Recent Errors (none) | "No recent errors. The system is running smoothly." | -- |

### Error States

| Scenario | Behavior |
|----------|----------|
| Network error (API unreachable) | Toast (error): "Unable to reach the server. Please check your connection and try again." |
| 400 Bad Request (validation) | Inline field-level errors on forms; toast summary for non-form errors |
| 401 Unauthorized (session expired) | Redirect to /login with redirect param; toast "Session expired" |
| 403 Forbidden (wrong role) | Redirect to user's default landing page; toast "You don't have permission to access that page." |
| 404 Not Found (entity missing) | Full-page "Not Found" message: "The resource you're looking for doesn't exist or has been removed." + link to go back |
| 409 Conflict (duplicate submission) | Toast: "You have already submitted proof for this bounty." + link to existing submission |
| 429 Too Many Requests (rate limited) | Toast: "Too many requests. Please wait a moment and try again." |
| 500 Internal Server Error | Toast (error): "Something went wrong. Our team has been notified." (Sentry captures details) |
| File upload error (wrong type) | Inline error: "Only image files are allowed (JPEG, PNG, GIF, WebP)." |
| File upload error (too large) | Inline error: "File size must be under 5MB." |

### Confirmation Dialogs (Destructive Actions)

All confirmation dialogs follow a consistent pattern using PrimeReact ConfirmDialog:

| Action | Dialog Title | Dialog Message | Confirm Button | Cancel Button |
|--------|-------------|----------------|----------------|---------------|
| Close bounty | Close Bounty | "Are you sure you want to close this bounty? This action cannot be undone. No new submissions will be accepted." | "Yes, Close" (danger) | "Cancel" |
| Delete draft bounty | Delete Bounty | "Are you sure you want to delete this draft bounty? This action cannot be undone." | "Yes, Delete" (danger) | "Cancel" |
| Approve submission | Approve Submission | "Approve this submission? The participant will be notified." | "Approve" (success) | "Cancel" |
| Reject submission | Reject Submission | "Reject this submission? This action is final. The participant will be notified." | "Reject" (danger) | "Cancel" |
| Suspend user | Suspend User | "Suspend this user? They will be unable to log in." + Reason field (required) | "Suspend" (danger) | "Cancel" |
| Reinstate user | Reinstate User | "Reinstate this user? They will be able to log in again." + Reason field (required) | "Reinstate" (success) | "Cancel" |
| Suspend organisation | Suspend Organisation | "Suspend this organisation? All its live bounties will be paused automatically." + Reason field (required) | "Suspend" (danger) | "Cancel" |
| Override status | Override Status | "Override [entity] status from [current] to [new]?" + Reason field (required) | "Override" (warning) | "Cancel" |
| Mark as paid | Confirm Payment | "Confirm this participant has been paid?" | "Confirm Paid" (success) | "Cancel" |
| Remove org member | Remove Member | "Remove this member from the organisation? They will lose Business Admin privileges." | "Remove" (danger) | "Cancel" |
| Toggle global setting | Confirm Setting Change | "Are you sure you want to [enable/disable] [setting name]?" | "Confirm" (warning) | "Cancel" |

---

## Summary

| Deliverable | Count |
|------------|-------|
| Total unique screens | 33 |
| Public screens | 5 |
| Participant screens | 8 |
| Business Admin screens | 10 |
| Super Admin screens | 14 |
| User flows documented | 13 (P1-P4, B1-B5, S1-S6, plus 3 shared) |
| State machines | 3 (Bounty, Submission, Payout) |
| Empty states defined | 9 |
| Error states defined | 10 |
| Confirmation dialogs | 11 |

---

*This document follows the spec at `md-files/social-bounty-mvp.md` strictly. No features outside the spec have been added. All assumptions are documented at the top of this document.*
