# Bounty Marketplace Specification

## Overview
The Bounty Marketplace is the participant-facing discovery and submission experience. Users browse available bounties, read details and requirements, and submit proof-of-completion — all with minimal friction (target: under 60 seconds from finding a bounty to submitting proof). Only Live bounties are shown. No authentication is required to browse or view details; auth is required to submit.

## User Flows
- Browse bounties in a card grid (default) or list view with a toggle between the two layouts
- Filter bounties by category and reward type; sort by newest, ending soon, or highest reward
- Search bounties by title or description with a text input
- View a bounty detail page with full instructions, requirements, reward info, organization name/logo, dates, remaining spots, and eligibility criteria (informational only — no enforcement)
- Submit proof on a full-page form reached via the "Submit Proof" CTA on the detail page; form includes proof links (required, multiple) and proof images (optional, image upload); confirm and submit redirects to My Submissions
- If the user has already submitted for a bounty, the detail page shows their current submission status instead of the submit CTA
- If a bounty is closed or full, submission is disabled and the state is clearly indicated
- Unauthenticated users see a login prompt when tapping "Submit Proof"
- Empty state when no bounties match active filters, with a reset option

## UI Requirements
- Card grid layout as the default browse view with a toggle to switch to a compact list/row layout
- Each card shows: title, short description, reward (type + value), category, organization name/logo, deadline (if set), and submission count vs. max
- Sort selector with three options: Newest, Ending Soon, Highest Reward
- Filter controls for category and reward type
- Search bar for text search across title and description
- Full-page bounty detail view with a back button to return to the list; detail shows full instructions, requirements, reward, organization info, start/end dates, remaining spots ("3 of 10 spots left"), and eligibility criteria text
- Full-page submit proof form with link inputs (add/remove multiple) and optional image upload area; confirmation step before final submit
- Submission status indicator on the detail page when the participant has already submitted
- Closed/full bounty visual treatment: grayed-out card or banner, disabled submit button
- Responsive layout: cards reflow from multi-column grid on desktop to single column on mobile

## Configuration
- shell: true
