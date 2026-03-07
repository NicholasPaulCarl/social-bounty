# My Submissions Specification

## Overview
My Submissions is a personal dashboard where participants track their bounty submissions, monitor review statuses, respond to "Needs More Info" requests by editing their submission inline, and view earnings. It builds platform trust through transparency — reviewer notes are always visible on every outcome. Auth required; participants see only their own submissions.

## User Flows
- View a table of all personal submissions with bounty title, organization, date submitted, submission status badge, and payout status badge
- Filter submissions by status (All, Submitted, In Review, Needs More Info, Approved, Rejected) and by payout status (All, Not Paid, Pending, Paid)
- Sort submissions by newest first (default) or oldest first
- View earnings summary at the top of the page: total submissions, approved count, total earned, and pending payout amount
- Click a submission to view its detail page showing proof submitted (links, images), bounty title with link back to the bounty detail, status timeline/history (when submitted, when reviewed, current state), reviewer note, and payout status
- When a submission is in "Needs More Info" status, an inline edit form appears on the detail page allowing the participant to update links, add/remove images, and resubmit; on resubmit, status returns to Submitted and re-enters the review queue
- No resubmit limit — unlimited back-and-forth until the reviewer approves or rejects
- Navigate back to the submissions list from the detail view

## UI Requirements
- Table layout for the submissions list with colour-coded status badges for both submission status and payout status
- Earnings summary as simple stat cards at the top of the page (total submissions, approved, total earned, pending payout) — counts and totals only, no charts
- Full-page submission detail view with back button to return to the list
- Status timeline on the detail page showing each status change with timestamp and reviewer notes
- Reviewer note prominently displayed on every status (approve, reject, needs more info) for transparency
- Inline edit form on the detail page when status is "Needs More Info": editable link inputs (add/remove) and image upload area with a "Resubmit" button
- Proof display: links as clickable chips, images as thumbnails
- Empty state for the submissions list when the participant has no submissions

## Configuration
- shell: true
