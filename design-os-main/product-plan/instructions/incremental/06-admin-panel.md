# Milestone 6: Admin Panel

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-5 complete

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
