# Screen-by-Screen UX Specifications - Social Bounty MVP

> **Version**: 1.0
> **Date**: 2026-02-07
> **Source**: `docs/ux/sitemap-and-flows.md`, `md-files/social-bounty-mvp.md`, `docs/backlog/mvp-backlog.md`, `docs/architecture/database-schema.md`
> **Rule**: MVP scope only. No feature creep.

---

## Table of Contents

- [Conventions Used in This Document](#conventions-used-in-this-document)
- [1. Public Screens](#1-public-screens)
  - [1.1 Login](#11-login)
  - [1.2 Signup](#12-signup)
  - [1.3 Forgot Password](#13-forgot-password)
  - [1.4 Reset Password](#14-reset-password)
  - [1.5 Verify Email](#15-verify-email)
- [2. Participant Screens](#2-participant-screens)
  - [2.1 Browse Bounties](#21-browse-bounties)
  - [2.2 Bounty Detail (Participant)](#22-bounty-detail-participant)
  - [2.3 Submit Proof](#23-submit-proof)
  - [2.4 My Submissions List](#24-my-submissions-list)
  - [2.5 Submission Detail (Participant)](#25-submission-detail-participant)
  - [2.6 Update Submission](#26-update-submission)
- [3. Profile Screens (All Roles)](#3-profile-screens-all-roles)
  - [3.1 View Profile](#31-view-profile)
  - [3.2 Edit Profile](#32-edit-profile)
- [4. Business Admin Screens](#4-business-admin-screens)
  - [4.1 Business Admin Dashboard](#41-business-admin-dashboard)
  - [4.2 Bounty Management List](#42-bounty-management-list)
  - [4.3 Create Bounty](#43-create-bounty)
  - [4.4 Bounty Management Detail](#44-bounty-management-detail)
  - [4.5 Edit Bounty](#45-edit-bounty)
  - [4.6 Submission Review List](#46-submission-review-list)
  - [4.7 Submission Review Detail](#47-submission-review-detail)
  - [4.8 View Organisation](#48-view-organisation)
  - [4.9 Edit Organisation](#49-edit-organisation)
  - [4.10 Manage Organisation Members](#410-manage-organisation-members)
- [5. Super Admin Screens](#5-super-admin-screens)
  - [5.1 Super Admin Dashboard](#51-super-admin-dashboard)
  - [5.2 User Management List](#52-user-management-list)
  - [5.3 User Detail](#53-user-detail)
  - [5.4 Organisation Management List](#54-organisation-management-list)
  - [5.5 Organisation Detail (Admin)](#55-organisation-detail-admin)
  - [5.6 Bounty Oversight List](#56-bounty-oversight-list)
  - [5.7 Bounty Detail (Admin)](#57-bounty-detail-admin)
  - [5.8 Submission Oversight List](#58-submission-oversight-list)
  - [5.9 Submission Detail (Admin)](#59-submission-detail-admin)
  - [5.10 Audit Log List](#510-audit-log-list)
  - [5.11 Audit Log Detail](#511-audit-log-detail)
  - [5.12 System Health and Troubleshooting](#512-system-health-and-troubleshooting)
  - [5.13 Global Settings](#513-global-settings)

---

## Conventions Used in This Document

Each screen specification follows this structure:

- **Route**: URL path
- **Purpose**: What the screen does and why it exists
- **Roles**: Which user roles can access this screen
- **Entry Points**: How users navigate to this screen
- **Layout**: Page structure and major sections
- **Key Information Displayed**: Data shown on the screen
- **Primary Actions**: The main thing a user does on this screen
- **Secondary Actions**: Other available interactions
- **Form Fields** (where applicable): Inputs with types, validation, and requirements
- **Empty State**: What shows when there is no data
- **Error States**: Error scenarios and their display
- **Loading State**: What shows while data is being fetched
- **PrimeReact Components**: Specific PrimeReact components to use

---

## 1. Public Screens

### 1.1 Login

| Field | Value |
|-------|-------|
| **Route** | `/login` |
| **Purpose** | Authenticate existing users and route them to their role-specific dashboard |
| **Roles** | Unauthenticated visitors only. Authenticated users are redirected to their dashboard. |
| **Entry Points** | Direct URL, redirect from protected routes, link from signup page, link from password reset confirmation |

**Layout:**
- Centered card on a plain background
- Social Bounty logo at top
- Login form
- Links below the form

**Key Information Displayed:**
- Social Bounty branding/logo
- Login form
- "Forgot password?" link
- "Don't have an account? Sign up" link

**Form Fields:**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| Email | InputText | email | Yes | Valid email format |
| Password | Password (no strength meter) | password | Yes | Non-empty |

**Primary Actions:**
- "Log In" button (submit form)

**Secondary Actions:**
- "Forgot password?" link -> `/forgot-password`
- "Don't have an account? Sign up" link -> `/signup`

**Empty State:** N/A (form page)

**Error States:**
- Invalid credentials: inline message below form "Invalid email or password" (generic, no info leakage)
- Suspended account: inline message "Your account has been suspended. Contact support."
- Rate limited: inline message "Too many login attempts. Please try again in a few minutes."
- Network error: toast "Unable to reach the server. Please check your connection."

**Loading State:**
- "Log In" button shows a spinner and is disabled during submission

**PrimeReact Components:** InputText, Password, Button, Message (for inline errors)

---

### 1.2 Signup

| Field | Value |
|-------|-------|
| **Route** | `/signup` |
| **Purpose** | Create a new Participant account |
| **Roles** | Unauthenticated visitors only |
| **Entry Points** | Link from login page, direct URL |

**Layout:**
- Centered card on a plain background
- Social Bounty logo at top
- Signup form
- Link to login below

**Key Information Displayed:**
- Social Bounty branding/logo
- Signup form
- "Already have an account? Log in" link

**Form Fields:**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| First Name | InputText | text | Yes | Non-empty, max 100 chars |
| Last Name | InputText | text | Yes | Non-empty, max 100 chars |
| Email | InputText | email | Yes | Valid email format, unique (server-side) |
| Password | Password (with strength meter) | password | Yes | 8+ chars, 1 uppercase, 1 lowercase, 1 number |
| Confirm Password | Password (no strength meter) | password | Yes | Must match Password field |

**Primary Actions:**
- "Create Account" button (submit form)

**Secondary Actions:**
- "Already have an account? Log in" link -> `/login`

**Empty State:** N/A (form page)

**Error States:**
- Validation errors: inline per field (e.g., "Password must be at least 8 characters", "Passwords do not match")
- Duplicate email: inline on email field "An account with this email already exists"
- Rate limited: inline message "Too many signup attempts. Please try again later."
- Network error: toast "Unable to reach the server."

**Loading State:**
- "Create Account" button shows spinner and is disabled during submission

**PrimeReact Components:** InputText, Password (with feedback for strength), Button, Message

---

### 1.3 Forgot Password

| Field | Value |
|-------|-------|
| **Route** | `/forgot-password` |
| **Purpose** | Request a password reset email |
| **Roles** | Unauthenticated visitors |
| **Entry Points** | Link from login page |

**Layout:**
- Centered card
- Heading: "Reset your password"
- Description text: "Enter your email address and we'll send you a link to reset your password."
- Email form
- Back to login link

**Key Information Displayed:**
- Instructions
- Email form
- Confirmation message after submission

**Form Fields:**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| Email | InputText | email | Yes | Valid email format |

**Primary Actions:**
- "Send Reset Link" button

**Secondary Actions:**
- "Back to login" link -> `/login`

**Post-submission State:**
- Form is replaced with a confirmation message: "If an account exists with this email, a reset link has been sent. Check your inbox."
- "Back to login" link

**Empty State:** N/A

**Error States:**
- Rate limited: inline message "Too many reset requests. Please wait before trying again."
- Network error: toast "Unable to reach the server."
- Note: No error for non-existent email (security -- no information leakage)

**Loading State:**
- Button shows spinner during submission

**PrimeReact Components:** InputText, Button, Message

---

### 1.4 Reset Password

| Field | Value |
|-------|-------|
| **Route** | `/reset-password?token=xxx` |
| **Purpose** | Set a new password using a valid reset token |
| **Roles** | Anyone with a valid token |
| **Entry Points** | Link in password reset email |

**Layout:**
- Centered card
- Heading: "Set new password"
- New password form (if token valid)
- Error message (if token invalid/expired)

**Key Information Displayed:**
- New password form OR token error message

**Form Fields (token valid):**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| New Password | Password (with strength meter) | password | Yes | 8+ chars, 1 uppercase, 1 lowercase, 1 number |
| Confirm Password | Password (no strength meter) | password | Yes | Must match New Password |

**Primary Actions:**
- "Reset Password" button

**Secondary Actions:** None

**Error States:**
- Token invalid: full-page message "This reset link is invalid." + "Request a new reset link" button -> `/forgot-password`
- Token expired: full-page message "This reset link has expired." + "Request a new reset link" button -> `/forgot-password`
- Validation errors: inline per field
- Network error: toast

**Success State:**
- Message: "Your password has been reset successfully."
- "Log in with your new password" link -> `/login`

**Loading State:**
- Initial page load validates token (skeleton loader)
- Submit button shows spinner

**PrimeReact Components:** Password, Button, Message

---

### 1.5 Verify Email

| Field | Value |
|-------|-------|
| **Route** | `/verify-email?token=xxx` |
| **Purpose** | Confirm user's email address via verification link |
| **Roles** | Anyone with a valid verification token |
| **Entry Points** | Link in verification email |

**Layout:**
- Centered card
- Verification result message

**Key Information Displayed:**
- Verification success/failure message

**Primary Actions:** None (informational page)

**Secondary Actions:**
- Success: "Go to bounties" link -> `/bounties`
- Expired: "Resend verification email" button
- Invalid: "Go to login" link -> `/login`

**States:**
- Token valid: "Your email has been verified! You can now enjoy the full platform experience."
- Token expired: "This verification link has expired." + "Resend Verification Email" button
- Token invalid: "This verification link is invalid." + "Go to login" link

**Loading State:**
- Token validation in progress: centered spinner with "Verifying your email..."

**PrimeReact Components:** Button, Message, ProgressSpinner

---

## 2. Participant Screens

### 2.1 Browse Bounties

| Field | Value |
|-------|-------|
| **Route** | `/bounties` |
| **Purpose** | Discover and browse all live bounties with filtering and sorting |
| **Roles** | PARTICIPANT (default landing page after login) |
| **Entry Points** | Sidebar "Browse Bounties" link, redirect after login, link from empty My Submissions page |

**Layout:**
- Page header: "Browse Bounties"
- Filter bar (top)
- Bounty card grid or list
- Pagination at bottom

**Key Information Displayed (per bounty card):**
- Title
- Short description (truncated to 2 lines)
- Category badge
- Reward: type icon + value (e.g., "$50 Cash") or description (e.g., "Gift Card")
- Organisation name
- Time remaining (if endDate is set and approaching)

**Filter Bar:**

| Filter | Component | Options |
|--------|-----------|---------|
| Search | InputText (with search icon) | Keyword search in title and description |
| Category | Dropdown | Predefined category list |
| Reward Type | Dropdown | Cash, Product, Service, Other |
| Sort By | Dropdown | Newest, Highest Reward, Ending Soon |

**Primary Actions:**
- Click a bounty card -> `/bounties/:id`

**Secondary Actions:**
- Clear all filters
- Change page (pagination)

**Empty State:**
- Filter applied, no results: "No bounties match your filters. Try adjusting your search." + "Clear filters" button
- No bounties exist at all: "No bounties are available right now. Check back soon!" (centered, with illustration placeholder)

**Error States:**
- API error loading list: toast "Failed to load bounties. Please try again." + "Retry" button
- Network error: toast "Unable to reach the server."

**Loading State:**
- Skeleton cards (3x3 grid of PrimeReact Skeleton components) while data loads
- Filter bar is interactive during loading (new requests cancel previous)

**PrimeReact Components:** InputText (search), Dropdown (filters), Card (bounty items), Badge (category, reward type), Paginator, Skeleton (loading), Tag (for reward)

---

### 2.2 Bounty Detail (Participant)

| Field | Value |
|-------|-------|
| **Route** | `/bounties/:id` |
| **Purpose** | View full bounty details and decide whether to submit proof |
| **Roles** | PARTICIPANT |
| **Entry Points** | Click bounty card from Browse Bounties list |

**Layout:**
- Breadcrumb: Browse Bounties > [Bounty Title]
- Bounty header (title, status badge, org name)
- Two-column layout on desktop:
  - Left (wide): full instructions, eligibility rules
  - Right (narrow): reward card, proof requirements, dates, submit button
- On mobile: single column, submit button sticky at bottom

**Key Information Displayed:**
- Title
- Status badge (Live / Paused / Closed)
- Organisation name and logo
- Full instructions (rich text)
- Category badge
- Reward type + value or description
- Eligibility rules
- Proof requirements (highlighted box -- participant reads this before submitting)
- Start date / End date (if set)
- Remaining submissions count (if maxSubmissions is set): "X of Y submissions remaining"
- User's own submission status (if already submitted)

**Primary Actions:**
- [Live, not submitted, slots available]: "Submit Proof" button (large, primary) -> `/bounties/:id/submit`

**Secondary Actions:**
- "Back to Bounties" breadcrumb link

**Conditional Elements:**
- Already submitted: status badge of their submission + "View My Submission" link -> `/my-submissions/:id`
- Bounty paused: info banner "This bounty is currently paused. Check back later."
- Bounty closed: info banner "This bounty is closed and no longer accepting submissions."
- Max submissions reached: warning banner "Maximum submissions reached. This bounty is no longer accepting new submissions."

**Empty State:** N/A (detail page)

**Error States:**
- Bounty not found (404): "This bounty doesn't exist or has been removed." + "Browse bounties" link
- Network error: toast + retry
- Permission error (wrong role accessing admin bounty): redirect to `/bounties` with toast

**Loading State:**
- Skeleton layout matching the two-column design
- Breadcrumb shows immediately

**PrimeReact Components:** Card, Badge, Tag, Button, Skeleton, Message (for banners), BreadCrumb

---

### 2.3 Submit Proof

| Field | Value |
|-------|-------|
| **Route** | `/bounties/:id/submit` |
| **Purpose** | Submit proof of completing a bounty task (target: completable in 60 seconds) |
| **Roles** | PARTICIPANT |
| **Entry Points** | "Submit Proof" button on Bounty Detail page |

**Layout:**
- Breadcrumb: Browse Bounties > [Bounty Title] > Submit Proof
- Left panel (or top on mobile): proof requirements from the bounty (read-only reference)
- Right panel (or below on mobile): submission form
- Submit button at bottom

**Key Information Displayed:**
- Bounty title (read-only header)
- Proof requirements (from bounty, displayed as a reference panel with distinct background)

**Form Fields:**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| Proof Text | InputTextarea (autofocus) | text | Yes | Non-empty, max 5000 chars |
| Proof Links | Dynamic list of InputText | url | No | Valid URL format per entry |
| Proof Images | FileUpload | file | No | Images only (JPEG/PNG/GIF/WebP), max 5MB each, max 5 files |

**Proof Links Detail:**
- Initially shows one empty link field
- "Add another link" button to add more (up to 10)
- Each link has a remove (X) button
- URL validation on blur

**Proof Images Detail:**
- Drag-and-drop zone + "Choose Files" button
- Image preview thumbnails after upload
- Remove (X) button per image
- Progress bar during upload
- File type/size validation on select (before upload)

**Primary Actions:**
- "Submit Proof" button

**Secondary Actions:**
- "Cancel" -> back to `/bounties/:id`
- "Add another link" to add link fields

**Error States:**
- Validation errors: inline per field
- Already submitted for this bounty (409): toast "You have already submitted proof for this bounty" + redirect to submission
- Bounty no longer live: toast "This bounty is no longer accepting submissions" + redirect to bounty detail
- Max submissions reached: toast "Maximum submissions reached" + redirect to bounty detail
- Upload failure: inline error under file upload "Failed to upload [filename]. Please try again."
- Network error: toast

**Loading State:**
- Submit button shows spinner during form submission
- Image upload shows individual progress bars

**Success State:**
- Toast: "Proof submitted successfully!"
- Redirect to `/my-submissions`

**PrimeReact Components:** InputTextarea, InputText (links), FileUpload (images), Button, Message (validation), BreadCrumb, ProgressBar (upload)

---

### 2.4 My Submissions List

| Field | Value |
|-------|-------|
| **Route** | `/my-submissions` |
| **Purpose** | Track all submissions made by the logged-in participant |
| **Roles** | PARTICIPANT |
| **Entry Points** | Sidebar "My Submissions" link, redirect after successful proof submission |

**Layout:**
- Page header: "My Submissions"
- Submissions list (table or card list)
- Pagination at bottom

**Key Information Displayed (per item):**
- Bounty title (linked to bounty detail)
- Submission date (formatted)
- Status badge (color-coded):
  - Submitted: blue
  - In Review: orange
  - Needs More Info: yellow
  - Approved: green
  - Rejected: red
- Payout status badge (color-coded):
  - Not Paid: gray
  - Pending: orange
  - Paid: green

**Primary Actions:**
- Click submission row -> `/my-submissions/:id`

**Secondary Actions:**
- Pagination controls

**Sorting:** Newest first (fixed, no user-selectable sort)

**Pagination:** Server-side, 10 items per page

**Empty State:**
- "You haven't submitted any proof yet. Browse bounties to get started."
- "Browse Bounties" button -> `/bounties`

**Error States:**
- API error: toast "Failed to load submissions" + retry
- Network error: toast

**Loading State:**
- Skeleton table rows (10 rows matching column structure)

**PrimeReact Components:** DataTable (or custom Card list), Badge, Tag, Paginator, Skeleton, Button (empty state)

---

### 2.5 Submission Detail (Participant)

| Field | Value |
|-------|-------|
| **Route** | `/my-submissions/:id` |
| **Purpose** | View full details of a submission including review outcome |
| **Roles** | PARTICIPANT (own submissions only) |
| **Entry Points** | Click submission from My Submissions list, link from bounty detail (if already submitted) |

**Layout:**
- Breadcrumb: My Submissions > Submission for [Bounty Title]
- Status section (prominent, top)
- Proof details section
- Review section (if reviewed)
- Payout section (if approved)

**Key Information Displayed:**
- Bounty title (linked to bounty detail)
- Submission date
- Last updated date
- Status badge (prominent, large)
- Proof text (full)
- Proof links (clickable, open in new tab)
- Proof images (thumbnails, click to view full-size in lightbox)
- Reviewer note (if status is Needs More Info, Approved, or Rejected -- highlighted box)
- Payout status badge (if submission is Approved)

**Primary Actions:**
- [Status = NEEDS_MORE_INFO]: "Update Submission" button -> `/my-submissions/:id/update`

**Secondary Actions:**
- "Back to My Submissions" breadcrumb link
- View bounty detail (linked title)

**Conditional Elements:**
- Status = NEEDS_MORE_INFO: reviewer note displayed in a warning box with "Update Submission" button
- Status = APPROVED + Payout = PAID: success banner "Reward has been paid"
- Status = APPROVED + Payout = PENDING: info banner "Payment is being processed"
- Status = REJECTED: reviewer note in an error box

**Empty State:** N/A (detail page)

**Error States:**
- Submission not found (404): "This submission doesn't exist." + "Back to My Submissions" link
- Permission denied (not own submission, 403): redirect to `/my-submissions` with toast

**Loading State:**
- Skeleton layout for all sections

**PrimeReact Components:** Card, Badge, Tag, Button, Image (lightbox), Message (reviewer note), BreadCrumb, Skeleton

---

### 2.6 Update Submission

| Field | Value |
|-------|-------|
| **Route** | `/my-submissions/:id/update` |
| **Purpose** | Update a submission that was marked "Needs More Info" by a reviewer |
| **Roles** | PARTICIPANT (own submissions only, status must be NEEDS_MORE_INFO) |
| **Entry Points** | "Update Submission" button on Submission Detail page |

**Layout:**
- Breadcrumb: My Submissions > [Bounty Title] > Update Submission
- Reviewer note (prominent, at the top as context)
- Pre-filled submission form

**Key Information Displayed:**
- Reviewer note in a highlighted info box: "The reviewer has requested additional information:"
- Existing proof text, links, images (pre-filled)

**Form Fields:**
- Same as Submit Proof (Section 2.3) but pre-filled with existing data
- All fields are editable

**Primary Actions:**
- "Resubmit" button

**Secondary Actions:**
- "Cancel" -> back to `/my-submissions/:id`

**Error States:**
- Submission not in NEEDS_MORE_INFO status: redirect to detail page with toast "This submission cannot be updated."
- Validation errors: inline per field
- Network error: toast

**Loading State:**
- Form shows skeleton while pre-filling data
- Submit button shows spinner during submission

**Success State:**
- Submission status changes to SUBMITTED
- Toast: "Submission updated successfully"
- Redirect to `/my-submissions/:id`

**PrimeReact Components:** InputTextarea, InputText, FileUpload, Button, Message, BreadCrumb

---

## 3. Profile Screens (All Roles)

### 3.1 View Profile

| Field | Value |
|-------|-------|
| **Route** | `/profile` |
| **Purpose** | View own profile information |
| **Roles** | All authenticated roles (PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN) |
| **Entry Points** | Top bar user menu "My Profile" link |

**Layout:**
- Page header: "My Profile"
- Profile card with user information
- Email verification banner (if unverified)
- "Edit Profile" button

**Key Information Displayed:**
- First Name + Last Name
- Email address
- Role badge
- Email verification status (verified checkmark or "Not verified" warning)
- Account creation date

**Primary Actions:**
- "Edit Profile" button -> `/profile/edit`

**Secondary Actions:**
- "Resend verification email" button (if email not verified)

**Empty State:** N/A

**Error States:**
- API error loading profile: toast + retry
- Resend verification failed: toast "Failed to send verification email. Please try again."

**Loading State:**
- Skeleton card

**PrimeReact Components:** Card, Badge, Button, Tag, Message (verification banner), Skeleton

---

### 3.2 Edit Profile

| Field | Value |
|-------|-------|
| **Route** | `/profile/edit` |
| **Purpose** | Update name and/or change password |
| **Roles** | All authenticated roles |
| **Entry Points** | "Edit Profile" button on View Profile page |

**Layout:**
- Page header: "Edit Profile"
- Profile information section (name fields)
- Change password section (collapsible/expandable)
- Save buttons per section

**Form Fields -- Profile Section:**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| First Name | InputText | text | Yes | Non-empty, max 100 chars |
| Last Name | InputText | text | Yes | Non-empty, max 100 chars |
| Email | InputText (disabled) | email | N/A | Read-only, shown for reference |

**Form Fields -- Change Password Section:**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| Current Password | Password | password | Yes (if changing) | Non-empty |
| New Password | Password (with strength meter) | password | Yes (if changing) | 8+ chars, 1 upper, 1 lower, 1 number |
| Confirm New Password | Password | password | Yes (if changing) | Must match New Password |

**Primary Actions:**
- "Save Changes" button (profile section)
- "Change Password" button (password section)

**Secondary Actions:**
- "Cancel" -> `/profile`

**Error States:**
- Validation errors: inline per field
- Current password incorrect: inline error "Current password is incorrect"
- Network error: toast

**Loading State:**
- Save button shows spinner during submission

**Success States:**
- Profile saved: toast "Profile updated"
- Password changed: toast "Password changed successfully"

**PrimeReact Components:** InputText, Password, Button, Fieldset (collapsible password section), Message

---

## 4. Business Admin Screens

### 4.1 Business Admin Dashboard

| Field | Value |
|-------|-------|
| **Route** | `/dashboard` |
| **Purpose** | Overview of bounty and submission activity for the Business Admin's organisation |
| **Roles** | BUSINESS_ADMIN (default landing page after login) |
| **Entry Points** | Login redirect, sidebar "Dashboard" link |

**Layout:**
- Page header: "Dashboard" with organisation name
- Summary cards row (4 cards)
- Quick actions section

**Key Information Displayed:**

| Card | Content |
|------|---------|
| Bounties | Total count + breakdown by status (Draft: X, Live: X, Paused: X, Closed: X) |
| Submissions | Total count + breakdown by status (Submitted: X, In Review: X, Needs More Info: X, Approved: X, Rejected: X) |
| Pending Reviews | Count of submissions with status Submitted or In Review |
| Payouts | Breakdown (Not Paid: X, Pending: X, Paid: X) |

**Quick Actions:**
- "Create New Bounty" button -> `/manage/bounties/new`
- "Review Submissions" link -> `/manage/bounties` (filtered to bounties with pending submissions)

**Primary Actions:**
- Click any summary card to navigate to relevant list view

**Secondary Actions:**
- Quick action buttons

**Empty State:**
- No organisation set up yet: "Welcome! Create your organisation to get started." + "Create Organisation" button -> `/organisation` (org creation flow)
- Organisation exists but no bounties: cards show all zeros, "Create your first bounty" prompt

**Error States:**
- API error: toast + retry
- Network error: toast

**Loading State:**
- Skeleton cards (4 cards matching card layout)

**PrimeReact Components:** Card (summary stats), Button, Badge, Skeleton

---

### 4.2 Bounty Management List

| Field | Value |
|-------|-------|
| **Route** | `/manage/bounties` |
| **Purpose** | View and manage all bounties for the Business Admin's organisation |
| **Roles** | BUSINESS_ADMIN |
| **Entry Points** | Sidebar "Bounties" link, dashboard card click, dashboard quick action |

**Layout:**
- Page header: "Manage Bounties" + "Create New Bounty" button (top right)
- Filter bar
- DataTable
- Pagination

**Key Information Displayed (per row):**
- Title
- Status badge (Draft/Live/Paused/Closed)
- Submission count
- Creation date
- Actions column

**Filter Bar:**

| Filter | Component | Options |
|--------|-----------|---------|
| Status | Dropdown | All, Draft, Live, Paused, Closed |
| Sort | Dropdown | Newest, Title (A-Z), Status |

**Primary Actions:**
- Click row -> `/manage/bounties/:id`
- "Create New Bounty" button -> `/manage/bounties/new`

**Secondary Actions (per row via action buttons/menu):**
- Edit -> `/manage/bounties/:id/edit`
- View Submissions -> `/manage/bounties/:id/submissions`
- Status transition (context-dependent): Publish / Pause / Resume / Close

**Pagination:** Server-side, 10 per page

**Empty State:**
- "No bounties yet. Create your first bounty." + "Create Bounty" button

**Error States:**
- API error: toast + retry
- Network error: toast

**Loading State:**
- Skeleton DataTable (10 rows)

**PrimeReact Components:** DataTable, Column, Dropdown (filters), Button, Badge, Tag, Paginator, Skeleton, SplitButton or Menu (row actions)

---

### 4.3 Create Bounty

| Field | Value |
|-------|-------|
| **Route** | `/manage/bounties/new` |
| **Purpose** | Create a new bounty in Draft status |
| **Roles** | BUSINESS_ADMIN |
| **Entry Points** | "Create New Bounty" button from dashboard or bounty list |

**Layout:**
- Page header: "Create New Bounty"
- Multi-section form (single page, not wizard)
- Sections: Basic Info, Reward, Scheduling, Requirements
- Sticky footer with Save button

**Form Fields:**

| Section | Field | Component | Type | Required | Validation |
|---------|-------|-----------|------|----------|------------|
| Basic Info | Title | InputText | text | Yes | Non-empty, max 200 chars |
| Basic Info | Short Description | InputTextarea | text | Yes | Non-empty, max 200 chars, char counter shown |
| Basic Info | Full Instructions | InputTextarea | text | Yes | Non-empty |
| Basic Info | Category | Dropdown | select | Yes | Must select from predefined list |
| Reward | Reward Type | Dropdown | select | Yes | Cash / Product / Service / Other |
| Reward | Reward Value | InputNumber | number | Conditional | Required if type is Cash. Positive number. |
| Reward | Reward Description | InputText | text | Conditional | Required if type is Product/Service/Other. Max 200 chars. |
| Scheduling | Max Submissions | InputNumber | number | No | Positive integer if provided |
| Scheduling | Start Date | Calendar | date | No | Must be today or future |
| Scheduling | End Date | Calendar | date | No | Must be after Start Date |
| Requirements | Eligibility Rules | InputTextarea | text | Yes | Non-empty |
| Requirements | Proof Requirements | InputTextarea | text | Yes | Non-empty |

**Reward Type conditional logic:**
- When "Cash" is selected: show Reward Value field, hide Reward Description
- When "Product", "Service", or "Other" is selected: show Reward Description field, hide Reward Value

**Primary Actions:**
- "Save as Draft" button

**Secondary Actions:**
- "Cancel" -> `/manage/bounties` (with confirmation if form is dirty)

**Error States:**
- Validation errors: inline per field with scroll-to-first-error behavior
- Network error: toast
- Server validation error: toast with message

**Loading State:**
- Save button shows spinner during submission

**Success State:**
- Toast: "Bounty saved as draft"
- Redirect to `/manage/bounties/:id`

**PrimeReact Components:** InputText, InputTextarea, Dropdown, InputNumber, Calendar, Button, Message (validation), Divider (section separators)

---

### 4.4 Bounty Management Detail

| Field | Value |
|-------|-------|
| **Route** | `/manage/bounties/:id` |
| **Purpose** | View bounty details and perform management actions (status transitions) |
| **Roles** | BUSINESS_ADMIN (own organisation's bounties only) |
| **Entry Points** | Click row from Bounty Management List, redirect after creating/editing |

**Layout:**
- Breadcrumb: Bounties > [Bounty Title]
- Status badge (prominent)
- Bounty details (all fields)
- Action bar (status-dependent buttons)
- Submission summary (count by status)

**Key Information Displayed:**
- All bounty fields (title, description, instructions, category, reward, dates, rules, proof requirements)
- Status badge
- Submission count (total and by status)
- Created/updated dates
- Created by (user name)

**Action Bar (status-dependent):**

| Current Status | Available Actions |
|----------------|-------------------|
| DRAFT | "Publish" (primary), "Edit" (secondary), "Delete" (danger) |
| LIVE | "Pause" (warning), "Close" (danger), "Edit" (secondary, limited fields), "View Submissions" |
| PAUSED | "Resume" (primary), "Close" (danger), "Edit" (secondary) |
| CLOSED | "View Submissions" (secondary only) |

**Primary Actions:**
- Status transition buttons (context-dependent)

**Secondary Actions:**
- "Edit" -> `/manage/bounties/:id/edit`
- "View Submissions" -> `/manage/bounties/:id/submissions`

**Confirmation Dialogs:**
- Publish: validates all required fields. If invalid: toast listing missing fields, no dialog.
- Pause: "Are you sure you want to pause this bounty? It will no longer be visible to participants."
- Close: "Are you sure you want to close this bounty? This action cannot be undone. No new submissions will be accepted." (danger styling)
- Delete: "Are you sure you want to delete this draft bounty? This action cannot be undone." (danger styling)

**Empty State:** N/A

**Error States:**
- Bounty not found (404): "This bounty doesn't exist." + back link
- Permission denied (403): redirect to `/manage/bounties` with toast
- Invalid transition: toast with reason (e.g., "Cannot publish: missing required fields")

**Loading State:**
- Skeleton layout

**PrimeReact Components:** Card, Badge, Tag, Button, ConfirmDialog, BreadCrumb, Skeleton, Toolbar (action bar)

---

### 4.5 Edit Bounty

| Field | Value |
|-------|-------|
| **Route** | `/manage/bounties/:id/edit` |
| **Purpose** | Edit bounty details (field editability depends on bounty status) |
| **Roles** | BUSINESS_ADMIN (own organisation's bounties only) |
| **Entry Points** | "Edit" button from Bounty Management Detail |

**Layout:**
- Same form layout as Create Bounty
- Pre-filled with existing data
- Non-editable fields shown as read-only (grayed out with "locked" icon)

**Field Editability by Status:**

| Field | DRAFT | PAUSED | LIVE |
|-------|-------|--------|------|
| Title | Editable | Editable | Read-only |
| Short Description | Editable | Editable | Read-only |
| Full Instructions | Editable | Editable | Read-only |
| Category | Editable | Editable | Read-only |
| Reward Type | Editable | Editable | Read-only |
| Reward Value/Description | Editable | Editable | Read-only |
| Max Submissions | Editable | Editable | Editable |
| Start Date | Editable | Editable | Read-only |
| End Date | Editable | Editable | Editable |
| Eligibility Rules | Editable | Editable | Editable |
| Proof Requirements | Editable | Editable | Editable |

**Info banner for LIVE bounties:**
- "This bounty is live. Only some fields can be edited." (info severity)

**Primary Actions:**
- "Save Changes" button

**Secondary Actions:**
- "Cancel" -> `/manage/bounties/:id`

**Error States:**
- Same as Create Bounty
- Bounty status changed while editing (409): toast "This bounty's status has changed. Please refresh."

**Loading State:**
- Skeleton form while loading existing data
- Save button shows spinner

**Success State:**
- Toast: "Bounty updated"
- Redirect to `/manage/bounties/:id`

**PrimeReact Components:** Same as Create Bounty + Message (info banner for LIVE restriction)

---

### 4.6 Submission Review List

| Field | Value |
|-------|-------|
| **Route** | `/manage/bounties/:id/submissions` |
| **Purpose** | View all submissions for a specific bounty for review |
| **Roles** | BUSINESS_ADMIN (own organisation's bounties only) |
| **Entry Points** | "View Submissions" from Bounty Management Detail, dashboard quick action |

**Layout:**
- Breadcrumb: Bounties > [Bounty Title] > Submissions
- Page header: "Submissions for [Bounty Title]"
- Filter bar
- DataTable
- Pagination

**Key Information Displayed (per row):**
- Participant name
- Submission date
- Status badge (color-coded)
- Payout status badge
- Preview of proof text (first 100 chars)

**Filter Bar:**

| Filter | Component | Options |
|--------|-----------|---------|
| Status | Dropdown | All, Submitted, In Review, Needs More Info, Approved, Rejected |

**Primary Actions:**
- Click row -> `/manage/submissions/:id`

**Secondary Actions:**
- Pagination

**Pagination:** Server-side, 10 per page

**Sorting:** Newest first (default), by status

**Empty State:**
- "No submissions yet for this bounty."

**Error States:**
- Bounty not found: redirect to `/manage/bounties` with toast
- API error: toast + retry

**Loading State:**
- Skeleton DataTable (10 rows)

**PrimeReact Components:** DataTable, Column, Dropdown, Badge, Tag, Paginator, Skeleton, BreadCrumb

---

### 4.7 Submission Review Detail

| Field | Value |
|-------|-------|
| **Route** | `/manage/submissions/:id` |
| **Purpose** | Review a single submission: view proof and take review actions |
| **Roles** | BUSINESS_ADMIN (own organisation's bounties only) |
| **Entry Points** | Click submission from Submission Review List |

**Layout:**
- Breadcrumb: Bounties > [Bounty Title] > Submissions > Review
- Participant info section
- Proof section (text, links, images)
- Review action panel (fixed at bottom or in sidebar)
- Payout section (visible after approval)

**Key Information Displayed:**
- Participant name and email
- Submission date, last updated
- Status badge (prominent)
- Proof text (full)
- Proof links (clickable, open in new tab with external link icon)
- Proof images (thumbnails, click to view full-size in lightbox/dialog)
- Reviewer note (if previously reviewed)
- Payout status badge (if approved)

**Auto-transition:** When a reviewer opens a submission with status SUBMITTED, the system automatically changes it to IN_REVIEW. A subtle toast confirms: "Submission marked as In Review."

**Review Action Panel:**

```
+-----------------------------------------------+
| Review Actions                                 |
|                                                |
| Note (optional):                               |
| [_________________________________________]    |
|                                                |
| [Approve]  [Needs More Info]  [Reject]         |
+-----------------------------------------------+
```

- Note field: InputTextarea, optional, max 1000 chars
- Approve button: success/green styling
- Needs More Info button: warning/yellow styling
- Reject button: danger/red styling

**Review action visibility by current status:**

| Current Status | Actions Available |
|----------------|-------------------|
| SUBMITTED | (auto-transitions to IN_REVIEW on open) |
| IN_REVIEW | Approve, Needs More Info, Reject |
| NEEDS_MORE_INFO | No review actions (waiting for participant) |
| APPROVED | No review actions, payout controls visible |
| REJECTED | No review actions (final state) |

**Payout Controls (APPROVED status only):**

| Current Payout | Available Actions |
|----------------|-------------------|
| NOT_PAID | "Mark as Pending", "Mark as Paid" |
| PENDING | "Mark as Paid" |
| PAID | No actions (read-only) |

- Optional payout note field
- "Mark as Paid" requires confirmation dialog

**Confirmation Dialogs:**
- Approve: "Approve this submission? The participant will be notified." [Approve / Cancel]
- Reject: "Reject this submission? This action is final. The participant will be notified." [Reject / Cancel]
- Mark as Paid: "Confirm this participant has been paid?" [Confirm / Cancel]
- Needs More Info: no confirmation (non-destructive, participant can resubmit)

**Empty State:** N/A

**Error States:**
- Submission not found: redirect with toast
- Permission denied: redirect with toast
- Stale status (someone else reviewed): toast "This submission's status has changed. Please refresh." + disable actions

**Loading State:**
- Skeleton layout
- Action buttons disabled until data loads

**PrimeReact Components:** Card, Badge, Tag, Button, InputTextarea (note), Image (lightbox), ConfirmDialog, BreadCrumb, Divider, Skeleton, Toolbar

---

### 4.8 View Organisation

| Field | Value |
|-------|-------|
| **Route** | `/organisation` |
| **Purpose** | View the Business Admin's organisation details |
| **Roles** | BUSINESS_ADMIN |
| **Entry Points** | Sidebar "Organisation" link |

**Layout:**
- Page header: "My Organisation"
- Organisation details card
- Members section

**Key Information Displayed:**
- Organisation name
- Logo (or placeholder icon if none)
- Contact email
- Status badge (Active/Suspended)
- Creation date
- Member list (name, role badge: Owner/Member, joined date)

**Primary Actions:**
- "Edit Organisation" button -> `/organisation/edit` (owner only)
- "Manage Members" button -> `/organisation/members` (owner only)

**Secondary Actions:** None

**Conditional Elements:**
- Edit/Manage buttons only visible to organisation OWNER, not regular MEMBER
- Suspended org: warning banner "Your organisation has been suspended by a platform administrator."

**Empty State:**
- No organisation: "You haven't set up an organisation yet." + "Create Organisation" button

**Error States:**
- API error: toast + retry

**Loading State:**
- Skeleton card + skeleton member list

**PrimeReact Components:** Card, Badge, Tag, Button, DataTable (member list), Avatar (for members), Message (suspended banner), Skeleton

---

### 4.9 Edit Organisation

| Field | Value |
|-------|-------|
| **Route** | `/organisation/edit` |
| **Purpose** | Update organisation details |
| **Roles** | BUSINESS_ADMIN (OWNER role within organisation only) |
| **Entry Points** | "Edit Organisation" button from View Organisation |

**Layout:**
- Page header: "Edit Organisation"
- Edit form

**Form Fields:**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| Organisation Name | InputText | text | Yes | Non-empty, max 200 chars |
| Contact Email | InputText | email | Yes | Valid email format |
| Logo | FileUpload (single image) | file | No | Images only (JPEG/PNG/GIF/WebP), max 2MB |

**Primary Actions:**
- "Save Changes" button

**Secondary Actions:**
- "Cancel" -> `/organisation`

**Error States:**
- Validation errors: inline per field
- Permission denied (not owner): redirect to `/organisation` with toast

**Loading State:**
- Skeleton form while loading existing data
- Save button shows spinner

**Success State:**
- Toast: "Organisation updated"
- Redirect to `/organisation`

**PrimeReact Components:** InputText, FileUpload, Button, Message

---

### 4.10 Manage Organisation Members

| Field | Value |
|-------|-------|
| **Route** | `/organisation/members` |
| **Purpose** | Invite new members and manage existing members |
| **Roles** | BUSINESS_ADMIN (OWNER role within organisation only) |
| **Entry Points** | "Manage Members" button from View Organisation |

**Layout:**
- Page header: "Manage Members"
- Invite section (top)
- Current members list (below)

**Invite Section:**
- Email input field + "Send Invite" button
- List of pending invitations (if any)

**Current Members List (per row):**
- Name
- Email
- Role badge (Owner/Member)
- Joined date
- Actions: "Remove" button (except for the owner themselves)

**Form Fields (Invite):**

| Field | Component | Type | Required | Validation |
|-------|-----------|------|----------|------------|
| Email | InputText | email | Yes | Valid email format |

**Primary Actions:**
- "Send Invite" button (invite section)
- "Remove" button per member (with confirmation dialog)

**Confirmation Dialog (Remove Member):**
- "Remove this member from the organisation? They will lose Business Admin privileges."
- [Remove (danger)] [Cancel]

**Empty State:**
- No other members: "You're the only member. Invite team members to help manage bounties."

**Error States:**
- User not found: toast "No user found with this email"
- User already a member: toast "This user is already a member of your organisation"
- Cannot remove self (owner): button disabled for own row
- API error: toast

**Loading State:**
- Skeleton list for members
- Invite button shows spinner during submission

**PrimeReact Components:** InputText, Button, DataTable, Badge, Tag, ConfirmDialog, Skeleton, Message

---

## 5. Super Admin Screens

### 5.1 Super Admin Dashboard

| Field | Value |
|-------|-------|
| **Route** | `/admin/dashboard` |
| **Purpose** | Platform-wide overview of users, organisations, bounties, and submissions |
| **Roles** | SUPER_ADMIN (default landing page after login) |
| **Entry Points** | Login redirect, sidebar "Dashboard" link |

**Layout:**
- Page header: "Platform Dashboard"
- Summary cards row (5 cards)
- Recent activity section

**Key Information Displayed:**

| Card | Content |
|------|---------|
| Users | Total count + breakdown by role (Participant: X, Business Admin: X, Super Admin: X) |
| Organisations | Total count + breakdown (Active: X, Suspended: X) |
| Bounties | Total count + breakdown by status |
| Submissions | Total count + breakdown by status |
| Payouts | Breakdown (Not Paid: X, Pending: X, Paid: X) |

**Recent Activity Section:**
- Last 10 audit log entries
- Each entry: timestamp, actor name, action summary (e.g., "John Doe approved submission #abc")
- "View All Audit Logs" link -> `/admin/audit-logs`

**Primary Actions:**
- Click any summary card -> navigate to relevant management list

**Secondary Actions:**
- "View All Audit Logs" link

**Empty State:**
- Fresh install: all counts show 0, recent activity shows "No activity recorded yet."

**Error States:**
- API error: toast + retry

**Loading State:**
- Skeleton cards (5) + skeleton list (10 rows for activity)

**PrimeReact Components:** Card, Badge, DataTable (recent activity), Button, Skeleton

---

### 5.2 User Management List

| Field | Value |
|-------|-------|
| **Route** | `/admin/users` |
| **Purpose** | Search, view, and manage all platform users |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Sidebar "Users" link, dashboard card click |

**Layout:**
- Page header: "User Management"
- Search bar + filters
- DataTable
- Pagination

**Key Information Displayed (per row):**
- Name (first + last)
- Email
- Role badge
- Status badge (Active: green, Suspended: red)
- Email verified (checkmark or X icon)
- Created date

**Search and Filters:**

| Control | Component | Behavior |
|---------|-----------|----------|
| Search | InputText (with search icon) | Server-side search by email or name |
| Role | Dropdown | All, Participant, Business Admin, Super Admin |
| Status | Dropdown | All, Active, Suspended |

**Primary Actions:**
- Click row -> `/admin/users/:id`

**Secondary Actions:**
- Pagination

**Pagination:** Server-side, 20 per page

**Empty State:**
- "No users match your search criteria." + "Clear search" button

**Error States:**
- API error: toast + retry

**Loading State:**
- Skeleton DataTable (20 rows)

**PrimeReact Components:** DataTable, Column, InputText (search), Dropdown, Badge, Tag, Paginator, Skeleton

---

### 5.3 User Detail

| Field | Value |
|-------|-------|
| **Route** | `/admin/users/:id` |
| **Purpose** | View user details and perform admin actions (suspend, reinstate, force password reset) |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Click row from User Management List |

**Layout:**
- Breadcrumb: Users > [User Name]
- User details card
- Organisation membership section (if Business Admin)
- Submission summary section
- Admin actions bar

**Key Information Displayed:**
- Full name
- Email
- Role badge
- Status badge (prominent)
- Email verification status
- Account creation date
- Organisation name + link (if Business Admin)
- Submission count summary (by status): Submitted: X, Approved: X, Rejected: X, etc.

**Admin Actions (based on user status):**

| User Status | Available Actions |
|-------------|-------------------|
| ACTIVE | "Suspend User" (danger), "Force Password Reset" |
| SUSPENDED | "Reinstate User" (success), "Force Password Reset" |

**Confirmation Dialogs:**

- **Suspend**: Title "Suspend User". Message: "Suspend this user? They will be unable to log in." + Reason field (required InputTextarea). Buttons: [Suspend (danger)] [Cancel]
- **Reinstate**: Title "Reinstate User". Message: "Reinstate this user? They will be able to log in again." + Reason field (required InputTextarea). Buttons: [Reinstate (success)] [Cancel]
- **Force Password Reset**: Title "Force Password Reset". Message: "Send a password reset email to [email]?" Buttons: [Send Reset (primary)] [Cancel]

**Reason field validation:** Cannot submit suspend/reinstate without a reason. Minimum 10 characters.

**Primary Actions:**
- Status change actions (suspend/reinstate)

**Secondary Actions:**
- Force password reset
- Navigate to user's organisation (if applicable)

**Error States:**
- User not found: redirect to `/admin/users` with toast
- API error: toast

**Loading State:**
- Skeleton layout

**PrimeReact Components:** Card, Badge, Tag, Button, ConfirmDialog (custom with reason field), InputTextarea (reason), BreadCrumb, Skeleton, Divider

---

### 5.4 Organisation Management List

| Field | Value |
|-------|-------|
| **Route** | `/admin/organisations` |
| **Purpose** | View and manage all platform organisations |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Sidebar "Organisations" link, dashboard card click |

**Layout:**
- Page header: "Organisation Management"
- Search bar + filters
- DataTable
- Pagination

**Key Information Displayed (per row):**
- Name
- Contact email
- Status badge (Active/Suspended)
- Member count
- Bounty count
- Created date

**Search and Filters:**

| Control | Component | Behavior |
|---------|-----------|----------|
| Search | InputText | Server-side search by name |
| Status | Dropdown | All, Active, Suspended |

**Primary Actions:**
- Click row -> `/admin/organisations/:id`

**Pagination:** Server-side, 20 per page

**Empty State:**
- "No organisations match your search criteria."

**Error States:**
- API error: toast + retry

**Loading State:**
- Skeleton DataTable

**PrimeReact Components:** DataTable, Column, InputText, Dropdown, Badge, Paginator, Skeleton

---

### 5.5 Organisation Detail (Admin)

| Field | Value |
|-------|-------|
| **Route** | `/admin/organisations/:id` |
| **Purpose** | View organisation details and perform admin actions (suspend/reinstate) |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Click row from Organisation Management List, link from User Detail |

**Layout:**
- Breadcrumb: Organisations > [Org Name]
- Organisation details card (name, logo, contact email, status, created date)
- Members list (name, role, joined date)
- Bounty summary (count by status)
- Admin actions bar

**Key Information Displayed:**
- Organisation name, logo, contact email
- Status badge (prominent)
- Creation date
- Member list with roles
- Bounty count by status

**Admin Actions:**

| Org Status | Available Actions |
|------------|-------------------|
| ACTIVE | "Suspend Organisation" (danger) |
| SUSPENDED | "Reinstate Organisation" (success) |

**Confirmation Dialogs:**

- **Suspend**: "Suspend this organisation? All its live bounties will be paused automatically." + Reason field (required). [Suspend (danger)] [Cancel]
- **Reinstate**: "Reinstate this organisation?" + Reason field (required). [Reinstate (success)] [Cancel]

**Error States:**
- Org not found: redirect with toast

**Loading State:**
- Skeleton layout

**PrimeReact Components:** Card, Badge, Tag, Button, ConfirmDialog (custom with reason), DataTable (members), BreadCrumb, Skeleton, Divider

---

### 5.6 Bounty Oversight List

| Field | Value |
|-------|-------|
| **Route** | `/admin/bounties` |
| **Purpose** | View all bounties across the platform for oversight |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Sidebar "Bounties" link, dashboard card click |

**Layout:**
- Page header: "Bounty Oversight"
- Search bar + filters
- DataTable
- Pagination

**Key Information Displayed (per row):**
- Title
- Organisation name
- Status badge
- Submission count
- Created date

**Search and Filters:**

| Control | Component | Behavior |
|---------|-----------|----------|
| Search | InputText | Keyword in title |
| Status | Dropdown | All, Draft, Live, Paused, Closed |
| Organisation | Dropdown | All orgs (populated dynamically) |

**Primary Actions:**
- Click row -> `/admin/bounties/:id`

**Pagination:** Server-side, 20 per page

**Empty State:**
- "No bounties match your search criteria."

**Error States:**
- API error: toast + retry

**Loading State:**
- Skeleton DataTable

**PrimeReact Components:** DataTable, Column, InputText, Dropdown, Badge, Paginator, Skeleton

---

### 5.7 Bounty Detail (Admin)

| Field | Value |
|-------|-------|
| **Route** | `/admin/bounties/:id` |
| **Purpose** | View any bounty's full details and override its status if needed |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Click row from Bounty Oversight List |

**Layout:**
- Breadcrumb: Bounties > [Bounty Title]
- Full bounty details (same fields as business admin view)
- Status badge (prominent)
- Organisation info (linked)
- Submission count summary
- Override action bar

**Key Information Displayed:**
- All bounty fields
- Organisation name and link -> `/admin/organisations/:id`
- Created by user name and link -> `/admin/users/:id`
- Status, submission counts

**Admin Actions:**
- "Override Status" button -> opens override modal

**Override Modal:**

```
+------------------------------------------+
| Override Bounty Status                    |
|                                           |
| Current Status: [badge]                   |
|                                           |
| New Status:                               |
| [Dropdown: Draft / Live / Paused / Closed]|
|                                           |
| Reason (required):                        |
| [_________________________________]       |
| Minimum 10 characters                     |
|                                           |
| [Cancel]              [Override Status]   |
+------------------------------------------+
```

- New status dropdown excludes current status
- Reason is mandatory (min 10 chars)
- Override button is disabled until status selected and reason meets minimum length

**Error States:**
- Bounty not found: redirect with toast
- API error: toast

**Loading State:**
- Skeleton layout

**PrimeReact Components:** Card, Badge, Tag, Button, Dialog (override modal), Dropdown, InputTextarea, BreadCrumb, Skeleton

---

### 5.8 Submission Oversight List

| Field | Value |
|-------|-------|
| **Route** | `/admin/submissions` |
| **Purpose** | View all submissions across the platform for oversight |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Sidebar "Submissions" link, dashboard card click |

**Layout:**
- Page header: "Submission Oversight"
- Search bar + filters
- DataTable
- Pagination

**Key Information Displayed (per row):**
- Bounty title
- Participant name
- Status badge
- Payout status badge
- Submitted date

**Search and Filters:**

| Control | Component | Behavior |
|---------|-----------|----------|
| Search | InputText | By participant email or bounty title |
| Status | Dropdown | All, Submitted, In Review, Needs More Info, Approved, Rejected |
| Payout Status | Dropdown | All, Not Paid, Pending, Paid |

**Primary Actions:**
- Click row -> `/admin/submissions/:id`

**Pagination:** Server-side, 20 per page

**Empty State:**
- "No submissions match your search criteria."

**Error States:**
- API error: toast + retry

**Loading State:**
- Skeleton DataTable

**PrimeReact Components:** DataTable, Column, InputText, Dropdown, Badge, Tag, Paginator, Skeleton

---

### 5.9 Submission Detail (Admin)

| Field | Value |
|-------|-------|
| **Route** | `/admin/submissions/:id` |
| **Purpose** | View any submission's full details and override status/payout if needed |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Click row from Submission Oversight List |

**Layout:**
- Breadcrumb: Submissions > Submission for [Bounty Title]
- Participant info (linked to user detail)
- Bounty info (linked to bounty detail)
- Proof section (text, links, images)
- Status + payout badges
- Reviewer note (if any)
- Override action bar

**Key Information Displayed:**
- Participant name and email (linked -> `/admin/users/:id`)
- Bounty title (linked -> `/admin/bounties/:id`)
- Full proof details (text, links, images)
- Status badge
- Payout status badge
- Reviewer note
- Reviewer name (if reviewed)
- Submission date, last updated

**Admin Actions:**
- "Override Status" button -> opens status override modal
- "Override Payout" button (only when status = APPROVED) -> opens payout override modal

**Status Override Modal:**

```
+--------------------------------------------+
| Override Submission Status                  |
|                                             |
| Current Status: [badge]                     |
|                                             |
| New Status:                                 |
| [Dropdown: Submitted / In Review /          |
|  Needs More Info / Approved / Rejected]     |
|                                             |
| Reason (required):                          |
| [___________________________________]       |
| Minimum 10 characters                       |
|                                             |
| [Cancel]              [Override Status]     |
+--------------------------------------------+
```

**Payout Override Modal:**

```
+--------------------------------------------+
| Override Payout Status                      |
|                                             |
| Current Payout: [badge]                     |
|                                             |
| New Payout Status:                          |
| [Dropdown: Not Paid / Pending / Paid]       |
|                                             |
| Reason (required):                          |
| [___________________________________]       |
| Minimum 10 characters                       |
|                                             |
| [Cancel]            [Override Payout]       |
+--------------------------------------------+
```

**Error States:**
- Submission not found: redirect with toast
- API error: toast

**Loading State:**
- Skeleton layout

**PrimeReact Components:** Card, Badge, Tag, Button, Dialog (override modals), Dropdown, InputTextarea, Image, BreadCrumb, Skeleton, Divider

---

### 5.10 Audit Log List

| Field | Value |
|-------|-------|
| **Route** | `/admin/audit-logs` |
| **Purpose** | View all audit trail entries with filtering for investigation |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Sidebar "Audit Logs" link, "View All" from dashboard activity section |

**Layout:**
- Page header: "Audit Logs"
- Filter bar (collapsible)
- DataTable
- Pagination

**Key Information Displayed (per row):**
- Timestamp (formatted: YYYY-MM-DD HH:mm:ss)
- Actor name + email
- Role badge
- Action (human-readable label, e.g., "Approved Submission", "Suspended User")
- Entity type (User / Organisation / Bounty / Submission / Setting)
- Entity ID (truncated UUID, linked to entity if applicable)
- Change summary (one-line description)

**Filter Bar:**

| Control | Component | Behavior |
|---------|-----------|----------|
| Actor | InputText (with autocomplete) | Search by actor name or email |
| Action Type | Dropdown | CREATE, UPDATE, DELETE, STATUS_CHANGE, OVERRIDE, LOGIN, PASSWORD_RESET, etc. |
| Entity Type | Dropdown | User, Organisation, Bounty, Submission, Setting |
| Date Range Start | Calendar | Filter from date |
| Date Range End | Calendar | Filter to date |

**Primary Actions:**
- Click row -> `/admin/audit-logs/:id`

**Secondary Actions:**
- Clear all filters
- Pagination

**Pagination:** Server-side, 25 per page

**Sorting:** Newest first (default, fixed -- audit logs are always chronological)

**Empty State:**
- "No audit log entries match your filters." + "Clear filters" button

**Error States:**
- API error: toast + retry

**Loading State:**
- Skeleton DataTable (25 rows)

**PrimeReact Components:** DataTable, Column, InputText (actor search), Dropdown (action, entity), Calendar (date range), Badge, Paginator, Skeleton, Panel (collapsible filter section)

---

### 5.11 Audit Log Detail

| Field | Value |
|-------|-------|
| **Route** | `/admin/audit-logs/:id` |
| **Purpose** | View full details of a single audit log entry including before/after state |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Click row from Audit Log List |

**Layout:**
- Breadcrumb: Audit Logs > Entry [ID]
- Log entry metadata section
- Before/After state comparison section

**Key Information Displayed:**

| Section | Fields |
|---------|--------|
| Metadata | Timestamp, Actor (name, email, role badge), Action, Entity Type, Entity ID (linked if entity still exists), IP Address |
| Reason | Override/action reason (if provided) -- highlighted box |
| Before State | JSON data formatted as readable key-value table |
| After State | JSON data formatted as readable key-value table |
| Changes | Highlighted diff between before and after (fields that changed shown in bold/highlighted) |

**Before/After display:**
- Each state shown as a two-column table (field name | value)
- Changed fields are visually highlighted (e.g., yellow background)
- If before state is null (creation): "New entity created" message
- If after state is null (deletion): "Entity deleted" message

**Primary Actions:** None (read-only view)

**Secondary Actions:**
- "Back to Audit Logs" breadcrumb link
- Click entity ID to navigate to entity (if it exists)
- Click actor name to navigate to user detail

**Empty State:** N/A

**Error States:**
- Log entry not found: "Audit log entry not found." + back link

**Loading State:**
- Skeleton layout

**PrimeReact Components:** Card, Badge, Tag, BreadCrumb, DataTable (for key-value display), Panel, Skeleton

---

### 5.12 System Health and Troubleshooting

| Field | Value |
|-------|-------|
| **Route** | `/admin/system` |
| **Purpose** | Monitor system health and view recent errors for troubleshooting |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Sidebar "System Health" link |

**Layout:**
- Page header: "System Health"
- Section 1: Health Status panel
- Section 2: Recent Errors panel

**Section 1 -- Health Status:**

| Indicator | Display |
|-----------|---------|
| Overall Status | Large green "Healthy" or red "Unhealthy" badge |
| Database | Connected (green) / Disconnected (red) |
| API Uptime | Duration since last restart |
| Application Version | Version string |
| Last Checked | Timestamp of last health check |

- "Refresh" button to re-fetch health data

**Section 2 -- Recent Errors:**

| Column | Content |
|--------|---------|
| Timestamp | When the error occurred |
| Error Message | Summary (first line) |
| Endpoint | Affected API route |
| Count | Number of occurrences |

- Rows are expandable to show stack trace summary
- Sorted by most recent first
- Pagination: 20 per page

**Primary Actions:**
- "Refresh" health check
- Expand error rows to see details

**Secondary Actions:**
- Pagination on error list

**Empty State (Recent Errors):**
- "No recent errors. The system is running smoothly." (with green checkmark icon)

**Error States:**
- Health check fails: show red "Unhealthy" status with available details
- Error list API failure: toast + retry

**Loading State:**
- Skeleton for health cards
- Skeleton DataTable for errors

**PrimeReact Components:** Card, Badge, Tag, Button, DataTable (expandable rows), Column, Paginator, Skeleton, Panel

---

### 5.13 Global Settings

| Field | Value |
|-------|-------|
| **Route** | `/admin/settings` |
| **Purpose** | Manage global platform toggles (optional/lower priority feature) |
| **Roles** | SUPER_ADMIN |
| **Entry Points** | Sidebar "Settings" link |

**Layout:**
- Page header: "Global Settings"
- Toggle cards

**Key Information Displayed:**

| Setting | Display |
|---------|---------|
| Disable New Signups | Toggle switch + current state + "Last changed: [timestamp]" |
| Disable New Submissions | Toggle switch + current state + "Last changed: [timestamp]" |

**Primary Actions:**
- Toggle each setting (with confirmation dialog)

**Confirmation Dialog:**
- "Are you sure you want to [enable/disable] [setting name]? This will affect all users immediately."
- [Confirm (warning)] [Cancel]

**Error States:**
- API error: toast + revert toggle state
- Network error: toast

**Loading State:**
- Skeleton toggle cards

**PrimeReact Components:** InputSwitch, Card, ConfirmDialog, Skeleton, Button

---

## Appendix: PrimeReact Component Usage Summary

| Component | Usage Count | Screens Used |
|-----------|-------------|--------------|
| Button | All screens | Primary/secondary actions, links |
| InputText | 14 screens | Forms, search bars |
| InputTextarea | 7 screens | Multi-line text input (proof, notes, descriptions) |
| Password | 4 screens | Login, signup, reset, profile edit |
| Dropdown | 12 screens | Filters, selects |
| Calendar | 3 screens | Date pickers (bounty dates, audit log filters) |
| InputNumber | 2 screens | Bounty reward value, max submissions |
| FileUpload | 3 screens | Proof images, org logo |
| InputSwitch | 1 screen | Global settings toggles |
| DataTable + Column | 12 screens | Lists and management tables |
| Paginator | 10 screens | Pagination on all list views |
| Card | 10 screens | Content containers, summary cards |
| Badge | All list screens | Status indicators |
| Tag | All list screens | Category, role indicators |
| Message | 8 screens | Inline errors, info banners |
| ConfirmDialog | 8 screens | Destructive action confirmations |
| Dialog | 3 screens | Override modals |
| BreadCrumb | 12 screens | Navigation hierarchy |
| Skeleton | All screens | Loading states |
| Image | 3 screens | Proof image viewing |
| Panel | 2 screens | Collapsible filter sections |
| Divider | 4 screens | Section separators |
| Avatar | 1 screen | Member list |
| ProgressBar | 1 screen | File upload progress |
| ProgressSpinner | 1 screen | Email verification |
| Toolbar | 2 screens | Action bars |
| SplitButton / Menu | 1 screen | Row actions in bounty management |

---

*This document follows the spec at `md-files/social-bounty-mvp.md` strictly. No features outside the spec have been added. Screen specifications are aligned with the flows defined in `docs/ux/sitemap-and-flows.md`.*
