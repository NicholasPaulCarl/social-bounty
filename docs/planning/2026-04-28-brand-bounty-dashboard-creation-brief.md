# Developer Brief: Brand Bounty Dashboard + Creation Flow Refinement

**Request:** Refine the brand-facing bounty hub and bounty creation flow without departing heavily from the existing implementation.

**Primary routes:**
- `/business/bounties` — brand bounty dashboard / management hub.
- `/business/bounties/new` — create bounty.
- `/business/bounties/[id]/edit` — edit draft / permitted edit states.

**Implementation stance:** This is a UX/UI refinement over the legacy flow, not a rewrite. Keep the existing API contracts, status transitions, TradeSafe funding handoff, RBAC, audit logging, and current form reducer patterns unless a scoped item below explicitly says otherwise.

---

## 1. Current State Summary

The brand bounty dashboard already exists at `apps/web/src/app/business/bounties/page.tsx`.

Current implementation:
- Uses `ManageHero`, status pills, `BrowseFilterBar`, active filter chips, grid/list view toggle, `BountyManageCard`, `BusinessBountyListView`, `Paginator`, and `ConfirmAction`.
- Uses URL-backed filters via `useManageFilters`: `search`, `status`, `rewardType`, `sortBy`, `view`, `page`.
- Uses `PAGE_LIMIT = 12`.
- Shows action icons through `BountyManageActions`.
- Publishing an unpaid draft starts hosted checkout via `bountyApi.fundBounty()` and `redirectToHostedCheckout()`.

The bounty creation route already exists at `apps/web/src/app/business/bounties/new/page.tsx`, with form state owned by `CreateBountyForm` and `useCreateBountyForm`.

Current form model already includes:
- title, short description, instruction steps, channels, post formats
- content format and TikTok video-only guard
- AI content toggle
- engagement requirements, payout metrics, post visibility
- eligibility requirements
- max submissions
- multi-line rewards
- access type and hunter search
- brand asset uploads
- save draft and create/fund actions

Known documentation drift:
- Older create-bounty docs still describe a 9/10-section single-page form with category and a visible proof-requirements section.
- Current code renders 5 sections, has no category input, and auto-seeds URL proof in `INITIAL_FORM_STATE`.
- Treat the code as the source of truth for this refinement unless this brief explicitly scopes a change.

---

## 2. Goals

1. Make `/business/bounties` feel like the brand’s bounty command center.
2. Add four quick-create cards at the top of the dashboard.
3. Keep the existing bounty list and filters, but tune them to the requested list-management behavior.
4. Present bounty creation as a clear 5-step flow while reusing the existing form state, validation, request builder, and API mutations.
5. Preserve MVP rules: BUSINESS_ADMIN RBAC, destructive confirmations, audit logs for status changes, and full test pass before release.

---

## 3. Non-Goals

- No new social platforms.
- No new bounty status model.
- No new payment rail behavior.
- No change to participant submission verification rules.
- No AI copy generation in this pass. The “AI Content” control only captures whether hunter AI-generated content is allowed.
- No full rebuild of the form data model unless required for claim-count funding correctness.

---

## 4. Brand Bounty Dashboard Scope

### Route

Update `/business/bounties`.

Primary files:
- `apps/web/src/app/business/bounties/page.tsx`
- `apps/web/src/components/features/bounty/ManageHero.tsx`
- `apps/web/src/components/features/bounty/BountyManageCard.tsx`
- `apps/web/src/components/features/bounty/BusinessBountyListView.tsx`
- `apps/web/src/components/features/bounty/BountyManageActions.tsx`
- `apps/web/src/hooks/useManageFilters.ts`

### Layout

Order the page as:

1. Existing management hero / page header area.
2. Quick Create card grid.
3. Existing status tabs.
4. Search, filter, sort controls.
5. Existing bounties list.
6. Pagination.

Keep the current grid/list view toggle unless product explicitly removes it. The requested “Each line has a three-dot menu” applies most directly to list mode; grid cards can keep icon actions if already working, but list rows should move toward a menu-trigger pattern.

### Quick Create Cards

Add a four-card grid above the existing list controls.

Cards:

| Card | Purpose | Click behavior |
| --- | --- | --- |
| Blank bounty | Start from an empty bounty. Use a plus icon as the main visual. | Navigate to `/business/bounties/new`. |
| Social Exposure | General reach/awareness campaign. | Navigate to create flow with preset channels/formats. |
| Check-Ins | Location/check-in style bounty. | Navigate to create flow with preset channels/formats. |
| Product Sales | Product review/purchase bounty. | Navigate to create flow with preset channels/formats and product reward defaults where possible. |

Suggested preset transport:
- Use a query param rather than a new route: `/business/bounties/new?preset=social-exposure`.
- Keep presets client-side and deterministic.
- Add a small helper such as `bounty-presets.ts` that maps preset ids to partial `BountyFormState`.

Suggested preset mapping:

| Preset | Channels / formats | Other defaults |
| --- | --- | --- |
| `blank` | none | existing initial state |
| `social-exposure` | Instagram: Feed Post, Story, Reel; Facebook: Feed Post, Story; TikTok: Video Post | `contentFormat = BOTH` unless TikTok forces video-only, AI content off |
| `check-ins` | Facebook: Feed Post, Story; Instagram: Feed Post, Story | add demo instruction step about location check-in; do not add new location-verification feature |
| `product-sales` | Instagram: Feed Post, Reel; TikTok: Video Post | default first reward line to Product if this does not break existing validation |

UX details:
- Cards should be compact action cards, not a marketing hero.
- Use PrimeReact and Tailwind with lucide icons.
- Make card labels explicit and short.
- Include one-line helper copy, but do not over-explain the product.
- Cards must be keyboard-focusable buttons or links.

### Existing Bounties List

Keep the current data source: `GET /api/v1/bounties` through `useBounties`.

Requested list behavior:
- Search above the list.
- Filter options above the list.
- Paginate after 25 bounties per page.
- Each row has a three-dot options menu.
- Draft bounties can be edited.
- Live bounties with submissions cannot be edited.

Implementation notes:
- Change `PAGE_LIMIT` from `12` to `25`.
- Preserve URL-backed filters.
- Keep status filtering by All / Draft / Live / Paused / Closed.
- In list mode, replace always-visible row action icons with a PrimeReact `Menu` or `TieredMenu` opened by an ellipsis icon button.
- Keep destructive actions behind `ConfirmAction`.
- If grid mode remains, the footer can keep compact icon actions, but it should respect the same editability rules.

Editability matrix:

| Bounty state | Submission count | Edit action |
| --- | ---: | --- |
| DRAFT | any | enabled |
| LIVE | 0 | allowed only if current backend permits limited live edits |
| LIVE | > 0 | disabled or hidden; show View / Submissions instead |
| PAUSED | any | follow existing backend rules; do not widen editing |
| CLOSED | any | no edit; view only |

If backend rules differ, the UI must not imply edits that the API rejects. Prefer hiding unavailable menu items over showing disabled items unless the disabled reason is useful.

---

## 5. Bounty Creation Flow Scope

### Route

Keep `/business/bounties/new`.

Primary files:
- `apps/web/src/app/business/bounties/new/page.tsx`
- `apps/web/src/components/bounty-form/CreateBountyForm.tsx`
- `apps/web/src/components/bounty-form/useCreateBountyForm.ts`
- `apps/web/src/components/bounty-form/types.ts`
- `apps/web/src/components/bounty-form/validation.ts`
- Existing section components under `apps/web/src/components/bounty-form/`

### Flow Model

Present creation as five steps:

1. Basics
2. Instructions & Metrics
3. Access & Requirements
4. Claim & Rewards
5. Document Share

This can be implemented as a wizard shell over the existing reducer rather than replacing the reducer. The current `CreateBountyForm` already holds most fields; the main work is regrouping, step navigation, progress indicators, and draft/discard behavior.

Global actions:
- Back / Next between steps.
- Save as Draft at every step.
- Discard at every step, with confirmation.
- Create Bounty on final step only, with full validation and existing funding handoff.

Draft behavior:
- Keep current draft validation: title required.
- If no title exists when saving draft, prompt user to add one.
- After draft save, keep existing navigation to bounty detail unless the product wants the user to remain in the wizard.

Discard behavior:
- Requires confirmation.
- For a new unsaved bounty, discard returns to `/business/bounties`.
- For editing an existing draft, discard returns to the bounty detail page.

### Step 1: Basics

