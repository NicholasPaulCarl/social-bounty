# Payout Banking — `/settings/payouts`

**Route path:** `/settings/payouts`
**File:** `apps/web/src/app/(participant)/settings/payouts/page.tsx`
**Role:** Any authenticated role (hunter-centric; API scopes to user).
**Access:** `AuthGuard` via participant layout.
**Nav entry:** Sidebar Settings → Payouts.
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`, `claude.md` §4 Financial Non-Negotiables, `docs/adr/0011-tradesafe-unified-rail.md` (canonical payment spec). (The historical `DevStitchPayments` skill is no longer the SA bank list source post-cutover.)

## Purpose
Capture/upsert the hunter's banking details (Stitch beneficiary) that payouts will settle into, and display payout history with retry-state indicators. <!-- historical -->

## Entry & exit
- **Reached from:** Sidebar Settings nav.
- **Links out to:** None (standalone).

## Data
- **React Query hooks:** `useMyPayouts()`, `useToast()`.
- **API endpoints called:** `POST /payouts/beneficiaries/mine` (via `payoutsApi.upsertMyBeneficiary`), `GET /payouts/mine`.
- **URL params:** None.
- **Search params:** None.

## UI structure
- `PageHeader` "Payout banking — where we send your cleared earnings".
- Beneficiary form Card:
  - Copy explaining clearance windows (free 72h, pro instant) + encryption-at-rest assurance.
  - Success `Message` after save.
  - Grid (2-col on md): Account holder name, Bank dropdown (15 SA banks), Account number (digits only, 6–20 char), Account type (Cheque/Savings).
  - Save button (disabled unless all fields valid).
- Payout history Card:
  - Header row with "Refresh" (RefreshCw icon) that calls `payouts.refetch()`.
  - DataTable (paginator, 20 rows): Status (colored `Tag` via `PAYOUT_STATUS_SEVERITY`), Amount (mono), Initiated, Last attempt, Attempts, Last error (truncated + hover tooltip), Stitch payout ID (mono, truncated). <!-- historical -->

## States
- **Loading:** `LoadingState type="table" rows={4} columns={6}`.
- **Empty:** `EmptyState` — Wallet icon + "No payouts yet."
- **Error:** `ErrorState` with retry.
- **Success:** "Banking details saved" toast + inline success message.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Save | `payoutsApi.upsertMyBeneficiary(form)` | Upserts beneficiary |
| Refresh | `payouts.refetch()` | Re-pulls payout list |

## Business rules
- **Financial Non-Negotiables (`claude.md` §4):** account number encrypted at rest (`BENEFICIARY_ENC_KEY`, 32-char min, gated by `PAYOUTS_ENABLED=true` — R29 env validation).
- **Kill switch + `PAYOUTS_ENABLED`:** outbound payouts are currently inert (`PAYOUTS_ENABLED=false` until TradeSafe live — ADR 0008/0009); the form saves the beneficiary regardless so it's ready once flipped.
- Validation: name >= 2 chars, bank selected, account number `\d{6,20}`, type set.
- Payouts run every 10 minutes against cleared earnings.
- SA banks list is historical — originally sourced from `.claude/skills/DevStitchPayments/SKILL.md`; post-cutover aligns with TradeSafe's `UniversalBranchCode` lookup.
- Account type options: CURRENT (Cheque) / SAVINGS.

## Edge cases
- Digits-only guard strips non-numeric input from account number as typed.
- Payout FAILED/RETRY_PENDING states rendered with error color + error message truncation.
- CANCELLED payout has no tag severity (renders as plain `Tag`).

## Tests
No colocated tests.

## Related files
- `@/lib/api/payouts`
- `@/hooks/usePayouts`
- Shared: `HunterPayoutRow`
- `@/components/common/LoadingState`, `ErrorState`, `EmptyState`

## Open questions / TODOs
- No explicit KYB/CIPC step here for hunters — assumes platform-level verification elsewhere.
- SA bank list is hard-coded; could move to shared + backend-verified list.
