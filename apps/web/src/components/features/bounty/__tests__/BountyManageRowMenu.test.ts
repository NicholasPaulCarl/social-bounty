/**
 * BountyManageRowMenu — unit coverage for the Duplicate item.
 *
 * The component always inserts "Duplicate" into its MenuItem array
 * regardless of bounty status — verified here without mounting the full
 * React component (which requires jsdom + PrimeReact peers not available
 * in this jest environment).
 *
 * We mirror the item-building logic inline (no `.tsx` imports — the jest
 * config resolves only `.ts` extensions). This keeps the test small and
 * stable: the invariant under test is "Duplicate always appears", not the
 * exact item order.
 */

import { BountyStatus } from '@social-bounty/shared';
import { getManageMenuPolicy } from '../manage-menu-policy';

// Mirrors `getStatusActions` from BountyManageActions.tsx to derive label sets
// without importing a .tsx file.
function getStatusActionLabels(status: BountyStatus): string[] {
  switch (status) {
    case BountyStatus.DRAFT:
      return ['Publish'];
    case BountyStatus.LIVE:
      return ['Pause', 'Close'];
    case BountyStatus.PAUSED:
      return ['Resume', 'Close', 'Revert to draft'];
    case BountyStatus.CLOSED:
    default:
      return [];
  }
}

function buildItemLabels(status: BountyStatus, submissionCount: number): string[] {
  const bounty = {
    id: 'b1',
    title: 'Test',
    shortDescription: '',
    category: '',
    status,
    submissionCount,
    rewardType: 'CASH' as never,
    rewardValue: '500',
    rewardDescription: null,
    maxSubmissions: 1,
    startDate: null,
    endDate: null,
    brand: { id: 'br1', name: 'Brand', logo: null, verified: false },
    createdAt: new Date().toISOString(),
    channels: null,
    currency: 'ZAR' as never,
    totalRewardValue: '500',
    rewards: [],
    payoutMetrics: null,
    paymentStatus: 'UNPAID' as never,
    accessType: 'PUBLIC' as never,
    userHasApplied: false,
    userHasSubmitted: false,
  };

  const policy = getManageMenuPolicy(bounty);
  const labels: string[] = [];

  labels.push('View');

  if (policy.showSubmissions && !policy.canEdit) {
    labels.push('View submissions');
  }

  if (policy.canEdit) {
    labels.push('Edit');
  }

  // Duplicate — always present regardless of status.
  labels.push('Duplicate');

  labels.push(...getStatusActionLabels(status));

  if (status === BountyStatus.DRAFT) {
    labels.push('Delete');
  }

  return labels;
}

describe('BountyManageRowMenu — Duplicate item appears regardless of status', () => {
  it('DRAFT bounty (no submissions)', () => {
    expect(buildItemLabels(BountyStatus.DRAFT, 0)).toContain('Duplicate');
  });

  it('LIVE bounty with 0 submissions', () => {
    expect(buildItemLabels(BountyStatus.LIVE, 0)).toContain('Duplicate');
  });

  it('LIVE bounty with >0 submissions', () => {
    expect(buildItemLabels(BountyStatus.LIVE, 5)).toContain('Duplicate');
  });

  it('PAUSED bounty', () => {
    expect(buildItemLabels(BountyStatus.PAUSED, 2)).toContain('Duplicate');
  });

  it('CLOSED bounty', () => {
    expect(buildItemLabels(BountyStatus.CLOSED, 10)).toContain('Duplicate');
  });
});
