# Milestone 4: Bounty Management

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1-3 complete

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

Implement the Bounty Management section — the business admin workspace for creating, editing, and managing bounties through their full lifecycle.

## Overview

Business admins manage their organization's bounties from a filterable data table. They create bounties via a multi-section form that auto-saves as Draft, then publish to make them Live. Bounties can be paused, resumed, or permanently closed. A detail view shows all fields, submission count, status history, and lifecycle actions.

**Key Functionality:**
- Browse bounties in a filterable, sortable data table
- Create bounties via multi-section form (Basic Info, Requirements, Reward & Dates, Settings)
- Edit existing bounties with field locking when submissions exist
- Manage lifecycle: Publish (Draft->Live), Pause (Live->Paused), Resume (Paused->Live), Close (any->Closed)
- Duplicate bounties as new Drafts
- View bounty detail with all fields, submission count, status history

## Components Provided

- `BountyList.tsx` — Data table with filters, sort, search, status tabs, create button
- `BountyForm.tsx` — Multi-section create/edit form with field locking and auto-save indicator
- `BountyDetail.tsx` — Read-only detail with status history timeline and action buttons
- `StatusBadge.tsx` — Bounty status badges

## Props Reference

**Data props:**
- `Bounty` — Full bounty with all fields, status history, submission count
- `Category` — Category for filtering and form

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onCreateBounty` | User clicks "Create Bounty" |
| `onEditBounty` | User clicks edit on a bounty |
| `onViewBounty` | User clicks a bounty row |
| `onPublishBounty` | User publishes a draft |
| `onPauseBounty` | User pauses a live bounty |
| `onResumeBounty` | User resumes a paused bounty |
| `onCloseBounty` | User closes a bounty (with confirmation) |
| `onDuplicateBounty` | User duplicates a bounty |
| `onSave` | Form save |
| `onCancel` | Form cancel |

## Expected User Flows

### Flow 1: Create a New Bounty
1. User clicks "Create Bounty" button
2. User fills in Basic Info (title, description, instructions, category, tags)
3. User sets Requirements (eligibility, proof types, proof template)
4. User configures Reward & Dates (amount, start/end, max submissions)
5. User adjusts Settings (priority, featured, terms)
6. Form auto-saves as Draft
7. User clicks "Publish" to make it Live
8. **Outcome:** Bounty appears in the list with "Live" status

### Flow 2: Edit an Existing Bounty
1. User clicks edit on a bounty
2. If submissions exist, reward amount and some fields are locked with indicators
3. User modifies allowed fields
4. User saves changes
5. **Outcome:** Bounty updates in place

### Flow 3: Manage Bounty Lifecycle
1. User views a Live bounty's detail page
2. User clicks "Pause" to temporarily hide it
3. Later, user clicks "Resume" to make it Live again
4. When done, user clicks "Close" and confirms
5. **Outcome:** Bounty moves through statuses, closed bounties cannot be reopened

## Empty States

- **No bounties:** Show empty state with "Create your first bounty" CTA
- **No filter matches:** Show "No bounties match your filters" with clear button

## Testing

See `product-plan/sections/bounty-management/tests.md`

## Files to Reference

- `product-plan/sections/bounty-management/README.md`
- `product-plan/sections/bounty-management/tests.md`
- `product-plan/sections/bounty-management/components/`
- `product-plan/sections/bounty-management/types.ts`
- `product-plan/sections/bounty-management/sample-data.json`
- `product-plan/sections/bounty-management/screenshot.png`

## Done When

- [ ] Bounty table renders with status badges, sort, filter, search
- [ ] Create form works with all sections
- [ ] Edit form locks fields when submissions exist
- [ ] Lifecycle actions (publish, pause, resume, close) work with confirmations
- [ ] Duplicate creates a new draft pre-filled
- [ ] Detail view shows all fields, submission count, status history
- [ ] Empty states display properly
- [ ] Responsive on mobile
