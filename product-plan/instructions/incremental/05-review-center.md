# Milestone 5: Review Center

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-4 complete

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
