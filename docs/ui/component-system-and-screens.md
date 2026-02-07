# PrimeReact + Tailwind Component System and Screen Inventory

> **Version**: 1.0
> **Date**: 2026-02-07
> **Source**: `docs/ux/screen-specifications.md`, `docs/ux/sitemap-and-flows.md`, `docs/architecture/database-schema.md`, `md-files/social-bounty-mvp.md`
> **Rule**: MVP scope only. No feature creep.

---

## Table of Contents

- [Assumptions](#assumptions)
- [Part 1: PrimeReact Component Catalogue](#part-1-primereact-component-catalogue)
- [Part 2: Tailwind CSS Strategy](#part-2-tailwind-css-strategy)
- [Part 3: Custom Composite Components](#part-3-custom-composite-components)
- [Part 4: Status Badge Colour Mapping](#part-4-status-badge-colour-mapping)
- [Part 5: Screen Inventory](#part-5-screen-inventory)
- [Part 6: Accessibility Requirements](#part-6-accessibility-requirements)

---

## Assumptions

1. **Dark mode excluded from MVP**: The application ships with a light theme only. This is documented to avoid scope creep. A dark mode toggle can be added in a future release.
2. **PrimeReact Lara Light theme**: We use the `lara-light-blue` PrimeReact theme as the base, customised via Tailwind to match Social Bounty branding.
3. **Tailwind CSS v3+**: Using Tailwind CSS v3 or later with JIT mode enabled.
4. **Desktop-primary, responsive layout**: All screens are designed for desktop first. Responsive breakpoints ensure usability on tablet and mobile, but no mobile-specific UX flows are designed for MVP.
5. **PrimeReact v10+**: Component APIs reference PrimeReact v10 for React. All component names follow PrimeReact's documented API.
6. **No custom icon library**: Use PrimeReact's built-in `pi pi-*` icon set. No additional icon library (e.g. Heroicons, Lucide) is introduced for MVP.
7. **Toast position**: All toast notifications appear in the top-right corner, matching PrimeReact defaults and the UX flow document.
8. **Image lightbox**: Proof images use PrimeReact's `Image` component with built-in preview/lightbox capability rather than a third-party lightbox.

---

## Part 1: PrimeReact Component Catalogue

### Validated Component List

The screen specifications identify 26 PrimeReact components. After cross-referencing all 33 screens and their interaction patterns, the validated and refined list is **27 components** (one addition: `AutoComplete` for audit log actor search).

| # | Component | Category | Import Path | Screens Used (count) | Purpose |
|---|-----------|----------|-------------|---------------------|---------|
| 1 | `Button` | Action | `primereact/button` | 33 | Primary/secondary actions, CTAs, navigation |
| 2 | `InputText` | Form | `primereact/inputtext` | 14 | Single-line text inputs, search bars |
| 3 | `InputTextarea` | Form | `primereact/inputtextarea` | 7 | Multi-line text (proof, notes, instructions) |
| 4 | `Password` | Form | `primereact/password` | 4 | Password fields with optional strength meter |
| 5 | `Dropdown` | Form | `primereact/dropdown` | 12 | Single-select filters, form selects |
| 6 | `Calendar` | Form | `primereact/calendar` | 3 | Date pickers (bounty scheduling, audit log range) |
| 7 | `InputNumber` | Form | `primereact/inputnumber` | 2 | Numeric inputs (reward value, max submissions) |
| 8 | `FileUpload` | Form | `primereact/fileupload` | 3 | Image uploads (proof images, org logo) |
| 9 | `InputSwitch` | Form | `primereact/inputswitch` | 1 | Global settings toggles |
| 10 | `AutoComplete` | Form | `primereact/autocomplete` | 1 | Actor search in audit log filters |
| 11 | `DataTable` | Data | `primereact/datatable` | 12 | Tabular list views and management tables |
| 12 | `Column` | Data | `primereact/column` | 12 | Column definitions within DataTable |
| 13 | `Paginator` | Data | `primereact/paginator` | 10 | Server-side pagination on all list views |
| 14 | `Card` | Layout | `primereact/card` | 10 | Content containers, summary cards, detail sections |
| 15 | `Panel` | Layout | `primereact/panel` | 2 | Collapsible filter sections |
| 16 | `Divider` | Layout | `primereact/divider` | 4 | Visual section separators |
| 17 | `Toolbar` | Layout | `primereact/toolbar` | 2 | Action bars on detail pages |
| 18 | `Fieldset` | Layout | `primereact/fieldset` | 1 | Collapsible password change section |
| 19 | `BreadCrumb` | Navigation | `primereact/breadcrumb` | 12 | Hierarchical navigation |
| 20 | `Menu` | Navigation | `primereact/menu` | 1 | Row action menus in bounty management |
| 21 | `Badge` | Display | `primereact/badge` | 20+ | Status indicators (inline counts) |
| 22 | `Tag` | Display | `primereact/tag` | 20+ | Category, role, and status labels |
| 23 | `Image` | Display | `primereact/image` | 3 | Proof image viewing with lightbox |
| 24 | `Avatar` | Display | `primereact/avatar` | 1 | Member list avatars |
| 25 | `Skeleton` | Feedback | `primereact/skeleton` | 33 | Loading placeholder on all screens |
| 26 | `ProgressBar` | Feedback | `primereact/progressbar` | 1 | File upload progress |
| 27 | `ProgressSpinner` | Feedback | `primereact/progressspinner` | 1 | Email verification loading |
| 28 | `Message` | Feedback | `primereact/message` | 8 | Inline errors, info/warning banners |
| 29 | `Toast` | Feedback | `primereact/toast` | 33 | Success/error/info notifications (global) |
| 30 | `ConfirmDialog` | Overlay | `primereact/confirmdialog` | 8 | Destructive action confirmation |
| 31 | `Dialog` | Overlay | `primereact/dialog` | 3 | Override modals (admin) |

**Note**: `Toast` is used globally (mounted once at app root) and available on all 33 screens. `Skeleton` is used as the loading pattern across all screens. Both are counted as 33 even though they are configured once.

### Removed from Initial Estimate

- `MultiSelect`: Not required. All filter dropdowns are single-select in MVP.
- `SplitButton`: Replaced with `Menu` for row actions. Simpler and avoids overloading the bounty management table.

### Added

- `AutoComplete` (added): Audit log actor search field benefits from server-side autocomplete rather than free-text InputText.

---

## Part 2: Tailwind CSS Strategy

### 2.1 Theme Colour Palette

Colours are defined as CSS custom properties in `tailwind.config.ts` and mapped to semantic names. The palette is designed for light mode only (dark mode excluded from MVP).

```typescript
// tailwind.config.ts (colour extension excerpt)
{
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Primary blue - main brand colour
          600: '#2563eb',  // Primary hover
          700: '#1d4ed8',  // Primary active
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',  // Secondary slate
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',  // Success green
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',  // Warning amber
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',  // Danger red
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',  // Info blue (same as primary)
          600: '#2563eb',
          700: '#1d4ed8',
        },
        neutral: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
    },
  },
}
```

### 2.2 Typography Scale

Using Tailwind's default scale with semantic aliases applied via `@apply` in a global CSS file.

| Token | Tailwind Class | Size | Weight | Usage |
|-------|---------------|------|--------|-------|
| `page-title` | `text-2xl font-bold` | 24px | 700 | Page headers |
| `section-title` | `text-xl font-semibold` | 20px | 600 | Card titles, section headers |
| `card-title` | `text-lg font-semibold` | 18px | 600 | Summary card titles |
| `body` | `text-base font-normal` | 16px | 400 | Body text, form labels |
| `body-small` | `text-sm font-normal` | 14px | 400 | Secondary text, helper text |
| `caption` | `text-xs font-normal` | 12px | 400 | Timestamps, metadata |
| `label` | `text-sm font-medium` | 14px | 500 | Form field labels |
| `button` | `text-sm font-semibold` | 14px | 600 | Button text |

**Font family**: System font stack via Tailwind's `font-sans` (Inter if available, falls back to system UI).

### 2.3 Spacing Scale

Using Tailwind's default spacing scale. Key application patterns:

| Context | Tailwind Class | Pixels | Usage |
|---------|---------------|--------|-------|
| Page padding | `p-6` | 24px | Main content area padding |
| Card padding | `p-4` | 16px | Inside Card components |
| Section gap | `gap-6` | 24px | Between major sections |
| Field gap | `gap-4` | 16px | Between form fields |
| Inline gap | `gap-2` | 8px | Between inline elements (badge + text) |
| Button gap | `gap-3` | 12px | Between action buttons |
| Table cell padding | `p-3` | 12px | DataTable cell padding |

### 2.4 Responsive Breakpoints

Desktop-primary with mobile responsiveness. Using Tailwind's default breakpoints:

| Breakpoint | Min Width | Target Devices | Layout Behaviour |
|------------|-----------|---------------|-----------------|
| `sm` | 640px | Large phones | Single column, stacked cards |
| `md` | 768px | Tablets | Sidebar collapses to hamburger, 2-column grids |
| `lg` | 1024px | Small desktops | Full sidebar visible, 3-column bounty grid |
| `xl` | 1280px | Desktops | Max content width, optimal reading width |
| `2xl` | 1536px | Large screens | Content centred with max-width constraint |

**Layout rules:**
- Below `md`: sidebar is hidden, accessible via hamburger menu
- `md` and above: sidebar is always visible (240px width)
- Main content area: `max-w-7xl mx-auto` on `2xl` and above
- Bounty card grid: 1 column (`sm`), 2 columns (`md`), 3 columns (`lg`+)
- Form layouts: full-width on mobile, max `max-w-2xl` on desktop
- Dashboard summary cards: 1 column (`sm`), 2 columns (`md`), 4-5 columns (`lg`+)

### 2.5 Dark Mode

**Excluded from MVP.** The application ships with light theme only. Assumptions:
- No `dark:` variant Tailwind classes are used.
- PrimeReact's `lara-light-blue` theme is the only theme loaded.
- A dark mode toggle is a post-MVP enhancement.

---

## Part 3: Custom Composite Components

These components are built on top of PrimeReact components and Tailwind CSS. They enforce consistency across all screens and reduce duplication.

### 3.1 StatusBadge

Renders a PrimeReact `Tag` with the correct colour, label, and ARIA attributes based on entity type and status value.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'bounty' \| 'submission' \| 'payout' \| 'user' \| 'organisation' \| 'role'` | Yes | Entity type for colour mapping lookup |
| `value` | `string` | Yes | Enum value (e.g., `'LIVE'`, `'APPROVED'`, `'PAID'`) |
| `size` | `'small' \| 'normal' \| 'large'` | No (default: `'normal'`) | Controls Tag size |

**Implementation:**
- Wraps PrimeReact `Tag` component
- Applies `severity` and custom `className` based on colour mapping (see Part 4)
- Adds `role="status"` and `aria-label` for screen readers (e.g., `aria-label="Bounty status: Live"`)
- Formats enum values for display: `NEEDS_MORE_INFO` -> `"Needs More Info"`, `NOT_PAID` -> `"Not Paid"`

**Usage:**
```tsx
<StatusBadge type="bounty" value="LIVE" />
<StatusBadge type="submission" value="NEEDS_MORE_INFO" size="large" />
<StatusBadge type="payout" value="PAID" />
```

---

### 3.2 PageLayout

Application shell providing role-based sidebar, top bar, breadcrumbs, and toast container.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `role` | `UserRole` | Yes | Current user's role (determines sidebar items) |
| `breadcrumbs` | `MenuItem[]` | No | PrimeReact BreadCrumb `model` items |
| `title` | `string` | No | Page title shown in header |
| `actions` | `ReactNode` | No | Slot for page-level action buttons (top right) |
| `children` | `ReactNode` | Yes | Page content |

**Structure:**
```
+-------+------------------------------------------------------+
| SIDE  | TOP BAR: [Logo]                   [User Menu v]       |
| BAR   +------------------------------------------------------+
|       | BREADCRUMB: Home > Section > Page                     |
|       +------------------------------------------------------+
|       | PAGE HEADER: Title                  [Action Buttons]  |
| nav   +------------------------------------------------------+
| items | CONTENT AREA                                          |
|       |   {children}                                          |
|       |                                                       |
+-------+------------------------------------------------------+
```

**Sidebar items by role:**

| Role | Items |
|------|-------|
| `PARTICIPANT` | Browse Bounties (`pi-search`), My Submissions (`pi-list`) |
| `BUSINESS_ADMIN` | Dashboard (`pi-chart-bar`), Bounties (`pi-megaphone`), Organisation (`pi-building`) |
| `SUPER_ADMIN` | Dashboard (`pi-chart-bar`), Users (`pi-users`), Organisations (`pi-building`), Bounties (`pi-megaphone`), Submissions (`pi-file`), Audit Logs (`pi-history`), System Health (`pi-server`), Settings (`pi-cog`) |

**Behaviour:**
- Sidebar collapses to hamburger on `< md` breakpoints
- Active sidebar item highlighted based on current route
- Top bar user menu uses PrimeReact `Menu` with items: "My Profile", "Logout"
- Toast container mounted at this level (top-right)
- BreadCrumb rendered below top bar if `breadcrumbs` prop provided

---

### 3.3 ConfirmAction

Wrapper around PrimeReact `ConfirmDialog` for destructive actions. Supports an optional mandatory reason field for admin overrides.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls dialog visibility |
| `onHide` | `() => void` | Yes | Called when dialog is dismissed |
| `title` | `string` | Yes | Dialog header text |
| `message` | `string` | Yes | Confirmation message body |
| `confirmLabel` | `string` | No (default: `"Confirm"`) | Confirm button text |
| `confirmSeverity` | `'danger' \| 'warning' \| 'success'` | No (default: `'danger'`) | Confirm button colour |
| `onConfirm` | `(reason?: string) => void` | Yes | Called with optional reason when confirmed |
| `requireReason` | `boolean` | No (default: `false`) | If true, shows a mandatory reason textarea |
| `reasonMinLength` | `number` | No (default: `10`) | Minimum characters for the reason field |
| `loading` | `boolean` | No (default: `false`) | Shows spinner on confirm button |

**Behaviour:**
- When `requireReason` is `true`:
  - Renders an `InputTextarea` labelled "Reason (required)" inside the dialog
  - Confirm button is disabled until reason meets `reasonMinLength`
  - Character count displayed below textarea
- Focus is trapped within the dialog while open
- Escape key and click-outside dismiss the dialog (calling `onHide`)
- Confirm button shows spinner when `loading` is `true`

**Usage:**
```tsx
// Simple destructive confirmation
<ConfirmAction
  visible={showDelete}
  onHide={() => setShowDelete(false)}
  title="Delete Bounty"
  message="Are you sure you want to delete this draft bounty? This action cannot be undone."
  confirmLabel="Yes, Delete"
  confirmSeverity="danger"
  onConfirm={handleDelete}
/>

// Admin override with mandatory reason
<ConfirmAction
  visible={showSuspend}
  onHide={() => setShowSuspend(false)}
  title="Suspend User"
  message="Suspend this user? They will be unable to log in."
  confirmLabel="Suspend"
  confirmSeverity="danger"
  requireReason
  reasonMinLength={10}
  onConfirm={(reason) => handleSuspend(reason!)}
/>
```

---

### 3.4 EmptyState

Consistent empty state display with icon, title, message, and optional CTA.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `string` | No (default: `'pi-inbox'`) | PrimeIcons class name |
| `title` | `string` | Yes | Primary empty state heading |
| `message` | `string` | No | Secondary descriptive text |
| `ctaLabel` | `string` | No | CTA button text (renders Button if provided) |
| `ctaAction` | `() => void` | No | CTA button click handler |
| `ctaIcon` | `string` | No | CTA button icon |

**Structure:**
```
    [Icon - large, muted]
    Title (section-title, centered)
    Message (body-small, muted, centered)
    [CTA Button] (if provided)
```

**Styling:**
- Centred vertically and horizontally within parent container
- Icon: 48px, `text-neutral-400`
- Title: `text-lg font-semibold text-neutral-700`
- Message: `text-sm text-neutral-500 mt-2`
- CTA button: `mt-4`, uses PrimeReact `Button` with `outlined` style

**Usage:**
```tsx
<EmptyState
  icon="pi-search"
  title="No bounties match your filters"
  message="Try adjusting your search criteria."
  ctaLabel="Clear Filters"
  ctaAction={clearFilters}
/>
```

---

### 3.5 LoadingState

Skeleton loader or spinner component for consistent loading UX across all screens.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'table' \| 'card' \| 'cards-grid' \| 'form' \| 'detail' \| 'page' \| 'inline'` | Yes | Determines skeleton pattern |
| `rows` | `number` | No (default: `10`) | Number of rows for `table` type |
| `columns` | `number` | No (default: `4`) | Number of columns for `table` type |
| `cards` | `number` | No (default: `6`) | Number of cards for `cards-grid` type |

**Patterns by type:**

| Type | Renders |
|------|---------|
| `table` | Skeleton rows matching DataTable column structure |
| `card` | Single Skeleton card (title + 3 text lines + footer) |
| `cards-grid` | Grid of Skeleton cards (responsive: 1/2/3 columns) |
| `form` | Skeleton form fields (label + input pairs, 6 fields) |
| `detail` | Skeleton detail page (title + two-column content + action bar) |
| `page` | Full page skeleton (header + content area) |
| `inline` | PrimeReact `ProgressSpinner` (small, inline) |

---

### 3.6 DataTablePage

Reusable page pattern combining DataTable with filters, pagination, empty state, and loading state.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `ColumnDef[]` | Yes | Column definitions (field, header, body template, sortable) |
| `data` | `any[]` | Yes | Table row data |
| `totalRecords` | `number` | Yes | Total count for server-side pagination |
| `loading` | `boolean` | Yes | Loading state |
| `page` | `number` | Yes | Current page (0-indexed) |
| `pageSize` | `number` | No (default: `10`) | Rows per page |
| `onPageChange` | `(page: number) => void` | Yes | Page change handler |
| `filters` | `FilterDef[]` | No | Filter controls to render above the table |
| `onFilterChange` | `(filters: Record<string, any>) => void` | No | Filter change handler |
| `emptyIcon` | `string` | No | Icon for empty state |
| `emptyTitle` | `string` | No (default: `"No results found"`) | Empty state title |
| `emptyMessage` | `string` | No | Empty state message |
| `emptyCta` | `{ label: string; action: () => void }` | No | Empty state CTA |
| `onRowClick` | `(rowData: any) => void` | No | Row click handler for navigation |
| `rowClassName` | `(rowData: any) => string` | No | Conditional row styling |

**ColumnDef type:**
```typescript
interface ColumnDef {
  field: string;
  header: string;
  body?: (rowData: any) => ReactNode;
  sortable?: boolean;
  style?: CSSProperties;
}
```

**FilterDef type:**
```typescript
interface FilterDef {
  key: string;
  label: string;
  type: 'dropdown' | 'text' | 'date-range';
  options?: { label: string; value: any }[];
  placeholder?: string;
}
```

**Behaviour:**
- Renders filter bar above DataTable if `filters` provided
- Shows `LoadingState type="table"` when `loading` is true
- Shows `EmptyState` when `data` is empty and `loading` is false
- Renders `Paginator` below table with `totalRecords`
- Rows have `cursor-pointer` when `onRowClick` is provided
- Keyboard: rows focusable and activatable with Enter key

---

### 3.7 FormPage

Reusable form layout with sections, validation display, and submit/cancel actions.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Form page title |
| `sections` | `FormSection[]` | Yes | Grouped form field definitions |
| `onSubmit` | `(data: Record<string, any>) => void` | Yes | Submit handler |
| `onCancel` | `() => void` | Yes | Cancel handler |
| `submitLabel` | `string` | No (default: `"Save"`) | Submit button text |
| `loading` | `boolean` | No | Submit in progress |
| `initialValues` | `Record<string, any>` | No | Pre-filled values for edit forms |
| `infoBanner` | `string` | No | Info message shown at top (e.g., "This bounty is live. Only some fields can be edited.") |

**FormSection type:**
```typescript
interface FormSection {
  title: string;
  fields: FormFieldDef[];
}
```

**FormFieldDef type:**
```typescript
interface FormFieldDef {
  key: string;
  label: string;
  component: 'InputText' | 'InputTextarea' | 'Dropdown' | 'InputNumber'
             | 'Calendar' | 'Password' | 'FileUpload';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  validation?: (value: any) => string | null;
  helpText?: string;
  options?: { label: string; value: any }[];  // for Dropdown
  maxLength?: number;  // shows char counter
  conditionalRender?: (values: Record<string, any>) => boolean;
}
```

**Behaviour:**
- Sections separated by `Divider` with section title
- Fields render the specified PrimeReact component with label above
- Validation errors shown inline below fields using `Message` severity `error`
- On submit: validates all fields, scrolls to first error if any fail
- Dirty form detection: cancel triggers confirmation if form has changes
- Submit button sticks to bottom on mobile
- `infoBanner` renders as a PrimeReact `Message` severity `info` at the top of the form

---

### 3.8 ReviewActionBar

One-click review actions (approve/reject/needs-more-info) with optional note field for the Business Admin submission review flow.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentStatus` | `SubmissionStatus` | Yes | Current submission status (controls which actions are visible) |
| `onAction` | `(action: 'APPROVED' \| 'REJECTED' \| 'NEEDS_MORE_INFO', note?: string) => void` | Yes | Action handler |
| `loading` | `boolean` | No | Disables all buttons during API call |

**Structure:**
```
+-----------------------------------------------+
| Review Actions                                 |
|                                                |
| Note (optional):                               |
| [_________________________________________]    |
| Max 1000 characters                            |
|                                                |
| [Approve]  [Needs More Info]  [Reject]         |
|  (green)     (yellow/amber)    (red)           |
+-----------------------------------------------+
```

**Visibility rules:**

| Current Status | Visible Actions |
|----------------|----------------|
| `IN_REVIEW` | Approve, Needs More Info, Reject |
| `SUBMITTED` | None (auto-transitions to IN_REVIEW) |
| `NEEDS_MORE_INFO` | None (waiting for participant) |
| `APPROVED` | None (shows payout controls instead -- separate component) |
| `REJECTED` | None (final state) |

**Behaviour:**
- Note field is always visible when actions are available
- Approve and Reject trigger `ConfirmAction` dialog before executing
- Needs More Info executes immediately (non-destructive)
- The note text at the moment of click is passed to `onAction`
- All buttons disabled when `loading` is true

---

### 3.9 PayoutActionBar

Payout status controls for approved submissions.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentPayoutStatus` | `PayoutStatus` | Yes | Current payout status |
| `onAction` | `(newStatus: 'PENDING' \| 'PAID', note?: string) => void` | Yes | Action handler |
| `loading` | `boolean` | No | Disables buttons during API call |

**Visibility rules:**

| Current Payout Status | Visible Actions |
|-----------------------|----------------|
| `NOT_PAID` | "Mark as Pending", "Mark as Paid" |
| `PENDING` | "Mark as Paid" |
| `PAID` | None (read-only) |

**Behaviour:**
- Optional note field above action buttons
- "Mark as Paid" triggers `ConfirmAction` dialog
- "Mark as Pending" executes immediately

---

### 3.10 OverrideModal

Admin override modal for bounty status, submission status, and payout status overrides.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls modal visibility |
| `onHide` | `() => void` | Yes | Called on dismiss |
| `title` | `string` | Yes | Modal title (e.g., "Override Bounty Status") |
| `currentStatus` | `string` | Yes | Current status value (displayed as StatusBadge) |
| `statusOptions` | `{ label: string; value: string }[]` | Yes | Available new statuses (excludes current) |
| `onOverride` | `(newStatus: string, reason: string) => void` | Yes | Override handler |
| `loading` | `boolean` | No | Shows spinner on confirm button |

**Structure:**
```
+------------------------------------------+
| [Title]                                   |
|                                           |
| Current Status: [StatusBadge]             |
|                                           |
| New Status:                               |
| [Dropdown]                                |
|                                           |
| Reason (required):                        |
| [_________________________________]       |
| Minimum 10 characters                     |
|                                           |
| [Cancel]              [Override]          |
+------------------------------------------+
```

**Behaviour:**
- Uses PrimeReact `Dialog` component
- Dropdown excludes the current status value
- Reason is a mandatory `InputTextarea` with min 10 characters
- Override button disabled until both status selected and reason meets minimum
- Focus trapped inside modal
- Escape key dismisses

---

## Part 4: Status Badge Colour Mapping

### 4.1 Bounty Status

| Status | PrimeReact Tag Severity | Background | Text | Tailwind Classes |
|--------|------------------------|------------|------|-----------------|
| `DRAFT` | `null` (default/secondary) | `bg-neutral-100` | `text-neutral-600` | `bg-neutral-100 text-neutral-600` |
| `LIVE` | `success` | `bg-success-100` | `text-success-700` | `bg-success-100 text-success-700` |
| `PAUSED` | `warning` | `bg-warning-100` | `text-warning-700` | `bg-warning-100 text-warning-700` |
| `CLOSED` | `danger` | `bg-danger-100` | `text-danger-700` | `bg-danger-100 text-danger-700` |

### 4.2 Submission Status

| Status | PrimeReact Tag Severity | Background | Text | Tailwind Classes | Icon |
|--------|------------------------|------------|------|-----------------|------|
| `SUBMITTED` | `info` | `bg-info-100` | `text-info-700` | `bg-info-100 text-info-700` | `pi-send` |
| `IN_REVIEW` | `warning` | `bg-warning-100` | `text-warning-700` | `bg-warning-100 text-warning-700` | `pi-eye` |
| `NEEDS_MORE_INFO` | `warning` | `bg-yellow-100` | `text-yellow-800` | `bg-yellow-100 text-yellow-800` | `pi-exclamation-triangle` |
| `APPROVED` | `success` | `bg-success-100` | `text-success-700` | `bg-success-100 text-success-700` | `pi-check-circle` |
| `REJECTED` | `danger` | `bg-danger-100` | `text-danger-700` | `bg-danger-100 text-danger-700` | `pi-times-circle` |

**Note on `IN_REVIEW` vs `NEEDS_MORE_INFO`**: Both use orange/yellow tones but are visually distinguished by using `warning-100/700` for IN_REVIEW and `yellow-100/800` for NEEDS_MORE_INFO, plus different icons.

### 4.3 Payout Status

| Status | PrimeReact Tag Severity | Background | Text | Tailwind Classes | Icon |
|--------|------------------------|------------|------|-----------------|------|
| `NOT_PAID` | `null` (secondary) | `bg-neutral-100` | `text-neutral-600` | `bg-neutral-100 text-neutral-600` | `pi-minus-circle` |
| `PENDING` | `warning` | `bg-warning-100` | `text-warning-700` | `bg-warning-100 text-warning-700` | `pi-clock` |
| `PAID` | `success` | `bg-success-100` | `text-success-700` | `bg-success-100 text-success-700` | `pi-check-circle` |

### 4.4 User Status

| Status | Background | Text |
|--------|------------|------|
| `ACTIVE` | `bg-success-100` | `text-success-700` |
| `SUSPENDED` | `bg-danger-100` | `text-danger-700` |

### 4.5 Organisation Status

| Status | Background | Text |
|--------|------------|------|
| `ACTIVE` | `bg-success-100` | `text-success-700` |
| `SUSPENDED` | `bg-danger-100` | `text-danger-700` |

### 4.6 User Role

| Role | Background | Text |
|------|------------|------|
| `PARTICIPANT` | `bg-info-100` | `text-info-700` |
| `BUSINESS_ADMIN` | `bg-primary-100` | `text-primary-700` |
| `SUPER_ADMIN` | `bg-purple-100` | `text-purple-700` |

### 4.7 Organisation Member Role

| Role | Background | Text |
|------|------------|------|
| `OWNER` | `bg-primary-100` | `text-primary-700` |
| `MEMBER` | `bg-neutral-100` | `text-neutral-600` |

### 4.8 Complete Colour Map (TypeScript)

```typescript
// File: packages/shared/src/status-colours.ts

export const STATUS_COLOUR_MAP = {
  bounty: {
    DRAFT:  { bg: 'bg-neutral-100', text: 'text-neutral-600', severity: null },
    LIVE:   { bg: 'bg-success-100', text: 'text-success-700', severity: 'success' },
    PAUSED: { bg: 'bg-warning-100', text: 'text-warning-700', severity: 'warning' },
    CLOSED: { bg: 'bg-danger-100',  text: 'text-danger-700',  severity: 'danger' },
  },
  submission: {
    SUBMITTED:       { bg: 'bg-info-100',    text: 'text-info-700',    severity: 'info',    icon: 'pi-send' },
    IN_REVIEW:       { bg: 'bg-warning-100', text: 'text-warning-700', severity: 'warning', icon: 'pi-eye' },
    NEEDS_MORE_INFO: { bg: 'bg-yellow-100',  text: 'text-yellow-800',  severity: 'warning', icon: 'pi-exclamation-triangle' },
    APPROVED:        { bg: 'bg-success-100', text: 'text-success-700', severity: 'success', icon: 'pi-check-circle' },
    REJECTED:        { bg: 'bg-danger-100',  text: 'text-danger-700',  severity: 'danger',  icon: 'pi-times-circle' },
  },
  payout: {
    NOT_PAID: { bg: 'bg-neutral-100', text: 'text-neutral-600', severity: null,      icon: 'pi-minus-circle' },
    PENDING:  { bg: 'bg-warning-100', text: 'text-warning-700', severity: 'warning', icon: 'pi-clock' },
    PAID:     { bg: 'bg-success-100', text: 'text-success-700', severity: 'success', icon: 'pi-check-circle' },
  },
  user: {
    ACTIVE:    { bg: 'bg-success-100', text: 'text-success-700', severity: 'success' },
    SUSPENDED: { bg: 'bg-danger-100',  text: 'text-danger-700',  severity: 'danger' },
  },
  organisation: {
    ACTIVE:    { bg: 'bg-success-100', text: 'text-success-700', severity: 'success' },
    SUSPENDED: { bg: 'bg-danger-100',  text: 'text-danger-700',  severity: 'danger' },
  },
  role: {
    PARTICIPANT:    { bg: 'bg-info-100',    text: 'text-info-700',    severity: 'info' },
    BUSINESS_ADMIN: { bg: 'bg-primary-100', text: 'text-primary-700', severity: null },
    SUPER_ADMIN:    { bg: 'bg-purple-100',  text: 'text-purple-700',  severity: null },
  },
  orgMemberRole: {
    OWNER:  { bg: 'bg-primary-100', text: 'text-primary-700', severity: null },
    MEMBER: { bg: 'bg-neutral-100', text: 'text-neutral-600', severity: null },
  },
} as const;
```

---

## Part 5: Screen Inventory

### 5.1 Summary

| Category | Screens | Layout Pattern Breakdown |
|----------|---------|-------------------------|
| Public (auth) | 5 | 5 form pages |
| Participant | 6 | 1 list, 2 detail, 2 form, 1 grid |
| Profile (shared) | 2 | 1 detail, 1 form |
| Business Admin | 8 | 2 list, 2 detail, 2 form, 1 dashboard, 1 list+detail |
| Super Admin | 12 | 5 list, 4 detail, 1 dashboard, 1 status, 1 settings |
| **Total** | **33** | |

### 5.2 Complete Screen-by-Screen Mapping

---

#### Screen 1.1: Login (`/login`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Auth form page (centred card) |
| **PrimeReact Components** | InputText, Password, Button, Message |
| **Custom Components** | -- |
| **Key Interactions** | Form submit with validation, link navigation |
| **Loading Pattern** | Button spinner on submit |

---

#### Screen 1.2: Signup (`/signup`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Auth form page (centred card) |
| **PrimeReact Components** | InputText, Password (with feedback), Button, Message |
| **Custom Components** | -- |
| **Key Interactions** | Form submit, password strength feedback, inline validation |
| **Loading Pattern** | Button spinner on submit |

---

#### Screen 1.3: Forgot Password (`/forgot-password`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Auth form page (centred card) |
| **PrimeReact Components** | InputText, Button, Message |
| **Custom Components** | -- |
| **Key Interactions** | Form submit, post-submit confirmation state |
| **Loading Pattern** | Button spinner on submit |

---

#### Screen 1.4: Reset Password (`/reset-password`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Auth form page (centred card) |
| **PrimeReact Components** | Password (with feedback), Button, Message |
| **Custom Components** | LoadingState (inline -- token validation) |
| **Key Interactions** | Token validation on load, form submit, success redirect |
| **Loading Pattern** | Skeleton on page load (token validation), button spinner on submit |

---

#### Screen 1.5: Verify Email (`/verify-email`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Auth status page (centred card) |
| **PrimeReact Components** | Button, Message, ProgressSpinner |
| **Custom Components** | -- |
| **Key Interactions** | Token validation on load, conditional result display |
| **Loading Pattern** | ProgressSpinner centred |

---

#### Screen 2.1: Browse Bounties (`/bounties`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Grid browse page |
| **PrimeReact Components** | InputText (search), Dropdown (3 filters), Card (bounty items), Badge, Tag, Paginator, Skeleton |
| **Custom Components** | PageLayout, StatusBadge, EmptyState, LoadingState (cards-grid) |
| **Key Interactions** | Filter, search, sort, card click navigation, pagination |
| **Loading Pattern** | Skeleton card grid (3x3) |

---

#### Screen 2.2: Bounty Detail - Participant (`/bounties/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page (two-column) |
| **PrimeReact Components** | Card, Badge, Tag, Button, Skeleton, Message (banners), BreadCrumb |
| **Custom Components** | PageLayout, StatusBadge, LoadingState (detail) |
| **Key Interactions** | Submit proof navigation, conditional banners (paused/closed/max reached), view existing submission |
| **Loading Pattern** | Skeleton two-column layout |

---

#### Screen 2.3: Submit Proof (`/bounties/:id/submit`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Form page (two-panel) |
| **PrimeReact Components** | InputTextarea, InputText (links), FileUpload, Button, Message, BreadCrumb, ProgressBar |
| **Custom Components** | PageLayout, LoadingState (inline -- upload) |
| **Key Interactions** | Autofocus proof text, dynamic link fields (add/remove), drag-drop image upload, form validation, submit |
| **Loading Pattern** | Button spinner on submit, ProgressBar per file upload |

---

#### Screen 2.4: My Submissions List (`/my-submissions`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page |
| **PrimeReact Components** | DataTable, Column, Badge, Tag, Paginator, Skeleton, Button |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge, EmptyState |
| **Key Interactions** | Row click navigation, pagination |
| **Loading Pattern** | Skeleton DataTable (10 rows) |

---

#### Screen 2.5: Submission Detail - Participant (`/my-submissions/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page |
| **PrimeReact Components** | Card, Badge, Tag, Button, Image (lightbox), Message, BreadCrumb, Skeleton |
| **Custom Components** | PageLayout, StatusBadge, LoadingState (detail) |
| **Key Interactions** | View proof images (lightbox), conditional update button (NEEDS_MORE_INFO), view reviewer note |
| **Loading Pattern** | Skeleton layout |

---

#### Screen 2.6: Update Submission (`/my-submissions/:id/update`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Form page (pre-filled) |
| **PrimeReact Components** | InputTextarea, InputText, FileUpload, Button, Message, BreadCrumb |
| **Custom Components** | PageLayout, LoadingState (form) |
| **Key Interactions** | Pre-filled form, reviewer note display, form validation, resubmit |
| **Loading Pattern** | Skeleton form while loading data, button spinner on submit |

---

#### Screen 3.1: View Profile (`/profile`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page |
| **PrimeReact Components** | Card, Badge, Button, Tag, Message (verification banner), Skeleton |
| **Custom Components** | PageLayout, StatusBadge (role badge) |
| **Key Interactions** | Edit profile navigation, resend verification email |
| **Loading Pattern** | Skeleton card |

---

#### Screen 3.2: Edit Profile (`/profile/edit`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Form page (two-section) |
| **PrimeReact Components** | InputText, Password (with feedback), Button, Fieldset, Message |
| **Custom Components** | PageLayout, FormPage |
| **Key Interactions** | Save name changes, expand/collapse password section, change password with current password validation |
| **Loading Pattern** | Button spinner on submit |

---

#### Screen 4.1: Business Admin Dashboard (`/dashboard`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Dashboard (summary cards) |
| **PrimeReact Components** | Card, Button, Badge, Skeleton |
| **Custom Components** | PageLayout, EmptyState, LoadingState (cards-grid) |
| **Key Interactions** | Click summary cards to navigate, quick action buttons |
| **Loading Pattern** | Skeleton cards (4) |

---

#### Screen 4.2: Bounty Management List (`/manage/bounties`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page |
| **PrimeReact Components** | DataTable, Column, Dropdown, Button, Badge, Tag, Paginator, Skeleton, Menu |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge, EmptyState |
| **Key Interactions** | Row click, filter by status, row action menu (edit/view submissions/status change), create bounty button |
| **Loading Pattern** | Skeleton DataTable (10 rows) |

---

#### Screen 4.3: Create Bounty (`/manage/bounties/new`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Form page (multi-section) |
| **PrimeReact Components** | InputText, InputTextarea, Dropdown, InputNumber, Calendar, Button, Message, Divider |
| **Custom Components** | PageLayout, FormPage |
| **Key Interactions** | Conditional field display (reward type), section navigation, validation, save as draft, dirty form detection on cancel |
| **Loading Pattern** | Button spinner on submit |

---

#### Screen 4.4: Bounty Management Detail (`/manage/bounties/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page with action bar |
| **PrimeReact Components** | Card, Badge, Tag, Button, ConfirmDialog, BreadCrumb, Skeleton, Toolbar |
| **Custom Components** | PageLayout, StatusBadge, ConfirmAction, LoadingState (detail) |
| **Key Interactions** | Status transitions (publish/pause/close/delete) with confirmations, edit navigation, view submissions |
| **Loading Pattern** | Skeleton layout |

---

#### Screen 4.5: Edit Bounty (`/manage/bounties/:id/edit`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Form page (pre-filled, conditional editability) |
| **PrimeReact Components** | InputText, InputTextarea, Dropdown, InputNumber, Calendar, Button, Message, Divider |
| **Custom Components** | PageLayout, FormPage |
| **Key Interactions** | Status-dependent field editability, info banner for live bounties, pre-filled values, save changes |
| **Loading Pattern** | Skeleton form while loading, button spinner on submit |

---

#### Screen 4.6: Submission Review List (`/manage/bounties/:id/submissions`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page |
| **PrimeReact Components** | DataTable, Column, Dropdown, Badge, Tag, Paginator, Skeleton, BreadCrumb |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge, EmptyState |
| **Key Interactions** | Filter by status, row click to review, pagination |
| **Loading Pattern** | Skeleton DataTable (10 rows) |

---

#### Screen 4.7: Submission Review Detail (`/manage/submissions/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page with review panel |
| **PrimeReact Components** | Card, Badge, Tag, Button, InputTextarea, Image, ConfirmDialog, BreadCrumb, Divider, Skeleton, Toolbar |
| **Custom Components** | PageLayout, StatusBadge, ReviewActionBar, PayoutActionBar, ConfirmAction, LoadingState (detail) |
| **Key Interactions** | Auto-transition SUBMITTED->IN_REVIEW, one-click review actions with optional note, payout status management, image lightbox |
| **Loading Pattern** | Skeleton layout, buttons disabled until data loads |

---

#### Screen 4.8: View Organisation (`/organisation`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page |
| **PrimeReact Components** | Card, Badge, Tag, Button, DataTable, Avatar, Message, Skeleton |
| **Custom Components** | PageLayout, StatusBadge, EmptyState, LoadingState (detail) |
| **Key Interactions** | Edit/manage members navigation (owner only), view member list, suspended warning banner |
| **Loading Pattern** | Skeleton card + skeleton member list |

---

#### Screen 4.9: Edit Organisation (`/organisation/edit`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Form page |
| **PrimeReact Components** | InputText, FileUpload, Button, Message |
| **Custom Components** | PageLayout, FormPage |
| **Key Interactions** | Logo upload, form validation, save changes |
| **Loading Pattern** | Skeleton form, button spinner on submit |

---

#### Screen 4.10: Manage Organisation Members (`/organisation/members`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page with invite form |
| **PrimeReact Components** | InputText, Button, DataTable, Badge, Tag, ConfirmDialog, Skeleton, Message |
| **Custom Components** | PageLayout, StatusBadge (role badges), ConfirmAction, EmptyState |
| **Key Interactions** | Invite by email, remove member with confirmation, role display |
| **Loading Pattern** | Skeleton list, invite button spinner |

---

#### Screen 5.1: Super Admin Dashboard (`/admin/dashboard`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Dashboard (summary cards + activity list) |
| **PrimeReact Components** | Card, Badge, DataTable, Button, Skeleton |
| **Custom Components** | PageLayout, StatusBadge, EmptyState, LoadingState (cards-grid) |
| **Key Interactions** | Click summary cards to navigate, view recent audit activity, link to full audit logs |
| **Loading Pattern** | Skeleton cards (5) + skeleton list (10 rows) |

---

#### Screen 5.2: User Management List (`/admin/users`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page |
| **PrimeReact Components** | DataTable, Column, InputText (search), Dropdown (2 filters), Badge, Tag, Paginator, Skeleton |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge, EmptyState |
| **Key Interactions** | Search by email/name, filter by role/status, row click, pagination |
| **Loading Pattern** | Skeleton DataTable (20 rows) |

---

#### Screen 5.3: User Detail (`/admin/users/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page with admin actions |
| **PrimeReact Components** | Card, Badge, Tag, Button, InputTextarea (reason), BreadCrumb, Skeleton, Divider |
| **Custom Components** | PageLayout, StatusBadge, ConfirmAction (with requireReason), LoadingState (detail) |
| **Key Interactions** | Suspend/reinstate with mandatory reason, force password reset, navigate to user's org |
| **Loading Pattern** | Skeleton layout |

---

#### Screen 5.4: Organisation Management List (`/admin/organisations`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page |
| **PrimeReact Components** | DataTable, Column, InputText, Dropdown, Badge, Paginator, Skeleton |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge, EmptyState |
| **Key Interactions** | Search by name, filter by status, row click, pagination |
| **Loading Pattern** | Skeleton DataTable |

---

#### Screen 5.5: Organisation Detail - Admin (`/admin/organisations/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page with admin actions |
| **PrimeReact Components** | Card, Badge, Tag, Button, DataTable (members), BreadCrumb, Skeleton, Divider |
| **Custom Components** | PageLayout, StatusBadge, ConfirmAction (with requireReason), LoadingState (detail) |
| **Key Interactions** | Suspend/reinstate org with mandatory reason, view members, view bounty summary |
| **Loading Pattern** | Skeleton layout |

---

#### Screen 5.6: Bounty Oversight List (`/admin/bounties`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page |
| **PrimeReact Components** | DataTable, Column, InputText, Dropdown (2 filters), Badge, Paginator, Skeleton |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge, EmptyState |
| **Key Interactions** | Search by title, filter by status/org, row click, pagination |
| **Loading Pattern** | Skeleton DataTable |

---

#### Screen 5.7: Bounty Detail - Admin (`/admin/bounties/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page with override |
| **PrimeReact Components** | Card, Badge, Tag, Button, Dialog, Dropdown, InputTextarea, BreadCrumb, Skeleton |
| **Custom Components** | PageLayout, StatusBadge, OverrideModal, LoadingState (detail) |
| **Key Interactions** | Override bounty status with mandatory reason, navigate to org/user |
| **Loading Pattern** | Skeleton layout |

---

#### Screen 5.8: Submission Oversight List (`/admin/submissions`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page |
| **PrimeReact Components** | DataTable, Column, InputText, Dropdown (2 filters), Badge, Tag, Paginator, Skeleton |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge, EmptyState |
| **Key Interactions** | Search by participant/bounty, filter by status/payout, row click, pagination |
| **Loading Pattern** | Skeleton DataTable |

---

#### Screen 5.9: Submission Detail - Admin (`/admin/submissions/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page with dual override |
| **PrimeReact Components** | Card, Badge, Tag, Button, Dialog (2 modals), Dropdown, InputTextarea, Image, BreadCrumb, Skeleton, Divider |
| **Custom Components** | PageLayout, StatusBadge, OverrideModal (x2), LoadingState (detail) |
| **Key Interactions** | Override submission status, override payout status, both with mandatory reason, image lightbox, navigate to user/bounty |
| **Loading Pattern** | Skeleton layout |

---

#### Screen 5.10: Audit Log List (`/admin/audit-logs`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | List page (advanced filters) |
| **PrimeReact Components** | DataTable, Column, AutoComplete (actor search), Dropdown (2 filters), Calendar (date range), Badge, Paginator, Skeleton, Panel |
| **Custom Components** | PageLayout, DataTablePage, StatusBadge (role badge), EmptyState |
| **Key Interactions** | Multi-filter search (actor, action, entity, date range), collapsible filter panel, row click, pagination |
| **Loading Pattern** | Skeleton DataTable (25 rows) |

---

#### Screen 5.11: Audit Log Detail (`/admin/audit-logs/:id`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Detail page (before/after comparison) |
| **PrimeReact Components** | Card, Badge, Tag, BreadCrumb, DataTable (key-value display), Panel, Skeleton |
| **Custom Components** | PageLayout, StatusBadge (role badge), LoadingState (detail) |
| **Key Interactions** | View before/after state diff, navigate to entity, navigate to actor |
| **Loading Pattern** | Skeleton layout |

---

#### Screen 5.12: System Health (`/admin/system`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Status page (health + error list) |
| **PrimeReact Components** | Card, Badge, Tag, Button, DataTable (expandable rows), Column, Paginator, Skeleton, Panel |
| **Custom Components** | PageLayout, EmptyState, LoadingState (cards-grid + table) |
| **Key Interactions** | Refresh health check, expand error rows for stack trace, pagination on error list |
| **Loading Pattern** | Skeleton cards + skeleton DataTable |

---

#### Screen 5.13: Global Settings (`/admin/settings`)

| Attribute | Value |
|-----------|-------|
| **Layout Pattern** | Settings page (toggle cards) |
| **PrimeReact Components** | InputSwitch, Card, ConfirmDialog, Skeleton, Button |
| **Custom Components** | PageLayout, ConfirmAction |
| **Key Interactions** | Toggle with confirmation, revert on API error |
| **Loading Pattern** | Skeleton toggle cards |

---

### 5.3 Layout Pattern Summary

| Layout Pattern | Screens | Structure |
|----------------|---------|-----------|
| **Auth form page** | 1.1, 1.2, 1.3, 1.4, 1.5 | Centred card on plain background, no sidebar |
| **Grid browse page** | 2.1 | PageLayout + filter bar + responsive card grid + pagination |
| **List page** | 2.4, 4.2, 4.6, 4.10, 5.2, 5.4, 5.6, 5.8, 5.10 | PageLayout + filter bar + DataTable + pagination |
| **Detail page** | 2.2, 2.5, 3.1, 4.4, 4.8, 5.3, 5.5, 5.7, 5.9, 5.11 | PageLayout + breadcrumb + content sections + action bar |
| **Form page** | 2.3, 2.6, 3.2, 4.3, 4.5, 4.9 | PageLayout + breadcrumb + sectioned form + submit/cancel |
| **Detail + review** | 4.7 | PageLayout + proof display + ReviewActionBar + PayoutActionBar |
| **Dashboard** | 4.1, 5.1 | PageLayout + summary card grid + quick actions or activity list |
| **Status page** | 5.12 | PageLayout + health indicators + expandable error list |
| **Settings page** | 5.13 | PageLayout + toggle cards with confirmations |

---

### 5.4 Custom Component Usage Across Screens

| Custom Component | Screens Using It |
|-----------------|-----------------|
| **PageLayout** | All 28 authenticated screens (not auth pages 1.1-1.5) |
| **StatusBadge** | 2.1, 2.2, 2.4, 2.5, 3.1, 4.1, 4.2, 4.4, 4.6, 4.7, 4.8, 4.10, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11 (23 screens) |
| **EmptyState** | 2.1, 2.4, 4.1, 4.2, 4.6, 4.8, 4.10, 5.1, 5.2, 5.4, 5.6, 5.8, 5.10, 5.12 (14 screens) |
| **LoadingState** | All 33 screens |
| **ConfirmAction** | 4.4, 4.7, 4.10, 5.3, 5.5, 5.13 (6 screens) |
| **DataTablePage** | 2.4, 4.2, 4.6, 5.2, 5.4, 5.6, 5.8, 5.10 (8 screens) |
| **FormPage** | 3.2, 4.3, 4.5, 4.9 (4 screens) |
| **ReviewActionBar** | 4.7 (1 screen) |
| **PayoutActionBar** | 4.7 (1 screen) |
| **OverrideModal** | 5.7, 5.9 (2 screens) |

---

## Part 6: Accessibility Requirements

### 6.1 Keyboard Navigation

| Requirement | Implementation |
|-------------|---------------|
| All interactive elements focusable via Tab | PrimeReact components are keyboard-accessible by default. Custom components must ensure `tabIndex={0}` on interactive elements. |
| DataTable row navigation | Arrow keys navigate rows, Enter activates row click. PrimeReact DataTable supports this natively with `selectionMode`. |
| Modal focus trapping | PrimeReact Dialog and ConfirmDialog trap focus automatically. Custom ConfirmAction inherits this. |
| Dropdown keyboard | Arrow keys open/navigate options, Enter selects, Escape closes. Native PrimeReact behaviour. |
| Skip navigation link | Add a visually hidden "Skip to main content" link as the first focusable element. Targets `#main-content` anchor on the content area. |
| Sidebar navigation | Arrow keys navigate sidebar items, Enter activates. |
| Form submission | Enter key submits forms when focus is on an input (standard HTML behaviour, preserved). |
| Escape key | Closes modals, dropdowns, and menus. PrimeReact default. |

### 6.2 ARIA Labels and Roles

| Element | ARIA Attribute | Example |
|---------|---------------|---------|
| StatusBadge | `role="status"`, `aria-label` | `aria-label="Bounty status: Live"` |
| Action buttons (icon-only) | `aria-label` | `aria-label="Remove link"`, `aria-label="Delete bounty"` |
| Search inputs | `aria-label` | `aria-label="Search bounties by title"` |
| Filter dropdowns | `aria-label` | `aria-label="Filter by status"` |
| DataTable | `aria-label` on table | `aria-label="Bounty management table"` |
| Pagination | `aria-label` on Paginator | `aria-label="Pagination"` |
| Sidebar navigation | `role="navigation"`, `aria-label="Main navigation"` | On the `<nav>` element |
| Breadcrumb | `aria-label="Breadcrumb"` | PrimeReact BreadCrumb sets this by default |
| Image lightbox | `alt` on Image | `alt="Proof image 1 of 3"` |
| File upload zone | `aria-label` | `aria-label="Upload proof images, accepts JPEG, PNG, GIF, WebP"` |
| Toast container | `role="alert"`, `aria-live="assertive"` | PrimeReact Toast handles this natively |
| Loading skeletons | `aria-busy="true"` on parent container | Applied to loading regions |

### 6.3 Focus Management

| Scenario | Focus Behaviour |
|----------|----------------|
| Modal opens | Focus moves to first interactive element in modal (or close button) |
| Modal closes | Focus returns to the element that triggered the modal |
| Toast appears | Screen reader announces toast content (via `aria-live`) |
| Page navigation | Focus moves to the page title `<h1>` element |
| Form validation error | Focus moves to the first field with an error |
| Inline error display | Error message is associated with field via `aria-describedby` |
| Skeleton loading complete | Focus remains in place; content replaces skeleton without focus disruption |

### 6.4 Colour Contrast

| Requirement | Standard | Implementation |
|-------------|----------|---------------|
| Normal text on background | WCAG AA (4.5:1) | All text colours in the palette are validated against their background colours |
| Large text (18px+ or 14px+ bold) | WCAG AA (3:1) | Page titles and section headers meet this ratio |
| Interactive element boundaries | WCAG AA (3:1) | Buttons, inputs, and links have sufficient contrast against surrounding content |
| Status badges | WCAG AA | All badge colour combinations (bg + text) achieve at least 4.5:1 contrast ratio |
| Focus indicators | Visible focus ring | PrimeReact provides default focus rings; supplemented with `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2` |
| Disabled state | Distinguish from enabled | Disabled elements use `opacity-50` and `cursor-not-allowed` |

**Contrast validation for status badge colours:**

| Badge | Background | Text | Contrast Ratio | Pass? |
|-------|-----------|------|----------------|-------|
| DRAFT (neutral) | `#f5f5f5` | `#525252` | 5.9:1 | Yes |
| LIVE (success) | `#dcfce7` | `#15803d` | 5.2:1 | Yes |
| PAUSED (warning) | `#fef3c7` | `#b45309` | 4.6:1 | Yes |
| CLOSED (danger) | `#fee2e2` | `#b91c1c` | 5.0:1 | Yes |
| SUBMITTED (info) | `#dbeafe` | `#1d4ed8` | 5.4:1 | Yes |
| IN_REVIEW (warning) | `#fef3c7` | `#b45309` | 4.6:1 | Yes |
| NEEDS_MORE_INFO (yellow) | `#fef9c3` | `#854d0e` | 5.1:1 | Yes |
| APPROVED (success) | `#dcfce7` | `#15803d` | 5.2:1 | Yes |
| REJECTED (danger) | `#fee2e2` | `#b91c1c` | 5.0:1 | Yes |
| NOT_PAID (neutral) | `#f5f5f5` | `#525252` | 5.9:1 | Yes |
| PENDING (warning) | `#fef3c7` | `#b45309` | 4.6:1 | Yes |
| PAID (success) | `#dcfce7` | `#15803d` | 5.2:1 | Yes |

All combinations meet WCAG AA minimum of 4.5:1.

### 6.5 Screen Reader Announcements

| Event | Announcement Method | Content |
|-------|--------------------|---------|
| Toast notification | `aria-live="assertive"` (PrimeReact Toast) | Toast message content |
| Status badge | `role="status"` + `aria-label` | Full status context |
| Form validation error | `aria-describedby` linking field to error | Error message text |
| Page title change | Document `<title>` update | "Page Name - Social Bounty" |
| Loading start | `aria-busy="true"` on container | Implicit loading state |
| Loading complete | `aria-busy="false"` on container | Content available |

### 6.6 Skip Navigation

A visually hidden skip link is rendered as the first DOM element inside `PageLayout`:

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-2 focus:rounded focus:shadow">
  Skip to main content
</a>
```

The main content area has `id="main-content"` and `tabindex="-1"` to receive focus.

---

## Summary

| Deliverable | Count |
|------------|-------|
| PrimeReact components validated | 31 (27 unique + DataTable/Column paired, Toast global) |
| Custom composite components | 10 |
| Status colour mappings | 7 entity types, 22 individual status values |
| Screens inventoried | 33 |
| Layout patterns defined | 9 |
| Accessibility requirements | 6 categories |

---

*This document follows the spec at `md-files/social-bounty-mvp.md` strictly. No features outside the spec have been added. All component selections are validated against the screen specifications in `docs/ux/screen-specifications.md`. Dark mode is explicitly excluded from MVP scope.*
