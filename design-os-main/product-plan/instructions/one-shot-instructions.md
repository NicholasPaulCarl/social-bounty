# Social Bounty — Complete Implementation Instructions

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Testing

Each section includes a `tests.md` file with UI behavior test specs. These are **framework-agnostic** — adapt them to your testing setup.

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

---

## Product Overview

Social Bounty is a task marketplace where businesses post bounties with rewards and real people complete them with verifiable proof. It brings accountability, structured review, and transparent payout tracking to the gig-task economy.

### Planned Sections

1. **Bounty Marketplace** — The participant-facing browse and search experience where users discover available bounties, filter by category or reward, and claim tasks to work on.
2. **My Submissions** — A personal dashboard where participants track their active and past submissions, see review status, respond to "Needs More Info" requests, and monitor their earnings.
3. **Bounty Management** — The business admin workspace for creating, editing, and managing bounties through their full lifecycle (Draft, Live, Paused, Closed), including setting rewards and requirements.
4. **Review Center** — Where business admins review incoming submissions, examine proof-of-completion, approve or reject work, request additional information, and track payout status for approved submissions.
5. **Admin Panel** — The super admin control center for platform-wide user management, organization oversight, submission overrides, audit log review, system health monitoring, and simple reporting.

### Product Entities

- **User** — A person who uses the platform with role-based access (Participant, Business Admin, Super Admin)
- **Organization** — A business or company that creates and manages bounties
- **OrganizationMember** — Membership link between User and Organization with role
- **Bounty** — A task posted by an organization with reward, requirements, and deadline (Draft -> Live -> Paused -> Closed)
- **Submission** — A participant's completed work with structured proof (Submitted -> In Review -> Needs More Info -> Approved -> Rejected)
- **Payout** — Payment tracking for approved submissions (Not Paid -> Pending -> Paid)
- **FileUpload** — Files attached to submissions as proof-of-completion
- **AuditLog** — Timestamped record of admin actions for accountability

### Design System

**Colors:**
- Primary: pink — buttons, links, key accents
- Secondary: blue — tags, highlights, secondary elements
- Neutral: slate — backgrounds, text, borders

**Typography:**
- Heading: Space Grotesk
- Body: Inter
- Mono: Source Code Pro

### Implementation Sequence

Build this product in milestones:

1. **Shell** — Set up design tokens and application shell (collapsible sidebar navigation)
2. **Bounty Marketplace** — Participant browse/search, bounty details, submit proof
3. **My Submissions** — Personal submission tracking, earnings, inline resubmit
4. **Bounty Management** — Business admin bounty CRUD, lifecycle management
5. **Review Center** — Submission review queue, approve/reject/need info, payouts
6. **Admin Panel** — Super admin user/org management, audit logs, troubleshooting

---

# Milestone 1: Shell

> **Prerequisites:** None

## Goal

Set up the design tokens and application shell — the persistent chrome that wraps all sections.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration
- See `product-plan/design-system/fonts.md` for Google Fonts setup

**Colors:** pink (primary), blue (secondary), slate (neutral)
**Fonts:** Space Grotesk (headings), Inter (body), Source Code Pro (mono)

### 2. Application Shell

Copy the shell components from `product-plan/shell/components/`:

- `AppShell.tsx` — Main layout wrapper with collapsible sidebar and mobile overlay
- `MainNav.tsx` — Navigation component with active indicator and notification badges
- `UserMenu.tsx` — User menu with avatar, settings, and logout

**Wire Up Navigation:**

| Route | Label | Roles |
|-------|-------|-------|
| `/marketplace` | Bounty Marketplace | Participant, Super Admin |
| `/my-submissions` | My Submissions | Participant, Super Admin |
| `/bounty-management` | Bounty Management | Business Admin, Super Admin |
| `/review-center` | Review Center | Business Admin, Super Admin |
| `/admin` | Admin Panel | Super Admin |

**User Menu:**

The user menu expects:
- User name
- Avatar URL (optional, falls back to initials)
- Role (optional, displayed below name)
- Logout callback
- Settings callback

## Files to Reference

