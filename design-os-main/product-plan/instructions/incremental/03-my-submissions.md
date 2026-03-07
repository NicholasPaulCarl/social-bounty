# Milestone 3: My Submissions

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-2 complete

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
