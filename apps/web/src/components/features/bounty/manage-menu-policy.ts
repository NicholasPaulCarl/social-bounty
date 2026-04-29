/**
 * Pure policy module — decides which actions appear in a brand bounty's
 * row-level ellipsis menu.
 *
 * Centralised here so the dashboard list-row consumer and the future
 * grid-card footer can share the same "Edit allowed?" rule without
 * forking copy. The backend remains the authority — this is UI-only:
 * we hide menu items the user cannot use rather than disable them, per
 * brief §4 ("Prefer hiding unavailable menu items over showing
 * disabled items unless the disabled reason is useful").
 *
 * Editability matrix (brief §4):
 *   DRAFT          → edit allowed (any submission count, though DRAFT
 *                     should never have submissions in practice).
 *   LIVE, 0 subs   → edit allowed (limited live edits per ADR 0013 §3:
 *                     `eligibilityRules`, `proofRequirements`, `endDate`
 *                     remain editable; `maxSubmissions` is immutable
 *                     post-fund and the form-level `readOnlyMode='live'`
 *                     handles per-field lock-down).
 *   LIVE, >0 subs  → edit hidden; show View + Submissions instead.
 *   PAUSED, any    → follow existing backend rules — edit hidden once
 *                     submissions exist, allowed on zero. Same matrix
 *                     as LIVE (we treat them symmetrically; widening
 *                     PAUSED edits is out of scope for this UI pass).
 *   CLOSED, any    → no edit; view-only.
 */

import { BountyStatus, type BountyListItem } from '@social-bounty/shared';

export interface ManageMenuPolicy {
  /** Show the "Edit" item. Hidden when locked by submissions or status. */
  canEdit: boolean;
  /**
   * Show a "Submissions" shortcut. Surfaces whenever there are
   * submissions to view, regardless of edit-ability. The dashboard
   * routes this to the bounty detail page (which already lists
   * submissions) — no separate route needed.
   */
  showSubmissions: boolean;
}

/**
 * Decide which menu items render for a given bounty row.
 *
 * Implementation note on the count source: `BountyListItem` carries
 * `submissionCount` directly (see `packages/shared/src/dto/bounty.dto.ts:138`)
 * so list rows have the field they need; no additional fetch required.
 */
export function getManageMenuPolicy(bounty: BountyListItem): ManageMenuPolicy {
  const hasSubmissions = bounty.submissionCount > 0;

  // DRAFT: always editable. CLOSED: never editable. LIVE/PAUSED: editable
  // only with zero submissions (per brief — backend rules tighten further
  // via `readOnlyMode='live'` once the form opens).
  let canEdit: boolean;
  switch (bounty.status) {
    case BountyStatus.DRAFT:
      canEdit = true;
      break;
    case BountyStatus.CLOSED:
      canEdit = false;
      break;
    case BountyStatus.LIVE:
    case BountyStatus.PAUSED:
    default:
      canEdit = !hasSubmissions;
      break;
  }

  return {
    canEdit,
    showSubmissions: hasSubmissions,
  };
}