- `product-plan/design-system/` — Design tokens
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts)
- [ ] Shell renders with collapsible sidebar navigation
- [ ] Navigation items are role-filtered and route correctly
- [ ] User menu shows user info with dropdown
- [ ] Mobile responsive: hamburger menu with slide-over
- [ ] Dark mode works correctly

---

# Milestone 2: Bounty Marketplace

> **Prerequisites:** Milestone 1 (Shell) complete

## Goal

Implement the Bounty Marketplace — the participant-facing discovery experience where users browse bounties, view details, and submit proof-of-completion.

## Overview

Participants land here to discover tasks they can complete for rewards. They browse a card grid (with list toggle), filter by category, sort by various criteria, and search by title. Clicking a bounty opens a full-page detail view with instructions, requirements, and a Submit Proof CTA. The submit flow is a full-page form with link inputs and optional image upload.

**Key Functionality:**
- Browse bounties in card grid or list layout with toggle
- Filter by category, sort by newest/ending soon/highest reward, search by title
- View full bounty details with instructions, reward info, org, remaining spots
- Submit proof via full-page form (multiple links + optional images)
- See existing submission status if already submitted
- Login prompt for unauthenticated users trying to submit
- Disabled submission for closed/full bounties

## Components Provided

- `BountyBrowse.tsx` — Card grid/list toggle, filters, sort, search, empty state
- `BountyDetail.tsx` — Full detail page with org info, instructions, sidebar cards, CTA logic
- `SubmitProof.tsx` — Multi-link inputs, image upload, confirmation modal

## Props Reference

**Data props:**
- `MarketplaceBounty` — Bounty with title, description, reward, category, org, dates, spots
- `Category` — Category id and name
- `Organization` — Org id, name, logoUrl
- `UserSubmission` — Existing submission status per bounty

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onViewBounty` | User clicks a bounty card |
| `onSubmitProof` | User clicks "Submit Proof" CTA |
| `onBack` | User clicks back button |
| `onLogin` | Unauthenticated user tries to submit |
| `onSubmit` | User confirms proof submission |

## Expected User Flows

### Flow 1: Browse and Discover Bounties
1. User lands on the marketplace page
2. User sees a grid of bounty cards with titles, rewards, and categories
3. User filters by category chip or sorts by "Highest Reward"
4. User searches by title in the search bar
5. **Outcome:** Filtered/sorted bounty cards display; empty state shown if no matches

### Flow 2: View Bounty Details
1. User clicks a bounty card
2. User sees full-page detail with instructions, eligibility, reward, org info, remaining spots
3. User reads requirements and decides to submit
4. **Outcome:** Detail page renders with correct CTA state (submit/login/full/already submitted)

### Flow 3: Submit Proof of Completion
1. User clicks "Submit Proof" on the detail page
2. User adds one or more proof links (required)
3. User optionally adds image uploads
4. User clicks "Submit" and sees confirmation modal
5. User confirms submission
6. **Outcome:** Proof is submitted, user is redirected to My Submissions

### Flow 4: Already Submitted
1. User views a bounty they've already submitted to
2. Detail page shows their current submission status instead of Submit CTA
3. **Outcome:** Status badge visible, no duplicate submission possible

## Empty States

- **No bounties match filters:** Show empty state with "No bounties found" and reset filters button
- **Bounty is full:** Card shows "Full" treatment, detail page disables submit
- **Bounty is closed:** Card is grayed out, detail page shows closed banner

## Testing

See `product-plan/sections/bounty-marketplace/tests.md`

## Files to Reference

- `product-plan/sections/bounty-marketplace/README.md`
- `product-plan/sections/bounty-marketplace/tests.md`
- `product-plan/sections/bounty-marketplace/components/`
- `product-plan/sections/bounty-marketplace/types.ts`
- `product-plan/sections/bounty-marketplace/sample-data.json`
- `product-plan/sections/bounty-marketplace/screenshot.png`

## Done When

- [ ] Bounty browse renders with card grid and list toggle
- [ ] Category filter, sort, and search work correctly
- [ ] Bounty detail page renders all fields and correct CTA state
- [ ] Submit proof form handles multiple links and image uploads
- [ ] Confirmation step before final submission
- [ ] Closed/full bounties handled gracefully
- [ ] Empty states display properly
- [ ] Responsive on mobile

---

# Milestone 3: My Submissions

> **Prerequisites:** Milestones 1-2 complete

## Goal

Implement the My Submissions section — a personal dashboard where participants track submissions, monitor review statuses, respond to "Needs More Info" requests, and view earnings.

## Overview

Authenticated participants see all their bounty submissions in a table with filters and sort. An earnings summary shows key stats. Clicking a submission opens a detail view with proof, timeline, and reviewer notes. When a submission needs more info, an inline edit form lets participants update their proof and resubmit.

**Key Functionality:**
- View submissions table with status and payout badges
- Filter by submission status and payout status
- Sort by newest/oldest
- View earnings summary (total, approved, earned, pending)
- View submission detail with proof, timeline, reviewer notes
- Inline edit and resubmit when status is "Needs More Info"

## Components Provided

- `SubmissionsList.tsx` — Earnings cards, status tab filters, payout filter, sort, table
- `MySubmissionDetail.tsx` — Full detail with proof display, inline edit, timeline, payout card
- `StatusBadges.tsx` — Submission status and payout badges

## Props Reference

**Data props:**
- `MySubmission` — Submission with proof items, timeline entries, payout
- `BountyReference` — Lightweight bounty context (title, org, reward, category)
- `EarningsSummary` — Aggregated stats

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onViewSubmission` | User clicks a submission row |
| `onViewBounty` | User clicks bounty link |
| `onResubmit` | User submits updated proof |
| `onBack` | User clicks back to list |

