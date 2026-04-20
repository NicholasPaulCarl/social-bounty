# Brand KYB — `/business/brands/kyb`

**Route path:** `/business/brands/kyb`
**File:** `apps/web/src/app/business/brands/kyb/page.tsx`
**Role:** BUSINESS_ADMIN
**Access:** `AuthGuard allowedRoles={[BUSINESS_ADMIN]}` via `business/layout.tsx`
**Nav entry:** Sidebar — `businessSections.KYB` (per navigation.ts)
**Layout:** `apps/web/src/app/business/layout.tsx`

See `docs/architecture/sitemap.md` §4.

## Purpose
Submit KYB (Know Your Business) for the active brand. Scoped to `user.brandId` (single-brand path — not in `[id]` tree). KYB submission is one of the preconditions for going live with bounties and receiving payouts (TradeSafe beneficiary setup).

## Entry & exit
- **Reached from:** Sidebar nav.
- **Links out to:** none (stays on page after submit).

## Data
- **React Query hooks:** `useBrand(brandId)`, `useSubmitKyb(brandId)`.
- **API endpoints called:** `GET /api/v1/brands/:id`, `POST /api/v1/brands/:brandId/kyb`.
- **URL params:** none (uses `user.brandId`)
- **Search params:** none

## UI structure
- `PageHeader` — title + subtitle + breadcrumbs.
- Status panel (conditional):
  - PENDING: info banner with submission timestamp.
  - APPROVED: success banner with approval timestamp.
  - REJECTED: error banner with resubmit prompt.
- Submit form (card titled "Submit KYB Details") — rendered only when `canSubmit === true` (NOT_STARTED or REJECTED):
  - Registered Name* (maxLength 200).
  - Registration Number* (maxLength 100, CIPC / Companies House).
  - VAT Number (optional, maxLength 50).
  - Country* — 5-option ISO 3166-1 alpha-2 Dropdown (ZA / US / GB / NA / BW).
  - Contact Email* (regex-validated).
  - Documents Reference (optional, maxLength 500 — link to KYB folder).
- `ConfirmAction` — non-rollbackable gate before actually submitting (Hard Rule #6).

## States
- **No active brand:** warning `Message` — "No brand is selected. Create or switch to a brand to continue."
- **Loading:** `<LoadingState type="form" />`
- **Error:** `<ErrorState ... onRetry={refetch} />`
- **Status panels:** PENDING / APPROVED / REJECTED as above.
- **Form validation:** inline `formError` text (mirrors backend validators).
- **Submitting:** button spinner; confirm dialog open.
- **Success:** toast + status panel flips to PENDING on next fetch.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Submit KYB (or Resubmit KYB if REJECTED) | opens `ConfirmAction` → POST `/brands/:brandId/kyb` | Status NOT_STARTED/REJECTED → PENDING. |

## Business rules
- KYB state machine: NOT_STARTED → PENDING → APPROVED / REJECTED. PENDING locks edits until Super Admin reviews (confirm copy).
- Super Admin approves / rejects via `/admin/brands/{id}` (or the dedicated admin endpoint `POST /api/v1/brands/:brandId/kyb/approve` / `reject`).
- KYB approval is the prerequisite for outbound payouts (TradeSafe beneficiary linking).
- AuditLog written on submission + on approve/reject (Hard Rule #3).

## Edge cases
- REJECTED: `canSubmit` true → form shown for resubmit. Rejection reason not fetched here (CLAUDE.md note: "don't fetch audit log — just surface the status and ask them to resubmit").
- Country `length !== 2`: blocked client-side + server-side.
- Contact email invalid: regex check; no sync with brand.contactEmail.
- Concurrent submission: Hard Rule #6 confirm prevents the race, but not bulletproof.

## Tests
None colocated.

## Related files
- `hooks/useBrand.ts` (`useBrand`, `useSubmitKyb`)
- `hooks/useAuth.ts`
- Shared: `KybStatus`.
- `components/common/PageHeader.tsx`, `ConfirmAction.tsx`

## Open questions / TODOs
- Country list is hardcoded to ZA/US/GB/NA/BW — expansion requires code change (not admin-config).
- Rejected brand doesn't see the reason inline — admin must message via email / inbox.
