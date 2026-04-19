import {
  UserRole,
  BountyStatus,
  RewardType,
  SocialChannel,
  PostFormat,
  PostVisibilityRule,
  DurationUnit,
  Currency,
  PaymentStatus,
} from '@social-bounty/shared';
import type {
  ChannelSelection,
  RewardLineInput,
  PostVisibilityInput,
  StructuredEligibilityInput,
  EngagementRequirementsInput,
  PayoutMetricsInput,
} from '@social-bounty/shared';
import { AuthenticatedUser } from '../../auth/jwt.strategy';

export interface CreateBountyTestData {
  title: string;
  shortDescription: string;
  fullInstructions: string;
  category: string;
  proofRequirements: string;
  maxSubmissions: number;
  startDate: string;
  endDate: string;
  channels: Record<string, string[]>;
  rewards: RewardLineInput[];
  postVisibility: PostVisibilityInput;
  structuredEligibility: StructuredEligibilityInput;
  currency: Currency;
  aiContentPermitted: boolean;
  engagementRequirements: EngagementRequirementsInput;
}

// ── User Fixtures ──────────────────────────────────

export const mockParticipant: AuthenticatedUser = {
  sub: 'participant-id',
  email: 'participant@test.com',
  role: UserRole.PARTICIPANT,
  brandId: null,
};

export const mockBA: AuthenticatedUser = {
  sub: 'ba-id',
  email: 'ba@test.com',
  role: UserRole.BUSINESS_ADMIN,
  brandId: 'org-1',
};

export const mockBA2: AuthenticatedUser = {
  sub: 'ba-2-id',
  email: 'ba2@test.com',
  role: UserRole.BUSINESS_ADMIN,
  brandId: 'org-2',
};

export const mockSA: AuthenticatedUser = {
  sub: 'sa-id',
  email: 'admin@test.com',
  role: UserRole.SUPER_ADMIN,
  brandId: null,
};

// ── Valid Create Data ──────────────────────────────

export function validCreateBountyData(): CreateBountyTestData {
  return {
    title: 'Share our product on Instagram',
    shortDescription: 'Post a photo or reel featuring our product',
    fullInstructions: '1. Unbox the product\n2. Post to Instagram\n3. Submit the URL',
    category: 'Social Media',
    proofRequirements: 'Submit the URL to your Instagram post.',
    maxSubmissions: 50,
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-04-01T00:00:00.000Z',
    channels: {
      [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST],
    },
    rewards: [
      { rewardType: RewardType.CASH, name: 'Cash reward', monetaryValue: 50 },
    ],
    postVisibility: {
      rule: PostVisibilityRule.MINIMUM_DURATION,
      minDurationValue: 7,
      minDurationUnit: DurationUnit.DAYS,
    },
    structuredEligibility: {
      minFollowers: 500,
      publicProfile: true,
      minAccountAgeDays: 90,
      locationRestriction: 'South Africa',
      noCompetingBrandDays: null,
      customRules: ['Must be 18 years or older'],
    },
    currency: Currency.ZAR,
    aiContentPermitted: false,
    engagementRequirements: {
      tagAccount: '@acmecorp',
      mention: true,
      comment: false,
    },
  };
}

// ── Base Bounty DB Record ──────────────────────────

export function baseBountyRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bounty-1',
    brandId: 'org-1',
    createdById: 'ba-id',
    title: 'Test Bounty',
    shortDescription: 'A test bounty',
    fullInstructions: 'Full instructions here',
    category: 'Social Media',
    rewardType: RewardType.CASH,
    rewardValue: 50,
    rewardDescription: 'Cash reward',
    maxSubmissions: 100,
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-03-01'),
    eligibilityRules: 'Min 500 followers. Public profile required.',
    proofRequirements: 'Submit URL',
    status: BountyStatus.DRAFT,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // New fields
    currency: Currency.ZAR,
    channels: { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] },
    aiContentPermitted: false,
    engagementRequirements: { tagAccount: '@acmecorp', mention: true, comment: false },
    postVisibilityRule: PostVisibilityRule.MINIMUM_DURATION,
    postMinDurationValue: 7,
    postMinDurationUnit: DurationUnit.DAYS,
    structuredEligibility: {
      minFollowers: 500,
      publicProfile: true,
      minAccountAgeDays: 90,
      locationRestriction: 'South Africa',
      noCompetingBrandDays: null,
      customRules: ['Must be 18 years or older'],
    },
    visibilityAcknowledged: false,
    payoutMetrics: null,
    paymentStatus: 'UNPAID',
    stripePaymentIntentId: null,
    ...overrides,
  };
}

export function baseBountyRewardRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reward-1',
    bountyId: 'bounty-1',
    rewardType: RewardType.CASH,
    name: 'Cash reward',
    monetaryValue: { toString: () => '50.00' },
    sortOrder: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

// ── Mock Prisma Factory ────────────────────────────

export function baseBrandAssetRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'asset-1',
    bountyId: 'bounty-1',
    userId: 'ba-id',
    fileName: 'logo.png',
    fileUrl: '/uploads/brand-assets/test-uuid.png',
    mimeType: 'image/png',
    fileSize: 1024,
    sortOrder: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockPrisma() {
  const bountyCreate = jest.fn();
  const bountyUpdate = jest.fn();
  const bountyFindUnique = jest.fn();
  const bountyFindMany = jest.fn();
  const bountyCount = jest.fn();
  const bountyDelete = jest.fn();
  const rewardCreateMany = jest.fn();
  const rewardDeleteMany = jest.fn();
  const rewardFindMany = jest.fn().mockResolvedValue([baseBountyRewardRecord()]);
  const submissionFindFirst = jest.fn();
  const submissionFindMany = jest.fn().mockResolvedValue([]);
  const bountyApplicationFindFirst = jest.fn();
  const bountyApplicationFindMany = jest.fn().mockResolvedValue([]);
  const ledgerEntryAggregate = jest
    .fn()
    .mockResolvedValue({ _sum: { amount: null } });
  const brandAssetCount = jest.fn();
  const brandAssetCreateManyAndReturn = jest.fn();
  const brandAssetFindUnique = jest.fn();
  const brandAssetDelete = jest.fn();

  const prisma = {
    bounty: {
      findMany: bountyFindMany,
      findUnique: bountyFindUnique,
      count: bountyCount,
      create: bountyCreate,
      update: bountyUpdate,
      delete: bountyDelete,
    },
    bountyReward: {
      createMany: rewardCreateMany,
      deleteMany: rewardDeleteMany,
      findMany: rewardFindMany,
    },
    submission: {
      findFirst: submissionFindFirst,
      findMany: submissionFindMany,
    },
    bountyApplication: {
      findFirst: bountyApplicationFindFirst,
      findMany: bountyApplicationFindMany,
    },
    ledgerEntry: {
      aggregate: ledgerEntryAggregate,
    },
    brandAsset: {
      count: brandAssetCount,
      createManyAndReturn: brandAssetCreateManyAndReturn,
      findUnique: brandAssetFindUnique,
      delete: brandAssetDelete,
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => {
      // The transaction callback receives a "tx" object that mirrors prisma
      // but uses the same mocks so tests can verify calls
      const tx = {
        bounty: {
          create: bountyCreate,
          update: bountyUpdate,
        },
        bountyReward: {
          createMany: rewardCreateMany,
          deleteMany: rewardDeleteMany,
          findMany: rewardFindMany,
        },
      };
      return fn(tx);
    }),
  };

  return prisma;
}

export function createMockAuditService() {
  return { log: jest.fn() };
}