## Expected User Flows

### Flow 1: Review Submission Status
1. User views their submissions list with status badges
2. User filters by "In Review" to see pending items
3. User clicks a submission to see its detail
4. **Outcome:** Detail shows proof, timeline with all status changes, reviewer notes

### Flow 2: Respond to Needs More Info
1. User sees a submission with "Needs More Info" status
2. Detail page shows prominent reviewer note explaining what's needed
3. User clicks to edit proof, updates links/images
4. User clicks "Resubmit"
5. **Outcome:** Submission returns to "Submitted" status, re-enters review queue

### Flow 3: Track Earnings
1. User views earnings summary cards at top of list
2. Cards show total submissions, approved count, total earned, pending payout
3. User filters by payout status "Pending" to see awaiting payment
4. **Outcome:** Clear visibility into financial status

## Empty States

- **No submissions:** Show empty state with "No submissions yet" and link to marketplace
- **No filter matches:** Show "No submissions match your filters" with clear button

## Testing

See `product-plan/sections/my-submissions/tests.md`

## Files to Reference

- `product-plan/sections/my-submissions/README.md`
- `product-plan/sections/my-submissions/tests.md`
- `product-plan/sections/my-submissions/components/`
- `product-plan/sections/my-submissions/types.ts`
- `product-plan/sections/my-submissions/sample-data.json`
- `product-plan/sections/my-submissions/screenshot.png`

## Done When

- [ ] Submissions table renders with status and payout badges
- [ ] Status filter tabs and payout dropdown work
- [ ] Earnings summary cards show correct aggregated data
- [ ] Submission detail shows proof, timeline, and reviewer notes
- [ ] Inline edit form works for "Needs More Info" submissions
- [ ] Resubmit resets status to "Submitted"
- [ ] Empty states display properly
- [ ] Responsive on mobile

---

# Milestone 4: Bounty Management

> **Prerequisites:** Milestones 1-3 complete

## Goal

Implement the Bounty Management section — the business admin workspace for creating, editing, and managing bounties through their full lifecycle.

## Overview

Business admins manage their organization's bounties from a filterable data table. They create bounties via a multi-section form that auto-saves as Draft, then publish to make them Live. Bounties can be paused, resumed, or permanently closed. A detail view shows all fields, submission count, status history, and lifecycle actions.

**Key Functionality:**
- Browse bounties in a filterable, sortable data table
- Create bounties via multi-section form (Basic Info, Requirements, Reward & Dates, Settings)
- Edit existing bounties with field locking when submissions exist
- Manage lifecycle: Publish (Draft->Live), Pause (Live->Paused), Resume (Paused->Live), Close (any->Closed)
- Duplicate bounties as new Drafts
- View bounty detail with all fields, submission count, status history

