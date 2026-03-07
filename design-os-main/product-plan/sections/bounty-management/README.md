# Bounty Management

## Overview

The business admin workspace for creating, editing, and managing bounties through their full lifecycle (Draft → Live → Paused → Closed). Admins build bounties with requirements, publish them, and track submissions.

## User Flows

- Browse bounties in a filterable, sortable data table
- Create bounties via multi-section form (auto-saves as Draft)
- Edit bounties with field locking when submissions exist
- Lifecycle: Publish, Pause, Resume, Close (permanent)
- Duplicate bounties as new Drafts
- View bounty detail with status history and actions

## Components

- `BountyList` — Data table with filters, sort, search, status tabs
- `BountyForm` — Multi-section create/edit form with locking
- `BountyDetail` — Read-only detail with status history and actions
- `StatusBadge` — Bounty status badges

## Callback Props

| Callback | Triggered When |
|----------|---------------|
| `onCreateBounty` | User clicks "Create Bounty" |
| `onEditBounty` | User clicks edit |
| `onViewBounty` | User clicks a row |
| `onPublishBounty` | User publishes a draft |
| `onPauseBounty` | User pauses a live bounty |
| `onResumeBounty` | User resumes a paused bounty |
| `onCloseBounty` | User closes a bounty |
| `onDuplicateBounty` | User duplicates a bounty |

## Visual Reference

See screenshots in this folder for the target UI design.
