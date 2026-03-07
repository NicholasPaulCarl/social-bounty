# Milestone 2: Bounty Marketplace

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Shell) complete

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

Implement the Bounty Marketplace — the participant-facing discovery experience where users browse bounties, view details, and submit proof-of-completion.

## Overview

Participants land here to discover tasks they can complete for rewards. They browse a card grid (with list toggle), filter by category, sort by various criteria, and search by title. Clicking a bounty opens a full-page detail view with instructions, requirements, and a Submit Proof CTA. The submit flow is a full-page form with link inputs and optional image upload.

**Key Functionality:**
- Browse bounties in card grid or list layout with toggle
- Filter by category, sort by newest/ending soon/highest reward, search by title
- View full bounty details with instructions, reward info, org, remaining spots
- Submit proof via full-page form (multiple links + optional images)
- See existing submission status if already submitted
- Login prompt for unauthenticated users trying to submit
- Disabled submission for closed/full bounties

## Components Provided

- `BountyBrowse.tsx` — Card grid/list toggle, filters, sort, search, empty state
- `BountyDetail.tsx` — Full detail page with org info, instructions, sidebar cards, CTA logic
- `SubmitProof.tsx` — Multi-link inputs, image upload, confirmation modal

## Props Reference

**Data props:**
- `MarketplaceBounty` — Bounty with title, description, reward, category, org, dates, spots
- `Category` — Category id and name
- `Organization` — Org id, name, logoUrl
- `UserSubmission` — Existing submission status per bounty

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onViewBounty` | User clicks a bounty card |
| `onSubmitProof` | User clicks "Submit Proof" CTA |
| `onBack` | User clicks back button |
| `onLogin` | Unauthenticated user tries to submit |
| `onSubmit` | User confirms proof submission |

## Expected User Flows

### Flow 1: Browse and Discover Bounties
1. User lands on the marketplace page
2. User sees a grid of bounty cards with titles, rewards, and categories
3. User filters by category chip or sorts by "Highest Reward"
4. User searches by title in the search bar
5. **Outcome:** Filtered/sorted bounty cards display; empty state shown if no matches

### Flow 2: View Bounty Details
1. User clicks a bounty card
2. User sees full-page detail with instructions, eligibility, reward, org info, remaining spots
3. User reads requirements and decides to submit
4. **Outcome:** Detail page renders with correct CTA state (submit/login/full/already submitted)

### Flow 3: Submit Proof of Completion
1. User clicks "Submit Proof" on the detail page
2. User adds one or more proof links (required)
3. User optionally adds image uploads
4. User clicks "Submit" and sees confirmation modal
5. User confirms submission
6. **Outcome:** Proof is submitted, user is redirected to My Submissions

### Flow 4: Already Submitted
1. User views a bounty they've already submitted to
2. Detail page shows their current submission status instead of Submit CTA
3. **Outcome:** Status badge visible, no duplicate submission possible

## Empty States

- **No bounties match filters:** Show empty state with "No bounties found" and reset filters button
- **Bounty is full:** Card shows "Full" treatment, detail page disables submit
- **Bounty is closed:** Card is grayed out, detail page shows closed banner

## Testing

See `product-plan/sections/bounty-marketplace/tests.md`

## Files to Reference

- `product-plan/sections/bounty-marketplace/README.md`
- `product-plan/sections/bounty-marketplace/tests.md`
- `product-plan/sections/bounty-marketplace/components/`
- `product-plan/sections/bounty-marketplace/types.ts`
- `product-plan/sections/bounty-marketplace/sample-data.json`
- `product-plan/sections/bounty-marketplace/screenshot.png`

## Done When

- [ ] Bounty browse renders with card grid and list toggle
- [ ] Category filter, sort, and search work correctly
- [ ] Bounty detail page renders all fields and correct CTA state
- [ ] Submit proof form handles multiple links and image uploads
- [ ] Confirmation step before final submission
- [ ] Closed/full bounties handled gracefully
- [ ] Empty states display properly
- [ ] Responsive on mobile
