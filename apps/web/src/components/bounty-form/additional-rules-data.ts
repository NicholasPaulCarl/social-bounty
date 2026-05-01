/**
 * additional-rules-data.ts
 *
 * Pure-data module for the 4 fixed bounty compliance / behaviour rules.
 * Kept in a separate .ts file so the node-only jest harness can import
 * ADDITIONAL_RULES without pulling in React or 'use client' code.
 *
 * Consumed by:
 *   - AdditionalRulesGroup.tsx  (the rendered component)
 *   - __tests__/AdditionalRulesGroup.test.ts  (pure-data unit tests)
 */

export interface AdditionalRule {
  id: string;
  label: string;
  /** When true: checkbox is always checked + disabled; id never in selectedIds. */
  required: boolean;
}

export const ADDITIONAL_RULES: readonly AdditionalRule[] = [
  {
    id: 'ftc',
    label: 'Disclose the partnership (#ad or #sponsored)',
    required: true,
  },
  {
    id: 'no_competitor',
    label: "Don't tag or feature competing brands",
    required: true,
  },
  {
    id: 'exclusive',
    label: "Don't post a competing bounty within 7 days",
    required: false,
  },
  {
    id: 'share_raw',
    label: 'Share raw assets with the brand on request',
    required: false,
  },
] as const;
