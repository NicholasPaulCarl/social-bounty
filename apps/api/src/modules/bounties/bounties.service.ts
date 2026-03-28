import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
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
  PayoutMethod,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  PAGINATION_DEFAULTS,
  CHANNEL_POST_FORMATS,
  BOUNTY_REWARD_LIMITS,
  BRAND_ASSET_LIMITS,
} from '@social-bounty/shared';
import type { BrandAssetInfo } from '@social-bounty/shared';
import type {
  ChannelSelection,
  RewardLineInput,
  StructuredEligibilityInput,
  PostVisibilityInput,
  EngagementRequirementsInput,
  PayoutMetricsInput,
  RewardLineResponse,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

const LIVE_EDITABLE_FIELDS = new Set([
  'eligibilityRules',
  'proofRequirements',
  'maxSubmissions',
  'endDate',
]);

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['LIVE'],
  LIVE: ['PAUSED', 'CLOSED'],
  PAUSED: ['LIVE', 'CLOSED'],
};

@Injectable()
export class BountiesService {
  private readonly logger = new Logger(BountiesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ── Validation helpers ─────────────────────────────────

  private validateChannels(channels: ChannelSelection): void {
    const entries = Object.entries(channels);
    if (entries.length === 0) {
      throw new BadRequestException('At least one channel must be selected');
    }

    for (const [channel, formats] of entries) {
      if (!Object.values(SocialChannel).includes(channel as SocialChannel)) {
        throw new BadRequestException(`Invalid channel: ${channel}`);
      }

      const allowedFormats = CHANNEL_POST_FORMATS[channel as SocialChannel];
      if (!Array.isArray(formats) || formats.length === 0) {
        throw new BadRequestException(
          `At least one post format is required for channel ${channel}`,
        );
      }

      const seen = new Set<string>();
      for (const format of formats) {
        if (!allowedFormats.includes(format as PostFormat)) {
          throw new BadRequestException(
            `Invalid post format "${format}" for channel ${channel}. Allowed: ${allowedFormats.join(', ')}`,
          );
        }
        if (seen.has(format)) {
          throw new BadRequestException(
            `Duplicate post format "${format}" for channel ${channel}`,
          );
        }
        seen.add(format);
      }
    }
  }

  private static readonly DURATION_LIMITS: Record<string, { min: number; max: number }> = {
    [DurationUnit.HOURS]: { min: 1, max: 168 },
    [DurationUnit.DAYS]: { min: 1, max: 90 },
    [DurationUnit.WEEKS]: { min: 1, max: 12 },
  };

  private static readonly TAG_ACCOUNT_REGEX = /^@[a-zA-Z0-9_.]{1,99}$/;

  private validatePostVisibility(input: PostVisibilityInput): void {
    if (!Object.values(PostVisibilityRule).includes(input.rule as PostVisibilityRule)) {
      throw new BadRequestException(`Invalid post visibility rule: ${input.rule}`);
    }

    if (input.rule === PostVisibilityRule.MUST_NOT_REMOVE) {
      if (input.minDurationValue != null || input.minDurationUnit != null) {
        throw new BadRequestException(
          'Duration fields must be null when rule is MUST_NOT_REMOVE',
        );
      }
      return;
    }

    if (input.rule === PostVisibilityRule.MINIMUM_DURATION) {
      if (!input.minDurationValue || input.minDurationValue <= 0) {
        throw new BadRequestException(
          'Duration value must be > 0 when rule is MINIMUM_DURATION',
        );
      }
      if (!input.minDurationUnit) {
        throw new BadRequestException(
          'Duration unit is required when rule is MINIMUM_DURATION',
        );
      }
      if (
        !Object.values(DurationUnit).includes(
          input.minDurationUnit as DurationUnit,
        )
      ) {
        throw new BadRequestException(
          `Invalid duration unit: ${input.minDurationUnit}`,
        );
      }
      const limits = BountiesService.DURATION_LIMITS[input.minDurationUnit];
      if (limits && (input.minDurationValue < limits.min || input.minDurationValue > limits.max)) {
        throw new BadRequestException(
          `Duration value for ${input.minDurationUnit} must be between ${limits.min} and ${limits.max}`,
        );
      }
    }
  }

  private validateRewards(rewards: RewardLineInput[]): void {
    if (!Array.isArray(rewards) || rewards.length === 0) {
      throw new BadRequestException('At least one reward line is required');
    }
    if (rewards.length > BOUNTY_REWARD_LIMITS.MAX_REWARD_LINES) {
      throw new BadRequestException(
        `Maximum ${BOUNTY_REWARD_LIMITS.MAX_REWARD_LINES} reward lines allowed`,
      );
    }
    for (const r of rewards) {
      if (!Object.values(RewardType).includes(r.rewardType as RewardType)) {
        throw new BadRequestException(`Invalid reward type: ${r.rewardType}`);
      }
      if (!r.name || r.name.trim().length === 0) {
        throw new BadRequestException('Reward name is required');
      }
      if (r.name.length > BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX) {
        throw new BadRequestException(
          `Reward name must be ${BOUNTY_REWARD_LIMITS.REWARD_NAME_MAX} characters or less`,
        );
      }
      if (typeof r.monetaryValue !== 'number' || isNaN(r.monetaryValue) || r.monetaryValue <= 0) {
        throw new BadRequestException('Reward monetary value must be a positive number');
      }
      // Check max 2 decimal places using epsilon comparison
      const cents = Math.round(r.monetaryValue * 100);
      if (Math.abs(r.monetaryValue * 100 - cents) > 1e-9) {
        throw new BadRequestException('Reward monetary value may have at most 2 decimal places');
      }
    }
  }

  private validateStructuredEligibility(input: StructuredEligibilityInput): void {
    if (input.minFollowers != null) {
      if (!Number.isInteger(input.minFollowers) || input.minFollowers <= 0) {
        throw new BadRequestException('minFollowers must be a positive integer');
      }
    }
    if (input.minAccountAgeDays != null) {
      if (!Number.isInteger(input.minAccountAgeDays) || input.minAccountAgeDays <= 0) {
        throw new BadRequestException('minAccountAgeDays must be a positive integer');
      }
    }
    if (input.noCompetingBrandDays != null) {
      if (!Number.isInteger(input.noCompetingBrandDays) || input.noCompetingBrandDays < 0) {
        throw new BadRequestException('noCompetingBrandDays must be a non-negative integer');
      }
    }
    if (input.locationRestriction != null && input.locationRestriction.length > 200) {
      throw new BadRequestException('locationRestriction must be 200 characters or less');
    }
    if (input.customRules) {
      if (input.customRules.length > BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES) {
        throw new BadRequestException(
          `Maximum ${BOUNTY_REWARD_LIMITS.MAX_CUSTOM_ELIGIBILITY_RULES} custom eligibility rules allowed`,
        );
      }
      for (const rule of input.customRules) {
        if (typeof rule !== 'string') {
          throw new BadRequestException('Each custom eligibility rule must be a string');
        }
        if (rule.trim().length === 0) {
          throw new BadRequestException('Custom eligibility rules must not be empty');
        }
        if (rule.length > BOUNTY_REWARD_LIMITS.CUSTOM_RULE_MAX_LENGTH) {
          throw new BadRequestException(
            `Each custom rule must be ${BOUNTY_REWARD_LIMITS.CUSTOM_RULE_MAX_LENGTH} characters or less`,
          );
        }
      }
    }
  }

  private validateEngagementRequirements(input: EngagementRequirementsInput): void {
    if (input.tagAccount != null) {
      if (!BountiesService.TAG_ACCOUNT_REGEX.test(input.tagAccount)) {
        throw new BadRequestException(
          'tagAccount must start with @ followed by 1-99 alphanumeric characters, underscores, or dots',
        );
      }
    }
  }

  private generateEligibilityText(
    structured: StructuredEligibilityInput,
  ): string {
    const parts: string[] = [];

    if (structured.minFollowers != null && structured.minFollowers > 0) {
      parts.push(`Minimum ${structured.minFollowers} followers`);
    }
    if (structured.publicProfile) {
      parts.push('Public profile required');
    }
    if (
      structured.minAccountAgeDays != null &&
      structured.minAccountAgeDays > 0
    ) {
      parts.push(`Account must be at least ${structured.minAccountAgeDays} days old`);
    }
    if (structured.locationRestriction) {
      parts.push(`Location: ${structured.locationRestriction}`);
    }
    if (
      structured.noCompetingBrandDays != null &&
      structured.noCompetingBrandDays > 0
    ) {
      parts.push(
        `No competing brand posts in last ${structured.noCompetingBrandDays} days`,
      );
    }
    if (structured.customRules && structured.customRules.length > 0) {
      for (const rule of structured.customRules) {
        parts.push(rule);
      }
    }

    return parts.length > 0 ? parts.join('. ') + '.' : 'No specific eligibility requirements.';
  }

  private mapRewards(
    rewards: Array<{
      id: string;
      rewardType: string;
      name: string;
      monetaryValue: { toString(): string };
      sortOrder: number;
    }>,
  ): RewardLineResponse[] {
    return rewards.map((r) => ({
      id: r.id,
      rewardType: r.rewardType as RewardType,
      name: r.name,
      monetaryValue: r.monetaryValue.toString(),
      sortOrder: r.sortOrder,
    }));
  }

  private mapBrandAssets(
    assets: Array<{
      id: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      createdAt: Date;
    }>,
  ): BrandAssetInfo[] {
    return assets.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  private computeTotalRewardValue(
    rewards: Array<{ monetaryValue: { toString(): string } }>,
  ): string {
    let total = 0;
    for (const r of rewards) {
      total += parseFloat(r.monetaryValue.toString());
    }
    return total.toFixed(2);
  }

  // ── List ───────────────────────────────────────────────

  async list(
    user: AuthenticatedUser,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      status?: BountyStatus;
      category?: string;
      rewardType?: RewardType;
      search?: string;
      organisationId?: string;
    },
  ) {
    const page = params.page || PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      params.limit || PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const sortBy = params.sortBy || PAGINATION_DEFAULTS.SORT_BY;
    const sortOrder = params.sortOrder || PAGINATION_DEFAULTS.SORT_ORDER;

    const where: Prisma.BountyWhereInput = { deletedAt: null };

    // Role-based filtering
    if (user.role === UserRole.PARTICIPANT) {
      where.status = BountyStatus.LIVE;
    } else if (user.role === UserRole.BUSINESS_ADMIN) {
      where.organisationId = user.organisationId || undefined;
      if (params.status) where.status = params.status;
    } else {
      // Super Admin sees all
      if (params.status) where.status = params.status;
      if (params.organisationId)
        where.organisationId = params.organisationId;
    }

    if (params.category) where.category = params.category;
    if (params.rewardType) where.rewardType = params.rewardType;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        {
          shortDescription: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [bounties, total] = await Promise.all([
      this.prisma.bounty.findMany({
        where,
        include: {
          organisation: {
            select: { id: true, name: true, logo: true },
          },
          rewards: {
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { submissions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.bounty.count({ where }),
    ]);

    return {
      data: bounties.map((b) => ({
        id: b.id,
        title: b.title,
        shortDescription: b.shortDescription,
        category: b.category,
        rewardType: b.rewardType,
        rewardValue: b.rewardValue?.toString() || null,
        rewardDescription: b.rewardDescription,
        maxSubmissions: b.maxSubmissions,
        startDate: b.startDate?.toISOString() || null,
        endDate: b.endDate?.toISOString() || null,
        status: b.status,
        submissionCount: b._count.submissions,
        organisation: b.organisation,
        channels: b.channels as Record<string, string[]> | null,
        currency: b.currency,
        totalRewardValue:
          b.rewards.length > 0 ? this.computeTotalRewardValue(b.rewards) : null,
        rewards: this.mapRewards(b.rewards),
        payoutMetrics: (b as any).payoutMetrics as PayoutMetricsInput | null ?? null,
        paymentStatus: (b as any).paymentStatus ?? PaymentStatus.UNPAID,
        payoutMethod: (b as any).payoutMethod ?? null,
        createdAt: b.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Find by ID ─────────────────────────────────────────

  async findById(id: string, user: AuthenticatedUser) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id },
      include: {
        organisation: {
          select: { id: true, name: true, logo: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        rewards: {
          orderBy: { sortOrder: 'asc' },
        },
        brandAssets: {
          select: { id: true, fileName: true, mimeType: true, fileSize: true, createdAt: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    // RBAC checks
    if (user.role === UserRole.PARTICIPANT && bounty.status !== BountyStatus.LIVE) {
      throw new ForbiddenException('Bounty not accessible');
    }

    if (
      user.role === UserRole.BUSINESS_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized to view this bounty');
    }

    // Check if participant has already submitted
    let userSubmission = null;
    if (user.role === UserRole.PARTICIPANT) {
      const submission = await this.prisma.submission.findFirst({
        where: { bountyId: id, userId: user.sub },
        select: { id: true, status: true, payoutStatus: true },
      });
      if (submission) {
        userSubmission = {
          id: submission.id,
          status: submission.status,
          payoutStatus: submission.payoutStatus,
        };
      }
    }

    const submissionCount = bounty._count.submissions;
    const remainingSubmissions =
      bounty.maxSubmissions != null
        ? bounty.maxSubmissions - submissionCount
        : null;

    return {
      id: bounty.id,
      title: bounty.title,
      shortDescription: bounty.shortDescription,
      fullInstructions: bounty.fullInstructions,
      category: bounty.category,
      rewardType: bounty.rewardType,
      rewardValue: bounty.rewardValue?.toString() || null,
      rewardDescription: bounty.rewardDescription,
      maxSubmissions: bounty.maxSubmissions,
      remainingSubmissions,
      startDate: bounty.startDate?.toISOString() || null,
      endDate: bounty.endDate?.toISOString() || null,
      eligibilityRules: bounty.eligibilityRules,
      proofRequirements: bounty.proofRequirements,
      status: bounty.status,
      submissionCount,
      organisation: bounty.organisation,
      createdBy: bounty.createdBy,
      userSubmission,
      createdAt: bounty.createdAt.toISOString(),
      updatedAt: bounty.updatedAt.toISOString(),
      // New fields
      channels: bounty.channels as ChannelSelection | null,
      currency: bounty.currency,
      aiContentPermitted: bounty.aiContentPermitted,
      engagementRequirements:
        (bounty.engagementRequirements as EngagementRequirementsInput | null),
      postVisibility: bounty.postVisibilityRule
        ? {
            rule: bounty.postVisibilityRule,
            minDurationValue: bounty.postMinDurationValue,
            minDurationUnit: bounty.postMinDurationUnit,
          }
        : null,
      structuredEligibility:
        (bounty.structuredEligibility as StructuredEligibilityInput | null),
      visibilityAcknowledged: bounty.visibilityAcknowledged,
      rewards: this.mapRewards(bounty.rewards),
      totalRewardValue:
        bounty.rewards.length > 0
          ? this.computeTotalRewardValue(bounty.rewards)
          : null,
      payoutMetrics: (bounty as any).payoutMetrics as PayoutMetricsInput | null ?? null,
      paymentStatus: (bounty as any).paymentStatus ?? PaymentStatus.UNPAID,
      payoutMethod: (bounty as any).payoutMethod ?? null,
      brandAssets: this.mapBrandAssets(bounty.brandAssets),
    };
  }

  // ── Create ─────────────────────────────────────────────

  private validatePayoutMetrics(input: PayoutMetricsInput): void {
    if (input.minViews != null) {
      if (!Number.isInteger(input.minViews) || input.minViews < 0) {
        throw new BadRequestException('minViews must be a non-negative integer');
      }
    }
    if (input.minLikes != null) {
      if (!Number.isInteger(input.minLikes) || input.minLikes < 0) {
        throw new BadRequestException('minLikes must be a non-negative integer');
      }
    }
    if (input.minComments != null) {
      if (!Number.isInteger(input.minComments) || input.minComments < 0) {
        throw new BadRequestException('minComments must be a non-negative integer');
      }
    }
  }

  async create(
    user: AuthenticatedUser,
    data: {
      title: string;
      shortDescription?: string;
      fullInstructions?: string;
      category?: string;
      proofRequirements?: string;
      maxSubmissions?: number | null;
      startDate?: string | null;
      endDate?: string | null;
      // New structured fields (optional for draft saves)
      channels?: ChannelSelection;
      rewards?: RewardLineInput[];
      postVisibility?: PostVisibilityInput;
      structuredEligibility?: StructuredEligibilityInput;
      currency?: Currency;
      aiContentPermitted?: boolean;
      engagementRequirements?: EngagementRequirementsInput;
      payoutMetrics?: PayoutMetricsInput;
      payoutMethod?: PayoutMethod;
      // Legacy fields (optional)
      rewardType?: RewardType;
      rewardValue?: number | null;
      rewardDescription?: string | null;
      eligibilityRules?: string;
    },
    ipAddress?: string,
  ) {
    if (!user.organisationId) {
      throw new BadRequestException('You must belong to an organisation to create bounties');
    }

    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate maxSubmissions if provided
    if (data.maxSubmissions != null) {
      if (!Number.isInteger(data.maxSubmissions) || data.maxSubmissions <= 0) {
        throw new BadRequestException('maxSubmissions must be a positive integer');
      }
    }

    // Validate currency enum if provided
    if (data.currency != null && !Object.values(Currency).includes(data.currency as Currency)) {
      throw new BadRequestException(`Invalid currency: ${data.currency}`);
    }

    // Validate structured fields only if provided (allows draft saves with minimal data)
    if (data.channels && Object.keys(data.channels).length > 0) {
      this.validateChannels(data.channels);
    }
    if (data.rewards && data.rewards.length > 0) {
      this.validateRewards(data.rewards);
    }
    if (data.postVisibility) {
      this.validatePostVisibility(data.postVisibility);
    }
    if (data.structuredEligibility) {
      this.validateStructuredEligibility(data.structuredEligibility);
    }
    if (data.engagementRequirements) {
      this.validateEngagementRequirements(data.engagementRequirements);
    }
    if (data.payoutMetrics) {
      this.validatePayoutMetrics(data.payoutMetrics);
    }

    // Compute legacy fields from structured data (if available)
    const hasRewards = data.rewards && data.rewards.length > 0;
    const legacyRewardType = data.rewardType ?? (hasRewards ? data.rewards![0].rewardType : RewardType.CASH);
    const legacyRewardValue =
      data.rewardValue ??
      (hasRewards ? data.rewards!.reduce((sum, r) => sum + r.monetaryValue, 0) : undefined);
    const legacyRewardDescription =
      data.rewardDescription ?? (hasRewards ? data.rewards!.map((r) => r.name).join(', ') : undefined);
    const legacyEligibilityRules =
      data.eligibilityRules ?? (data.structuredEligibility ? this.generateEligibilityText(data.structuredEligibility) : undefined);

    // Atomic transaction: create bounty + reward rows
    const result = await this.prisma.$transaction(async (tx) => {
      const bounty = await tx.bounty.create({
        data: {
          organisationId: user.organisationId!,
          createdById: user.sub,
          title: data.title.trim(),
          shortDescription: data.shortDescription?.trim() ?? '',
          fullInstructions: data.fullInstructions?.trim() ?? '',
          category: data.category?.trim() ?? '',
          proofRequirements: data.proofRequirements?.trim() ?? '',
          maxSubmissions: data.maxSubmissions ?? undefined,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          status: BountyStatus.DRAFT,
          // Legacy fields (populated from structured data if available)
          rewardType: legacyRewardType,
          rewardValue: legacyRewardValue,
          rewardDescription: legacyRewardDescription,
          eligibilityRules: legacyEligibilityRules ?? '',
          // New structured fields (conditionally set)
          currency: data.currency ?? Currency.ZAR,
          channels: data.channels ? data.channels as Prisma.InputJsonValue : undefined,
          aiContentPermitted: data.aiContentPermitted ?? false,
          engagementRequirements: data.engagementRequirements
            ? data.engagementRequirements as Prisma.InputJsonValue
            : undefined,
          postVisibilityRule: data.postVisibility?.rule ?? undefined,
          postMinDurationValue: data.postVisibility?.minDurationValue ?? null,
          postMinDurationUnit: data.postVisibility?.minDurationUnit ?? null,
          structuredEligibility: data.structuredEligibility
            ? data.structuredEligibility as Prisma.InputJsonValue
            : undefined,
          payoutMetrics: data.payoutMetrics
            ? data.payoutMetrics as Prisma.InputJsonValue
            : undefined,
          payoutMethod: data.payoutMethod ?? undefined,
          visibilityAcknowledged: false,
        },
      });

      // Create reward rows (if any provided)
      let rewards: any[] = [];
      if (hasRewards) {
        const rewardRows = data.rewards!.map((r, index) => ({
          bountyId: bounty.id,
          rewardType: r.rewardType,
          name: r.name.trim(),
          monetaryValue: r.monetaryValue,
          sortOrder: index,
        }));

        await tx.bountyReward.createMany({ data: rewardRows });

        rewards = await tx.bountyReward.findMany({
          where: { bountyId: bounty.id },
          orderBy: { sortOrder: 'asc' },
        });
      }

      return { bounty, rewards };
    });

    // Fire-and-forget audit log
    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_CREATE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: result.bounty.id,
      afterState: { title: result.bounty.title, status: result.bounty.status },
      ipAddress,
    });

    return {
      id: result.bounty.id,
      title: result.bounty.title,
      shortDescription: result.bounty.shortDescription,
      fullInstructions: result.bounty.fullInstructions,
      category: result.bounty.category,
      rewardType: result.bounty.rewardType,
      rewardValue: result.bounty.rewardValue?.toString() || null,
      rewardDescription: result.bounty.rewardDescription,
      maxSubmissions: result.bounty.maxSubmissions,
      startDate: result.bounty.startDate?.toISOString() || null,
      endDate: result.bounty.endDate?.toISOString() || null,
      eligibilityRules: result.bounty.eligibilityRules,
      proofRequirements: result.bounty.proofRequirements,
      status: result.bounty.status,
      organisationId: result.bounty.organisationId,
      createdById: result.bounty.createdById,
      createdAt: result.bounty.createdAt.toISOString(),
      updatedAt: result.bounty.updatedAt.toISOString(),
      // New fields
      channels: result.bounty.channels as ChannelSelection | null,
      currency: result.bounty.currency,
      aiContentPermitted: result.bounty.aiContentPermitted,
      engagementRequirements:
        result.bounty.engagementRequirements as EngagementRequirementsInput | null,
      postVisibility: result.bounty.postVisibilityRule
        ? {
            rule: result.bounty.postVisibilityRule,
            minDurationValue: result.bounty.postMinDurationValue,
            minDurationUnit: result.bounty.postMinDurationUnit,
          }
        : null,
      structuredEligibility:
        result.bounty.structuredEligibility as StructuredEligibilityInput | null,
      visibilityAcknowledged: result.bounty.visibilityAcknowledged,
      rewards: this.mapRewards(result.rewards),
      totalRewardValue: result.rewards.length > 0
        ? this.computeTotalRewardValue(result.rewards)
        : null,
      payoutMetrics: (result.bounty as any).payoutMetrics as PayoutMetricsInput | null ?? null,
      paymentStatus: (result.bounty as any).paymentStatus ?? PaymentStatus.UNPAID,
      payoutMethod: (result.bounty as any).payoutMethod ?? null,
    };
  }

  // ── Update ─────────────────────────────────────────────

  async update(
    id: string,
    user: AuthenticatedUser,
    data: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id },
    });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status === BountyStatus.CLOSED) {
      throw new BadRequestException('Cannot edit a closed bounty');
    }

    // Enforce field restrictions for LIVE bounties
    if (bounty.status === BountyStatus.LIVE) {
      const invalidFields = Object.keys(data).filter(
        (key) => !LIVE_EDITABLE_FIELDS.has(key),
      );
      if (invalidFields.length > 0) {
        throw new BadRequestException(
          `Cannot edit these fields on a LIVE bounty: ${invalidFields.join(', ')}`,
        );
      }
    }

    const beforeState = {
      title: bounty.title,
      shortDescription: bounty.shortDescription,
      status: bounty.status,
    };

    // Build update data safely
    const updateData: Prisma.BountyUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title as string;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription as string;
    if (data.fullInstructions !== undefined) updateData.fullInstructions = data.fullInstructions as string;
    if (data.category !== undefined) updateData.category = data.category as string;
    if (data.rewardType !== undefined) updateData.rewardType = data.rewardType as RewardType;
    if (data.rewardValue !== undefined) updateData.rewardValue = data.rewardValue as number | null;
    if (data.rewardDescription !== undefined) updateData.rewardDescription = data.rewardDescription as string | null;
    if (data.maxSubmissions !== undefined) updateData.maxSubmissions = data.maxSubmissions as number | null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate as string) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate as string) : null;
    if (data.eligibilityRules !== undefined) updateData.eligibilityRules = data.eligibilityRules as string;
    if (data.proofRequirements !== undefined) updateData.proofRequirements = data.proofRequirements as string;

    // New structured fields
    if (data.currency !== undefined) updateData.currency = data.currency as Currency;
    if (data.aiContentPermitted !== undefined) updateData.aiContentPermitted = data.aiContentPermitted as boolean;
    if (data.channels !== undefined) {
      const channels = data.channels as ChannelSelection;
      this.validateChannels(channels);
      updateData.channels = channels as Prisma.InputJsonValue;
    }
    if (data.engagementRequirements !== undefined) {
      const er = data.engagementRequirements as EngagementRequirementsInput;
      if (er) this.validateEngagementRequirements(er);
      updateData.engagementRequirements = data.engagementRequirements as Prisma.InputJsonValue;
    }
    if (data.postVisibility !== undefined) {
      const pv = data.postVisibility as PostVisibilityInput;
      this.validatePostVisibility(pv);
      updateData.postVisibilityRule = pv.rule;
      updateData.postMinDurationValue = pv.minDurationValue ?? null;
      updateData.postMinDurationUnit = pv.minDurationUnit ?? null;
      // Reset acknowledgment when visibility rule changes
      updateData.visibilityAcknowledged = false;
    }
    if (data.structuredEligibility !== undefined) {
      const se = data.structuredEligibility as StructuredEligibilityInput;
      if (se) this.validateStructuredEligibility(se);
      updateData.structuredEligibility = se as Prisma.InputJsonValue;
      // Update legacy eligibility text
      updateData.eligibilityRules = this.generateEligibilityText(se);
    }
    if ((data as any).payoutMetrics !== undefined) {
      const pm = (data as any).payoutMetrics as PayoutMetricsInput;
      if (pm) this.validatePayoutMetrics(pm);
      (updateData as any).payoutMetrics = pm ? pm as Prisma.InputJsonValue : Prisma.DbNull;
    }
    if ((data as any).payoutMethod !== undefined) {
      (updateData as any).payoutMethod = (data as any).payoutMethod as PayoutMethod | null;
    }

    // Handle rewards update within a transaction if rewards are provided
    let updatedBounty: any;
    let rewards: any[] = [];

    if (data.rewards !== undefined) {
      const rewardInputs = data.rewards as RewardLineInput[];
      if (rewardInputs.length > 0) {
        this.validateRewards(rewardInputs);
        const result = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.bounty.update({
            where: { id },
            data: {
              ...updateData,
              rewardType: rewardInputs[0].rewardType,
              rewardValue: rewardInputs.reduce(
                (sum, r) => sum + r.monetaryValue,
                0,
              ),
              rewardDescription: rewardInputs.map((r) => r.name).join(', '),
            },
            include: {
              organisation: { select: { id: true, name: true, logo: true } },
              createdBy: { select: { id: true, firstName: true, lastName: true } },
              _count: { select: { submissions: true } },
            },
          });

          await tx.bountyReward.deleteMany({ where: { bountyId: id } });
          const rewardRows = rewardInputs.map((r, index) => ({
            bountyId: id,
            rewardType: r.rewardType,
            name: r.name.trim(),
            monetaryValue: r.monetaryValue,
            sortOrder: index,
          }));
          await tx.bountyReward.createMany({ data: rewardRows });

          const newRewards = await tx.bountyReward.findMany({
            where: { bountyId: id },
            orderBy: { sortOrder: 'asc' },
          });

          return { updated, newRewards };
        });

        updatedBounty = result.updated;
        rewards = result.newRewards;
      } else {
        // Empty rewards array - just update without touching rewards
        updatedBounty = await this.prisma.bounty.update({
          where: { id },
          data: updateData,
          include: {
            organisation: { select: { id: true, name: true, logo: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            rewards: { orderBy: { sortOrder: 'asc' } },
            _count: { select: { submissions: true } },
          },
        });
        rewards = updatedBounty.rewards || [];
      }
    } else {
      updatedBounty = await this.prisma.bounty.update({
        where: { id },
        data: updateData,
        include: {
          organisation: { select: { id: true, name: true, logo: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          rewards: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { submissions: true } },
        },
      });
      rewards = updatedBounty.rewards || [];
    }

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_UPDATE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: id,
      beforeState,
      afterState: { title: updatedBounty.title, status: updatedBounty.status },
      ipAddress,
    });

    return {
      id: updatedBounty.id,
      title: updatedBounty.title,
      shortDescription: updatedBounty.shortDescription,
      fullInstructions: updatedBounty.fullInstructions,
      category: updatedBounty.category,
      rewardType: updatedBounty.rewardType,
      rewardValue: updatedBounty.rewardValue?.toString() || null,
      rewardDescription: updatedBounty.rewardDescription,
      maxSubmissions: updatedBounty.maxSubmissions,
      remainingSubmissions: updatedBounty.maxSubmissions != null
        ? updatedBounty.maxSubmissions - updatedBounty._count.submissions
        : null,
      startDate: updatedBounty.startDate?.toISOString() || null,
      endDate: updatedBounty.endDate?.toISOString() || null,
      eligibilityRules: updatedBounty.eligibilityRules,
      proofRequirements: updatedBounty.proofRequirements,
      status: updatedBounty.status,
      submissionCount: updatedBounty._count.submissions,
      organisation: updatedBounty.organisation,
      createdBy: updatedBounty.createdBy,
      userSubmission: null,
      createdAt: updatedBounty.createdAt.toISOString(),
      updatedAt: updatedBounty.updatedAt.toISOString(),
      // New fields
      channels: updatedBounty.channels as ChannelSelection | null,
      currency: updatedBounty.currency,
      aiContentPermitted: updatedBounty.aiContentPermitted,
      engagementRequirements:
        updatedBounty.engagementRequirements as EngagementRequirementsInput | null,
      postVisibility: updatedBounty.postVisibilityRule
        ? {
            rule: updatedBounty.postVisibilityRule,
            minDurationValue: updatedBounty.postMinDurationValue,
            minDurationUnit: updatedBounty.postMinDurationUnit,
          }
        : null,
      structuredEligibility:
        updatedBounty.structuredEligibility as StructuredEligibilityInput | null,
      visibilityAcknowledged: updatedBounty.visibilityAcknowledged,
      rewards: this.mapRewards(rewards),
      totalRewardValue:
        rewards.length > 0 ? this.computeTotalRewardValue(rewards) : null,
      payoutMetrics: updatedBounty.payoutMetrics as PayoutMetricsInput | null ?? null,
      paymentStatus: updatedBounty.paymentStatus ?? PaymentStatus.UNPAID,
      payoutMethod: updatedBounty.payoutMethod ?? null,
    };
  }

  // ── Update Status ──────────────────────────────────────

  async updateStatus(
    id: string,
    user: AuthenticatedUser,
    newStatus: BountyStatus,
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id } });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    const allowed = VALID_TRANSITIONS[bounty.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${bounty.status} to ${newStatus}`,
      );
    }

    // For DRAFT -> LIVE, verify all required fields
    if (bounty.status === BountyStatus.DRAFT && newStatus === BountyStatus.LIVE) {
      const missing: string[] = [];

      if (!bounty.visibilityAcknowledged) {
        missing.push('visibilityAcknowledged');
      }
      if (!bounty.title) missing.push('title');
      if (!bounty.shortDescription) missing.push('shortDescription');
      if (!bounty.fullInstructions) missing.push('fullInstructions');
      if (!bounty.proofRequirements) missing.push('proofRequirements');
      if (!bounty.channels) missing.push('channels');
      if (!bounty.postVisibilityRule) missing.push('postVisibilityRule');

      // Check for at least one reward
      const rewards = await this.prisma.bountyReward.findMany({
        where: { bountyId: id },
      });
      if (rewards.length === 0) missing.push('rewards');

      if (missing.length > 0) {
        throw new BadRequestException(
          `Cannot publish bounty. Missing required fields: ${missing.join(', ')}`,
        );
      }

      // Check payment status
      if ((bounty as any).paymentStatus !== PaymentStatus.PAID) {
        throw new BadRequestException(
          'Payment must be completed before publishing',
        );
      }
    }

    const beforeState = { status: bounty.status };

    // Append to statusHistory
    const existingHistory = (bounty as any).statusHistory as any[] || [];
    const historyEntry = {
      status: newStatus,
      changedAt: new Date().toISOString(),
      changedBy: user.sub,
    };

    const updated = await this.prisma.bounty.update({
      where: { id },
      data: {
        status: newStatus,
        statusHistory: [...existingHistory, historyEntry] as any,
      },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_STATUS_CHANGE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: id,
      beforeState,
      afterState: { status: newStatus },
      ipAddress,
    });

    // Log when a bounty goes live (audit trail, no mass email)
    if (newStatus === BountyStatus.LIVE) {
      this.logger.log({
        message: 'Bounty published and now LIVE',
        bountyId: id,
        title: bounty.title,
        publishedBy: user.sub,
      });
    }

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Acknowledge Visibility ─────────────────────────────

  async acknowledgeVisibility(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id } });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (
      bounty.status !== BountyStatus.DRAFT &&
      bounty.status !== BountyStatus.PAUSED
    ) {
      throw new BadRequestException(
        'Visibility can only be acknowledged on DRAFT or PAUSED bounties',
      );
    }

    if (!bounty.postVisibilityRule) {
      throw new BadRequestException(
        'Cannot acknowledge visibility when no post visibility rule is set',
      );
    }

    const updated = await this.prisma.bounty.update({
      where: { id },
      data: { visibilityAcknowledged: true },
    });

    return {
      id: updated.id,
      visibilityAcknowledged: updated.visibilityAcknowledged,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ── Delete ─────────────────────────────────────────────

  async delete(id: string, user: AuthenticatedUser, ipAddress?: string) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id } });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status !== BountyStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT bounties can be deleted');
    }

    await this.prisma.bounty.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_DELETE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: id,
      beforeState: { title: bounty.title, status: bounty.status },
      ipAddress,
    });

    return { message: 'Bounty deleted.' };
  }

  // ── Duplicate ─────────────────────────────────────────

  async duplicate(bountyId: string, user: AuthenticatedUser, ip?: string) {
    const original = await this.prisma.bounty.findUnique({
      where: { id: bountyId },
    });
    if (!original || original.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    // Verify user belongs to the same org (for BUSINESS_ADMIN)
    if (user.role === UserRole.BUSINESS_ADMIN) {
      if (original.organisationId !== user.organisationId) {
        throw new ForbiddenException('Not authorized');
      }
    }

    const newBounty = await this.prisma.bounty.create({
      data: {
        title: `Copy of ${original.title}`,
        shortDescription: original.shortDescription,
        fullInstructions: original.fullInstructions,
        category: original.category,
        rewardType: original.rewardType,
        rewardValue: original.rewardValue,
        rewardDescription: original.rewardDescription,
        maxSubmissions: original.maxSubmissions,
        eligibilityRules: original.eligibilityRules,
        proofRequirements: original.proofRequirements,
        currency: original.currency,
        channels: original.channels as Prisma.InputJsonValue ?? undefined,
        aiContentPermitted: original.aiContentPermitted,
        engagementRequirements: original.engagementRequirements as Prisma.InputJsonValue ?? undefined,
        postVisibilityRule: original.postVisibilityRule,
        postMinDurationValue: original.postMinDurationValue,
        postMinDurationUnit: original.postMinDurationUnit,
        structuredEligibility: original.structuredEligibility as Prisma.InputJsonValue ?? undefined,
        payoutMetrics: (original as any).payoutMetrics as Prisma.InputJsonValue ?? undefined,
        organisationId: original.organisationId,
        createdById: user.sub,
        status: BountyStatus.DRAFT,
      },
    });

    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BOUNTY_CREATE,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: newBounty.id,
      afterState: { duplicatedFrom: bountyId },
      ipAddress: ip,
    });

    return newBounty;
  }

  // ── Brand Assets ────────────────────────────────────────

  async uploadBrandAssets(
    bountyId: string,
    user: AuthenticatedUser,
    files: Express.Multer.File[],
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id: bountyId } });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status !== BountyStatus.DRAFT) {
      throw new BadRequestException('Brand assets can only be uploaded to DRAFT bounties');
    }

    // Check total file count limit
    const existingCount = await this.prisma.brandAsset.count({
      where: { bountyId },
    });
    if (existingCount + files.length > BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY) {
      throw new BadRequestException(
        `Maximum ${BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY} brand assets per bounty. Currently ${existingCount}, trying to add ${files.length}.`,
      );
    }

    const assets = await this.prisma.brandAsset.createManyAndReturn({
      data: files.map((file, index) => ({
        bountyId,
        userId: user.sub,
        fileName: file.originalname,
        fileUrl: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        sortOrder: existingCount + index,
      })),
    });

    // Fire-and-forget audit log
    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BRAND_ASSET_UPLOAD,
      entityType: ENTITY_TYPES.BOUNTY,
      entityId: bountyId,
      afterState: { fileCount: files.length, fileNames: files.map((f) => f.originalname) },
      ipAddress,
    });

    return assets.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  async deleteBrandAsset(
    bountyId: string,
    assetId: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id: bountyId } });

    if (!bounty || bounty.deletedAt) {
      throw new NotFoundException('Bounty not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    if (bounty.status !== BountyStatus.DRAFT) {
      throw new BadRequestException('Brand assets can only be deleted from DRAFT bounties');
    }

    const asset = await this.prisma.brandAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.bountyId !== bountyId) {
      throw new NotFoundException('Brand asset not found');
    }

    // Delete file from disk
    try {
      const filePath = path.resolve(asset.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Log but don't fail if file deletion fails
    }

    await this.prisma.brandAsset.delete({ where: { id: assetId } });

    // Fire-and-forget audit log
    this.auditService.log({
      actorId: user.sub,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.BRAND_ASSET_DELETE,
      entityType: ENTITY_TYPES.BRAND_ASSET,
      entityId: assetId,
      beforeState: { fileName: asset.fileName, bountyId },
      ipAddress,
    });

    return { message: 'Brand asset deleted.' };
  }

  async getBrandAssetForDownload(assetId: string, user: AuthenticatedUser) {
    const asset = await this.prisma.brandAsset.findUnique({
      where: { id: assetId },
      include: {
        bounty: {
          select: { organisationId: true, status: true, deletedAt: true },
        },
      },
    });

    if (!asset || asset.bounty.deletedAt) {
      throw new NotFoundException('Brand asset not found');
    }

    // Participants can only download from LIVE bounties
    if (user.role === UserRole.PARTICIPANT && asset.bounty.status !== BountyStatus.LIVE) {
      throw new ForbiddenException('Brand asset not accessible');
    }

    // Business admins can only access their own org's assets
    if (
      user.role === UserRole.BUSINESS_ADMIN &&
      asset.bounty.organisationId !== user.organisationId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    return asset;
  }
}
