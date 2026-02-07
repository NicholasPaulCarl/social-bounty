# Create Bounty Form -- UX Flow & Interaction Design

> **Version**: 1.0
> **Date**: 2026-02-07
> **Status**: Draft for review
> **Source**: `docs/ux/screen-specifications.md` (Section 4.3), `docs/ux/sitemap-and-flows.md` (Flow B2), current implementation at `apps/web/src/app/business/bounties/new/page.tsx`, Prisma schema
> **Rule**: MVP scope only. No feature creep.

---

## Table of Contents

- [1. Section Ordering and Rationale](#1-section-ordering-and-rationale)
- [2. Progressive Disclosure Patterns](#2-progressive-disclosure-patterns)
- [3. Validation UX](#3-validation-ux)
- [4. Reward Line Interactions](#4-reward-line-interactions)
- [5. Mobile-First Layout](#5-mobile-first-layout)
- [6. Save as Draft vs Create](#6-save-as-draft-vs-create)
- [7. Empty States and Hints](#7-empty-states-and-hints)

---

## Assumptions

1. The form is a single-page, sectioned layout (not a multi-step wizard). All sections are visible and scrollable. This matches the existing screen specification (Section 4.3: "Multi-section form, single page, not wizard").
2. PrimeReact `Panel` components provide collapsible sections with numbered headers. Sections default to expanded on first load.
3. The form supports both "Save as Draft" (partial data) and "Create" (full validation). The bounty always starts in DRAFT status.
4. Currency defaults to ZAR (per schema `@default(ZAR)`) and is selectable per bounty.
5. Channel options are Instagram, Facebook, and TikTok. These are the only three channels for MVP.
6. The BountyReward model (multi-line reward table) replaces the single rewardType/rewardValue/rewardDescription fields from the original form.
7. Desktop-primary, responsive layout. Mobile breakpoints use Tailwind CSS. No mobile-specific UX flows per project assumptions.

---

## 1. Section Ordering and Rationale

The form is divided into 9 numbered sections using PrimeReact `Panel` components. Each section has a numbered header badge and a descriptive title.

| # | Section | Fields | Rationale |
|---|---------|--------|-----------|
| 1 | Basic Info | Title, Short Description, Full Instructions, Category | Identity first. The business admin names and describes the bounty before configuring details. These are the "what" of the bounty. |
| 2 | Channels | Channel checkboxes (Instagram, Facebook, TikTok), nested post format checkboxes per channel | After defining what the bounty is, specify where it happens. Channel selection drives downstream logic (post formats, visibility rules). Must come early because it constrains sections 3 and 4. |
| 3 | Content Rules | AI content permitted toggle, engagement requirements per channel | Depends on channels selected in section 2. Rules only apply to selected channels. Placed immediately after channels for natural "where, then how" flow. |
| 4 | Post Visibility | Visibility rule radio (Must Not Remove / Minimum Duration), conditional duration inputs | Directly related to the content and channels. Answers "how long must the post stay up?" which is a policy decision that should be made alongside content rules. |
| 5 | Rewards | Multi-line reward table (type, name, monetary value), running total, currency selector | The "what do participants get" section. Placed mid-form after the task definition is complete. Reward setup requires focused attention and its own mental context. |
| 6 | Eligibility | Predefined rule checkboxes with conditional inputs, custom rule rows | Who can participate. Placed after rewards because the business admin thinks about "what's the reward" before "who qualifies." Eligibility is a constraint on participation, not part of the task itself. |
| 7 | Proof Requirements | Free-text description of what participants must submit | What evidence is needed. Placed after eligibility because proof requirements often reference eligibility criteria ("must show follower count above X"). |
| 8 | Max Submissions | Optional numeric limit, unlimited toggle | A capacity/logistics field. Near the end because it's optional and secondary to the core bounty definition. |
| 9 | Schedule | Start Date, End Date | Timing comes last. The business admin finalises the bounty content and rules, then decides when to run it. Both fields are optional (bounties can be published without a schedule). |

### Why this order works

The ordering follows a natural cognitive flow:

1. **Define** (sections 1-2): What is this bounty, and where does it live?
2. **Constrain** (sections 3-4): What rules govern the content and visibility?
3. **Incentivise** (section 5): What's the reward?
4. **Gate** (sections 6-7): Who qualifies, and what proof do they need?
5. **Limit** (sections 8-9): How many submissions, and when?

This mirrors how a business admin naturally thinks about creating a campaign: "I want people to post about X on Instagram, following these rules, for this reward, if they meet these criteria, with this proof, limited to N submissions, starting on this date."

---

## 2. Progressive Disclosure Patterns

Progressive disclosure reduces cognitive load by hiding fields until they become relevant. The following patterns are used:

### 2.1 Channels --> Post Format Checkboxes

**Trigger**: Checking a channel checkbox in Section 2.

**Behaviour**:
- Section 2 displays three channel checkboxes: Instagram, Facebook, TikTok.
- When a channel is unchecked, no post format options are shown for that channel.
- When a channel is checked, a nested group of post format checkboxes appears below it, indented with a left border for visual nesting.
- Each channel has its own set of valid post formats:

| Channel | Post Formats |
|---------|-------------|
| Instagram | Feed Post, Story, Reel |
| Facebook | Feed Post, Story, Reel |
| TikTok | Video |

**Visual treatment**:
```
[ ] Instagram
[x] Facebook
    |  [x] Feed Post
    |  [ ] Story
    |  [x] Reel
[x] TikTok
    |  [x] Video
```

- The nested checkboxes slide in with a subtle height transition (200ms ease-out).
- At least one post format must be selected per checked channel. Validation enforces this (see Section 3).
- Unchecking a channel clears its post format selections and hides the nested group.

### 2.2 Post Visibility Radio --> Conditional Duration Inputs

**Trigger**: Selecting a radio option in Section 4.

**Behaviour**:
- Section 4 shows two radio buttons:
  - **Must Not Remove**: Post must remain live indefinitely. No additional inputs needed.
  - **Minimum Duration**: Post must stay live for a specified minimum time. Reveals duration inputs.
- Default state: no radio selected (field is optional for drafts, required for create).

**When "Minimum Duration" is selected**:
- Two inputs appear with a slide-down transition (200ms):
  - **Duration Value**: `InputNumber` (min: 1)
  - **Duration Unit**: `Dropdown` (Hours / Days / Weeks)
- These two fields form a compound input and are displayed inline on desktop (side by side), stacked on mobile.

**Visual treatment**:
```
Post Visibility Rule *
( ) Must Not Remove -- post stays up forever
(o) Minimum Duration -- post must stay up for a set time
     Duration: [__7__] [Days  v]
```

- Selecting "Must Not Remove" hides the duration inputs and clears their values.

### 2.3 Eligibility Predefined Checkboxes --> Conditional Inputs

**Trigger**: Checking a predefined eligibility rule checkbox in Section 6.

**Behaviour**:
- Section 6 shows a list of predefined eligibility rules as checkboxes.
- Each rule may have a conditional input that appears when checked.

| Predefined Rule | Conditional Input |
|----------------|-------------------|
| Minimum follower count | `InputNumber` (min: 1, placeholder: "e.g. 1000") |
| Minimum account age | `InputNumber` + `Dropdown` (value + unit: Days/Months/Years) |
| Must be verified account | None (boolean, checkbox only) |
| Location restriction | `InputText` (placeholder: "e.g. South Africa, United States") |
| Age restriction (18+) | None (boolean, checkbox only) |

**Visual treatment**:
```
Eligibility Rules
[x] Minimum follower count
     Minimum followers: [__1000__]
[ ] Minimum account age
[x] Must be verified account
[ ] Location restriction
[x] Age restriction (18+)
```

- Conditional inputs appear with a slide-down transition, indented below the checkbox.
- Unchecking a rule hides and clears the conditional input.

### 2.4 "Add Custom Rule" --> Dynamic Text Input Rows

**Trigger**: Clicking the "Add Custom Rule" button in Section 6.

**Behaviour**:
- Below the predefined rules, a "Add Custom Rule" link-style button is displayed.
- Clicking it appends a new text input row.
- Each custom rule row has:
  - `InputText` (placeholder: "Describe the eligibility requirement")
  - A remove button (X icon) to the right of the input.
- Maximum 10 custom rules. When 10 rules exist, the "Add Custom Rule" button is hidden.
- Custom rule counter is displayed: "X of 10 custom rules".

**Visual treatment**:
```
Custom Rules (2 of 10)
[Participant must have a public profile          ] [X]
[Must have posted at least 3 times this month    ] [X]
[+ Add Custom Rule]
```

- Empty custom rule rows are removed automatically on blur if the text is empty.
- The "Add Custom Rule" button is styled as a text link with a plus icon, not a full button, to keep it visually subordinate.

---

## 3. Validation UX

### 3.1 When Validation Runs

| Trigger | What is validated | Behaviour |
|---------|-------------------|-----------|
| **On blur** (field loses focus) | The individual field that lost focus | Immediate inline error below the field. Error clears when the user corrects the value and blurs again. |
| **On change** (for dropdowns, checkboxes, radio) | The changed control | Immediate inline validation since these are discrete selections. |
| **On submit** ("Save as Draft" or "Create Bounty") | All fields relevant to the action | Full form validation. Scroll to first error. Section-level indicators update. Footer error count updates. |

### 3.2 Inline Field-Level Errors

- Each field shows its error message directly below the input, in red text (PrimeReact `Message` with `severity="error"` or a simple `<small className="p-error">`).
- The field's border turns red when invalid (PrimeReact's `p-invalid` class on the input).
- Error message text is specific and actionable:
  - "Title is required" (not "This field is required")
  - "End date must be after start date" (not "Invalid date")
  - "At least one post format must be selected for Instagram" (not "Invalid selection")

### 3.3 Section-Level Error Indicators

- Each `Panel` header includes a small error badge when the section contains one or more validation errors.
- The badge is a red circle with the error count (e.g., a red `Badge` with `severity="danger"` value="2").
- The badge is positioned to the right of the section title in the Panel header.
- When all errors in a section are resolved, the badge disappears.

**Visual treatment**:
```
[1] Basic Info                           (red badge: 2)
[2] Channels
[3] Content Rules
[4] Post Visibility                      (red badge: 1)
[5] Rewards
...
```

### 3.4 Sticky Footer Error Summary

- The sticky footer (see Section 5) includes an error summary that appears after a failed submission attempt.
- Format: "X errors found. Please fix the highlighted fields." -- displayed as a compact warning message.
- The error count updates in real-time as the user fixes fields.
- When all errors are resolved, the summary disappears and the submit button becomes fully enabled.

### 3.5 Cross-Field Validation

Cross-field validations (fields that depend on each other) are validated as a group:

| Cross-field rule | When validated | Error display |
|-----------------|----------------|---------------|
| Minimum Duration requires both value AND unit | On blur of either field, and on submit | Error shown below the duration group: "Both duration value and unit are required" |
| End date must be after start date | On blur of end date, and on submit | Error shown below end date: "End date must be after start date" |
| At least one post format per checked channel | On change of channel/format checkboxes, and on submit | Error shown below the channel group: "Select at least one post format for [channel]" |
| At least one reward row must have all fields filled | On submit | Error on the reward section: "At least one complete reward is required" |

### 3.6 Validation Rules Summary

| Field | Required for Draft? | Required for Create? | Validation Rule |
|-------|-------------------|---------------------|-----------------|
| Title | Yes | Yes | Non-empty, max 200 chars |
| Short Description | No | Yes | Max 500 chars |
| Full Instructions | No | Yes | Non-empty |
| Category | No | Yes | Must select from predefined list |
| Channels | No | Yes | At least one channel selected |
| Post formats | No | Yes (per channel) | At least one format per selected channel |
| Post visibility rule | No | No | Optional; if MINIMUM_DURATION, both value+unit required |
| Rewards | No | Yes | At least one complete row (type + name + value) |
| Eligibility (predefined) | No | No | If checked, conditional inputs must be filled |
| Eligibility (custom) | No | No | Non-empty text if row exists |
| Proof requirements | No | Yes | Non-empty |
| Max submissions | No | No | Positive integer if provided |
| Start date | No | No | Must be today or future if provided |
| End date | No | No | Must be after start date if both provided |
| Currency | Yes (defaulted) | Yes (defaulted) | Must be a valid currency enum value |

---

## 4. Reward Line Interactions

### 4.1 Default State

- Section 5 opens with one empty reward row.
- The row has three fields inline:
  - **Reward Type**: `Dropdown` (Cash / Product / Service / Other)
  - **Name**: `InputText` (placeholder: "e.g. Cash reward per post")
  - **Monetary Value**: `InputNumber` with currency mode (placeholder: "0.00")
- A currency selector (`Dropdown`) is displayed above the reward table, defaulting to ZAR. This applies to all rows.

**Visual treatment (desktop)**:
```
Currency: [ZAR (R)  v]

| Type       | Name                        | Value (R) |      |
|------------|-----------------------------|-----------|------|
| [Cash   v] | [Cash reward per post     ] | [  50.00] | [X]  |
| [Product v]| [Free product sample      ] | [ 200.00] |      |
|            |                             |           |      |
                            Total: R 250.00
[+ Add Reward]                              (2 of 10)
```

### 4.2 Add Row Behaviour

- "Add Reward" button is positioned below the last row, left-aligned.
- A counter "X of 10" is displayed to the right of the button, showing current and maximum rows.
- Clicking "Add Reward" appends a new empty row at the bottom.
- Focus moves to the Type dropdown of the new row.
- When 10 rows exist, the "Add Reward" button is disabled and its label changes to "Maximum rewards reached".

### 4.3 Remove Row Behaviour

- Each row has a remove button (X icon / `pi pi-times` styled as a text/ghost button) on the far right.
- **When only 1 row exists**: The remove button is hidden. The business admin cannot have zero reward rows. They can leave the row empty for a draft save.
- **When 2+ rows exist**: The remove button is visible on all rows.
- **Confirmation for non-empty rows**: If the row has any non-empty field (type selected, name entered, or value entered), clicking remove shows an inline confirmation: the row highlights and the X button is replaced momentarily with "Remove?" (text link) and "Cancel" (text link). This avoids a modal for a low-stakes action.
- **Empty rows**: Removed immediately without confirmation.

### 4.4 Running Total Display

- Below the reward table, a running total is displayed: "Total: [currency symbol] [sum]".
- The total sums all `monetaryValue` fields from all rows.
- The total updates in real-time as values are typed.
- Rows with empty or zero values are excluded from the sum (they contribute R 0.00).
- The currency symbol matches the selected currency (R for ZAR, $ for USD, etc.).
- The total is right-aligned to match the value column.

### 4.5 Sort Order

- Rows are numbered implicitly by their position (1-indexed).
- The `sortOrder` field is set based on the row's position in the list when the form is saved.
- No drag-and-drop reordering for MVP. Rows appear in the order they were added.

---

## 5. Mobile-First Layout

### 5.1 Responsive Breakpoints

The form uses Tailwind's responsive breakpoints:

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px (`sm`) | Single column, full-width fields, stacked reward table |
| Tablet | 640px--1024px (`sm` to `lg`) | Single column, inline compound fields (e.g., duration value + unit) |
| Desktop | > 1024px (`lg`) | Single column form with wider max-width (max-w-3xl), inline reward rows |

The form is always single-column regardless of breakpoint. The difference is in how compound fields (duration, reward rows) and the sticky footer arrange internally.

### 5.2 Touch-Friendly Targets

- All interactive elements have a minimum touch target of 44x44px, achieved through:
  - PrimeReact default input heights (already 44px+)
  - Checkbox and radio buttons use PrimeReact defaults with sufficient label padding
  - Remove (X) buttons on reward rows and custom rules have `p-2` padding minimum (40px+ hit area)
  - "Add" buttons have standard PrimeReact button sizing

### 5.3 Sticky Footer Behaviour

**Desktop (> 1024px)**:
- Fixed to the bottom of the viewport using `position: sticky; bottom: 0`.
- Contains: error summary (left), running reward total (centre), "Save as Draft" and "Create Bounty" buttons (right).
- Background: white/surface with top border and subtle shadow to separate from form content.
- Width matches the form's max-width container.

**Tablet (640px--1024px)**:
- Same as desktop but with reduced horizontal padding.

**Mobile (< 640px)**:
- The footer is fixed to the bottom of the screen (`position: fixed; bottom: 0; left: 0; right: 0`).
- Buttons stack vertically: "Create Bounty" (full width, primary) on top, "Save as Draft" (full width, outlined) below.
- The running total and error summary are displayed above the buttons in the fixed footer.
- The form body has bottom padding equal to the footer height to prevent content from being hidden behind the footer.

**Footer contents**:
```
Desktop:
+------------------------------------------------------------------+
| 2 errors found                Total: R 250.00    [Draft] [Create] |
+------------------------------------------------------------------+

Mobile:
+----------------------------------+
| 2 errors found   Total: R 250.00 |
| [      Create Bounty           ] |
| [      Save as Draft           ] |
+----------------------------------+
```

### 5.4 Section Panels on Mobile

- `Panel` components remain collapsible on all breakpoints.
- On mobile, sections that are not currently being edited can be collapsed to reduce scroll distance.
- Section headers remain fully visible when collapsed, showing the title and any error badge.

---

## 6. Save as Draft vs Create

### 6.1 Field Requirements by Action

| Action | Validation Level | Minimum Required Fields | Result |
|--------|-----------------|------------------------|--------|
| **Save as Draft** | Partial | Title only | Bounty saved with `status: DRAFT`. Missing fields are allowed. |
| **Create Bounty** | Full | All required fields (see Section 3.6) | Bounty saved with `status: DRAFT`. All required fields validated. |

Both actions save the bounty in DRAFT status. The difference is validation strictness. "Create Bounty" ensures the bounty is complete enough to be published later, while "Save as Draft" lets the business admin save work-in-progress.

### 6.2 Visual Distinction

| Element | Save as Draft | Create Bounty |
|---------|--------------|---------------|
| Button style | Outlined / secondary (`outlined severity="secondary"`) | Filled / primary (default PrimeReact primary) |
| Button label | "Save as Draft" | "Create Bounty" |
| Button icon | `pi pi-save` | `pi pi-plus` |
| Position | Left of Create button (desktop) / below Create button (mobile) | Right side (desktop) / top (mobile) |
| Loading state | Spinner replaces icon; button disabled | Spinner replaces icon; button disabled |

### 6.3 Confirmation on Navigate Away

- If the form has unsaved changes (any field modified from initial state) and the user navigates away (browser back, sidebar link, Cancel button), a confirmation dialog is shown:
  - Title: "Unsaved Changes"
  - Message: "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
  - Buttons: "Leave" (danger) / "Stay" (primary)
- This uses the browser's `beforeunload` event for browser navigation, and a PrimeReact `ConfirmDialog` for in-app navigation.

---

## 7. Empty States and Hints

### 7.1 Section Helper Text

Each section includes a brief description below the section title to guide first-time users. This text is always visible (not dismissible) and is styled as muted text (`text-sm text-neutral-500`).

| Section | Helper Text |
|---------|------------|
| Basic Info | "Give your bounty a clear title and detailed instructions so participants know exactly what to do." |
| Channels | "Select which social media platforms participants should post on." |
| Content Rules | "Set rules for the type of content participants can create." |
| Post Visibility | "Choose how long participant posts must remain visible." |
| Rewards | "Define what participants earn for completing this bounty. You can offer multiple rewards." |
| Eligibility | "Set requirements that participants must meet to qualify. Leave empty if the bounty is open to everyone." |
| Proof Requirements | "Describe what evidence participants must submit to prove they completed the bounty." |
| Max Submissions | "Limit the number of submissions this bounty will accept. Leave empty for unlimited." |
| Schedule | "Set when this bounty becomes available. Leave empty to publish manually." |

### 7.2 Placeholder Text Patterns

All placeholder text follows a consistent pattern: either an example value or a brief instruction.

| Field | Placeholder |
|-------|------------|
| Title | "e.g. Share our new product launch on Instagram" |
| Short Description | "Brief summary visible in the bounty listing (max 500 chars)" |
| Full Instructions | "Step-by-step instructions for completing this bounty..." |
| Category | "Select a category" |
| Reward Name | "e.g. Cash reward per post" |
| Reward Value | "0.00" |
| Duration Value | "e.g. 7" |
| Follower Count | "e.g. 1000" |
| Location | "e.g. South Africa, United States" |
| Custom Rule | "Describe the eligibility requirement" |
| Proof Requirements | "e.g. Submit a screenshot of your post showing the caption, hashtags, and engagement metrics..." |
| Max Submissions | "Unlimited" |
| Start Date | "Select start date (optional)" |
| End Date | "Select end date (optional)" |

### 7.3 Character Counters

Fields with character limits display a counter below the input, right-aligned:

- Short Description: "X / 500 characters"
- Title: "X / 200 characters"
- Custom Rule text: "X / 200 characters"

The counter text turns red when approaching the limit (>90% of max). The counter is muted/gray when well below the limit.

### 7.4 Section Numbering Badges

Each Panel header includes a numbered badge to the left of the title. This provides a sense of progress and helps users reference sections in conversations ("I'm stuck on section 5").

**Visual treatment**:
```
[1] Basic Info
[2] Channels
[3] Content Rules
...
```

The badge is a small circle with the section number, using a neutral background. When the section has been completed (all required fields filled), the badge could optionally show a checkmark, but for MVP simplicity, the number remains static.

---

## PrimeReact Components Used

| Component | Usage in Create Bounty Form |
|-----------|-----------------------------|
| `Panel` | 9 form sections with collapsible headers |
| `InputText` | Title, reward name, custom rules, location, short description |
| `InputTextarea` | Full instructions, proof requirements, short description |
| `InputNumber` | Reward value, max submissions, duration value, follower count, account age |
| `Dropdown` | Category, reward type, currency, duration unit, account age unit |
| `Calendar` | Start date, end date |
| `Checkbox` | Channel selection, post format selection, predefined eligibility rules |
| `RadioButton` | Post visibility rule |
| `InputSwitch` | AI content permitted |
| `Button` | Add reward, add custom rule, remove row, save draft, create bounty |
| `Badge` | Section numbers, error counts |
| `Message` | Inline field errors, section helper text |
| `ConfirmDialog` | Navigate-away confirmation |
| `Tag` | Currency indicator |

---

## Wireframe: Complete Form Layout

```
+------------------------------------------------------------------+
| < Bounties / Create                                               |
| Create New Bounty                                                 |
+------------------------------------------------------------------+

[1] Basic Info
    "Give your bounty a clear title and detailed instructions..."
    +--------------------------------------------------------------+
    | Title *                                    (0 / 200 chars)    |
    | [e.g. Share our new product launch on Instagram            ]  |
    |                                                               |
    | Short Description *                        (0 / 500 chars)    |
    | [Brief summary visible in the bounty listing...            ]  |
    |                                                               |
    | Full Instructions *                                           |
    | [Step-by-step instructions for completing this bounty...   ]  |
    | [                                                          ]  |
    |                                                               |
    | Category *                                                    |
    | [Select a category                                      v  ]  |
    +--------------------------------------------------------------+

[2] Channels
    "Select which social media platforms participants should post on."
    +--------------------------------------------------------------+
    | [x] Instagram                                                 |
    |     |  [x] Feed Post  [ ] Story  [x] Reel                    |
    | [ ] Facebook                                                  |
    | [x] TikTok                                                    |
    |     |  [x] Video                                              |
    +--------------------------------------------------------------+

[3] Content Rules
    "Set rules for the type of content participants can create."
    +--------------------------------------------------------------+
    | AI-Generated Content Permitted    [off]                       |
    |                                                               |
    | Engagement Requirements                                       |
    | (shown per selected channel)                                  |
    +--------------------------------------------------------------+

[4] Post Visibility
    "Choose how long participant posts must remain visible."
    +--------------------------------------------------------------+
    | ( ) Must Not Remove -- post stays up forever                  |
    | (o) Minimum Duration -- post must stay up for a set time      |
    |      Duration: [__7__] [Days  v]                              |
    +--------------------------------------------------------------+

[5] Rewards                                              (red: 1)
    "Define what participants earn for completing this bounty."
    +--------------------------------------------------------------+
    | Currency: [ZAR (R)  v]                                        |
    |                                                               |
    | Type       | Name                       | Value (R) |         |
    |------------|----------------------------|-----------|---------|
    | [Cash   v] | [Cash reward per post    ] | [  50.00] |         |
    | [Product v]| [                        ] | [       ] |  [X]    |
    |            |          ^                  |           |         |
    |            |  "Name is required"         |           |         |
    |                                                               |
    |                                   Total: R 50.00              |
    | [+ Add Reward]                                  (2 of 10)     |
    +--------------------------------------------------------------+

[6] Eligibility
    "Set requirements that participants must meet to qualify."
    +--------------------------------------------------------------+
    | Predefined Rules                                              |
    | [x] Minimum follower count                                    |
    |      Minimum followers: [__1000__]                            |
    | [ ] Minimum account age                                       |
    | [x] Must be verified account                                  |
    | [ ] Location restriction                                      |
    | [x] Age restriction (18+)                                     |
    |                                                               |
    | Custom Rules (1 of 10)                                        |
    | [Must have a public profile                          ] [X]    |
    | [+ Add Custom Rule]                                           |
    +--------------------------------------------------------------+

[7] Proof Requirements
    "Describe what evidence participants must submit."
    +--------------------------------------------------------------+
    | [e.g. Submit a screenshot of your post showing the caption, ] |
    | [hashtags, and engagement metrics...                        ] |
    +--------------------------------------------------------------+

[8] Max Submissions
    "Limit the number of submissions this bounty will accept."
    +--------------------------------------------------------------+
    | Maximum Submissions                                           |
    | [       ] (leave empty for unlimited)                         |
    +--------------------------------------------------------------+

[9] Schedule
    "Set when this bounty becomes available."
    +--------------------------------------------------------------+
    | Start Date               | End Date                           |
    | [Select start date    ]  | [Select end date               ]  |
    +--------------------------------------------------------------+

+------------------------------------------------------------------+
| (sticky footer)                                                   |
| 1 error found             Total: R 50.00   [Draft]  [Create]     |
+------------------------------------------------------------------+
```

---

---

## 8. Payout Metrics Flow

### 8.1 Business Sets Payout Thresholds

During bounty creation (Section 10: Payout Metrics), the business admin can optionally define performance thresholds that participants must meet before becoming eligible for payout.

**Fields**:
- **Min Views** (`InputNumber`, optional): Minimum post view count required.
- **Min Likes** (`InputNumber`, optional): Minimum like count required.
- **Min Comments** (`InputNumber`, optional): Minimum comment count required.

At least one threshold must have a value if the section is used. All three fields are optional individually.

**UX flow**:
1. Business admin scrolls to Section 10 "Payout Metrics".
2. Fields are empty by default (no thresholds).
3. Business enters values for any combination of views/likes/comments.
4. Values are saved with the bounty (both draft and create).

### 8.2 Participant Submits with Reported Metrics

When a bounty has `payoutMetrics` set, the submission form shows additional fields for the participant to self-report their post performance.

**UX flow**:
1. Participant opens submission form for a bounty with payout metrics.
2. Below the proof text/links, three `InputNumber` fields appear:
   - "Post Views" (shown only if bounty requires min views)
   - "Post Likes" (shown only if bounty requires min likes)
   - "Post Comments" (shown only if bounty requires min comments)
3. A "Post Link" field (`InputText`) is required when payout metrics are set.
4. Participant fills in their metrics and submits.

### 8.3 Business Reviews Metrics

When reviewing a submission for a bounty with payout metrics, the business admin sees a side-by-side comparison.

**UX flow**:
1. Business admin opens submission detail for a bounty with metrics.
2. A "Performance Metrics" card is shown with a comparison table:

```
| Metric   | Required | Reported | Status  |
|----------|----------|----------|---------|
| Views    | 100      | 150      | ✓ Pass  |
| Likes    | 10       | 8        | ✗ Fail  |
| Comments | --       | --       | --      |
```

3. Each metric is color-coded: green (pass, reported >= required), red (fail, reported < required).
4. Business admin can approve or reject based on the metrics comparison.

### 8.4 Verification Deadline & Auto-Payout

After a submission is APPROVED, a 48-hour verification deadline begins.

**UX flow**:
1. When business approves a submission (sets status to APPROVED), `verificationDeadline` is set to `now + 48h`.
2. Submission detail shows a countdown timer: "Verification deadline: 23h 45m remaining".
3. If the business admin does not verify (mark payout as PAID or change status) within 48 hours, the system auto-sets `payoutStatus: PAID`.
4. A cron job runs every 15 minutes to check for expired deadlines.

---

## 9. Stripe Payment Flow

### 9.1 Payment During Publish

Payment is collected from the business when a bounty transitions from DRAFT to LIVE, not at draft creation time. This ensures businesses only pay for bounties they intend to publish.

**UX flow**:
1. Business admin clicks "Go Live" on a DRAFT bounty detail page.
2. Instead of directly transitioning to LIVE, a **Payment Dialog** (modal) appears.
3. The dialog shows:
   - Total reward amount (sum of all reward lines)
   - Currency
   - Stripe Elements payment form (card input)
4. Business enters card details and clicks "Pay & Publish".
5. On successful payment:
   - Stripe PaymentIntent is created and confirmed.
   - `paymentStatus` is set to `PAID`.
   - Bounty status transitions to `LIVE`.
   - Success toast: "Payment successful. Bounty is now live!"
6. On failed payment:
   - Error message shown in dialog: "Payment failed. Please try again."
   - Bounty remains in DRAFT status.
   - `paymentStatus` remains `UNPAID`.

### 9.2 Payment Status Display

The bounty detail page shows a payment status badge:
- **UNPAID**: Gray tag "Unpaid"
- **PENDING**: Orange tag "Payment Pending"
- **PAID**: Green tag "Paid"
- **REFUNDED**: Blue tag "Refunded"

The badge appears next to the bounty status badge in the header area.

### 9.3 DRAFT → LIVE Gate

The publish flow enforces:
1. All required fields must be filled (existing validation).
2. Visibility must be acknowledged (existing check).
3. Payment must be completed (`paymentStatus === PAID`).

If payment is not completed, the API returns 400: "Payment must be completed before publishing."

---

## 10. Draft Save with Minimal Fields

### 10.1 Draft Save Flow

The draft save flow allows business admins to save work-in-progress bounties with minimal data.

**UX flow**:
1. Business admin opens "Create New Bounty" page.
2. Types a title (the only required field for drafts).
3. Clicks "Save as Draft".
4. Success toast: "Draft saved successfully."
5. Redirected to bounties list page.
6. Draft appears in the list with DRAFT status badge.

### 10.2 Draft → Edit → Complete → Publish

**UX flow**:
1. Business finds draft on bounty list page (DRAFT status badge).
2. Clicks into the draft to view detail page.
3. Clicks "Edit" to open the edit form.
4. All previously saved fields are pre-populated.
5. Business completes remaining fields (channels, rewards, etc.).
6. Clicks "Save as Draft" again to save progress, or "Create Bounty" for full validation.
7. When all fields are complete, navigates to detail page and clicks "Go Live".
8. Payment dialog appears (see Section 9.1).
9. After successful payment, bounty goes LIVE.

### 10.3 Default Values for Drafts

When a draft is saved with minimal fields, the API applies sensible defaults:
- `shortDescription`: empty string
- `fullInstructions`: empty string
- `category`: empty string
- `rewardType`: CASH (Prisma default)
- `eligibilityRules`: empty string
- `proofRequirements`: empty string
- `currency`: ZAR (Prisma default)
- `aiContentPermitted`: false (Prisma default)

These defaults ensure the database row is valid while allowing the business admin to fill in details later.

---

*This document follows the spec at `md-files/social-bounty-mvp.md` and the existing screen specifications at `docs/ux/screen-specifications.md` (Section 4.3). No features outside the spec have been added. The form redesign extends the existing flat form into a structured, section-based layout while preserving all original fields and adding the new channel, visibility, reward, and eligibility concepts from the schema.*
