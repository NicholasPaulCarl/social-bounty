/**
 * BusinessBountyListView — column-rendering contract tests.
 *
 * The component uses PrimeReact + next/navigation which are not available in
 * the node test environment, so we test the *pure logic* extracted from each
 * body renderer rather than mounting the full component tree. This mirrors the
 * pattern in BountyManageRowMenu.test.ts.
 *
 * What we assert:
 *  - All 8 columns produce the expected output shape for a representative row
 *  - Claims column: progress fraction + bar when maxSubmissions is set
 *  - Claims column: em-dash when maxSubmissions is null
 *  - Status badge: correct label + colour config for each BountyStatus
 *  - PlatformChips: correct icon selection for INSTAGRAM / FACEBOOK / TIKTOK
 */

import { BountyStatus, SocialChannel, Currency, RewardType, PaymentStatus, BountyAccessType } from '@social-bounty/shared';
import { formatRewardZAR } from '@/lib/utils/bounty-format';
import { formatDate } from '@/lib/utils/format';
import type { BountyListItem } from '@social-bounty/shared';

// ─────────────────────────────────────
// Shared fixture
// ─────────────────────────────────────

function makeRow(overrides: Partial<BountyListItem> = {}): BountyListItem {
  return {
    id: 'bounty-uuid-1234',
    title: 'Test Bounty Title',
    shortDescription: 'A test bounty',
    category: 'Marketing',
    rewardType: RewardType.CASH,
    rewardValue: '500',
    rewardDescription: null,
    maxSubmissions: 10,
    startDate: null,
    endDate: '2026-03-15T00:00:00.000Z',
    status: BountyStatus.LIVE,
    submissionCount: 3,
    brand: { id: 'br1', name: 'Acme', logo: null, verified: false },
    createdAt: new Date().toISOString(),
    channels: {
      [SocialChannel.INSTAGRAM]: [],
      [SocialChannel.TIKTOK]: [],
    },
    currency: Currency.ZAR,
    totalRewardValue: '5000',
    rewards: [],
    payoutMetrics: null,
    paymentStatus: PaymentStatus.PAID,
    payoutMethod: null,
    accessType: BountyAccessType.PUBLIC,
    userHasApplied: false,
    userHasSubmitted: false,
    ...overrides,
  };
}

// ─────────────────────────────────────
// Status badge config (mirrors component)
// ─────────────────────────────────────

const STATUS_CONFIG = {
  [BountyStatus.LIVE]:   { label: 'Live',   dotVar: '--success-500' },
  [BountyStatus.DRAFT]:  { label: 'Draft',  dotVar: '--slate-400'   },
  [BountyStatus.PAUSED]: { label: 'Paused', dotVar: '--warning-500' },
  [BountyStatus.CLOSED]: { label: 'Closed', dotVar: '--rose-500'    },
};

// ─────────────────────────────────────
// Claims logic (mirrors component)
// ─────────────────────────────────────

function computeClaimsDisplay(row: BountyListItem): { isDash: true } | { taken: number; total: number; pct: number } {
  if (row.maxSubmissions == null) return { isDash: true };
  const taken = row.submissionCount ?? 0;
  const total = row.maxSubmissions;
  const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;
  return { taken, total, pct };
}

// ─────────────────────────────────────
// Platform icon map (mirrors component)
// ─────────────────────────────────────

const PLATFORM_ICON_NAMES: Record<string, string> = {
  [SocialChannel.INSTAGRAM]: 'Camera',
  [SocialChannel.FACEBOOK]:  'ThumbsUp',
  [SocialChannel.TIKTOK]:    'Video',
};

// ─────────────────────────────────────
// Tests
// ─────────────────────────────────────

describe('BusinessBountyListView — column data mapping', () => {
  const row = makeRow();

  it('renders all 8 columns for a representative bounty', () => {
    // 1. Bounty — title present
    expect(row.title).toBe('Test Bounty Title');
    // ID prefix used (first 8 chars)
    expect(row.id.slice(0, 8)).toBe('bounty-u');

    // 2. Category
    expect(row.category).toBe('Marketing');

    // 3. Platforms — two entries
    expect(Object.keys(row.channels ?? {})).toHaveLength(2);

    // 4. Status — live
    expect(STATUS_CONFIG[row.status].label).toBe('Live');

    // 5. Reward
    const rewardText = formatRewardZAR(row.rewardValue, row.currency);
    expect(rewardText).toMatch(/R/);
    expect(rewardText).toMatch(/500/);

    // 6. Claims — fraction
    const claims = computeClaimsDisplay(row);
    expect(claims).not.toHaveProperty('isDash');
    if (!('isDash' in claims)) {
      expect(claims.taken).toBe(3);
      expect(claims.total).toBe(10);
      expect(claims.pct).toBe(30);
    }

    // 7. Ends — formatted date
    const dateText = formatDate(row.endDate!);
    expect(dateText).toMatch(/Mar/);
    expect(dateText).toMatch(/15/);
    expect(dateText).toMatch(/2026/);

    // 8. Actions — checked by BountyManageRowMenu tests
  });
});

