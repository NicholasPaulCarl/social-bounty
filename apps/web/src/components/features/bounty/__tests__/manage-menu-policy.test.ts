import { getManageMenuPolicy } from '../manage-menu-policy';
import {
  BountyAccessType,
  BountyStatus,
  Currency,
  PaymentStatus,
  RewardType,
  type BountyListItem,
} from '@social-bounty/shared';

function makeBounty(
  status: BountyStatus,
  submissionCount: number,
): BountyListItem {
  return {
    id: 'bounty-1',
    title: 'Test',
    shortDescription: '',
    category: '',
    rewardType: RewardType.CASH,
    rewardValue: '500',
    rewardDescription: null,
    maxSubmissions: 10,
    startDate: null,
    endDate: null,
    status,
    submissionCount,
    brand: { id: 'b', name: 'Brand', logo: null, verified: false },
    createdAt: new Date('2026-04-01').toISOString(),
    channels: null,
    currency: Currency.ZAR,
    totalRewardValue: '500',
    rewards: [],
    payoutMetrics: null,
    paymentStatus: PaymentStatus.UNPAID,
    accessType: BountyAccessType.PUBLIC,
    userHasApplied: false,
    userHasSubmitted: false,
  };
}

describe('getManageMenuPolicy', () => {
  it('DRAFT: edit allowed at zero submissions, no submissions shortcut', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.DRAFT, 0))).toEqual({
      canEdit: true,
      showSubmissions: false,
    });
  });

  it('DRAFT with submissions (shouldn’t happen in practice) still allows edit, surfaces submissions link', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.DRAFT, 3))).toEqual({
      canEdit: true,
      showSubmissions: true,
    });
  });

  it('LIVE with 0 submissions: edit allowed (limited live edits per ADR 0013 §3)', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.LIVE, 0))).toEqual({
      canEdit: true,
      showSubmissions: false,
    });
  });

  it('LIVE with >0 submissions: edit hidden, submissions shortcut surfaces', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.LIVE, 1))).toEqual({
      canEdit: false,
      showSubmissions: true,
    });
  });

  it('LIVE with many submissions: edit stays hidden', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.LIVE, 42))).toEqual({
      canEdit: false,
      showSubmissions: true,
    });
  });

  it('PAUSED with 0 submissions: edit allowed (mirrors LIVE)', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.PAUSED, 0))).toEqual({
      canEdit: true,
      showSubmissions: false,
    });
  });

  it('PAUSED with submissions: edit hidden', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.PAUSED, 4))).toEqual({
      canEdit: false,
      showSubmissions: true,
    });
  });

  it('CLOSED, any submission count: edit always hidden', () => {
    expect(getManageMenuPolicy(makeBounty(BountyStatus.CLOSED, 0))).toEqual({
      canEdit: false,
      showSubmissions: false,
    });
    expect(getManageMenuPolicy(makeBounty(BountyStatus.CLOSED, 5))).toEqual({
      canEdit: false,
      showSubmissions: true,
    });
  });
});
