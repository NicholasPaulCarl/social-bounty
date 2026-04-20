# Platform settings — `/admin/settings`

**Route path:** `/admin/settings`
**File:** `apps/web/src/app/admin/settings/page.tsx`
**Role:** SUPER_ADMIN
**Access:** `AuthGuard allowedRoles={[SUPER_ADMIN]}` via `admin/layout.tsx`
**Nav entry:** System → Settings
**Layout:** `apps/web/src/app/admin/layout.tsx`

**Refs:** `docs/architecture/sitemap.md`, CLAUDE.md (financial kill switch lives at `SystemSetting.financial.kill_switch.active` — NOT here), `docs/adr/0006-compensating-entries-bypass-kill-switch.md`.

## Purpose
Platform-wide feature toggles: User Signups + Submissions. Shows last-updated metadata. Kept intentionally narrow — other SystemSetting keys (kill switch, reconciliation cadence, etc.) are controlled from the finance admin surfaces.

## Entry & exit
- **Reached from:** admin sidebar → Settings.
- **Links out to:** none.

## Data
- **React Query hooks:** `useAdminSettings()`, `useUpdateSettings()`.
- **API endpoints called:** `GET /api/v1/admin/settings`, `PATCH /api/v1/admin/settings`.
- **URL params:** none.
- **Search params:** none.

## UI structure
- `PageHeader` title "Platform Settings" + subtitle "Configure platform-wide settings".
- Max-w-2xl column:
  - Inline error `<Message severity="error">` (form-level).
  - `glass-card` "Feature Toggles":
    - User Signups (label + "Allow new users to create accounts." subtitle + `InputSwitch`).
    - Submissions (border-top separator + label + "Allow Hunters to submit proof for bounties." + `InputSwitch`).
  - `glass-card` "Last Updated" (shown when `settings` loaded): Timestamp (formatted) + Updated By email (if present) with border-top.
  - Footer-right "Save settings" button (Save icon, loading state).

## States
- **Loading:** `LoadingState type="form"`.
- **Empty:** N/A (settings row always exists).
- **Error:** top-level `ErrorState` with `refetch()`; form-level `Message` on save failure.
- **Success:** form + last-updated card; toast "Settings saved." on save.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Save settings | `updateSettings.mutate({ signupsEnabled, submissionsEnabled })` | PATCH; toast; `refetch()`; AuditLog `UPDATE systemSetting` |

## Business rules
- RBAC: SUPER_ADMIN-only.
- **Audit log mandatory (Hard Rule #3)** — backend persists `UPDATE` with actor id.
- **Not destructive** per Hard Rule #6 — toggles are reversible and don't destroy data; no confirmation dialog. Toggling off Signups or Submissions during an incident is quick-recovery.
- **Scope of this page is limited** to the two feature toggles shown. The settings surfaced here are:
  - `signupsEnabled` — controls the public/join pages.
  - `submissionsEnabled` — pauses hunter submission creation (review + approval still work).
- **Kill switch is NOT here** — `SystemSetting.financial.kill_switch.active` lives on the finance admin surface (`/admin/finance`). CLAUDE.md notes a dead `FINANCIAL_KILL_SWITCH` env was removed because it was operator-misleading.
- No payment-provider / TradeSafe / kill-switch / reconciliation settings are editable from this page.

## Edge cases
- `settings.updatedBy` null (initial seed) — Last-updated-by block hidden.
- Saving both toggles simultaneously — single PATCH call.
- Race: two admins toggle the same setting concurrently — last write wins, both get audit entries, `refetch()` reflects actual state.

## Tests
Integration-only.

## Related files
- `apps/web/src/hooks/useAdmin.ts` — `useAdminSettings`, `useUpdateSettings`.
- `apps/api/src/modules/admin/admin.service.ts` — `getSettings` / `updateSettings`.
- `apps/api/src/modules/system-setting/` — SystemSetting backend (also backs the kill switch at a different key).

## Open questions / TODOs
- Add a "soft disable all mutations" operator shortcut (signupsEnabled=false + submissionsEnabled=false in a single click).
- Expose other SystemSetting keys carefully (currency defaults, plan-fee overrides) via admin-gated surfaces — they currently require Prisma seeding.
- No scheduled-change (e.g., "disable signups for 2 hours") — manual only.
