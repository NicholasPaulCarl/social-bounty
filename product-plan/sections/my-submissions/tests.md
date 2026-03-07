# Test Specs: My Submissions

These test specs are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the submissions list, earnings summary, detail view, inline resubmit flow, and empty states.

---

## User Flow Tests

### Flow 1: View Submissions List

**Setup:**
- 7 submissions across all statuses
- Earnings: 7 total, 3 approved, $185 earned, $120 pending

**Expected Results:**
- [ ] Earnings cards show correct totals
- [ ] All submissions render in table with bounty title, status badge, reward, payout, date
- [ ] Status filter tabs show correct counts per status

### Flow 2: Filter and Sort

**Steps:**
1. User clicks "Approved" status tab
2. Only approved submissions show
3. User selects "Paid" payout filter
4. Results further narrow
5. User clicks sort toggle to "Oldest"

**Expected Results:**
- [ ] Status tabs filter correctly
- [ ] Payout dropdown filters correctly
- [ ] Sort toggle reverses order
- [ ] Count updates in tabs

### Flow 3: View Submission Detail

**Steps:**
1. User clicks a submission row
2. Detail page shows proof, timeline, bounty link

**Expected Results:**
- [ ] Proof links render as clickable elements
- [ ] Proof images render as thumbnails
- [ ] Timeline shows all status changes with timestamps
- [ ] Reviewer notes are visible on each timeline entry
- [ ] Payout card shows status and amount

### Flow 4: Inline Resubmit

**Setup:**
- Submission with status "needs_more_info" and reviewer note

**Steps:**
1. Detail page shows prominent "Needs More Info" banner with reviewer note
2. User sees inline edit form
3. User updates a link, adds a new one
4. User clicks "Resubmit"

**Expected Results:**
- [ ] Reviewer note is prominently displayed
- [ ] Edit form shows existing proof pre-filled
- [ ] Links can be added and removed
- [ ] `onResubmit` fires with updated links and images

---

## Empty State Tests

### No Submissions

**Setup:** Empty submissions array

**Expected Results:**
- [ ] Shows "No submissions yet" message
- [ ] Suggests browsing the Bounty Marketplace
- [ ] Earnings cards show all zeros

### No Filter Matches

**Setup:** Filter to a status with 0 submissions

**Expected Results:**
- [ ] Shows "No submissions match your filters"
- [ ] Shows "Clear filters" button

---

## Edge Cases

- [ ] Submission with no payout shows dash in payout column
- [ ] Earnings summary handles $0.00 correctly
- [ ] Very long bounty titles don't break table layout
- [ ] Multiple timeline entries render in correct order (newest first)

---

## Sample Test Data

```typescript
const mockSubmission: MySubmission = {
  id: "test-sub-1",
  bountyId: "bounty-1",
  status: "needs_more_info",
  submittedAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-03T14:00:00Z",
  proof: [{ type: "link", value: "https://example.com/proof" }],
  timeline: [
    { status: "submitted", changedAt: "2026-03-01T10:00:00Z", note: null },
    { status: "needs_more_info", changedAt: "2026-03-03T14:00:00Z", note: "Please provide a direct link to your post" }
  ],
  payout: null
};

const mockEarnings: EarningsSummary = {
  totalSubmissions: 5,
  approvedCount: 2,
  totalEarned: 100,
  pendingPayout: 50
};
```