## Components Provided

- `BountyList.tsx` — Data table with filters, sort, search, status tabs, create button
- `BountyForm.tsx` — Multi-section create/edit form with field locking and auto-save indicator
- `BountyDetail.tsx` — Read-only detail with status history timeline and action buttons
- `StatusBadge.tsx` — Bounty status badges

## Props Reference

**Data props:**
- `Bounty` — Full bounty with all fields, status history, submission count
- `Category` — Category for filtering and form

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onCreateBounty` | User clicks "Create Bounty" |
| `onEditBounty` | User clicks edit on a bounty |
| `onViewBounty` | User clicks a bounty row |
| `onPublishBounty` | User publishes a draft |
| `onPauseBounty` | User pauses a live bounty |
| `onResumeBounty` | User resumes a paused bounty |
| `onCloseBounty` | User closes a bounty (with confirmation) |
| `onDuplicateBounty` | User duplicates a bounty |
| `onSave` | Form save |
| `onCancel` | Form cancel |

## Expected User Flows

### Flow 1: Create a New Bounty
1. User clicks "Create Bounty" button
2. User fills in Basic Info (title, description, instructions, category, tags)
3. User sets Requirements (eligibility, proof types, proof template)
4. User configures Reward & Dates (amount, start/end, max submissions)
5. User adjusts Settings (priority, featured, terms)
6. Form auto-saves as Draft
7. User clicks "Publish" to make it Live
8. **Outcome:** Bounty appears in the list with "Live" status

### Flow 2: Edit an Existing Bounty
1. User clicks edit on a bounty
2. If submissions exist, reward amount and some fields are locked with indicators
3. User modifies allowed fields
4. User saves changes
5. **Outcome:** Bounty updates in place

### Flow 3: Manage Bounty Lifecycle
1. User views a Live bounty's detail page
2. User clicks "Pause" to temporarily hide it
3. Later, user clicks "Resume" to make it Live again
4. When done, user clicks "Close" and confirms
5. **Outcome:** Bounty moves through statuses, closed bounties cannot be reopened

## Empty States

- **No bounties:** Show empty state with "Create your first bounty" CTA
- **No filter matches:** Show "No bounties match your filters" with clear button

## Testing

See `product-plan/sections/bounty-management/tests.md`

## Files to Reference

- `product-plan/sections/bounty-management/README.md`
- `product-plan/sections/bounty-management/tests.md`
- `product-plan/sections/bounty-management/components/`
- `product-plan/sections/bounty-management/types.ts`
- `product-plan/sections/bounty-management/sample-data.json`
- `product-plan/sections/bounty-management/screenshot.png`

## Done When

- [ ] Bounty table renders with status badges, sort, filter, search
- [ ] Create form works with all sections
- [ ] Edit form locks fields when submissions exist
- [ ] Lifecycle actions (publish, pause, resume, close) work with confirmations
- [ ] Duplicate creates a new draft pre-filled
- [ ] Detail view shows all fields, submission count, status history
- [ ] Empty states display properly
- [ ] Responsive on mobile

---

# Milestone 5: Review Center

> **Prerequisites:** Milestones 1-4 complete

## Goal

Implement the Review Center — the work-queue interface where business admins process incoming submissions with speed and clarity.

## Overview

Reviewers see a queue of submissions sorted by oldest first (FIFO). Summary stats show pending counts. Clicking a submission opens a full-page detail with participant info, bounty context, proof display, and action buttons. Reviewers can approve (optional note), reject (mandatory reason), or request more info (mandatory message). Approved submissions can be marked as paid.

**Key Functionality:**
- Browse submission queue with FIFO sort, status filter, bounty filter, date range
- View summary stats (pending, in review, needs info, approved today, rejected today)
- Full-page submission detail with proof display (text, links, images with lightbox)
- Approve/Reject/Need More Info actions with text fields
- Mark approved submissions as paid
- Review history timeline with all status changes and notes

## Components Provided

- `SubmissionQueue.tsx` — Queue table with stats, filters, search, empty state
- `SubmissionDetail.tsx` — Full detail with participant info, proof, action panel, timeline, payout
- `StatusBadge.tsx` — Submission and payout status badges

## Props Reference

**Data props:**
- `Submission` — Full submission with proof items, review history, payout
- `Participant` — Participant name, email, avatar
- `BountySummary` — Bounty title, reward, category, proof requirements

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onViewSubmission` | Reviewer clicks a submission row |
| `onApprove` | Reviewer approves (with optional note) |
| `onReject` | Reviewer rejects (with mandatory reason) |
| `onRequestMoreInfo` | Reviewer requests more info (mandatory message) |
| `onMarkPaid` | Reviewer marks payout as paid |
| `onBack` / `onBackToQueue` | Reviewer returns to queue |

