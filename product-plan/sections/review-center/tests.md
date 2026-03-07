# Test Specs: Review Center

These test specs are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the submission queue, detail view with proof display, review actions, payout marking, and timeline.

---

## User Flow Tests

### Flow 1: Review and Approve

**Setup:** Submission with status "submitted", proof links and images

**Steps:**
1. Reviewer opens submission detail
2. Reviewer examines text proof, clicks links, views images in lightbox
3. Reviewer clicks "Approve"
4. Reviewer optionally adds a note
5. Reviewer clicks "Confirm Approval"

**Expected Results:**
- [ ] All proof items render (text in block, links as chips, images as thumbnails)
- [ ] Image lightbox opens on click with navigation
- [ ] Approve panel slides open with optional note field
- [ ] `onApprove` fires with note (or undefined if empty)

### Flow 2: Reject with Reason

**Steps:**
1. Reviewer clicks "Reject"
2. Reject panel opens with required reason field
3. Confirm button is disabled until reason is entered
4. Reviewer types reason and confirms

**Expected Results:**
- [ ] Reason field is required (confirm disabled when empty)
- [ ] `onReject` fires with the reason text

### Flow 3: Request More Info

**Steps:**
1. Reviewer clicks "Need Info"
2. Panel opens with required message field
3. Reviewer describes what's needed
4. Reviewer clicks "Send Request"

**Expected Results:**
- [ ] Message field is required
- [ ] `onRequestMoreInfo` fires with message

### Flow 4: Mark as Paid

**Setup:** Approved submission with payout status "not_paid"

**Expected Results:**
- [ ] "Mark Paid" button visible in action bar and payout card
- [ ] `onMarkPaid` fires on click

---

## Empty State Tests

### Empty Queue

**Setup:** No submissions

**Expected Results:**
- [ ] Shows empty state message
- [ ] No table rows rendered

---

## Component Interaction Tests

### SubmissionQueue
- [ ] Summary stats show correct counts per status
- [ ] Status filter tabs work
- [ ] Search filters by participant name
- [ ] Rows are clickable

### SubmissionDetail
- [ ] Back button calls `onBack`
- [ ] Action buttons show/hide based on submission status
- [ ] Approved submissions don't show Approve/Reject/Need Info buttons
- [ ] Review history timeline shows all entries chronologically

---

## Edge Cases

- [ ] Submission with many proof items scrolls properly
- [ ] Multiple images navigate in lightbox
- [ ] Submission with no payout (not yet approved) hides payout card
- [ ] Action panel closes when switching between Approve/Reject/Need Info

---

## Sample Test Data

```typescript
const mockSubmission: Submission = {
  id: "test-sub-1",
  bountyId: "bounty-1",
  participantId: "user-1",
  status: "submitted",
  submittedAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
  proof: [
    { type: "link", value: "https://twitter.com/user/post/123" },
    { type: "text", value: "Posted on March 1st with 500 impressions" }
  ],
  reviewHistory: [
    { status: "submitted", changedAt: "2026-03-01T10:00:00Z", changedBy: null, note: null }
  ],
  payout: null
};
```