Fields:
- Bounty Name: existing `title`.
- Bounty Description: map to existing `shortDescription`.
- Platform Select: existing `channels`.
- Format Select per platform: existing `ChannelSelectionSection`.
- Content Format: existing `contentFormat` with Photo, Video, Both.
- AI Content Toggle: existing `aiContentPermitted`.

Rules:
- Platforms are Facebook, Instagram, TikTok only.
- When a platform is selected, show allowed post formats.
- Each selected platform should default to the standard/default format set from `CHANNEL_POST_FORMATS`.
- If a user unchecks all formats for a platform, deactivate that platform.
- TikTok requires video. Preserve current TikTok guard.

### Step 2: Instructions & Metrics

Fields:
- Instruction Builder: existing `instructionSteps`.
- Additional Rules: use existing custom rules / structured rules where possible.
- Payout Metrics: existing `payoutMetrics.minViews`, `minLikes`, `minComments`.

Instruction builder requirements:
- Add line.
- Remove line.
- Reorder line.
- Demo/placeholder text for each row.
- Maintain max instruction count from the current form unless product changes it.

Additional rules:
- Use a fixed checklist for MVP-friendly extras where possible.
- Map existing toggles first: mention brand, leave comment, post visibility, no competing brands, public profile.
- Avoid adding free-form legal machinery beyond current custom rules.
- Current custom rules are capped by shared constants. Do not expand that cap as part of this UI pass unless product explicitly asks.

### Step 3: Access & Requirements

Fields:
- Hunter Access Type: Open to all or invite/apply-only.
- Invite-only hunter search/select: existing `AccessTypeSection` hunter search.
- Hunter Requirements: minimum followers, no competing brands, location.
- Post Requirements: brand tag, comment, reply to comments, post duration, multiple submissions allowed.

Mapping to current model:
- Open to all: `accessType = PUBLIC`.
- Invite/apply-only: current model uses `accessType = CLOSED`; UI copy should be aligned with the real behavior. Today this is “Apply only” with optional invited hunters.
- Minimum followers: `structuredEligibility.minFollowers`.
- No competing brands: `structuredEligibility.noCompetingBrandDays`.
- Location: `structuredEligibility.locationRestriction`.
- Brand tag: `engagementRequirements.tagAccount`.
- Comment: `engagementRequirements.comment`.
- Post duration: `postVisibility`.
- Multiple submissions / claim count: align with `maxSubmissions` unless a separate claim model is introduced.

Open question for product:
- “Reply to comments” is not clearly represented in the current DTO. Treat as out of scope unless there is already a backend field. Do not add a UI-only toggle that cannot be enforced or stored.

### Step 4: Claim & Rewards

Fields:
- Claim Count: number of hunters who can claim / submit.
- Reward Type: Cash, Product, Service, Other.
- Reward Value.
- Product/Service/Other name and description where supported.
- Total bounty value.

Mapping to current model:
- Claim Count should use existing `maxSubmissions` if the business meaning is “number of accepted submissions/claims.”
- Reward Type and Reward Value use existing `rewards`.
- Cash rewards hide the name input, as currently implemented.
- Product/Service/Other require a meaningful name.
- Current reward lines are capped by shared constants. A single reward line is enough for this requested flow; preserve multi-line support if it is already present and does not complicate the wizard.

Important financial rule:
- The displayed total committed bounty value must be: `per-claim reward value * claim count`.
- Today the form’s `totalRewardValue` sums reward lines without multiplying by `maxSubmissions`.
- If this value is used for funding, backend, shared DTO, API tests, and UI must agree on the same calculation.
- Do not ship a UI total that disagrees with the amount funded through TradeSafe.

### Step 5: Document Share

Fields:
- Upload collateral: guides, forms, product briefs, logos, brand guides.
- One upload input visible initially.
- User can add up to 5 uploads.
- Max 20 MB each.

Current implementation drift:
- Current shared constant is `BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY = 10`.
- Current shared max file size is `10 MB`.
- Requested behavior is `5` files and `20 MB` each.

Required implementation if accepted:
- Update shared constants in `packages/shared`.
- Ensure API validation and upload handling use the same limits.
- Update UI copy and file picker restrictions.
- Update tests for file-count and file-size boundaries.

---

## 6. Preset + Wizard Technical Design

Recommended approach:

1. Add a preset registry:
   - `apps/web/src/components/bounty-form/bounty-presets.ts`
   - Exports preset ids, labels, descriptions, icons, and a function that returns partial form state.

2. Read preset in create page:
   - `const preset = searchParams.get('preset')`
   - Pass preset into `CreateBountyForm`.

3. Apply preset once:
   - Add an initializer path to `useCreateBountyForm`.
   - Do not re-apply preset after user edits.
   - Preserve existing `initialBounty` behavior for edit mode.

4. Add wizard state:
   - Local `currentStep` in `CreateBountyForm`, or a small `useBountyWizard` hook.
   - Step-level validation can reuse `getSectionErrors` after mapping fields to steps.
   - Full validation still runs before Create Bounty.

5. Keep request conversion unchanged unless claim-total semantics require backend changes:
   - `buildCreateBountyRequest` should remain the single conversion point.

---

## 7. UI Requirements

- Use PrimeReact + Tailwind CSS.
- Use lucide icons for dashboard cards and menu triggers.
- Keep cards to 8px radius or match existing local card radius if the page already establishes it.
- Avoid nested cards.
- Keep form controls dense and operational, not landing-page-like.
- Ensure text fits on mobile and desktop.
- Use confirmation dialogs for destructive actions:
  - delete draft bounty
  - close bounty
  - discard creation flow
  - remove uploaded document if already persisted

---

## 8. API / Backend Considerations

Likely no new endpoint is needed for quick-create presets. Presets are front-end defaults.

Backend changes are needed only if scope includes:
- New upload limits: update shared constants and backend validation.
- Claim-count funding semantics: verify bounty funding amount is derived from `rewardValue * maxSubmissions` or the existing canonical server-side calculation.
- New post requirement fields such as “reply to comments”: defer unless the backend DTO already supports it.

RBAC:
- BUSINESS_ADMIN only for create, edit, status, delete, funding.
- Server remains the authority for brand ownership.

Audit logs:
- Existing status changes must remain audited.
- If discard only clears local unsaved state, no audit log needed.
- If deleting a persisted draft, existing delete audit behavior must remain intact.

---

## 9. Acceptance Criteria

Dashboard:
- Four quick-create cards render above the existing bounty controls.
- Blank card opens an empty create flow.
- Preset cards open the create flow with expected platforms/formats preselected.
- Existing status filters, search, reward filter, sort, and view toggle still work.
- Pagination uses 25 bounties per page.
- List rows expose actions through an ellipsis menu.
- Draft bounties can be edited.
- Live bounties with submissions cannot be edited from the dashboard.
- All destructive actions require confirmation.

Creation flow:
- Form is presented as five steps with Back / Next.
- Save Draft is available at every step.
- Discard is available at every step and requires confirmation.
- Create Bounty runs full validation only on final submission.
- TikTok video-only rule still holds.
- If all formats are removed from a platform, that platform is removed from selected channels.
- Total bounty value reflects reward value multiplied by claim count, or the implementation explicitly defers this with product sign-off.
- Document upload limits match agreed product limits in both UI and backend validation.

Testing:
- Add or update form reducer tests for presets and platform deactivation.
- Add wizard navigation tests.
- Add dashboard action-menu tests.
- Add upload limit tests if constants change.
- Run affected web tests and the existing bounty-form tests before handoff.

---

## 10. Suggested Work Breakdown

1. Dashboard quick-create cards and preset registry.
2. Preset application in create flow.
3. Wizard shell over existing `CreateBountyForm`.
4. Dashboard pagination/action-menu/editability rules.
5. Document upload limit alignment, if product confirms 5 files / 20 MB.
6. Claim-total calculation audit and tests.
7. Visual QA on desktop and mobile.

---

## 11. Product Questions Before Build

1. Should “Check-Ins” require any real location verification in MVP, or is it only a preset/instruction template for now? Recommended: preset only.
2. Should “Product Sales” default the reward line to Product, or only preselect Instagram/TikTok? Recommended: default Product if validation remains clean.
3. Is Claim Count exactly the existing `maxSubmissions` field? Recommended: yes for MVP.
4. Should upload limits change from current `10 files / 10 MB` to requested `5 files / 20 MB`? This needs shared constants and API validation changes.
5. Should LIVE bounties with zero submissions remain editable under existing limited-edit rules? Recommended: keep current backend-permitted behavior, but block edit once submissions exist.