## Expected User Flows

### Flow 1: Review and Approve a Submission
1. Reviewer sees the queue sorted by oldest pending first
2. Reviewer clicks a submission to open detail
3. Reviewer examines proof (text, links, images via lightbox)
4. Reviewer clicks "Approve", optionally adds a note
5. Reviewer confirms approval
6. **Outcome:** Submission status changes to "Approved", payout record created

### Flow 2: Reject a Submission
1. Reviewer opens a submission detail
2. Reviewer finds proof insufficient
3. Reviewer clicks "Reject", enters mandatory reason
4. Reviewer confirms rejection
5. **Outcome:** Submission status changes to "Rejected" with documented reason

### Flow 3: Request More Information
1. Reviewer opens a submission detail
2. Reviewer needs clarification on a proof item
3. Reviewer clicks "Need Info", enters what's needed
4. Reviewer sends the request
5. **Outcome:** Status changes to "Needs More Info", participant is notified

### Flow 4: Mark Payout as Paid
1. Reviewer views an approved submission
2. Reviewer confirms payment was made externally
3. Reviewer clicks "Mark as Paid"
4. **Outcome:** Payout status changes to "Paid"

## Empty States

- **Queue empty:** Show "All caught up!" with checkmark
- **No filter matches:** Show "No submissions match your filters" with clear button

## Testing

See `product-plan/sections/review-center/tests.md`

## Files to Reference

- `product-plan/sections/review-center/README.md`
- `product-plan/sections/review-center/tests.md`
- `product-plan/sections/review-center/components/`
- `product-plan/sections/review-center/types.ts`
- `product-plan/sections/review-center/sample-data.json`
- `product-plan/sections/review-center/screenshot.png`

## Done When

- [ ] Submission queue renders with FIFO sort and status filters
- [ ] Summary stats show correct counts
- [ ] Detail view shows participant info, bounty context, all proof
- [ ] Image lightbox works for image proof
- [ ] Approve/Reject/Need Info actions work with text fields
- [ ] Reject and Need Info require mandatory text
- [ ] Mark as Paid works for approved submissions
- [ ] Review history timeline shows all status changes
- [ ] Empty states display properly
- [ ] Responsive on mobile

---

# Milestone 6: Admin Panel

> **Prerequisites:** Milestones 1-5 complete

## Goal

Implement the Admin Panel — the super admin control center for platform-wide oversight, user management, and troubleshooting.

## Overview

Super admins access a single-page tabbed interface with six sections: Dashboard, Users, Organizations, Oversight, Audit Logs, and Troubleshooting. The Dashboard shows platform-wide stats, recent activity, and system health. User and Org tabs provide searchable tables with suspend/reinstate actions. The Oversight tab lets admins browse all bounties and override submission statuses. Audit Logs show an immutable record of all admin actions. Troubleshooting provides error logs, health checks, and kill switches. Full-page detail views are available for individual users and organizations.

**Key Functionality:**
- Dashboard with stat cards, recent activity feed, system health indicators
- User management: search, filter by role/status, suspend/reinstate/force password reset
- Organization management: search, filter by status, suspend/reinstate
- Bounty and submission oversight with status override capability
- Searchable, filterable audit logs with expandable detail
- Troubleshooting: error log, health check cards, kill switch toggles
- Full-page User Detail and Org Detail views
- All destructive actions require confirmation dialogs with mandatory reasons

## Components Provided

