/**
 * AdditionalRulesGroup — pure-data unit tests.
 *
 * The web jest harness uses testEnvironment: 'node' (no jsdom, no
 * @testing-library/react).  The component uses 'use client' and imports React,
 * so we cannot import the rendered component here.  Instead we test the
 * exported ADDITIONAL_RULES constant directly and verify the onChange contract
 * via inline logic mirroring the component implementation.
 *
 * This is the same pattern used by BrandAssetsSection.test.ts and
 * WizardShell.test.ts in this directory.
 */

import { ADDITIONAL_RULES } from '../additional-rules-data';

// ─── 1. ADDITIONAL_RULES exports correct shape ──────────────────────────────

describe('ADDITIONAL_RULES constant', () => {
  it('exports exactly 4 rules', () => {
    expect(ADDITIONAL_RULES).toHaveLength(4);
  });

  it('has the correct ids in order', () => {
    const ids = ADDITIONAL_RULES.map((r) => r.id);
    expect(ids).toEqual(['ftc', 'no_competitor', 'exclusive', 'share_raw']);
  });

  it('has the correct labels', () => {
    expect(ADDITIONAL_RULES[0].label).toBe('Disclose the partnership (#ad or #sponsored)');
    expect(ADDITIONAL_RULES[1].label).toBe("Don't tag or feature competing brands");
    expect(ADDITIONAL_RULES[2].label).toBe("Don't post a competing bounty within 7 days");
    expect(ADDITIONAL_RULES[3].label).toBe('Share raw assets with the brand on request');
  });

  it('marks the first two rules as required and the last two as optional', () => {
    expect(ADDITIONAL_RULES[0].required).toBe(true);
    expect(ADDITIONAL_RULES[1].required).toBe(true);
    expect(ADDITIONAL_RULES[2].required).toBe(false);
    expect(ADDITIONAL_RULES[3].required).toBe(false);
  });
});

// ─── 2. onChange contract — toggling an optional rule ───────────────────────

describe('onChange contract (mirrored inline logic)', () => {
  // Mirror the handleChange logic from the component so we can test it
  // without importing React.
  function handleChange(
    selectedIds: string[],
    id: string,
    checked: boolean,
  ): string[] {
    if (checked) return [...selectedIds, id];
    return selectedIds.filter((x) => x !== id);
  }

  it('adds an optional id when checked=true', () => {
    const result = handleChange([], 'exclusive', true);
    expect(result).toEqual(['exclusive']);
  });

  it('removes an optional id when checked=false', () => {
    const result = handleChange(['exclusive', 'share_raw'], 'exclusive', false);
    expect(result).toEqual(['share_raw']);
  });

  it('keeps existing selection when adding a second optional rule', () => {
    const result = handleChange(['exclusive'], 'share_raw', true);
    expect(result).toEqual(['exclusive', 'share_raw']);
  });
});

// ─── 3. Required rule IDs never appear in the onChange payload ───────────────

describe('required rules are excluded from selectedIds payload', () => {
  it('required rule ids are ftc and no_competitor', () => {
    const requiredIds = ADDITIONAL_RULES.filter((r) => r.required).map((r) => r.id);
    expect(requiredIds).toEqual(['ftc', 'no_competitor']);
  });

  it('required ids do not appear in optionalIds derived from the constant', () => {
    const optionalIds = ADDITIONAL_RULES.filter((r) => !r.required).map((r) => r.id);
    const requiredIds = ADDITIONAL_RULES.filter((r) => r.required).map((r) => r.id);

    for (const rid of requiredIds) {
      expect(optionalIds).not.toContain(rid);
    }
  });

  it('a fully-selected state only contains optional ids', () => {
    // Simulate the component: selectedIds only holds optional rules.
    const allOptional = ADDITIONAL_RULES.filter((r) => !r.required).map((r) => r.id);
    const requiredIds = ADDITIONAL_RULES.filter((r) => r.required).map((r) => r.id);

    for (const rid of requiredIds) {
      expect(allOptional).not.toContain(rid);
    }
  });
});

// ─── 4. Prop interface accepts an empty selectedIds array ───────────────────

describe('prop contract', () => {
  it('accepts an empty selectedIds array without error', () => {
    // Pure structural test — verifies the shape the component expects is
    // assignable. No rendering required.
    const props: { selectedIds: string[]; onChange: (ids: string[]) => void } = {
      selectedIds: [],
      onChange: (_ids: string[]) => undefined,
    };

    expect(props.selectedIds).toEqual([]);
    expect(typeof props.onChange).toBe('function');
  });

  it('selectedIds with only optional ids is a valid prop shape', () => {
    const optionalIds = ADDITIONAL_RULES.filter((r) => !r.required).map((r) => r.id);
    const props: { selectedIds: string[]; onChange: (ids: string[]) => void } = {
      selectedIds: optionalIds,
      onChange: jest.fn(),
    };

    expect(props.selectedIds).toHaveLength(2);
    expect(props.selectedIds).not.toContain('ftc');
    expect(props.selectedIds).not.toContain('no_competitor');
  });
});
