# Bounty Flow — Brief Reconciliation + Design Polish Plan

**Date:** 2026-04-29
**Branch:** `bounty-flow-refinement` (PR #69, currently 13 commits ahead of `main`)
**Trigger:** User reported "I don't see these updates" + provided two Claude Design handoff bundles for bounty-flow form inspiration.

---

## Push-back: framing the work

> The briefs you re-pasted are **already implemented on PR #69** (90% scope coverage). If you're looking at prod (`socialbounty.cash`) or `main`, that's why they're invisible — PR #69 has not been merged yet. The remaining 10% is a mix of (a) one functional gap in the brief that was never wired and (b) design polish from the handoff bundles.

This plan addresses the genuine gaps only. Items already shipped on PR #69 are listed in the "Out of scope — already shipped" section so future readers don't redo them.

---

## Goals

1. Close the **functional gap** in the brief: platform auto-deactivates when all formats are unchecked.
2. Apply **visual + interaction polish** from the Claude Design handoff bundles, **using PrimeReact + Tailwind + canonical design system** (no raw HTML/CSS adoption — the handoffs are inspiration, per the bundle README).
3. Keep PR #69 the single home for this work — fold polish in via additional commits, then merge.

## Non-goals

- Pixel-perfect reproduction of the design HTML (the briefs themselves say "stick to existing UI library").
- Re-architecting the wizard reducer (it's working).
- Anything requiring backend schema/DTO changes — defer to a follow-up.

## Acceptance criteria (verifiable per item)

Each work item below has its own acceptance criteria. The plan is accepted when:
- All Wave 1 items pass their acceptance checks under lead review.
- Web jest stays at **362+ passed** (baseline locked by previous cooldown).
- API jest stays at **1375+ passed** (baseline locked by post-rebase run).
- `next build --no-lint` clean (78 static pages).
- A 30-second visual QA pass through the wizard's 5 steps + dashboard hub via the dev server confirms no regressions.

---

## Already shipped on PR #69 (do NOT redo)

From the dashboard brief:
- ✓ 4 quick-create cards (Blank, Social Exposure, Check-Ins, Product Sales)
- ✓ Existing bounties list with search + status filter
- ✓ 25-per-page pagination (`PAGE_LIMIT = 25`)
- ✓ Three-dot ellipsis menu on list rows
- ✓ Edit hidden when `bounty.status !== DRAFT && submissionCount > 0` (`getManageMenuPolicy`)

From the wizard brief:
- ✓ 5 steps (Basics · Instructions & Metrics · Access & Requirements · Claim & Rewards · Document Share)
- ✓ Back/Next navigation, Save Draft at every step, Discard at every step
- ✓ Step 1: Bounty Name + Description, Platform Select (FB/IG/TikTok), Format Select per platform, Content Format (Photo/Video/Both), TikTok video-only guard, AI Content toggle
- ✓ Step 2: Instruction Builder (add/remove + demo placeholders), Custom Rules (capped per shared constants), Payout Metrics (min views/likes/comments)
- ✓ Step 3: Hunter Access Type (PUBLIC/CLOSED), Hunter Search/Select for invite-only, Min Followers, No Competing Brands days, Location, Brand Tag, Comment, Post Visibility / Duration, Multi-submission via maxSubmissions
- ✓ Step 4: Claim Count (`maxSubmissions`, required by validateFull post-cooldown), Reward Type (Cash/Product/Service/Other), Cash skips name input, Total = per-claim × claim count (ADR 0013)
- ✓ Step 5: Brand Assets upload (5 files, 20MB each per Wave C)

---

## Wave 1 — six parallel agents

All six items are **independent**: each touches different files, no item depends on another's output. Dispatch in a single tool-use block; subagents run on Sonnet.

### A. Auto-deactivate platform when all formats unchecked

**Goal**: When the brand unchecks the last format on a platform tile, drop the platform entirely from `state.channels`. Matches Step 1 design contract (`wizard-steps-1-3.jsx:50` — `if (list.length === 0) delete next[pid]`).

**Files**:
- `apps/web/src/components/bounty-form/useCreateBountyForm.ts` — reducer `case 'TOGGLE_FORMAT'` (~line 71-84)
- `apps/web/src/components/bounty-form/__tests__/useCreateBountyForm.test.ts` — add a "removes channel when last format unchecked" test

**Output artefact**: 1 modified reducer case (3-line change), 1 new test (~10 lines). Single conventional commit.

**Acceptance check**:
- Toggle reducer: dispatching `TOGGLE_FORMAT` that removes the last format from channel `INSTAGRAM` results in `state.channels.INSTAGRAM` being `undefined` (not `[]`).
- New test passes; existing 362 tests stay green.

**Effort**: S.

---

### B. Quick Create cards — platform chips

**Goal**: Beneath the title + description on Social Exposure, Check-Ins, and Product Sales cards, render a small row of platform icon chips (matching the design's `qc-platforms` element). Blank card stays plain.

**Files**:
- `apps/web/src/components/bounty-form/bounty-presets.ts` — extend `BountyPreset` interface with an explicit `platforms?: SocialChannel[]` field (or derive from existing `getPresetFormState(id).channels` keys; the explicit field is cleaner).
- `apps/web/src/components/features/bounty/QuickCreateGrid.tsx` — render chip row when `platforms` is non-empty.
- `apps/web/src/components/bounty-form/__tests__/bounty-presets.test.ts` — assert each non-blank preset has the expected platform list.

**Constraints (per CLAUDE.md `ui-ds-apply`)**: use Lucide stand-ins for social brand marks — `Camera` (Instagram), `ThumbsUp` (Facebook), `Globe` or `Video` (TikTok). Lucide doesn't ship Instagram/Facebook/TikTok glyphs per their trademark policy. Project already established this convention.

**Output artefact**: 1 new file or extension, 2 modified files, 1-2 new tests.

**Acceptance check**:
- Each non-blank card visibly renders 2-3 platform chips matching the `BOUNTY_PRESETS` registry.
- New tests pass; existing tests stay green.

**Effort**: S-M.

---

### C. Stepper jump-back navigation + 3-button discard dialog

**Goal** (two related changes in the same file, hence one agent):

1. **Stepper jump-back**: clicking a previous step's pill (or any completed step) navigates the user back. Forward jumps remain blocked unless the current step validates (matches design's `wizard.jsx:96-102` `jump()` logic).

2. **Discard dialog 3-button shape**: replace the single-button `ConfirmAction` with a custom dialog offering **Keep editing · Save as draft · Discard** (matches design's `wizard.jsx:148-162`). Save-as-draft path calls `onSaveDraft()` then closes the dialog and navigates per `onDiscard()`'s contract.

**Files**:
- `apps/web/src/components/bounty-form/WizardShell.tsx` — both changes
- `apps/web/src/components/bounty-form/CreateBountyForm.tsx` — track `completedSteps: number[]` state and pass to `WizardShell`; update `handleNext` to push current step into `completedSteps` after validation passes
- `apps/web/src/components/bounty-form/__tests__/WizardShell.test.ts` — add 3-4 tests:
  - jump-back to completed step works
  - jump-forward to uncompleted step is blocked
  - discard "Save as draft" button calls onSaveDraft + closes dialog
  - discard "Discard" button calls onDiscard

**Output artefact**: 2 modified files + 3-4 new tests. Single conventional commit.

**Acceptance check**:
- After advancing to step 3, click step 1's pill → returns to step 1 form panel.
- After advancing to step 3, click step 5's pill → no navigation (stays on step 3).
- Open Discard dialog on any step → 3 buttons visible with the right labels and click handlers.

**Effort**: M.

---

### D. South Africa locked location field

**Goal**: Replace the free-text Location input in Step 3 (Access & Requirements) with a locked field showing "South Africa" + a "Locked" tag. Click toggles a hint copy: "More locations coming soon — sit tight, we're cooking." (matches design's `wizard-steps-1-3.jsx:367-378`).

**Files**:
- `apps/web/src/components/bounty-form/EligibilityRulesSection.tsx` — replace the location text input with the locked display
- `apps/web/src/components/bounty-form/types.ts` — `INITIAL_FORM_STATE.structuredEligibility.locationRestriction` defaults to `'South Africa'` (from `null`)
- `apps/web/src/components/bounty-form/__tests__/validation.test.ts` — update any test that asserts default `locationRestriction` value

**Backend**: `structuredEligibility.locationRestriction` field is unchanged in the DTO — we just hard-code the value client-side. No API changes.

**Output artefact**: 2-3 modified files, possibly 1 test update.

**Acceptance check**:
- Step 3 renders "South Africa" with a "Locked" tag where the free-text input used to be.
- Click on the field toggles the hint copy underneath.
- `buildCreateBountyRequest` still serialises `locationRestriction: 'South Africa'` for new bounties.

**Effort**: S-M.

---

### E. Duplicate menu action

**Goal**: Add "Duplicate" item to the dashboard's three-dot menu (between Edit and Delete). Clicking creates a new DRAFT bounty with the original's payload (title prefixed "Copy of "), then navigates to the edit page.

**Files**:
- `apps/web/src/components/features/bounty/BountyManageRowMenu.tsx` — add `Duplicate` menu item with `Copy` lucide icon
- `apps/web/src/components/features/bounty/BountyManageActions.tsx` — same item for grid-view footer (consistent vocabulary)
- `apps/web/src/app/business/bounties/page.tsx` — add `handleDuplicate(bounty)` that fetches detail (`bountyApi.getById(bounty.id)`), strips/resets fields (status → DRAFT, paymentStatus → PENDING, submissions → empty), calls `bountyApi.create(payload)` with the cloned data, navigates to `/business/bounties/${newId}/edit` on success
- `apps/web/src/lib/api/bounties.ts` — verify `bountyApi.getById` exists (likely does); no new endpoint
- `apps/web/src/components/features/bounty/__tests__/manage-menu-policy.test.ts` — extend with `duplicate` assertion (always available regardless of status)

**Backend**: existing `POST /api/v1/bounties` (create) is sufficient. No new endpoint or DTO.

**Output artefact**: 3-4 modified files, 1 test update.

**Acceptance check**:
- Three-dot menu shows "Duplicate" on every status (DRAFT/LIVE/PAUSED/CLOSED).
- Click Duplicate → toast confirms, redirect to new bounty's edit page.
- New bounty has status DRAFT, title starts with "Copy of ", same channels/rewards/etc.

**Effort**: M.

---

### F. Auto-scroll on Next/Back success + "All bounties" eyebrow

**Goal** (two micro-fixes in one item):

1. `CreateBountyForm.tsx` `handleNext` and `handleBack`: scroll the form ref to top on success path too (currently only on error path). Matches design's `wizard.jsx:78-84` `scrollTop()` helper.
2. Add an "All bounties" eyebrow label above the `BountyStatusPills` on `business/bounties/page.tsx` (mirrors the design's `<Eyebrow>All bounties</Eyebrow>` at `hub.jsx:171`).

**Files**:
- `apps/web/src/components/bounty-form/CreateBountyForm.tsx`
- `apps/web/src/app/business/bounties/page.tsx`

**Output artefact**: 2 modified files, ~5 lines total.

**Acceptance check**:
- Click Next on step 1 with valid input → page scrolls to top of form.
- Click Back on step 2 → page scrolls to top of form.
- Hub renders "All bounties" eyebrow above the status pills.

**Effort**: S.

---

## Wave 2 — integration verification (sequential, after Wave 1 returns)

**G. Integration cherry-pick + full test suite + visual QA**

Per project pattern: each Wave 1 agent runs in an isolated worktree, commits its changes there, returns the branch. Lead cherry-picks each into `bounty-flow-refinement` in dependency order (no conflicts expected — all items touch different files). Then:

1. Run `npx jest --config apps/web/jest.config.ts` — confirm 362 + new tests still pass.
2. Run `npx jest --config apps/api/jest.config.ts` — confirm 1375 still pass.
3. Run `next build --no-lint` — confirm clean build.
4. Start dev server, walk the wizard end-to-end (Basics → Documents) on `bounty-flow` (or via test BUSINESS_ADMIN if creds available).
5. Force-push the rebased branch to update PR #69.

---

## Out of scope (defer to a follow-up plan)

These are real items I considered and consciously punted:

- **Drag-to-reorder instructions** (Step 2). Adds drag handles. Subjective; not in the brief; design polish only.
- **Toast on validation failure**. Design uses toast; ours uses inline errors. Inline errors are arguably better UX. Defer.
- **"Reply to comments" engagement field** (Step 3, design's `mustReply`). No backend DTO, no Apify scrape rule, no ledger consequence. ADR-territory if pursued.
- **Three-dot menu "Archive" item**. Design has it; we have Close (status change) which is semantically the same. Re-labelling is a separate decision.
- **List view DataTable redesign** with Category / Claims-progress / Ends columns. Significant rework of `BusinessBountyListView`. Defer until product priority.
- **Step 4 sticky KPI sidebar** (`calc-grid` 2-column with sticky `kpi-feature` panel). Significant rework of `RewardLinesSection`. Defer.
- **Stepper "Step X of N" text removal**. Per chat feedback, design removed it. Verify our `WizardShell` doesn't show it (likely doesn't — flag for visual QA in Wave 2).

---

## Risks watching

1. **Cherry-pick conflict on `WizardShell.tsx`**. Only Wave 1 item C touches it. If Wave 1 expands later to include another wizard-shell change, conflicts likely. Stays clean for now.
2. **`bountyApi.create` payload contract**. Item E assumes the create endpoint accepts the full `CreateBountyRequest`. Verify before dispatch. (Spec-grounded: existing `useCreateBountyForm.toRequest('full')` already builds this payload, so the contract is known.)
3. **Lucide icon stand-ins for platform chips**. Project already uses `Camera`/`ThumbsUp`/`Globe` per CLAUDE.md `ui-ds-apply`. Item B agent must follow this convention; brief includes the explicit reference.

---

## Pre-dispatch checklist (lead — run once before Wave 1 dispatch)

- [ ] **Architect pass**: every item's file list is concrete and disjoint from other items' file lists. ✓ confirmed above.
- [ ] **PO pass**: every acceptance criterion verifiable by reading the diff or running a test. ✓ confirmed.
- [ ] **Senior-dev pass**: each item names files + lines, not "fix the wizard". ✓ confirmed.
- [ ] **PM pass**: every agent will run as `subagent_type: general-purpose` on `model: sonnet`, in worktree isolation, with self-contained briefs (the project has no `.claude/agents/` specialists; `md-files/agents/` are play-books, not subagent definitions). ✓ confirmed.

---

## Approval gate

Reply with one of:
- **"go"** — dispatch all 6 Wave 1 agents in parallel.
- **"defer X"** — name items to drop from Wave 1 (e.g. "defer E, F" if Duplicate or eyebrow polish isn't worth the time).
- **redirect** — anything else; I re-shape the plan.
