# Bounty Marketplace

## Overview

The participant-facing discovery and submission experience. Users browse available bounties, read details and requirements, and submit proof-of-completion. Only Live bounties are shown. No auth required to browse; auth required to submit.

## User Flows

- Browse bounties in card grid (default) or list view with toggle
- Filter by category, sort by newest/ending soon/highest reward
- Search bounties by title or description
- View bounty detail with full instructions, requirements, reward, org, dates, remaining spots
- Submit proof via full-page form (multiple links + optional images)
- See existing submission status if already submitted
- Closed/full bounties disable submission

## Components

- `BountyBrowse` — Card grid/list browse with filters, sort, search
- `BountyDetail` — Full-page detail with org info, instructions, CTA logic
- `SubmitProof` — Proof submission form with links, images, confirmation

## Callback Props

| Callback | Triggered When |
|----------|---------------|
| `onViewBounty` | User clicks a bounty card |
| `onSubmitProof` | User clicks "Submit Proof" |
| `onBack` | User navigates back |
| `onLogin` | Unauthenticated submit attempt |
| `onSubmit` | User confirms proof submission |

## Visual Reference

See screenshots in this folder for the target UI design.
