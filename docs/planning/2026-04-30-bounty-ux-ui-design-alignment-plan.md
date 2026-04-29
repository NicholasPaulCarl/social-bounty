# Bounty UX/UI Design Alignment Plan

**Date:** 2026-04-30
**Branch:** `bounty-ux-ui` (forked from `main` at `e6585d7` — post-PR-#69 merge)
**Trigger:** User reports the live UI doesn't match the design bundle. Direct quote: "the ui is design is not the same at all create the new components, bounties should be list view and not cards".

---

## Context

The user provided a Claude Design handoff bundle at `https://api.anthropic.com/v1/design/h/Q8L6tGB2OS86y2WvAQPKTA` (also extracted locally at `~/Downloads/Brand - Bounty Flow/`). The bundle's JSX is **bit-for-bit identical** to the bundle processed in the previous `/dev-team-lead` pass — `diff -q -r` on `app/*.jsx` returns empty. The chat transcript is +92 lines (348 → 440), but those new lines are just the user asking for **standalone HTML exports** (`Save as standalone HTML: index.html` and `prototype.html`) — no functional design changes.

So the user is not handing me a NEW design — they're pointing at the SAME design and saying the live app doesn't match it. The previous Wave 1 polish closed 6 of the gaps; **5 substantial items remain deferred from that plan, plus 3 visual-style choices the user hasn't explicitly weighed in on**. This plan picks them up.

---

## Goals

1. Replace the bounty list's card-grid view with a **table** that mirrors the design's columns: Bounty (name + ID) · Category · Platforms · Status · Reward · Claims (with progress bar) · Ends · ⋯ menu.
2. Make **list view the default** (the design has no card variant for the bounty list).
3. Apply the deferred wizard polish from the previous plan: drag-to-reorder Step 2 instructions, sticky KPI sidebar on Step 4, per-slot upload progress on Step 5.
4. Optionally apply the design's visual-style choices on the hub (header, filter row, status filter) where they materially differ from current PrimeReact patterns.

## Non-goals

- **Removing the Quick Create cards.** The design has them — they stay (they shipped on PR #69). The user's "not cards" directive is specifically about the existing-bounties list below.
- **Backend DTO additions.** All columns the design needs are already on `BountyListItem` (`category`, `submissionCount`, `maxSubmissions`, `endDate`, `rewardValue`, `channels`, `status`). No API change required.
- **New Apify rules / new ledger work.** Anything that needs a backend ADR is out of scope; this is a UI alignment pass.
- **Pixel-perfect HTML reproduction.** The handoff README explicitly says "Match the visual output; don't copy the prototype's internal structure". Use PrimeReact + Tailwind + canonical design system. The HTML is inspiration.

## Acceptance criteria (verifiable per item)

The plan is accepted when:
- All Wave 1 items pass their acceptance checks under lead review.
- Web jest stays at **384+ passed** (current baseline, post-merge).
- API jest stays at **1375+ passed** (no backend change expected — only canary check).
- `next build --no-lint` clean.
- Visual QA on the dev server: walk the hub + 5-step wizard end-to-end and confirm the changes render correctly.

---

## Already shipped on `main` (PR #69 — do NOT redo)

From the design handoff bundle:
- ✓ 4 Quick Create cards with platform chips, "Quick start" eyebrow
- ✓ Three-dot ellipsis menu on list rows with Edit/View/Duplicate/Status/Delete
- ✓ Edit gate: hidden when non-DRAFT + has submissions (`getManageMenuPolicy`)
- ✓ 5-step wizard: Basics · Instructions & Metrics · Access & Requirements · Claim & Rewards · Document Share
- ✓ Stepper pills clickable for backward jumps; forward gated by `validateStep`
- ✓ 3-button Discard dialog (Keep editing · Save as draft · Discard)
- ✓ Auto-deactivate platform when last format unchecked
- ✓ TikTok video-only guard
- ✓ Step 1: title, description, platform select, format select, AI toggle, instructions, schedule, payout metrics
- ✓ Step 2: instruction builder (add/remove with placeholders), payout metrics, custom rules
- ✓ Step 3: Hunter access Open/Invite-only with hunter search, eligibility, post requirements; Location locked to "South Africa" with hint
- ✓ Step 4: Claim count, reward type/value, total = perClaim × claims (ADR 0013 multi-claim escrow)
- ✓ Step 5: Brand asset uploads up to 5 files / 20 MB
- ✓ "All bounties" eyebrow on the hub
- ✓ Auto-scroll on Next/Back

---

## Wave 1 — five parallel agents (independent files where possible)

### A. Default list view + drop the grid toggle

**Goal**: The design has no card-grid variant for the bounty list. Make `view = 'list'` the default and remove the grid/list toggle from `ManageHero` (or hide it). The existing card components (`BountyManageCard`, `BountyManageActions`) stay in the codebase but are no longer rendered from the dashboard.

**Files**:
- `apps/web/src/hooks/useManageFilters.ts` — `DEFAULT_FILTERS.view` from `'grid'` to `'list'`
- `apps/web/src/components/features/bounty/ManageHero.tsx` — drop the `viewMode` / `onViewChange` props (or hide the toggle UI behind a feature flag prop)
- `apps/web/src/app/business/bounties/page.tsx` — remove the `isGrid` branch; render `<BusinessBountyListView>` unconditionally; remove the unused `BountyManageCard` import

**Acceptance check**:
- Fresh visit to `/business/bounties` (no URL query) renders the list, not cards.
- No view-toggle button in the hero.
- `BountyManageCard` import is gone from `page.tsx` (but the component file stays — other consumers may use it).

**Effort**: S.

---

### B. List view table redesign — design's column set + visuals

**Goal**: Rework `BusinessBountyListView` to match the design's table structure (`/tmp/design-4/brand-bounty-flow/project/app/hub.jsx:96-141`). Columns:
1. **Bounty** — name (bold) + ID (mono, muted) stacked
2. **Category** — `bounty.category` text, muted
3. **Platforms** — small lucide-icon chips for each entry in `bounty.channels` (Camera/ThumbsUp/Video stand-ins per `ui-ds-apply` convention)
4. **Status** — badge with a colored dot indicator + label (LIVE/DRAFT/PAUSED/CLOSED)
5. **Reward** — `formatCurrency(bounty.rewardValue)` (existing helper if any, else inline)
6. **Claims** — mini progress bar showing `submissionCount / maxSubmissions` + the fraction text below in mono. Show `—` when `maxSubmissions == null`.
7. **Ends** — `bounty.endDate` formatted, mono, muted
8. **⋯ menu** — re-use the existing `BountyManageRowMenu` (Wave 1 of the prior pass already wired Duplicate)

**Files**:
- `apps/web/src/components/features/bounty/BusinessBountyListView.tsx` — rewrite columns. Use PrimeReact `<DataTable>` (already does); update `<Column>` `body` renderers per column above
- New helper if needed: `apps/web/src/components/features/bounty/PlatformChips.tsx` (reuse logic from `QuickCreateGrid`'s chip render)
- `apps/web/src/components/features/bounty/__tests__/BusinessBountyListView.test.ts` — new file: assert each column renders for a sample row + handles null-maxSubmissions case (claims column shows `—`)

**Out of scope**: persisted compact-density toggle (design has it as a tweak; defer).

**Acceptance check**:
- Each row renders all 8 columns with the right values for a representative bounty.
- Claims column shows a progress bar with `submissionCount / maxSubmissions` math; degrades to `—` when `maxSubmissions` is null.
- Status badge uses the existing `BountyStatus` enum + a per-status colour (success/warning/danger/secondary) with a colored dot prefix.
- Tests: new test file covers the 4 status colours + the null-maxSubmissions edge case.

**Effort**: M-L.

---

### C. Drag-to-reorder Step 2 instructions

**Goal**: Add drag handles + drag-and-drop reorder to the instruction builder in Step 2 (matches design's `wizard-steps-1-3.jsx:194-211`). Currently brand can add/remove instruction lines but not reorder.

**Files**:
- `apps/web/src/components/bounty-form/CreateBountyForm.tsx` — the `InstructionStepsBuilder` component (~lines 34-137). Replace the static `<div>` per row with a draggable row.
- `apps/web/src/components/bounty-form/useCreateBountyForm.ts` — add a new reducer case `REORDER_INSTRUCTION_STEP` that takes `{ from: number, to: number }` and reorders the `instructionSteps` array. Type the action in `types.ts`.
- `apps/web/src/components/bounty-form/__tests__/useCreateBountyForm.test.ts` — add a reducer test for `REORDER_INSTRUCTION_STEP` covering forward and backward moves.

**Implementation note**: Use HTML5 drag-and-drop API (matches the design's `draggable + onDragStart/onDragOver/onDragEnd` pattern). No new npm dep needed. Add a small drag handle (lucide `GripVertical` icon) on the left of each row.

**Acceptance check**:
- Each instruction row shows a drag handle on the left.
- Drag a row up/down → list reorders. Reducer test covers the action.
- No regression on add/remove (existing tests still green).

**Effort**: M.

---

### D. Sticky KPI sidebar on Step 4

**Goal**: Step 4 (Claim & Rewards) currently shows a right-aligned per-claim/total readout inline. The design uses a 2-column `calc-grid` layout: form on the left, sticky KPI panel on the right showing "Total bounty value" prominently with a breakdown (per-claim, claims, type). The panel uses `position: sticky; top: 84px;` so it stays visible as the user scrolls the form.

**Files**:
- `apps/web/src/components/bounty-form/RewardLinesSection.tsx` — restructure to 2-column layout. Left: existing form inputs (currency dropdown, reward rows, add reward button). Right: new `<RewardCalculator>` component with sticky positioning, prominent total, breakdown rows (Reward type, Claims, Per claim, Total).
- New file: `apps/web/src/components/bounty-form/RewardCalculator.tsx` — pure presentational component receiving `currency`, `perClaimRewardValue`, `totalRewardValue`, `maxSubmissions`, `rewardType`. Sticky on `lg:` breakpoint; full-width above the form on mobile (the layout collapses to 1 col below lg).
- `apps/web/src/components/bounty-form/CreateBountyForm.tsx` — pass `rewardType` derived from the first reward to `RewardLinesSection` (or compute inside the section).

**Acceptance check**:
- Step 4 renders as 2 cols on desktop (`lg:` and up), 1 col below lg.
- The right sidebar stays visible while scrolling through long content.
- Numbers update live as the brand changes the per-claim value or claim count.

**Effort**: M-L.

---

### E. File upload progress UX on Step 5

**Goal**: The design simulates per-slot upload progress (matches `wizard-steps-4-5.jsx:101-120` — `onFile` runs a tick loop bumping `progress` 0 → 100). Our current `BrandAssetsSection` shows after-the-fact upload status without per-slot progress feedback.

**Files**:
- `apps/web/src/components/bounty-form/BrandAssetsSection.tsx` — restructure to slot-based UI. Each staged file gets its own slot with: filename, file size, progress bar (0-100%), remove button. Initial empty state: "+ Add file" button. After a file is selected: show progress bar that fills in real-time during upload.
- The actual upload still goes through the existing client→API path. The progress bar can either:
  - (a) Use real progress events from `XMLHttpRequest` (replace the current `fetch` with `axios` or `XMLHttpRequest` for the upload — more accurate but extra change), OR
  - (b) Simulate progress from 0→100 over a fixed duration (matches the design's tick loop — simpler, still gives the brand a sense of "something is happening").
- Recommend (b) for this pass: simpler, no API contract change, matches the design literally.
- `apps/web/src/components/bounty-form/__tests__/BrandAssetsSection.test.ts` — if exists, add a test for slot rendering + progress simulation. If no test file, skip (per project convention — DS-system component tests are integration-only).

**Acceptance check**:
- Selecting a file shows a per-slot progress bar that fills 0 → 100% over ~1.5s.
- Slot stays in the UI after upload completes; brand can remove with an X button.
- Max 5 slots respected (existing).
- Max file size 20MB respected (existing).

**Effort**: M.

---

## Wave 2 — visual-style polish (deferred — confirm before dispatching)

These are subjective visual choices where the existing components work but render differently from the design. Surfacing for the user's call:

- **F. Header simplification** — Replace `ManageHero` (gradient + status counts + view toggle + CTA) with a simpler `<h1>Bounties</h1>` + subtitle + `+ New bounty` CTA on the right. The design's header is plainer and more typographic.
- **G. Filter row** — Currently `BrowseFilterBar` has search + reward filter + sort + view toggle. The design has search + segmented (All/Live/Drafts/Ended) + a single "Filter" button (which presumably opens a filter panel). Significant simplification.
- **H. Status filter visual: pills → segmented control** — `BountyStatusPills` (5 individual pill buttons) → segmented control (4 buttons in one rounded container). Pure visual swap.

These items are paused until the user explicitly approves Wave 2.

---

## Risks watching

1. **`BusinessBountyListView` is the only list view.** With Wave 1 A removing the grid view as the default, breakage of the list view becomes a P0. Wave 1 B's tests cover the column rendering, but I'd want a smoke test of the actual page render via dev server before merge.
2. **HTML5 drag-and-drop on touch devices.** Wave 1 C's `draggable` attribute doesn't work on iOS Safari. The design used `draggable` too — likely an accepted limitation. Flag for the user if they want a touch-friendly variant (would need a library like `dnd-kit`, that's a dep change which the cooldown skill says we don't make in a polish pass).
3. **Sticky positioning gotchas.** Wave 1 D's `position: sticky` requires the parent to have a known height; if the parent is `overflow: hidden` or has a smaller scroll container, sticky doesn't work. Test in the dev server.
4. **Upload progress simulation accuracy.** Wave 1 E's simulated progress may finish before the real upload completes (or after) — for slow networks or large files, the bar could hit 100% but the success toast lags. Documented limitation in the agent brief.

---

## Pre-dispatch checklist (lead — run once before Wave 1 dispatch)

- [ ] **Architect pass**: every Wave 1 item touches different files (A: hooks/page; B: BusinessBountyListView; C: CreateBountyForm InstructionStepsBuilder + reducer; D: RewardLinesSection + new RewardCalculator; E: BrandAssetsSection). Disjoint. ✓
- [ ] **PO pass**: every acceptance criterion verifiable from the diff or via dev-server walk-through. ✓
- [ ] **Senior-dev pass**: each item names files + the specific behaviour change. ✓
- [ ] **PM pass**: agents = `general-purpose` on Sonnet, isolated worktrees, self-contained briefs (project has no `.claude/agents/`). Per the previous Wave's orchestration learning, briefs MUST require `git log -1` verification post-commit so we don't end up with the worktree-vs-parent-branch ambiguity. ✓

---

## Approval gate

Reply with one of:

- **"go"** — dispatch all 5 Wave 1 agents in parallel.
- **"go + Wave 2"** — dispatch all 5 Wave 1 + queue Wave 2 (header / filter row / segmented status filter) for after Wave 1 lands cleanly.
- **"defer X"** — name items to drop from Wave 1 (e.g. "defer C, D, E" to ship the list-view headline first and pick up wizard polish later).
- **redirect** — re-shape the plan.
