# Create Bounty - UI Specification

> **Version**: 1.1
> **Date**: 2026-02-07
> **Depends on**: `docs/create-bounty-spec.md` (data model + business rules), `docs/create-bounty-ux.md` (UX flow)
> **Aligns with**: `docs/ui/component-system-and-screens.md` (design system)
> **Rule**: MVP scope only. PrimeReact + Tailwind CSS only. No custom CSS unless absolutely necessary.

---

## Table of Contents

- [1. Component Hierarchy](#1-component-hierarchy)
- [2. Spacing System](#2-spacing-system)
- [3. Typography and Color](#3-typography-and-color)
- [4. Layout Breakpoints](#4-layout-breakpoints)
- [5. Section Specifications](#5-section-specifications)
- [6. Sticky Footer](#6-sticky-footer)
- [7. Iconography](#7-iconography)
- [8. Validation States](#8-validation-states)
- [9. Tailwind Class Reference](#9-tailwind-class-reference)
- [10. Assumptions](#10-assumptions)

---

## 1. Component Hierarchy

The Create Bounty form is structured as a vertical stack of PrimeReact `Panel` components, each representing a logical section of the form. The page uses the existing `PageHeader` component and a sticky footer for actions.

```
PageHeader (breadcrumbs: Bounties > Create)
|
+-- Message (form-level error, if any)
|
+-- form
    |
    +-- Panel: 1. Basic Information
    |   +-- helper text
    |   +-- field: title (InputText)
    |   +-- field: shortDescription (InputTextarea)
    |   +-- field: fullInstructions (InputTextarea)
    |   +-- field: category (Dropdown)
    |
    +-- Panel: 2. Channels
    |   +-- helper text
    |   +-- channel selection grid (Checkbox groups per channel)
    |   +-- per-channel format checkboxes (dynamic, with left-border nesting)
    |
    +-- Panel: 3. Content Rules
    |   +-- helper text
    |   +-- field: aiContentPermitted (InputSwitch)
    |   +-- sub-group: Engagement Requirements
    |       +-- field: tagAccount (InputText)
    |       +-- field: mention (Checkbox)
    |       +-- field: comment (Checkbox)
    |
    +-- Panel: 4. Post Visibility
    |   +-- helper text
    |   +-- field: postVisibilityRule (RadioButton group)
    |   +-- conditional: duration fields (InputNumber + Dropdown)
    |   +-- acknowledgment checkbox
    |
    +-- Panel: 5. Rewards
    |   +-- helper text
    |   +-- field: currency (Dropdown)
    |   +-- reward lines table (dynamic add/remove rows with inline confirmation)
    |   +-- total reward value display
    |
    +-- Panel: 6. Eligibility
    |   +-- helper text
    |   +-- predefined rules (Checkbox + conditional input pairs)
    |   +-- custom rules (dynamic add/remove text inputs)
    |
    +-- Panel: 7. Proof Requirements
    |   +-- helper text
    |   +-- field: proofRequirements (InputTextarea)
    |
    +-- Panel: 8. Submission Limits
    |   +-- helper text
    |   +-- field: maxSubmissions (InputNumber)
    |
    +-- Panel: 9. Schedule
    |   +-- helper text
    |   +-- field: startDate (Calendar)
    |   +-- field: endDate (Calendar)
    |
    +-- Sticky Footer
        +-- error summary (if errors exist)
        +-- total reward value
        +-- Save as Draft button
        +-- Create Bounty button
```

### Panel Configuration

All panels use the PrimeReact `Panel` component with these shared settings:

| Property | Value | Notes |
|----------|-------|-------|
| `toggleable` | `true` | Panels are collapsible. All sections default to expanded on initial load. |
| `collapsed` | `false` (default) | All sections start expanded so the user sees the full form. |
| `header` | Custom template | Numbered header with icon, section title, and error badge |
| `className` | See Section 9 | Consistent panel styling |

**Collapsible panel rationale**: Per the UX spec, panels are toggleable to allow users (especially on mobile) to collapse completed or irrelevant sections to reduce scroll distance. All sections default to expanded on first load so the user sees the complete form. Section headers remain visible when collapsed, showing the title and any error badges.

### Section Helper Text

Each panel renders a brief description below the panel header, inside the panel body, to guide first-time users. This text is always visible and styled as muted text.

```tsx
<p className="text-sm text-neutral-500 mb-4">{helperText}</p>
```

| Section | Helper Text |
|---------|------------|
| 1. Basic Info | "Give your bounty a clear title and detailed instructions so participants know exactly what to do." |
| 2. Channels | "Select which social media platforms participants should post on." |
| 3. Content Rules | "Set rules for the type of content participants can create." |
| 4. Post Visibility | "Choose how long participant posts must remain visible." |
| 5. Rewards | "Define what participants earn for completing this bounty. You can offer multiple rewards." |
| 6. Eligibility | "Set requirements that participants must meet to qualify. Leave empty if the bounty is open to everyone." |
| 7. Proof Requirements | "Describe what evidence participants must submit to prove they completed the bounty." |
| 8. Submission Limits | "Limit the number of submissions this bounty will accept. Leave empty for unlimited." |
| 9. Schedule | "Set when this bounty becomes available. Leave empty to publish manually." |

---

## 2. Spacing System

All spacing uses Tailwind utility classes. These align with the spacing scale defined in `docs/ui/component-system-and-screens.md`.

### 2.1 Between Sections (Panel to Panel)

```
gap-6  (24px)
```

The form wrapper uses `flex flex-col gap-6` to space panels evenly.

### 2.2 Within Sections (Panel Content)

| Context | Tailwind Class | Pixels | Description |
|---------|---------------|--------|-------------|
| Field group spacing | `space-y-5` | 20px | Between individual field groups within a panel |
| Label to input | `mb-1.5` | 6px | Between label text and the input below |
| Label to helper text | `mt-1` | 4px | Between input and helper/error text below |
| Grid gap (multi-column) | `gap-4` | 16px | Between columns in a grid row |
| Sub-group separator | `mt-4 pt-4 border-t border-neutral-200` | -- | Visual separator within a panel (e.g. engagement sub-group) |
| Inline checkbox gap | `gap-3` | 12px | Between horizontally placed checkboxes |
| Inline element gap | `gap-2` | 8px | Between icon and text, badge and text |

### 2.3 Panel Padding

```
Panel body padding: Provided by PrimeReact's default panel padding (1.25rem / 20px)
No additional padding override needed.
```

### 2.4 Form Wrapper

```tsx
<form className="flex flex-col gap-6 pb-24">
```

The `pb-24` (96px) provides bottom padding to prevent the sticky footer from overlapping the last section.

---

## 3. Typography and Color

### 3.1 Section Headers (Panel Headers)

```
text-base font-semibold text-neutral-800
```

Panel headers include a section number and title. The number is visually distinct:

```tsx
<span className="text-primary-600 font-bold mr-2">1.</span>
<span className="text-base font-semibold text-neutral-800">Basic Information</span>
```

### 3.2 Field Labels

```
block text-sm font-medium text-neutral-700 mb-1.5
```

Required fields append a red asterisk:

```tsx
<label className="block text-sm font-medium text-neutral-700 mb-1.5">
  Title <span className="text-danger-500">*</span>
</label>
```

### 3.3 Helper Text

```
text-xs text-neutral-500 mt-1
```

Displayed below inputs for guidance. Examples: character counts, format hints.

### 3.4 Error Messages

```
text-xs text-danger-600 mt-1
```

Displayed below the invalid input. Paired with a `pi-exclamation-circle` icon:

```tsx
<small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
  <i className="pi pi-exclamation-circle text-xs" />
  Title is required
</small>
```

Invalid inputs receive the PrimeReact `p-invalid` class to show the red border.

### 3.5 Section Status Indicator

Displayed in the panel header, right-aligned. Uses PrimeReact `Badge` for error counts per the UX spec:

| State | Display | Implementation |
|-------|---------|---------------|
| Incomplete (no attempt) | No indicator | Nothing shown |
| Complete | Checkmark icon | `<i className="pi pi-check-circle text-success-600" />` |
| Has errors | Red badge with count | `<Badge value={errorCount} severity="danger" />` |

The error badge shows the number of validation errors in that section (e.g., "2"), providing more information than a simple icon. The badge updates in real-time as errors are fixed.

### 3.6 Reward Total

The total reward value is displayed with emphasis in both the Rewards panel and the sticky footer:

```
Panel:  text-lg font-bold text-neutral-900
Footer: text-base font-semibold text-neutral-900
```

Currency symbol prefix uses `text-neutral-500`.

---

## 4. Layout Breakpoints

The form uses responsive layouts following the existing app breakpoints from `tailwind.config.ts`.

### 4.1 Mobile (< 768px)

- Single column layout.
- All inputs full width (`w-full`).
- Channel selection: vertical stack (one channel per row).
- Reward table: card-based layout instead of table rows (each reward as a stacked card).
- Eligibility rules: single column.
- Sticky footer: full width, stacked buttons (total on top, buttons below).

### 4.2 Tablet (640px - 1024px)

- Form max width: `max-w-3xl`.
- Single column form with inline compound fields:
  - Duration value + unit side by side.
  - Schedule: start/end date side by side.
- Channel selection: horizontal row (channels side by side).
- Reward rows: inline (type + name + value on one row).
- Sticky footer: single row (errors left, total center, buttons right).

### 4.3 Desktop (> 1024px)

- Form max width: `max-w-3xl` with wider container space.
- Same as tablet, single column form.
- Channel selection: horizontal grid with format checkboxes inline.
- Reward table: proper table layout with column headers.
- Eligibility: checkbox + conditional input on indented row.

### 4.4 Responsive Class Patterns

```tsx
// Form wrapper
<div className="max-w-3xl mx-auto">

// Two-column grid (schedule, duration fields)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

// Channel cards grid
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

---

## 5. Section Specifications

### 5.1 Basic Information (Section 1)

**Panel header**: `1. Basic Info`
**Default state**: Expanded
**Helper text**: "Give your bounty a clear title and detailed instructions so participants know exactly what to do."

| Field | Component | Width | Required | Rows | Placeholder | Max Length |
|-------|-----------|-------|----------|------|-------------|-----------|
| Title | `InputText` | full | Yes | -- | "e.g. Share our new product launch on Instagram" | 200 |
| Short Description | `InputTextarea` | full | Yes | 2 | "Brief summary visible in the bounty listing (max 500 chars)" | 500 |
| Full Instructions | `InputTextarea` | full | Yes | 5 | "Step-by-step instructions for completing this bounty..." | 5000 |
| Category | `Dropdown` | full | Yes | -- | "Select a category" | -- |

**Character counters**: Show for `title`, `shortDescription`, and `fullInstructions` below each input, right-aligned:

```tsx
<small className={`text-xs mt-1 block text-right ${
  value.length > maxLength * 0.9 ? 'text-danger-500' : 'text-neutral-400'
}`}>
  {value.length} / {maxLength} characters
</small>
```

The counter text turns red when approaching the limit (>90% of max).

**Layout**: All fields stacked vertically, full width.

---

### 5.2 Channels (Section 2)

**Panel header**: `2. Channels`
**Default state**: Expanded
**Helper text**: "Select which social media platforms participants should post on."

Each channel is displayed as a selectable card with its icon, name, and nested format checkboxes.

**Channel cards layout**:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {/* One card per channel */}
</div>
```

**Individual channel card structure**:

```
+------------------------------------------------------+
| [x] [icon] Channel Name                              |
|     |  [x] Feed Post  [ ] Story  [x] Reel            |
+------------------------------------------------------+
```

**Card styling**:

| State | Classes |
|-------|---------|
| Unselected | `border border-neutral-200 rounded-lg p-4 bg-white` |
| Selected | `border-2 border-primary-500 rounded-lg p-4 bg-primary-50` |
| Hover | `hover:border-primary-300 transition-colors` |

**Channel checkbox**: PrimeReact `Checkbox` for the channel toggle. When unchecked, format checkboxes are hidden.

**Format checkboxes**: Rendered only when the parent channel is selected. Indented with a left border for visual nesting per the UX spec. Appear with a subtle height transition (200ms ease-out).

```tsx
{selected && (
  <div className="border-l-2 border-primary-300 ml-3 pl-4 mt-3 transition-all duration-200">
    <div className="flex flex-wrap gap-3">
      {formats.map(format => (
        <div key={format} className="flex items-center gap-2">
          <Checkbox ... />
          <label className="text-sm text-neutral-700">{formatLabel}</label>
        </div>
      ))}
    </div>
  </div>
)}
```

**Unchecking a channel**: Clears its post format selections and hides the nested group.

**Validation**: At least one channel with at least one format must be selected. Error shown below the channel grid: "Select at least one post format for [channel name]".

---

### 5.3 Content Rules (Section 3)

**Panel header**: `3. Content Rules`
**Default state**: Expanded
**Helper text**: "Set rules for the type of content participants can create."

**AI Content Toggle**:

```
AI-Generated Content    [toggle switch]
"Allow participants to use AI-generated content"
```

```tsx
<div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
  <div>
    <span className="text-sm font-medium text-neutral-700">AI-Generated Content</span>
    <p className="text-xs text-neutral-500 mt-0.5">Allow participants to use AI-generated content</p>
  </div>
  <InputSwitch checked={aiContentPermitted} onChange={...} />
</div>
```

**Engagement Requirements sub-group**:

Separated by `mt-4 pt-4 border-t border-neutral-200`.

Sub-group header: `text-sm font-semibold text-neutral-700 mb-3` with text "Engagement Requirements".

| Field | Component | Layout | Placeholder |
|-------|-----------|--------|-------------|
| Tag Account | `InputText` | full width | "@brandhandle" |
| Mention | `Checkbox` | inline with label | -- |
| Comment | `Checkbox` | inline with label | -- |

Mention and Comment checkboxes on the same row:

```tsx
<div className="flex flex-wrap gap-6">
  <div className="flex items-center gap-2">
    <Checkbox checked={mention} onChange={...} />
    <label className="text-sm text-neutral-700">Participant must mention brand</label>
  </div>
  <div className="flex items-center gap-2">
    <Checkbox checked={comment} onChange={...} />
    <label className="text-sm text-neutral-700">Participant must leave a comment</label>
  </div>
</div>
```

---

### 5.4 Post Visibility (Section 4)

**Panel header**: `4. Post Visibility`
**Default state**: Expanded
**Helper text**: "Choose how long participant posts must remain visible."

**Visibility rule selection**: Radio button group (PrimeReact `RadioButton`).

```
( ) Must not remove - Post must never be deleted
( ) Minimum duration - Post must stay up for a set time
```

**Conditional duration fields**: Shown only when "Minimum duration" is selected.

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 ml-6">
  <div>
    <label ...>Duration Value *</label>
    <InputNumber value={...} min={1} className="w-full" />
  </div>
  <div>
    <label ...>Duration Unit *</label>
    <Dropdown options={durationUnits} className="w-full" />
  </div>
</div>
```

**Duration unit options**: Hours, Days, Weeks.

**Acknowledgment checkbox**: Appears at the bottom of the section. Uses PrimeReact `Checkbox` with a prominent style:

```tsx
<div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
  <div className="flex items-start gap-3">
    <Checkbox checked={visibilityAcknowledged} onChange={...} />
    <label className="text-sm text-neutral-700">
      I understand and confirm the post visibility requirements above.
      <span className="block text-xs text-neutral-500 mt-1">
        This must be acknowledged before the bounty can be published.
      </span>
    </label>
  </div>
</div>
```

---

### 5.5 Rewards (Section 5)

**Panel header**: `5. Rewards`
**Default state**: Expanded
**Helper text**: "Define what participants earn for completing this bounty. You can offer multiple rewards."

**Currency selector**: Above the reward table.

```tsx
<div className="flex items-center gap-3 mb-4">
  <label className="text-sm font-medium text-neutral-700">Currency</label>
  <Dropdown
    value={currency}
    options={currencyOptions}
    onChange={...}
    className="w-40"
  />
</div>
```

Currency options: ZAR, USD, GBP, EUR.

**Reward lines table** (desktop):

| Column | Width | Component |
|--------|-------|-----------|
| Type | `w-40` | `Dropdown` (CASH, PRODUCT, SERVICE, OTHER) |
| Name | flex-1 | `InputText` placeholder "e.g. Cash reward per post" |
| Value | `w-36` | `InputNumber` mode="decimal" minFractionDigits={2} placeholder="0.00" |
| Remove | `w-12` | `Button` icon="pi pi-times" text severity="danger" |

```tsx
<div className="border border-neutral-200 rounded-lg overflow-hidden">
  {/* Header row */}
  <div className="grid grid-cols-[10rem_1fr_9rem_3rem] gap-3 p-3 bg-neutral-50 border-b border-neutral-200">
    <span className="text-xs font-semibold text-neutral-600 uppercase">Type</span>
    <span className="text-xs font-semibold text-neutral-600 uppercase">Name</span>
    <span className="text-xs font-semibold text-neutral-600 uppercase">Value</span>
    <span></span>
  </div>
  {/* Reward rows */}
  {rewards.map((reward, index) => (
    <div className="grid grid-cols-[10rem_1fr_9rem_3rem] gap-3 p-3 border-b border-neutral-100 last:border-b-0 items-center">
      ...
    </div>
  ))}
</div>
```

**Mobile layout**: Each reward renders as a stacked card instead of a table row.

```tsx
{/* Mobile: stacked card */}
<div className="md:hidden space-y-3 p-4 border border-neutral-200 rounded-lg">
  <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-neutral-700">Reward {index + 1}</span>
    <Button icon="pi pi-trash" text severity="danger" size="small" />
  </div>
  <Dropdown ... className="w-full" />
  <InputText ... className="w-full" />
  <InputNumber ... className="w-full" />
</div>
```

**Remove row behavior** (per UX spec):
- When only 1 row exists: remove button is hidden (cannot have zero reward rows).
- When 2+ rows exist: remove button visible on all rows.
- For non-empty rows (any field has a value): clicking remove shows inline confirmation. The row highlights and the remove button is replaced with "Remove?" and "Cancel" text links. This avoids a modal for a low-stakes action.
- Empty rows are removed immediately without confirmation.

```tsx
{/* Inline remove confirmation state */}
{confirmingRemove === index ? (
  <div className="flex items-center gap-2 text-sm">
    <button className="text-danger-600 font-medium hover:underline" onClick={() => removeRow(index)}>
      Remove?
    </button>
    <button className="text-neutral-500 hover:underline" onClick={() => setConfirmingRemove(null)}>
      Cancel
    </button>
  </div>
) : (
  <Button icon="pi pi-times" text severity="danger" size="small" onClick={() => handleRemove(index)} />
)}
```

**Add reward button**: Below the table/cards, with counter to the right.

```tsx
<div className="flex items-center gap-3 mt-3">
  <Button
    label={rewards.length >= 10 ? "Maximum rewards reached" : "Add Reward"}
    icon="pi pi-plus"
    outlined
    size="small"
    disabled={rewards.length >= 10}
  />
  <span className="text-xs text-neutral-500">{rewards.length} of 10</span>
</div>
```

**Total reward value**: Displayed below the reward table, right-aligned.

```tsx
<div className="flex justify-end mt-4 pt-3 border-t border-neutral-200">
  <div className="text-right">
    <span className="text-xs text-neutral-500 uppercase tracking-wider">Total Reward Value</span>
    <p className="text-lg font-bold text-neutral-900 mt-0.5">
      <span className="text-neutral-500 text-base font-normal mr-1">{currencySymbol}</span>
      {totalValue.toFixed(2)}
    </p>
  </div>
</div>
```

---

### 5.6 Eligibility (Section 6)

**Panel header**: `6. Eligibility`
**Default state**: Expanded
**Helper text**: "Set requirements that participants must meet to qualify. Leave empty if the bounty is open to everyone."

**Predefined rules**: Each rule is a `Checkbox` with a conditional input that appears when checked. The checkbox + input pattern provides clearer on/off semantics than a toggle for rule-based selections.

```
+---------------------------------------------------------------+
| [x] Minimum follower count                                    |
|      Minimum followers: [__1000__]                             |
| [ ] Minimum account age                                       |
| [x] Public profile required                                   |
| [ ] Location restriction                                      |
| [ ] No competing brand posts                                  |
+---------------------------------------------------------------+
```

**Layout**: Each predefined rule on its own row. Conditional inputs are indented below the checkbox with a slide-down transition (200ms).

```tsx
<div className="space-y-4">
  {/* Example: Min Followers */}
  <div>
    <div className="flex items-center gap-3">
      <Checkbox checked={minFollowersEnabled} onChange={...} />
      <span className="text-sm text-neutral-700">Minimum follower count</span>
    </div>
    {minFollowersEnabled && (
      <div className="ml-8 mt-2 transition-all duration-200">
        <label className="block text-xs text-neutral-600 mb-1">Minimum followers</label>
        <InputNumber
          value={minFollowers}
          onChange={...}
          min={1}
          className="w-40"
          placeholder="e.g. 1000"
        />
      </div>
    )}
  </div>

  {/* Boolean-only rule (no conditional input) */}
  <div className="flex items-center gap-3">
    <Checkbox checked={publicProfile} onChange={...} />
    <span className="text-sm text-neutral-700">Public profile required</span>
  </div>
</div>
```

**Predefined rule list**:

| Rule | Conditional Input | Placeholder |
|------|-------------------|-------------|
| Minimum follower count | `InputNumber` (min: 1) | "e.g. 1000" |
| Minimum account age | `InputNumber` (min: 1) + "days" label | "e.g. 90" |
| Public profile required | None (boolean only) | -- |
| Location restriction | `InputText` (max 200 chars) | "e.g. South Africa, United States" |
| No competing brand posts | `InputNumber` (min: 1) + "days" label | "e.g. 30" |

Unchecking a rule hides and clears its conditional input value.

**Custom rules sub-group**:

Separated by `mt-4 pt-4 border-t border-neutral-200`.

Sub-group header with counter: `text-sm font-semibold text-neutral-700 mb-3`.

Each custom rule is an `InputText` with a remove button. Empty rows are removed automatically on blur.

```tsx
<div className="space-y-3">
  <h4 className="text-sm font-semibold text-neutral-700">
    Custom Rules <span className="font-normal text-neutral-500">({customRules.length} of 5)</span>
  </h4>
  {customRules.map((rule, index) => (
    <div key={index} className="flex items-center gap-2">
      <InputText
        value={rule}
        onChange={...}
        onBlur={() => { if (!rule.trim()) removeRule(index); }}
        className="flex-1"
        placeholder="Describe the eligibility requirement"
        maxLength={500}
      />
      <Button
        icon="pi pi-times"
        text
        severity="danger"
        size="small"
        onClick={() => removeRule(index)}
      />
    </div>
  ))}
  <Button
    label="Add Custom Rule"
    icon="pi pi-plus"
    text
    size="small"
    className="text-primary-600"
    disabled={customRules.length >= 5}
  />
</div>
```

**Note**: The "Add Custom Rule" button uses `text` style (link-like) per UX spec, not `outlined`, to keep it visually subordinate. Maximum 5 custom rules per the product spec (`BOUNTY_REWARD_LIMITS`).

---

### 5.7 Proof Requirements (Section 7)

**Panel header**: `7. Proof Requirements`
**Default state**: Expanded
**Helper text**: "Describe what evidence participants must submit to prove they completed the bounty."

Single field:

| Field | Component | Width | Required | Rows | Placeholder |
|-------|-----------|-------|----------|------|-------------|
| Proof Requirements | `InputTextarea` | full | Yes | 4 | "e.g. Submit a screenshot of your post showing the caption, hashtags, and engagement metrics..." |

---

### 5.8 Submission Limits (Section 8)

**Panel header**: `8. Max Submissions`
**Default state**: Expanded
**Helper text**: "Limit the number of submissions this bounty will accept. Leave empty for unlimited."

| Field | Component | Width | Required | Placeholder |
|-------|-----------|-------|----------|-------------|
| Maximum Submissions | `InputNumber` | `w-48` | No | "Unlimited" |

Field-level helper text: `text-xs text-neutral-500 mt-1` with "Leave empty for unlimited submissions".

---

### 5.9 Schedule (Section 9)

**Panel header**: `9. Schedule`
**Default state**: Expanded
**Helper text**: "Set when this bounty becomes available. Leave empty to publish manually."

Two-column layout on tablet+:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label ...>Start Date</label>
    <Calendar
      value={startDate}
      onChange={...}
      showTime
      className="w-full"
      placeholder="Select start date (optional)"
      minDate={new Date()}
    />
    <small className="text-xs text-neutral-500 mt-1">When the bounty becomes available</small>
  </div>
  <div>
    <label ...>End Date</label>
    <Calendar
      value={endDate}
      onChange={...}
      showTime
      className="w-full"
      placeholder="Select end date (optional)"
      minDate={startDate || new Date()}
    />
    <small className="text-xs text-neutral-500 mt-1">When the bounty closes for submissions</small>
  </div>
</div>
```

---

## 6. Sticky Footer

The sticky footer anchors to the bottom of the viewport and provides the primary form actions.

### 6.1 Structure

Per the UX spec, the footer shows: error summary (left), running reward total (center), action buttons (right).

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

### 6.2 Styling

```tsx
<div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
  <div className="max-w-3xl mx-auto px-6 py-3 hidden md:flex items-center justify-between">
    {/* Left: Error summary (shown only after failed submit) */}
    <div className="text-sm">
      {errorCount > 0 && (
        <span className="text-danger-600 font-medium">
          {errorCount} {errorCount === 1 ? 'error' : 'errors'} found
        </span>
      )}
    </div>
    {/* Center: Total */}
    <div className="text-center">
      <span className="text-xs text-neutral-500 uppercase tracking-wider">Total Reward</span>
      <p className="text-base font-semibold text-neutral-900">
        <span className="text-neutral-500 text-sm font-normal mr-1">{currencySymbol}</span>
        {totalValue.toFixed(2)}
      </p>
    </div>
    {/* Right: Actions */}
    <div className="flex items-center gap-3">
      <Button label="Save as Draft" icon="pi pi-save" outlined severity="secondary" onClick={handleSaveDraft} loading={isSaving} />
      <Button label="Create Bounty" icon="pi pi-plus" onClick={handleCreate} loading={isCreating} />
    </div>
  </div>
</div>
```

### 6.3 Mobile Footer

On mobile (`< md`), the footer stacks vertically. "Create Bounty" is on top (primary), "Save as Draft" below.

```tsx
<div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] p-4">
  <div className="flex items-center justify-between mb-3">
    <div>
      {errorCount > 0 && (
        <span className="text-xs text-danger-600 font-medium">{errorCount} errors found</span>
      )}
    </div>
    <div className="text-right">
      <span className="text-xs text-neutral-500">Total: </span>
      <span className="text-sm font-semibold text-neutral-900">{currencySymbol} {totalValue.toFixed(2)}</span>
    </div>
  </div>
  <div className="flex flex-col gap-2">
    <Button label="Create Bounty" icon="pi pi-plus" className="w-full" loading={isCreating} />
    <Button label="Save as Draft" icon="pi pi-save" outlined severity="secondary" className="w-full" loading={isSaving} />
  </div>
</div>
```

### 6.4 Error Summary Behavior

- The error summary in the footer appears only after a failed form submission attempt.
- The error count updates in real-time as the user fixes fields.
- When all errors are resolved, the error text disappears.
- Format: "{N} errors found. Please fix the highlighted fields."

### 6.5 Cancel Navigation

The "Cancel" button is not in the sticky footer. It is handled via browser back or breadcrumb navigation. If the form has unsaved changes, a `ConfirmDialog` is shown:
- Title: "Unsaved Changes"
- Message: "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
- Buttons: "Leave" (severity danger) / "Stay" (primary)

This uses `beforeunload` for browser navigation and PrimeReact `ConfirmDialog` for in-app navigation.

### 6.4 Footer Height

| Breakpoint | Height | Bottom Padding |
|------------|--------|----------------|
| Mobile | ~120px | `pb-32` on form |
| Desktop | ~64px | `pb-24` on form |

---

## 7. Iconography

All icons use PrimeReact's `pi pi-*` icon set. No additional icon libraries.

### 7.1 Channel Icons

| Channel | Icon | Usage |
|---------|------|-------|
| Instagram | `pi pi-instagram` | Channel card header |
| Facebook | `pi pi-facebook` | Channel card header |
| TikTok | `pi pi-video` | Channel card header (no pi-tiktok; use pi-video as fallback) |

### 7.2 Reward Type Indicators

| Type | Icon | Color |
|------|------|-------|
| Cash | `pi pi-money-bill` | `text-success-600` |
| Product | `pi pi-box` | `text-primary-600` |
| Service | `pi pi-wrench` | `text-warning-600` |
| Other | `pi pi-gift` | `text-neutral-600` |

These icons appear in the reward type Dropdown as item templates:

```tsx
const rewardTypeTemplate = (option) => (
  <div className="flex items-center gap-2">
    <i className={`pi ${option.icon} ${option.iconColor}`} />
    <span>{option.label}</span>
  </div>
);
```

### 7.3 Section Icons

Used in panel headers alongside the section number:

| Section | Icon |
|---------|------|
| 1. Basic Information | `pi pi-file-edit` |
| 2. Channels | `pi pi-share-alt` |
| 3. Content Rules | `pi pi-sliders-h` |
| 4. Post Visibility | `pi pi-eye` |
| 5. Rewards | `pi pi-money-bill` |
| 6. Eligibility | `pi pi-users` |
| 7. Proof Requirements | `pi pi-camera` |
| 8. Submission Limits | `pi pi-hashtag` |
| 9. Schedule | `pi pi-calendar` |

Panel header template:

```tsx
import { Badge } from 'primereact/badge';

const panelHeader = (number: number, title: string, icon: string, isComplete: boolean, errorCount: number) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-2">
      <i className={`pi ${icon} text-primary-600 text-sm`} />
      <span className="text-primary-600 font-bold">{number}.</span>
      <span className="text-base font-semibold text-neutral-800">{title}</span>
    </div>
    {errorCount > 0 && <Badge value={errorCount} severity="danger" />}
    {isComplete && errorCount === 0 && <i className="pi pi-check-circle text-success-600" />}
  </div>
);
```

### 7.4 Action Icons

| Action | Icon |
|--------|------|
| Add item | `pi pi-plus` |
| Remove item | `pi pi-times` (inline remove) |
| Create bounty | `pi pi-plus` |
| Save as draft | `pi pi-save` |

---

## 8. Validation States

### 8.1 Field-Level Validation

All validation is inline, shown below the relevant field.

**Invalid input styling**:
- PrimeReact components receive `className="p-invalid"` (adds red border).
- Error message rendered below with `text-xs text-danger-600 mt-1`.

**Valid state**: No special styling (default input appearance).

### 8.2 Section-Level Validation

Each panel header shows a completion/error indicator (see Section 3.5).

A section is "complete" when all its required fields have valid values.
A section "has errors" when the user has attempted to submit and required fields are empty or invalid.

### 8.3 Form-Level Validation

On form submission (Create Bounty), all sections are validated. If errors exist:

1. A `Message` component with severity `error` appears at the top of the form.
2. The page scrolls to the first section with errors.
3. Each section with errors shows the error indicator in its panel header.
4. Individual field errors are shown inline.

**Form-level error message**:

```tsx
<Message
  severity="error"
  text="Please fix the errors below before creating the bounty."
  className="w-full mb-4"
/>
```

### 8.4 Validation Timing

| Trigger | Behavior |
|---------|----------|
| On blur (field exit) | Validate individual field, show error if invalid |
| On change (real-time) | Clear error when field becomes valid |
| On submit (Create/Draft) | Validate all fields, show all errors |

**Note**: "Save as Draft" has relaxed validation (only `title` is required).

---

## 9. Tailwind Class Reference

### 9.1 Form Field Pattern

```tsx
{/* Standard field */}
<div>
  <label htmlFor="fieldId" className="block text-sm font-medium text-neutral-700 mb-1.5">
    Field Label <span className="text-danger-500">*</span>
  </label>
  <InputText
    id="fieldId"
    value={value}
    onChange={...}
    className={`w-full ${hasError ? 'p-invalid' : ''}`}
    placeholder="Placeholder text"
  />
  {helperText && !hasError && (
    <small className="text-xs text-neutral-500 mt-1">{helperText}</small>
  )}
  {hasError && (
    <small className="text-xs text-danger-600 mt-1 flex items-center gap-1">
      <i className="pi pi-exclamation-circle text-xs" />
      {errorMessage}
    </small>
  )}
</div>
```

### 9.2 Panel Pattern

```tsx
<Panel
  header={panelHeader(1, 'Basic Info', 'pi-file-edit', isComplete, errorCount)}
  toggleable
  className="shadow-sm"
>
  <p className="text-sm text-neutral-500 mb-4">
    Give your bounty a clear title and detailed instructions so participants know exactly what to do.
  </p>
  <div className="space-y-5">
    {/* Fields */}
  </div>
</Panel>
```

### 9.3 Sub-Group Pattern

```tsx
<div className="mt-4 pt-4 border-t border-neutral-200">
  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Sub-Group Title</h4>
  <div className="space-y-4">
    {/* Sub-group fields */}
  </div>
</div>
```

### 9.4 Checkbox + Conditional Input Pattern (Eligibility)

```tsx
<div>
  <div className="flex items-center gap-3">
    <Checkbox checked={enabled} onChange={...} />
    <span className="text-sm text-neutral-700">Rule Label</span>
  </div>
  {enabled && (
    <div className="ml-8 mt-2 transition-all duration-200">
      <label className="block text-xs text-neutral-600 mb-1">Input Label</label>
      <InputNumber value={value} onChange={...} min={1} className="w-40" placeholder="e.g. 1000" />
    </div>
  )}
</div>
```

### 9.5 Dynamic List Pattern (Custom Rules, Rewards)

```tsx
<div className="space-y-3">
  {items.map((item, index) => (
    <div key={index} className="flex items-center gap-2">
      {/* Item fields */}
      <Button icon="pi pi-times" text severity="danger" size="small" onClick={() => remove(index)} />
    </div>
  ))}
  <Button
    label="Add Item"
    icon="pi pi-plus"
    outlined
    size="small"
    disabled={items.length >= maxItems}
  />
</div>
```

### 9.6 Channel Card Pattern

```tsx
<div
  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
    selected
      ? 'border-2 border-primary-500 bg-primary-50'
      : 'border-neutral-200 bg-white hover:border-primary-300'
  }`}
  onClick={() => toggleChannel(channel)}
>
  <div className="flex items-center gap-3">
    <Checkbox checked={selected} onChange={() => toggleChannel(channel)} />
    <i className={`pi ${channelIcon} text-lg ${selected ? 'text-primary-600' : 'text-neutral-400'}`} />
    <span className={`text-sm font-medium ${selected ? 'text-primary-700' : 'text-neutral-700'}`}>
      {channelName}
    </span>
  </div>
  {selected && (
    <div className="border-l-2 border-primary-300 ml-3 pl-4 mt-3 transition-all duration-200">
      <div className="flex flex-wrap gap-3">
        {formats.map(format => (
          <div key={format} className="flex items-center gap-2">
            <Checkbox checked={isFormatSelected(format)} onChange={() => toggleFormat(channel, format)} />
            <label className="text-sm text-neutral-700">{formatLabel(format)}</label>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

### 9.7 Info/Warning Box Pattern

```tsx
{/* Used for visibility acknowledgment, draft info banners, etc. */}
<div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
  <div className="flex items-start gap-3">
    {/* Content */}
  </div>
</div>
```

---

## 10. Assumptions

1. **No stepper/wizard**: The form is a single long page with toggleable panels, not a multi-step wizard. This reduces complexity for MVP and keeps all fields accessible. (Matches UX spec Section 1.)
2. **No auto-save**: Auto-save/draft recovery is not implemented for MVP. The "Save as Draft" button is an explicit action.
3. **Toggleable panels**: PrimeReact `Panel` with `toggleable` is used. All sections default to expanded. Users can collapse completed sections to reduce scroll distance, especially on mobile. (Matches UX spec Section 5.4.)
4. **No drag-and-drop reordering**: Reward lines and custom rules are ordered by creation order. Drag-and-drop reordering is post-MVP. (Matches UX spec Section 4.5.)
5. **Sidebar offset**: The sticky footer's `left-0 right-0` positioning accounts for the sidebar. On desktop, the MainLayout provides the sidebar, and the content area is already offset. The footer spans the full viewport width and its content is centered with `max-w-3xl mx-auto` to align with the form.
6. **InputSwitch for booleans, Checkbox for rules**: PrimeReact `InputSwitch` is used for the AI content toggle (on/off). PrimeReact `Checkbox` is used for eligibility rules (enable/disable with conditional input), channels, and format selections. (Aligns with UX spec Section 2.3.)
7. **No rich text editor**: All text fields use plain `InputTextarea`. Rich text editing is out of scope for MVP.
8. **PrimeReact lara-light-blue theme**: All component colors inherit from this theme. The custom Tailwind colors in `tailwind.config.ts` match the theme palette for consistency.
9. **Channel icon fallback**: PrimeReact does not include a dedicated TikTok icon. `pi-video` is used as a visual stand-in. This can be replaced with a custom SVG icon post-MVP if needed.
10. **Inline remove confirmation**: Non-empty reward rows use inline text confirmation ("Remove? / Cancel") instead of a modal dialog, per UX spec Section 4.3. This avoids interruption for a low-stakes action.
11. **Custom eligibility rule limit**: Maximum 5 custom rules per the product spec (`BOUNTY_REWARD_LIMITS`), not 10 as noted in the UX spec. The product spec is the source of truth for data constraints.
12. **Category as Dropdown**: Category uses a `Dropdown` with predefined options per the UX spec, replacing the free-text `InputText` from the original form.

---

---

## 11. Payout Metrics Section (Section 10)

### 11.1 Component: PayoutMetricsSection

**Panel header**: `10. Payout Metrics`
**Icon**: `pi pi-chart-bar`
**Default state**: Expanded
**Helper text**: "Set performance thresholds participants must meet before being eligible for payout. Leave empty if no thresholds apply."

Three optional `InputNumber` fields in a responsive grid:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
      Min Views
    </label>
    <InputNumber
      value={minViews}
      onValueChange={(e) => dispatch({ type: 'SET_MIN_VIEWS', payload: e.value })}
      min={0}
      className="w-full"
      placeholder="e.g. 100"
    />
    <small className="text-xs text-neutral-500 mt-1">Minimum post views required</small>
  </div>
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
      Min Likes
    </label>
    <InputNumber
      value={minLikes}
      onValueChange={(e) => dispatch({ type: 'SET_MIN_LIKES', payload: e.value })}
      min={0}
      className="w-full"
      placeholder="e.g. 10"
    />
    <small className="text-xs text-neutral-500 mt-1">Minimum post likes required</small>
  </div>
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
      Min Comments
    </label>
    <InputNumber
      value={minComments}
      onValueChange={(e) => dispatch({ type: 'SET_MIN_COMMENTS', payload: e.value })}
      min={0}
      className="w-full"
      placeholder="e.g. 5"
    />
    <small className="text-xs text-neutral-500 mt-1">Minimum post comments required</small>
  </div>
</div>
```

**Validation**: No required fields. All values must be >= 0 if provided. Integer only.

---

## 12. Payment Dialog

### 12.1 Component: PaymentDialog

A modal dialog using PrimeReact `Dialog` with Stripe Elements integration.

```
+--------------------------------------------------+
| Payment Required                           [X]    |
+--------------------------------------------------+
|                                                    |
|  You are about to publish this bounty.             |
|  A payment of R 250.00 is required.                |
|                                                    |
|  ┌──────────────────────────────────────────────┐  |
|  │  Card Number  [4242 4242 4242 4242]          │  |
|  │  Expiry [MM/YY]      CVC [123]              │  |
|  └──────────────────────────────────────────────┘  |
|                                                    |
|  [Cancel]                    [Pay R 250.00 & Publish]  |
+--------------------------------------------------+
```

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Controls dialog visibility |
| `onHide` | `() => void` | Called when dialog is dismissed |
| `bountyId` | `string` | Bounty ID for payment intent |
| `amount` | `string` | Formatted total reward amount |
| `currency` | `Currency` | Currency for display |
| `onSuccess` | `() => void` | Called after successful payment |

**Styling**:

```tsx
<Dialog
  visible={visible}
  onHide={onHide}
  header="Payment Required"
  className="w-full max-w-lg"
  modal
  closable
  draggable={false}
>
  <div className="space-y-4">
    <p className="text-sm text-neutral-700">
      You are about to publish this bounty.
      A payment of <span className="font-semibold">{formatCurrency(amount, currency)}</span> is required.
    </p>
    <div className="border border-neutral-200 rounded-lg p-4">
      {/* Stripe PaymentElement */}
      <PaymentElement />
    </div>
    {error && (
      <Message severity="error" text={error} className="w-full" />
    )}
    <div className="flex justify-end gap-3 pt-2">
      <Button label="Cancel" outlined severity="secondary" onClick={onHide} />
      <Button
        label={`Pay ${formatCurrency(amount, currency)} & Publish`}
        icon="pi pi-credit-card"
        onClick={handlePayment}
        loading={isProcessing}
      />
    </div>
  </div>
</Dialog>
```

---

## 13. Metrics Comparison View

### 13.1 Submission Review — Metrics Card

When reviewing a submission for a bounty with payout metrics, a comparison card is shown.

```tsx
<Card>
  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Performance Metrics</h3>
  <div className="space-y-3">
    {metrics.map(({ label, required, reported }) => (
      <div key={label} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
        <span className="text-sm text-neutral-700">{label}</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">Required: {required ?? '--'}</span>
          <span className="text-sm text-neutral-700">Reported: {reported ?? '--'}</span>
          {required != null && reported != null && (
            <Tag
              value={reported >= required ? 'Pass' : 'Fail'}
              severity={reported >= required ? 'success' : 'danger'}
            />
          )}
        </div>
      </div>
    ))}
  </div>
</Card>
```

### 13.2 Verification Deadline Display

Shown on submission detail when `verificationDeadline` is set:

```tsx
<div className="flex items-center gap-2 text-sm">
  <i className="pi pi-clock text-warning-600" />
  <span className="text-neutral-700">
    Verification deadline: <span className="font-medium">{timeRemaining}</span>
  </span>
</div>
```

Color changes: > 24h remaining = neutral, < 24h = warning (orange), < 1h = danger (red).

### 13.3 Payment Status Badge

Displayed on bounty detail page next to the bounty status badge:

```tsx
const PAYMENT_STATUS_SEVERITY: Record<string, string> = {
  UNPAID: 'secondary',
  PENDING: 'warning',
  PAID: 'success',
  REFUNDED: 'info',
};

<Tag
  value={formatEnumLabel(bounty.paymentStatus)}
  severity={PAYMENT_STATUS_SEVERITY[bounty.paymentStatus]}
/>
```

---

*This document strictly follows the product specification at `docs/create-bounty-spec.md`, the UX flow at `docs/create-bounty-ux.md`, and the existing design system at `docs/ui/component-system-and-screens.md`. No features outside the spec have been added. All component selections use PrimeReact components and Tailwind CSS utilities only. Where the UX spec and product spec conflict on data constraints (e.g., custom rule limits), the product spec takes precedence.*
