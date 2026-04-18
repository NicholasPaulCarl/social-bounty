/**
 * Phase 3C — derivation tests for the form-side auto-verify preview accordion.
 *
 * The web jest harness is intentionally pure (`testEnvironment: 'node'`,
 * `testRegex: '.*\\.test\\.ts$'`, no jsdom, no @testing-library/react). Rather
 * than introduce a parallel jsdom config + RTL just for one render test, we
 * lock in the contract the component actually depends on:
 *
 *   - `derivePreviewChecks` returns a safe (empty) value for the form's
 *     "channels not picked yet" state — the case the accordion has to render
 *     on first paint without crashing.
 *   - `derivePreviewChecks` reacts to live form-state edits — the live-update
 *     property the accordion relies on (re-derives on every keystroke that
 *     touches a rule).
 *
 * Full visual rendering of the accordion is covered by Playwright E2E +
 * manual verification (the brand-form path mirrors the saved-bounty preview
 * panel which already has E2E coverage on the bounty detail page).
 */
import {
  derivePreviewChecks,
  hasAnyPreviewChecks,
  ELIGIBILITY_KEY,
  pairKey,
  type BountyPreviewInput,
} from '@/lib/utils/bounty-preview-checks';
import {
  ContentFormat,
  PostFormat,
  SocialChannel,
} from '@social-bounty/shared';

describe('AutoVerifyPreviewAccordion — no-channels render path', () => {
  // The accordion's `input` prop is built by CreateBountyForm.tsx as:
  //   {
  //     channels: Object.keys(state.channels).length > 0 ? state.channels : null,
  //     contentFormat: state.contentFormat,
  //     ...
  //   }
  // On first paint state.channels === {} so this evaluates to null. The
  // accordion must derive a safe (empty) preview without crashing.
  const initialFormInput: BountyPreviewInput = {
    channels: null,
    contentFormat: ContentFormat.BOTH,
    engagementRequirements: { tagAccount: null, mention: false, comment: false },
    payoutMetrics: { minViews: null, minLikes: null, minComments: null },
    structuredEligibility: {
      minFollowers: null,
      publicProfile: false,
      minAccountAgeDays: null,
      locationRestriction: null,
      noCompetingBrandDays: null,
      customRules: [],
    },
  };

  it('returns an empty preview-checks map for the form initial state', () => {
    expect(derivePreviewChecks(initialFormInput)).toEqual({});
  });

  it('hasAnyPreviewChecks is false for the form initial state', () => {
    expect(hasAnyPreviewChecks(initialFormInput)).toBe(false);
  });

  it('treats channels === {} the same as channels === null (also no-channels case)', () => {
    const withEmpty: BountyPreviewInput = { ...initialFormInput, channels: {} };
    expect(derivePreviewChecks(withEmpty)).toEqual(
      derivePreviewChecks(initialFormInput),
    );
  });
});

describe('AutoVerifyPreviewAccordion — live form-edit reactivity', () => {
  // Each "edit" below is a fresh derivePreviewChecks call — mirrors the
  // accordion re-rendering as the brand types. We confirm the output
  // changes shape with each edit, which is what gives the live-preview
  // feel inside the form.

  it('emits a per-URL group once the brand picks an Instagram channel', () => {
    const before: BountyPreviewInput = {
      channels: null,
      contentFormat: ContentFormat.BOTH,
    };
    const after: BountyPreviewInput = {
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
      contentFormat: ContentFormat.BOTH,
    };
    expect(Object.keys(derivePreviewChecks(before))).toHaveLength(0);
    // Picking Instagram REEL emits at least the formatMatch row.
    const afterChecks = derivePreviewChecks(after);
    expect(Object.keys(afterChecks)).toHaveLength(1);
    expect(afterChecks[pairKey(SocialChannel.INSTAGRAM, PostFormat.REEL)]).toBeDefined();
  });

  it('grows the eligibility group when minFollowers becomes non-null', () => {
    const base: BountyPreviewInput = {
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
      contentFormat: ContentFormat.BOTH,
      structuredEligibility: { minFollowers: null },
    };
    const edited: BountyPreviewInput = {
      ...base,
      structuredEligibility: { minFollowers: 1000 },
    };
    expect(derivePreviewChecks(base)[ELIGIBILITY_KEY]).toBeUndefined();
    expect(derivePreviewChecks(edited)[ELIGIBILITY_KEY]).toHaveLength(1);
  });

  it('grows per-URL groups as the brand picks additional formats', () => {
    const oneFormat: BountyPreviewInput = {
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
      contentFormat: ContentFormat.BOTH,
    };
    const twoFormats: BountyPreviewInput = {
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST] },
      contentFormat: ContentFormat.BOTH,
    };
    expect(Object.keys(derivePreviewChecks(oneFormat))).toHaveLength(1);
    expect(Object.keys(derivePreviewChecks(twoFormats))).toHaveLength(2);
  });

  it('removes a per-URL group when the brand unchecks the format', () => {
    // Symmetric to the "grows" test — confirms toggling-off works the same way.
    const before: BountyPreviewInput = {
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST] },
      contentFormat: ContentFormat.BOTH,
    };
    const after: BountyPreviewInput = {
      channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
      contentFormat: ContentFormat.BOTH,
    };
    expect(Object.keys(derivePreviewChecks(before))).toHaveLength(2);
    expect(Object.keys(derivePreviewChecks(after))).toHaveLength(1);
  });
});
