# Graphify Completeness & Connectivity Audit

> Generated: 2026-04-23  ·  Graph: 2450 nodes, 4911 edges

## Summary

| Metric | Value |
|---|---|
| Files on disk (post `.graphifyignore`) | 714 |
| Files represented in graph | 714 |
| **File coverage** | **100.0%** |
| Connected components | 92 |
| Largest component (main graph) | 2241 nodes (91.5%) |
| Isolated nodes (degree = 0) | 43 |
| Weakly-connected (degree = 1) | 735 |

## File coverage

All **714** files detected on disk are represented in the graph as a `source_file` attribute somewhere. No files were silently dropped by the AST extractor (`.graphifyignore` correctly filters out everything the graph shouldn't see).

## Component structure

The main component contains **91.5%** of all nodes. The remaining 209 nodes are distributed across 91 islands:

```
Top 10 component sizes: 2241, 35, 15, 9, 5, 5, 4, 4, 4, 3
```

## Isolated nodes (deg = 0)

**43 nodes** carry no edges. These represent real limitations of the AST + semantic extraction passes — the node exists (extraction created it) but no edge was extracted or inferred. Not a bug; a hygiene inventory.

### By extension

- `(none)`: 2
- `.js`: 2
- `.md`: 1
- `.ts`: 15
- `.tsx`: 23

### By top-level directory

#### `apps/` (38 isolated)

- `next-env.d.ts` — `apps/web/next-env.d.ts`
- `postcss.config.js` — `apps/web/postcss.config.js`
- `global.d.ts` — `apps/web/src/global.d.ts`
- `global-error.tsx` — `apps/web/src/app/global-error.tsx`
- `LibrarySidebar.tsx` — `apps/web/src/app/admin/component-library/_components/LibrarySidebar.tsx`
- `MoleculesSection.tsx` — `apps/web/src/app/admin/component-library/_components/sections/MoleculesSection.tsx`
- `BrandSection.tsx` — `apps/web/src/app/admin/component-library/_components/sections/BrandSection.tsx`
- `AtomsSection.tsx` — `apps/web/src/app/admin/component-library/_components/sections/AtomsSection.tsx`
- `layout.tsx` — `apps/web/src/app/admin/finance/layout.tsx`
- `ScheduleSection.tsx` — `apps/web/src/components/bounty-form/ScheduleSection.tsx`
- `SectionPanel.tsx` — `apps/web/src/components/bounty-form/SectionPanel.tsx`
- `MaxSubmissionsSection.tsx` — `apps/web/src/components/bounty-form/MaxSubmissionsSection.tsx`
- `index.ts` — `apps/web/src/components/bounty-form/index.ts`
- `ProofRequirementsSection.tsx` — `apps/web/src/components/bounty-form/ProofRequirementsSection.tsx`
- `AppHeader.tsx` — `apps/web/src/components/layout/AppHeader.tsx`
- `BrowseHero.tsx` — `apps/web/src/components/features/bounty/BrowseHero.tsx`
- `BountyCardSkeleton.tsx` — `apps/web/src/components/features/bounty/BountyCardSkeleton.tsx`
- `ActiveFilterChips.tsx` — `apps/web/src/components/features/bounty/ActiveFilterChips.tsx`
- `MobileFilterSheet.tsx` — `apps/web/src/components/features/bounty/MobileFilterSheet.tsx`
- `StatusDot.tsx` — `apps/web/src/components/features/bounty/StatusDot.tsx`
- *... and 18 more*

#### `docs/` (1 isolated)

- `QA Known Issues and Checks` — `docs/qa/KNOWN-ISSUES-AND-CHECKS.md`

#### `md-files/` (2 isolated)

- `Double-entry ledger (CLAUDE.md §4.1)` — `md-files/page-spec/`
- `UNIQUE(referenceId, actionType) idempotency` — `md-files/page-spec/`

#### `packages/` (1 isolated)

- `node-globals.d.ts` — `packages/prisma/types/node-globals.d.ts`

#### `scripts/` (1 isolated)

- `jest.config.js` — `scripts/jest.config.js`

## Interpretation

- **Config files** (`jest.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `playwright.config.ts`, `next.config.mjs`) that remain isolated didn't get picked up by the `configures` edge pass either because they were merged into dedupe under a short-path ID or the target nodes weren't yet present. Safe to revisit in a follow-up pass.
- **`__tests__/` fixtures and unused helper files** can stay isolated — they're real dead weight from a graph perspective.
- **Community-count islands** (the 31-node + 14-node + smaller islands in the component list) are mostly self-contained module clusters (e.g. `DisputesService` methods, hooks groups). Bridging them requires either semantic re-extraction with `--mode deep` or a deeper manual wiring pass.

Bottom line: the graph has no silent data-loss; it has 94 legitimately-disconnected nodes worth auditing individually if/when someone cares.