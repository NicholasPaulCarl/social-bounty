# Test Specs: Admin Panel

These test specs are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the tabbed interface, each tab's functionality, confirmation dialogs, and detail views.

---

## User Flow Tests

### Flow 1: Dashboard Overview

**Setup:** Full dashboard stats, 6+ audit logs, 6 health checks (1 degraded)

**Expected Results:**
- [ ] 5 stat cards render with correct counts
- [ ] Recent activity feed shows latest 6 entries
- [ ] System health cards show all services with status badges
- [ ] Degraded service triggers warning banner

### Flow 2: Suspend a User

**Steps:**
1. Admin clicks Users tab
2. Admin searches for user
3. Admin clicks suspend icon
4. Confirmation dialog appears with required reason
5. Admin enters reason and clicks "Suspend User"

**Expected Results:**
- [ ] Search filters user table
- [ ] Confirmation dialog shows user name
- [ ] Reason field is required
- [ ] `onSuspendUser` fires with userId and reason

### Flow 3: Reinstate a User

**Setup:** User with status "suspended"

**Steps:**
1. Admin finds suspended user (shown with red badge)
2. Admin clicks reinstate icon
3. Confirmation dialog appears (no reason required)
4. Admin confirms

**Expected Results:**
- [ ] Reinstate icon shown instead of suspend for suspended users
- [ ] `onReinstateUser` fires with userId

### Flow 4: Override Submission Status

**Steps:**
1. Admin clicks Oversight tab, then Submissions sub-tab
2. Admin clicks "Override" on a submission
3. Confirmation dialog with reason appears
4. Admin enters reason and confirms

**Expected Results:**
- [ ] Override button visible on each submission row
- [ ] Reason is required
- [ ] `onOverrideSubmission` fires with submissionId, newStatus, reason

### Flow 5: Review Audit Logs

**Steps:**
1. Admin clicks Audit Logs tab
2. Admin filters by action "User Suspended"
3. Admin clicks an entry to expand
4. Expanded shows actor, entity, state change, reason

**Expected Results:**
- [ ] Action filter narrows results
- [ ] Entries expand on click to show details
- [ ] Before/after state displays with visual arrow
- [ ] Reason text is visible

### Flow 6: Toggle Kill Switch

**Steps:**
1. Admin clicks Troubleshooting tab
2. Admin toggles a kill switch off
3. Confirmation dialog appears with required reason
4. Admin confirms

**Expected Results:**
- [ ] Kill switch shows current state (enabled/disabled)
- [ ] Toggle triggers confirmation
- [ ] `onToggleKillSwitch` fires with switchId and new state

---

## Tab Navigation Tests

- [ ] All 6 tabs render and switch correctly
- [ ] Active tab has pink border indicator
- [ ] Tab content changes on click
- [ ] Mobile shows icon-only tabs

---

## Detail View Tests

### User Detail

**Setup:** Suspended user with submissions and audit activity

**Expected Results:**
- [ ] User profile shows name, email, role, org, status, join date
- [ ] Submissions list shows this user's submissions with status badges
- [ ] Admin activity shows audit log entries for this user
- [ ] Sidebar shows details and submission stat breakdown
- [ ] Reinstate button visible (user is suspended)

### Org Detail

**Setup:** Suspended org with members, bounties, submissions

**Expected Results:**
- [ ] Org header shows name, status, contact, member/bounty counts
- [ ] Members/Bounties/Submissions sub-tabs switch content
- [ ] Members list shows user rows with view button
- [ ] Bounties list shows bounty rows with status and reward
- [ ] Admin activity shows audit log entries for this org
- [ ] Reinstate button visible (org is suspended)

---

## Empty State Tests

- [ ] Users tab with no search matches shows "No users found"
- [ ] Orgs tab with no search matches shows "No organizations found"
- [ ] Audit logs with no matches shows "No audit log entries found"
- [ ] User detail with no submissions shows empty list
- [ ] Org detail with no bounties shows empty list

---

## Edge Cases

- [ ] Inactive orgs don't show suspend or reinstate buttons
- [ ] Health check with >500ms response time shows warning color
- [ ] Error entries with count >1 show occurrence badge
- [ ] Tab switching preserves content (no re-render issues)

---

## Sample Test Data

```typescript
const mockUser: AdminUser = {
  id: "user-001",
  name: "Jordan Rivera",
  email: "jordan.r@email.com",
  role: "participant",
  status: "active",
  organizationName: null,
  joinedAt: "2025-11-02T00:00:00Z"
};

const mockOrg: AdminOrganization = {
  id: "org-nova",
  name: "NovaTech Group",
  status: "suspended",
  memberCount: 8,
  bountyCount: 18,
  contactEmail: "ops@novatech.co",
  createdAt: "2025-11-01T00:00:00Z"
};
```
