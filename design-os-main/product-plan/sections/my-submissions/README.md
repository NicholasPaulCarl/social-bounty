# My Submissions

## Overview

A personal dashboard where participants track their bounty submissions, monitor review statuses, respond to "Needs More Info" requests by editing inline, and view earnings. Auth required; participants see only their own submissions.

## User Flows

- View submissions table with status and payout badges
- Filter by submission status and payout status, sort by newest/oldest
- View earnings summary (total, approved, earned, pending)
- View submission detail with proof, timeline, reviewer notes
- Inline edit and resubmit for "Needs More Info" status

## Components

- `SubmissionsList` — Earnings cards, filters, sort, table
- `MySubmissionDetail` — Detail with proof, inline edit, timeline, payout
- `StatusBadges` — Submission and payout badges

## Callback Props

| Callback | Triggered When |
|----------|---------------|
| `onViewSubmission` | User clicks a submission row |
| `onViewBounty` | User clicks bounty link |
| `onResubmit` | User resubmits updated proof |
| `onBack` | User navigates back to list |

## Visual Reference

See screenshots in this folder for the target UI design.
