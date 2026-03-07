# Test Specs: Bounty Marketplace

These test specs are **framework-agnostic**. Adapt them to your testing setup.

## Overview

Test the bounty browse experience, detail view rendering, proof submission flow, and edge cases like closed/full bounties.

---

## User Flow Tests

### Flow 1: Browse and Filter Bounties

**Setup:**
- 8 bounties across multiple categories
- Categories: Social Media, Content, Research, Design, Referral, Video

**Steps:**
1. User sees card grid with all bounties
2. User clicks "Social Media" category chip
3. Only social media bounties are shown
4. User changes sort to "Highest Reward"
5. Cards reorder by reward amount descending

**Expected Results:**
- [ ] All 8 bounties render as cards with title, reward, category, org
- [ ] Clicking a category chip filters cards
- [ ] Sort changes card order
- [ ] Search filters by title text
- [ ] Toggling to list view switches layout

### Flow 2: View Bounty Detail

**Setup:**
- A bounty with endDate, maxSubmissions, and eligibilityText

**Steps:**
1. User clicks a bounty card
2. Detail page renders with all fields

**Expected Results:**
- [ ] Title, full description, and instructions render
- [ ] Organization name displays
- [ ] Reward amount shows formatted as currency
- [ ] Remaining spots show (e.g., "7 of 10 spots left")
- [ ] End date displays when set
- [ ] Eligibility criteria text displays
- [ ] "Submit Proof" button is visible for authenticated users

### Flow 3: Submit Proof

**Steps:**
1. User clicks "Submit Proof" on detail page
2. User adds a proof link
3. User adds a second proof link via "Add Link"
4. User clicks "Submit"
5. Confirmation modal appears
6. User confirms

**Expected Results:**
- [ ] At least one link is required to submit
- [ ] Multiple links can be added and removed
- [ ] Confirmation modal shows before final submit
- [ ] `onSubmit` callback fires with links array

### Flow 4: Already Submitted

**Setup:**
- User has an existing submission for bounty-001 with status "in_review"

**Expected Results:**
- [ ] Detail page shows "In Review" status badge instead of Submit CTA
- [ ] Submit button is not visible

---

## Empty State Tests

### No Bounties Match Filters

**Setup:** Filter combination that returns 0 results

**Expected Results:**
- [ ] Shows "No bounties found" message
- [ ] Shows "Reset filters" button
- [ ] Clicking reset clears all filters

### Full Bounty

**Setup:** Bounty with currentSubmissions === maxSubmissions

**Expected Results:**
- [ ] Card shows "Full" indicator
- [ ] Detail page disables submit button
- [ ] Shows "This bounty is full" message

### Closed Bounty

**Setup:** Bounty that is closed (not in browse, but if accessed directly)

**Expected Results:**
- [ ] Submit button is disabled
- [ ] Shows closed state treatment

---

## Component Interaction Tests

### BountyBrowse
- [ ] Grid/list toggle switches layout mode
- [ ] Category chips toggle filter on/off
- [ ] Sort selector changes sort order
- [ ] Search input filters by title

### BountyDetail
- [ ] Back button calls `onBack`
- [ ] Submit CTA calls `onSubmitProof` when authenticated
- [ ] Submit CTA calls `onLogin` when unauthenticated

### SubmitProof
- [ ] Add Link button adds a new link input
- [ ] Remove button removes a link input
- [ ] Submit is disabled with no links
- [ ] Confirmation modal appears on submit click

---

## Edge Cases

- [ ] Bounty with no end date shows "No deadline"
- [ ] Bounty with no max submissions shows "Unlimited spots"
- [ ] Very long bounty titles truncate properly in cards
- [ ] Works correctly with 1 bounty and many bounties

---

## Sample Test Data

```typescript
const mockBounty: MarketplaceBounty = {
  id: "test-1",
  title: "Test Bounty",
  shortDescription: "A test bounty",
  fullDescription: "Full description here",
  rewardType: "cash",
  rewardAmount: 50,
  categoryId: "cat-1",
  organizationId: "org-1",
  proofRequirements: ["link"],
  eligibilityText: "Anyone can participate",
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-12-31T00:00:00Z",
  maxSubmissions: 10,
  currentSubmissions: 3,
  createdAt: "2026-01-01T00:00:00Z"
};
```
