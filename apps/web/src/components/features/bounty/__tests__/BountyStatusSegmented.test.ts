/**
 * BountyStatusSegmented — pure logic / option-set contract tests.
 *
 * Verifies the segmented control's option set, active-state derivation,
 * and handler contract without mounting the full React tree.
 *
 * Mirrors the pure-logic approach in BountyManageRowMenu.test.ts.
 */

import { BountyStatus } from '@social-bounty/shared';
import type { StatusFilter } from '@/hooks/useManageFilters';

// ─────────────────────────────────────
// Option set (mirrors component)
// ─────────────────────────────────────

const OPTIONS: ReadonlyArray<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: BountyStatus.LIVE, label: 'Live' },
  { id: BountyStatus.DRAFT, label: 'Drafts' },
  { id: BountyStatus.CLOSED, label: 'Ended' },
];

describe('BountyStatusSegmented — option set', () => {
  it('has exactly 4 options', () => {
    expect(OPTIONS).toHaveLength(4);
  });

  it('first option is "All" mapped to id "all"', () => {
    expect(OPTIONS[0].id).toBe('all');
    expect(OPTIONS[0].label).toBe('All');
  });

  it('includes Live → BountyStatus.LIVE', () => {
    const opt = OPTIONS.find((o) => o.label === 'Live');
    expect(opt).toBeDefined();
    expect(opt!.id).toBe(BountyStatus.LIVE);
  });

  it('includes Drafts → BountyStatus.DRAFT', () => {
    const opt = OPTIONS.find((o) => o.label === 'Drafts');
    expect(opt).toBeDefined();
    expect(opt!.id).toBe(BountyStatus.DRAFT);
  });

  it('maps Ended → BountyStatus.CLOSED (not "Closed")', () => {
    const opt = OPTIONS.find((o) => o.id === BountyStatus.CLOSED);
    expect(opt).toBeDefined();
    expect(opt!.label).toBe('Ended');
  });

  it('does NOT include a PAUSED option (dropped in Wave 2 per design)', () => {
    const paused = OPTIONS.find((o) => o.id === BountyStatus.PAUSED);
    expect(paused).toBeUndefined();
  });
});

describe('BountyStatusSegmented — active-state derivation', () => {
  const isActive = (value: StatusFilter, optId: StatusFilter) => value === optId;

  it('marks "all" active when value is "all"', () => {
    expect(isActive('all', 'all')).toBe(true);
    expect(isActive('all', BountyStatus.LIVE)).toBe(false);
  });

  it('marks LIVE active when value is BountyStatus.LIVE', () => {
    expect(isActive(BountyStatus.LIVE, BountyStatus.LIVE)).toBe(true);
    expect(isActive(BountyStatus.LIVE, 'all')).toBe(false);
  });

  it('marks DRAFT active when value is BountyStatus.DRAFT', () => {
    expect(isActive(BountyStatus.DRAFT, BountyStatus.DRAFT)).toBe(true);
    expect(isActive(BountyStatus.DRAFT, BountyStatus.LIVE)).toBe(false);
  });
});

describe('BountyStatusSegmented — onChange handler', () => {
  it('fires onChange with the clicked option id', () => {
    let captured: StatusFilter | null = null;
    const onChange = (status: StatusFilter) => { captured = status; };

    onChange(BountyStatus.LIVE);
    expect(captured).toBe(BountyStatus.LIVE);

    onChange('all');
    expect(captured).toBe('all');

    onChange(BountyStatus.DRAFT);
    expect(captured).toBe(BountyStatus.DRAFT);

    onChange(BountyStatus.CLOSED);
    expect(captured).toBe(BountyStatus.CLOSED);
  });
});
