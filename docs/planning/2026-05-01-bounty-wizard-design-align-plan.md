# Bounty wizard design alignment — execution plan

**Branch:** `bounty-wizard-design-align` (off main)
**Scope:** Visual + structural alignment of the 5-step bounty creation wizard at `/business/bounties/new` to the `brand-bounty-flow` Claude Design handoff bundle. Multi-reward feature retained.
**Source:** `/tmp/wizard-design/brand-bounty-flow/project/app/{wizard.jsx,wizard-steps-1-3.jsx,wizard-steps-4-5.jsx,app.css}`

## Context

Third polish pass of the bounty surface. The wizard already exists (built on `bounty-flow-refinement` 2026-04-28, polished on `bounty-ux-ui` 2026-04-30). Recent CLAUDE.md entry "Wave 1 polish landed (2026-04-29)" + "Bounty UX/UI design alignment (2026-04-30)" cover prior passes. This pass closes design gaps surfaced by a fresh look at the same design bundle (the bundle has wizard files we hadn't fully mirrored).

User-confirmed scope (option A): visual + structural alignment, **multi-reward feature retained**. Strict simplification (option B — single reward, schema change, ledger math touch) is NOT in this pass.

## Goals

1. Match the design's step content layout: Step 0 has no instructions, Step 2 has instructions + 4 fixed additional rules + 3-input metrics grid.
2. Match the design's section ordering on Step 3 (access first, requirements second; 7/14/30 day post-duration segmented).
3. Match the design's reward step layout (sticky KPI sidebar already in place per Wave 1 (iv); confirm visual fidelity).
4. Preserve all current behaviour: multi-reward lines, ScheduleSection start/end dates, validation, draft mode, edit mode, ADR 0013 multi-claim escrow math.

## Non-goals

- Strip multi-reward (option B). Tracked separately if user wants it later.
- Touch `useCreateBountyForm.ts` reducer except for shape-stable additions.
- Touch the API / Prisma / ADR 0011 / ADR 0013.
- Touch `/business/bounties` hub (separate branch `bounty-hub-design-align`, PR #79).

## Acceptance criteria

- `cd apps/web && npx jest --testPathPatterns="bounty-form|business|bounty"` green.
- `npx tsc --noEmit -p apps/web/tsconfig.json` clean modulo the pre-existing `RewardCalculator.test.tsx` errors that predate this branch.
- `npx next build --no-lint` clean.
- Visual self-check (one engineer): the rendered `/business/bounties/new` matches the design's `wizard-steps-*.jsx` step content + ordering for steps 0-2; reward step (3) and documents step (4) unchanged in behaviour.

## Critical files

- `apps/web/src/components/bounty-form/CreateBountyForm.tsx` (~756 lines, the orchestrator — Step 0 lines 385-565, Step 1 lines 567-598, Step 2 lines 601-686, Step 3 lines 688-716, Step 4 lines 718-740)
- `apps/web/src/components/bounty-form/validation.ts` (`WIZARD_STEP_SECTIONS` mapping at lines 303-309)
- `apps/web/src/components/bounty-form/CustomRulesSection.tsx` (replaced by new component this pass)
- `apps/web/src/components/bounty-form/PostVisibilitySection.tsx` (post-duration UI restyle on Step 3)
- `apps/web/src/components/bounty-form/__tests__/validation.test.ts` (will need step-mapping updates)
- `apps/web/src/components/bounty-form/__tests__/WizardShell.test.ts` (may need step-content asserts updated)
- `apps/web/src/app/business/bounties/new/page.tsx` (breadcrumb addition)

## Wave structure

### Wave 1 — 2 parallel items, no shared file

- **Item A · `AdditionalRulesGroup.tsx`** — new pure component (~120 LOC). 4 fixed checkbox rules per design's `wizard-steps-1-3.jsx:174-179`:
  - `ftc` (required, "Disclose the partnership (#ad or #sponsored)")
  - `no_competitor` (required, "Don't tag or feature competing brands")
  - `exclusive` (optional, "Don't post a competing bounty within 7 days")
  - `share_raw` (optional, "Share raw assets with the brand on request")
  - Required rules render disabled + checked + "Required by law" eyebrow tag.
  - Controlled prop signature: `selectedIds: string[]`, `onChange: (ids: string[]) => void`. Wire later by Wave 2.
  - Light unit test (3-4 cases): required-always-checked, optional-toggleable, payload shape.

- **Item B · Page breadcrumb** — add a breadcrumb component at the top of `/business/bounties/new/page.tsx` matching design's `wizard.jsx:111` shape: "Bounties" link → "New bounty" current. No new component if there's an existing breadcrumb primitive (search the repo); otherwise inline. Standalone file edit, no dep on A.

### Wave 2 — 1 item, depends on Wave 1A

- **Item C · `CreateBountyForm.tsx` restructure + `validation.ts` mapping** (chunky but file-locked: single ownership of `CreateBountyForm.tsx` to avoid concurrent-edit conflicts):
  1. **Step 0 (Basics):** drop `InstructionStepsBuilder` (move to Step 2). Keep `ChannelSelectionSection`, title, description, content format, AI toggle, `ScheduleSection`. Schedule stays on Step 0 (Bounty.endDate is required at funding per ADR 0013 — verify and confirm; if optional, this could be a separate decision).
  2. **Step 2 (Instructions & Metrics):** add `InstructionStepsBuilder` (moved from Step 0). Replace `CustomRulesSection` with Wave A's new `AdditionalRulesGroup`. Keep `PayoutMetricsSection` (3-input grid already matches design).
  3. **Step 3 (Access & Requirements):** reorder sections — `AccessTypeSection` first, then `EligibilityRulesSection`, then `PostVisibilitySection`. Replace `PostVisibilitySection`'s flexible "duration variants" UI with a 7/14/30 day segmented control matching design `wizard-steps-1-3.jsx:407-410`. Drop `AutoVerifyPreviewAccordion` from this step (it's preview-only, belongs on the bounty detail view, not the create wizard).
  4. **Step 4 (Claim & Rewards):** confirm sticky KPI sidebar exists (per Wave 1 (iv) `RewardCalculator`) — visual nudges only, NO behavioural changes (multi-reward stays). If reward type cards aren't 4-up Cash/Product/Service/Other, restyle.
  5. **Step 5 (Documents):** visual nudges only (already matches design).
  6. **`validation.ts`** — update `WIZARD_STEP_SECTIONS` mapping to reflect instructions moving from `bountyBasicInfo` → `bountyRules` (or whichever section key buckets instructions). Re-run `validateStep` boundary tests to ensure step gating still fires.
  7. **Tests:** update `validation.test.ts` (step-mapping changes), `WizardShell.test.ts` (step-content shifts), any step-content tests in `__tests__/`. Net delta target: ±5 tests.
  8. **Delete `CustomRulesSection.tsx`** if no other consumers — confirm with `grep -r "CustomRulesSection"` before removing.

## Verification (in this order)

1. `cd apps/web && npx jest --testPathPatterns="bounty-form|business|bounty" --silent` — all green.
2. `npx tsc --noEmit -p apps/web/tsconfig.json` — only pre-existing `RewardCalculator.test.tsx` errors.
3. `npx next build --no-lint` — clean.
4. Visual self-check via existing preview servers (api on 3001, web-preview on 3010). Auth-gated, but the user is mid-login — they can land on `/business/bounties/new` after auth and confirm the step layouts.

## Risks

- **Step ordering drift:** moving instructions to Step 2 may break draft persistence if any draft has incomplete state assumed for the old step layout. Validation update should resolve this — flag in PR if the test surface lights up unexpectedly.
- **Schedule on Step 0:** if `Bounty.endDate` is non-nullable at funding, ScheduleSection MUST stay in the wizard. Wave 2 verifies and keeps it. If the design intent was "schedule moved to a different surface" we surface that as a follow-up.
- **`AutoVerifyPreviewAccordion` removal from Step 3:** if there are tests asserting it on Step 3, they need to flip. The component itself stays in the codebase (still used on the bounty detail preview).

## Out of scope follow-ups

- Strict single-reward simplification (option B from the user prompt).
- Drop ScheduleSection entirely (separate product decision once endDate nullability is confirmed).
- Pixel-perfect 1:1 match against `wizard-steps-*.jsx` styling tokens — we honour the local DS tokens (`apps/web/src/styles/design-system/`) which may differ slightly from the bundle's CSS values.