- `AdminPanel.tsx` — Main tabbed container orchestrating all tabs
- `DashboardTab.tsx` — Stat cards, activity feed, health indicator
- `UsersTab.tsx` — Searchable user table with action buttons
- `OrganizationsTab.tsx` — Searchable org table with action buttons
- `OversightTab.tsx` — Bounty browser + submission browser with override
- `AuditLogsTab.tsx` — Expandable log entries with filters
- `TroubleshootingTab.tsx` — Health cards, error log, kill switches
- `UserDetail.tsx` — Full-page user profile with submissions and audit activity
- `OrgDetail.tsx` — Full-page org profile with members, bounties, submissions
- `ConfirmationDialog.tsx` — Reusable confirmation modal with optional reason
- `StatusBadges.tsx` — All admin-specific status badges

## Props Reference

**Data props:**
- `DashboardStats` — Aggregated counts for users, orgs, bounties, submissions, payouts
- `AdminUser`, `AdminOrganization`, `AdminBounty`, `AdminSubmission` — Entity records
- `AuditLogEntry` — Immutable log with actor, action, entity, before/after state, reason
- `HealthCheck`, `SystemError`, `KillSwitch` — System monitoring

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onViewUser` | Admin clicks to view user detail |
| `onSuspendUser` | Admin suspends a user (with reason) |
| `onReinstateUser` | Admin reinstates a user |
| `onForcePasswordReset` | Admin forces password reset |
| `onViewOrg` | Admin clicks to view org detail |
| `onSuspendOrg` | Admin suspends an org (with reason) |
| `onReinstateOrg` | Admin reinstates an org |
| `onOverrideSubmission` | Admin overrides submission status (with reason) |
| `onToggleKillSwitch` | Admin toggles a kill switch |

## Expected User Flows

### Flow 1: Monitor Platform Health
1. Admin views the Dashboard tab
2. Stat cards show user, org, bounty, submission, and payout counts
3. Recent activity feed shows latest admin actions
4. System health panel shows service statuses
5. **Outcome:** Quick overview of platform state

### Flow 2: Suspend a User
1. Admin navigates to Users tab
2. Admin searches for or filters to find the user
3. Admin clicks the suspend icon on the user row
4. Confirmation dialog appears with mandatory reason field
5. Admin enters reason and confirms
6. **Outcome:** User is suspended, action is audit-logged

### Flow 3: Override a Submission Status
1. Admin navigates to Oversight tab, selects Submissions sub-tab
2. Admin finds the submission and clicks "Override"
3. Confirmation dialog with mandatory reason appears
4. Admin enters reason and confirms
5. **Outcome:** Submission status is overridden, audit-logged with before/after state

### Flow 4: Review Audit Logs
1. Admin navigates to Audit Logs tab
2. Admin filters by action type (e.g., "User Suspended")
3. Admin clicks an entry to expand details
4. Expanded view shows actor, entity, state change, and reason
5. **Outcome:** Full transparency into admin actions

## Empty States

- **No users/orgs match filter:** Show "No results found" with clear filter option
- **No audit log entries:** Show "No audit log entries found"
- **No system errors:** Clean state (no special treatment needed)

## Testing

See `product-plan/sections/admin-panel/tests.md`

## Files to Reference

- `product-plan/sections/admin-panel/README.md`
- `product-plan/sections/admin-panel/tests.md`
- `product-plan/sections/admin-panel/components/`
- `product-plan/sections/admin-panel/types.ts`
- `product-plan/sections/admin-panel/sample-data.json`
- `product-plan/sections/admin-panel/screenshot.png`

## Done When

- [ ] All 6 tabs render and switch correctly
- [ ] Dashboard shows stats, activity feed, and health
- [ ] User table supports search, role filter, status filter
- [ ] Org table supports search and status filter
- [ ] Suspend/reinstate/reset actions work with confirmation dialogs
- [ ] Oversight tab browses bounties and submissions with status override
- [ ] Audit logs are searchable, filterable, and expandable
- [ ] Troubleshooting shows errors, health checks, and kill switches
- [ ] User Detail and Org Detail full-page views work
- [ ] All destructive actions require confirmation with reason
- [ ] Responsive on mobile
