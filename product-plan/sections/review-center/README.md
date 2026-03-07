# Review Center

## Overview

A work-queue interface where business admins process incoming submissions. The focus is speed and clarity — reviewers should open, examine proof, take action, and move to the next item quickly. Submissions update in place when participants respond to "Needs More Info".

## User Flows

- Browse submission queue with FIFO sort, filterable by status/bounty/date
- View summary stats (pending, in review, needs info, approved today, rejected today)
- Full-page detail with participant info, bounty context, proof display
- Approve (optional note), Reject (mandatory reason), Request More Info (mandatory message)
- Mark approved submissions as paid
- View review history timeline

## Components

- `SubmissionQueue` — Queue table with stats, filters, search
- `SubmissionDetail` — Full detail with proof, actions, timeline, payout
- `StatusBadge` — Submission and payout badges

## Callback Props

| Callback | Triggered When |
|----------|---------------|
| `onViewSubmission` | Reviewer clicks a submission |
| `onApprove` | Reviewer approves |
| `onReject` | Reviewer rejects (with reason) |
| `onRequestMoreInfo` | Reviewer requests more info |
| `onMarkPaid` | Reviewer marks as paid |
| `onBack` | Reviewer returns to queue |

## Visual Reference

See screenshots in this folder for the target UI design.
