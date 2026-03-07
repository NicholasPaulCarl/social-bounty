# Review Center Specification

## Overview
The Review Center is a work-queue interface where business admins process incoming submissions. The focus is speed and clarity — reviewers should be able to open a submission, examine proof-of-completion, take action, and move to the next item in under 60 seconds. Submissions update in place when participants respond to "Needs More Info" requests, keeping the full history on a single record.

## User Flows
- Browse the submission queue with default FIFO sort (oldest unreviewed first), filterable by status (Submitted, In Review, Needs More Info, Approved, Rejected), by bounty, and by date range
- View summary stats at the top of the queue: total pending, in review, needs info, approved today, and rejected today
- Click a submission to navigate to a full-page detail view showing the participant info, bounty context, and proof (text, links, images)
- View image proof in a lightbox/zoom overlay for close inspection
- Approve a submission with one click plus an optional note
- Reject a submission with one click plus a mandatory reason (protects the business)
- Request more info with one click plus a mandatory message describing what's needed; status moves to Needs More Info and participant's resubmission updates the existing record (status returns to Submitted)
- Mark an approved submission's payout as Paid (manual confirmation, no auto-pay in MVP)
- Navigate back to the queue from the detail view; queue remembers scroll position and active filters
- View the review history timeline on each submission (status changes, notes, timestamps, who acted)

## UI Requirements
- Queue/list view as the primary screen with a table or card layout showing submission title, bounty name, participant, status badge, submitted date, and reward amount
- Status badges with distinct colors for each status: Submitted, In Review, Needs More Info, Approved, Rejected
- Full-page submission detail view (not a side panel) with a back button to return to the queue
- Prominent action buttons at the top of the detail view (Approve, Reject, Need More Info) — sticky or always visible
- Proof display section: text proof in a readable block, links as clickable chips, images as thumbnails that open in a lightbox on click
- Payout status indicator on approved submissions (Not Paid, Pending, Paid) with a "Mark as Paid" action
- Review history timeline showing each status change with timestamp, actor, and any notes
- Bounty context card on the detail view showing the bounty title, reward, category, and proof requirements so the reviewer doesn't have to navigate away
- Search submissions by participant name or submission content
- Empty state for the queue when all submissions have been reviewed

## Configuration
- shell: true
