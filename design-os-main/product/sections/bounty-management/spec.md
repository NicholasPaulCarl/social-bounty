# Bounty Management Specification

## Overview
The business admin workspace for creating, editing, and managing bounties through their full lifecycle. Admins can build bounties with detailed requirements, publish them for participants, pause or close them as needed, and track submission counts and performance — all from a filterable table view with full-page detail and edit flows.

## User Flows
- Browse all bounties in a filterable, sortable data table (columns: title, status, category, reward, submission count, created date)
- Filter bounties by status (Draft, Live, Paused, Closed), date range, and reward amount
- Create a new bounty via a full-page form with sections for basic info, requirements, reward & dates, and settings — auto-saves as Draft
- Edit an existing bounty (available in Draft and Live status); some fields lock after submissions are received (e.g., reward amount) to prevent bait-and-switch
- Publish a bounty (Draft → Live) to make it visible to participants
- Pause a live bounty (Live → Paused) to temporarily hide it from participants
- Resume a paused bounty (Paused → Live) to make it visible again
- Close a bounty (any status → Closed) to permanently end it; closed bounties cannot be reopened
- Duplicate a bounty to create a new Draft pre-filled with the original's details
- View a bounty detail page showing all fields, submission count, status history, and quick actions (edit, pause, close, duplicate)
- Bounties are never deleted to preserve audit trail integrity

## UI Requirements
- Data table as the primary view with sortable columns and pagination
- Status filter tabs or dropdown (Draft, Live, Paused, Closed, All)
- Search bar to filter bounties by title
- "Create Bounty" primary action button in the table header
- Full-page create/edit form organized into sections: Basic Info (title, description, instructions, category, tags), Requirements (eligibility criteria, proof requirements — text/link/image, custom proof template), Reward & Dates (reward amount, start date, end date, max submissions), Settings (priority level, featured flag, terms & conditions)
- Auto-save indicator on the form (saving/saved status)
- Field locking indicators on edit form when submissions exist (locked icon + tooltip explaining why)
- Bounty detail page with: all field values displayed read-only, submission count with link to Review Center, status badge with lifecycle history timeline, action buttons (Edit, Pause/Resume, Close, Duplicate)
- Confirmation dialogs for destructive actions (Close bounty)
- Status badges with distinct colors: Draft (neutral/gray), Live (green), Paused (amber), Closed (red)

## Configuration
- shell: true