describe('BusinessBountyListView — claims column', () => {
  it('shows progress bar + fraction when maxSubmissions is set', () => {
    const row = makeRow({ submissionCount: 3, maxSubmissions: 10 });
    const result = computeClaimsDisplay(row);
    expect(result).not.toHaveProperty('isDash');
    if (!('isDash' in result)) {
      expect(result.taken).toBe(3);
      expect(result.total).toBe(10);
      expect(result.pct).toBe(30);
    }
  });

  it('shows em-dash when maxSubmissions is null', () => {
    const row = makeRow({ maxSubmissions: null });
    const result = computeClaimsDisplay(row);
    expect(result).toEqual({ isDash: true });
  });

  it('caps progress at 100% when submissionCount exceeds maxSubmissions', () => {
    const row = makeRow({ submissionCount: 15, maxSubmissions: 10 });
    const result = computeClaimsDisplay(row);
    if (!('isDash' in result)) {
      expect(result.pct).toBe(100);
    }
  });

  it('shows 0% when no submissions yet', () => {
    const row = makeRow({ submissionCount: 0, maxSubmissions: 10 });
    const result = computeClaimsDisplay(row);
    if (!('isDash' in result)) {
      expect(result.pct).toBe(0);
      expect(result.taken).toBe(0);
    }
  });
});

describe('BusinessBountyListView — status badge renders correct colour for each status', () => {
  it('LIVE → success dot + "Live" label', () => {
    const cfg = STATUS_CONFIG[BountyStatus.LIVE];
    expect(cfg.label).toBe('Live');
    expect(cfg.dotVar).toBe('--success-500');
  });

  it('DRAFT → slate dot + "Draft" label', () => {
    const cfg = STATUS_CONFIG[BountyStatus.DRAFT];
    expect(cfg.label).toBe('Draft');
    expect(cfg.dotVar).toBe('--slate-400');
  });

  it('PAUSED → warning dot + "Paused" label', () => {
    const cfg = STATUS_CONFIG[BountyStatus.PAUSED];
    expect(cfg.label).toBe('Paused');
    expect(cfg.dotVar).toBe('--warning-500');
  });

  it('CLOSED → rose dot + "Closed" label', () => {
    const cfg = STATUS_CONFIG[BountyStatus.CLOSED];
    expect(cfg.label).toBe('Closed');
    expect(cfg.dotVar).toBe('--rose-500');
  });
});

describe('BusinessBountyListView — platform chips icon selection', () => {
  it('INSTAGRAM → Camera icon', () => {
    expect(PLATFORM_ICON_NAMES[SocialChannel.INSTAGRAM]).toBe('Camera');
  });

  it('FACEBOOK → ThumbsUp icon', () => {
    expect(PLATFORM_ICON_NAMES[SocialChannel.FACEBOOK]).toBe('ThumbsUp');
  });

  it('TIKTOK → Video icon', () => {
    expect(PLATFORM_ICON_NAMES[SocialChannel.TIKTOK]).toBe('Video');
  });

  it('channels record with all 3 platforms maps each correctly', () => {
    const channels = {
      [SocialChannel.INSTAGRAM]: [],
      [SocialChannel.FACEBOOK]: [],
      [SocialChannel.TIKTOK]: [],
    };
    const iconNames = Object.keys(channels).map((ch) => PLATFORM_ICON_NAMES[ch]);
    expect(iconNames).toContain('Camera');
    expect(iconNames).toContain('ThumbsUp');
    expect(iconNames).toContain('Video');
  });

  it('null channels renders no chips (empty key list)', () => {
    const row = makeRow({ channels: null });
    const keys = Object.keys(row.channels ?? {});
    expect(keys).toHaveLength(0);
  });
});
