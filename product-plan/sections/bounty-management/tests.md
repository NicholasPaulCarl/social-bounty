# Test Specs: Bounty Management

These test specs are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the bounty table, create/edit form, lifecycle transitions, and detail view.

---

## User Flow Tests

### Flow 1: Create a Bounty

**Steps:**
1. User clicks "Create Bounty"
2. User fills in title, description, instructions
3. User selects category and adds tags
4. User sets reward amount and dates
5. User saves (auto-saved as Draft)
6. User clicks "Publish"

**Expected Results:**
- [ ] Form renders all sections (Basic Info, Requirements, Reward & Dates, Settings)
- [ ] Saving creates a Draft bounty
- [ ] Publishing changes status to Live
- [ ] New bounty appears in table

### Flow 2: Edit with Field Locking

**Setup:** Bounty with `hasSubmissions: true`

**Expected Results:**
- [ ] Reward amount field is locked with indicator
- [ ] Locked fields show tooltip explaining why
- [ ] Non-locked fields remain editable

### Flow 3: Lifecycle Management

**Steps:**
1. View a Live bounty detail
2. Click "Pause" → status becomes Paused
3. Click "Resume" → status becomes Live
4. Click "Close" → confirmation dialog → status becomes Closed

**Expected Results:**
- [ ] Each action changes the bounty status
- [ ] Close requires confirmation dialog
- [ ] Closed bounties cannot be reopened
- [ ] Status history timeline updates

---

## Empty State Tests

### No Bounties

**Setup:** Empty bounties array

**Expected Results:**
- [ ] Shows "Create your first bounty" message and CTA
- [ ] "Create Bounty" button is prominent

---

## Edge Cases

- [ ] Bounty with 0 submissions shows "0 submissions"
- [ ] Duplicate creates a new Draft with pre-filled data
- [ ] Status filter tabs show correct counts
- [ ] Search filters by title

---

## Sample Test Data

```typescript
const mockBounty: Bounty = {
  id: "test-1",
  title: "Test Bounty",
  description: "Description",
  instructions: "Do the thing",
  categoryId: "cat-1",
  tags: ["social"],
  rewardAmount: 50,
  startDate: "2026-01-01T00:00:00Z",
  endDate: null,
  maxSubmissions: 100,
  eligibilityCriteria: "Open to all",
  proofRequirements: ["link", "image"],
  proofTemplate: null,
  priority: "medium",
  featured: false,
  termsAndConditions: "Standard terms",
  status: "draft",
  submissionCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  createdBy: "admin-1",
  statusHistory: [{ status: "draft", changedAt: "2026-01-01T00:00:00Z", changedBy: "admin-1" }]
};
```
