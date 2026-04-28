/**
 * Quick-create bounty presets.
 *
 * Powers the Quick Create card grid on `/business/bounties`. Each preset
 * is a deterministic, client-side seed for the create-bounty form — the
 * card navigates to `/business/bounties/new?preset=<id>` and the create
 * page hands the partial state to the form via an initializer path.
 *
 * Presets express *intent*, not policy: they pre-tick channel/format
 * combinations the brand was likely already going to pick, but every
 * field stays user-editable. The reducer's existing guards still hold
 * — e.g. picking TikTok forces `contentFormat = VIDEO_ONLY` regardless
 * of what the preset declared.
 *
 * Source of truth for the seed mappings is the brief at
 * `docs/planning/2026-04-28-brand-bounty-dashboard-creation-brief.md` §4.
 */

import type { LucideIcon } from 'lucide-react';
import { MapPin, Megaphone, Plus, ShoppingBag } from 'lucide-react';
import {
  ContentFormat,
  PostFormat,
  RewardType,
  SocialChannel,
} from '@social-bounty/shared';
import type { BountyFormState } from './types';

export type BountyPresetId =
  | 'blank'
  | 'social-exposure'
  | 'check-ins'
  | 'product-sales';

export interface BountyPreset {
  id: BountyPresetId;
  label: string;
  description: string;
  Icon: LucideIcon;
}

/**
 * Card-grid registry, in display order: Blank first (the escape hatch
 * for brands that don't want a template), then the three opinionated
 * presets ordered roughly by frequency of use.
 */
export const BOUNTY_PRESETS: readonly BountyPreset[] = [
  {
    id: 'blank',
    label: 'Blank bounty',
    description: 'Start from scratch with a clean slate.',
    Icon: Plus,
  },
  {
    id: 'social-exposure',
    label: 'Social Exposure',
    description: 'Reach campaign across Instagram, Facebook, and TikTok.',
    Icon: Megaphone,
  },
  {
    id: 'check-ins',
    label: 'Check-Ins',
    description: 'Drive visits with location check-ins on Facebook and Instagram.',
    Icon: MapPin,
  },
  {
    id: 'product-sales',
    label: 'Product Sales',
    description: 'Promote a product with reels, posts, and TikTok video.',
    Icon: ShoppingBag,
  },
] as const;

/**
 * Convenience id list for callers that only need the union (e.g. the
 * wizard page reading `?preset=<id>` from the URL). Kept in sync with
 * `BOUNTY_PRESETS` order.
 */
export const BOUNTY_PRESET_IDS: readonly BountyPresetId[] = BOUNTY_PRESETS.map(
  (p) => p.id,
);

/**
 * Whitelist for `?preset=...` query-param parsing on the create page.
 * Anything not in this set falls through to the empty (blank) state.
 */
export function isBountyPresetId(value: unknown): value is BountyPresetId {
  return (
    typeof value === 'string' &&
    BOUNTY_PRESETS.some((p) => p.id === value)
  );
}

/**
 * Returns the partial form state for a preset. Caller merges this onto
 * `INITIAL_FORM_STATE` (or feeds it through the form's initializer).
 *
 * Notes on individual presets:
 * - `blank` returns `{}`; `INITIAL_FORM_STATE` survives unchanged.
 * - `social-exposure` declares `contentFormat = BOTH`. The reducer's
 *   `TOGGLE_CHANNEL` for TIKTOK forces VIDEO_ONLY, so when the form
 *   actually opens the channels and reapplies them through the toggle
 *   path TikTok will dominate — that's expected and matches the brief.
 *   If the seed is applied directly (bypassing the toggle path) the
 *   stored value will be BOTH; the brand can adjust on the form.
 * - `check-ins` includes a single demo instruction step. No new
 *   location-verification feature is added; the step is purely guidance.
 * - `product-sales` seeds a single PRODUCT reward line with empty `name`,
 *   so validation forces the brand to name the product. The CASH-name
 *   auto-fill in `useCreateBountyForm.ts:161-167` only fires when the
 *   form transitions *into* CASH; arriving non-CASH means no auto-fill
 *   collision and the validator-required name prompt fires naturally.
 */
export function getPresetFormState(
  id: BountyPresetId,
): Partial<BountyFormState> {
  switch (id) {
    case 'blank':
      return {};

    case 'social-exposure':
      return {
        channels: {
          [SocialChannel.INSTAGRAM]: [
            PostFormat.FEED_POST,
            PostFormat.STORY,
            PostFormat.REEL,
          ],
          [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.STORY],
          [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
        },
        contentFormat: ContentFormat.BOTH,
        aiContentPermitted: false,
      };

    case 'check-ins':
      return {
        channels: {
          [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.STORY],
          [SocialChannel.INSTAGRAM]: [PostFormat.FEED_POST, PostFormat.STORY],
        },
        instructionSteps: [
          'Visit the location and check in on the platform',
        ],
      };

    case 'product-sales':
      return {
        channels: {
          [SocialChannel.INSTAGRAM]: [PostFormat.FEED_POST, PostFormat.REEL],
          [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
        },
        rewards: [
          { rewardType: RewardType.PRODUCT, name: '', monetaryValue: 0 },
        ],
      };
  }
}
