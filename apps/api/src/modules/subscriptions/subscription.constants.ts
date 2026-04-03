import {
  SubscriptionTier,
  SubscriptionEntityType,
  SubscriptionFeature,
  SUBSCRIPTION_CONSTANTS,
  COMMISSION_RATES,
  CLEARANCE_PERIODS,
} from '@social-bounty/shared';

export const PRICING: Record<SubscriptionEntityType, number> = {
  [SubscriptionEntityType.HUNTER]: SUBSCRIPTION_CONSTANTS.HUNTER_PRO_PRICE_ZAR,
  [SubscriptionEntityType.BRAND]: SUBSCRIPTION_CONSTANTS.BRAND_PRO_PRICE_ZAR,
};

export const FEATURE_MATRIX: Record<SubscriptionFeature, (tier: SubscriptionTier) => boolean> = {
  [SubscriptionFeature.REDUCED_COMMISSION]: (tier) => tier === SubscriptionTier.PRO,
  [SubscriptionFeature.SAME_DAY_PAYOUT]: (tier) => tier === SubscriptionTier.PRO,
  [SubscriptionFeature.CLOSED_BOUNTY_APPLICATION]: (tier) => tier === SubscriptionTier.PRO,
  [SubscriptionFeature.CLOSED_BOUNTY_CREATION]: (tier) => tier === SubscriptionTier.PRO,
  [SubscriptionFeature.VERIFICATION_BADGE]: (tier) => tier === SubscriptionTier.PRO,
  [SubscriptionFeature.PRIORITY_SUPPORT]: (tier) => tier === SubscriptionTier.PRO,
};

export function getCommissionRate(entityType: SubscriptionEntityType, tier: SubscriptionTier): number {
  if (entityType === SubscriptionEntityType.HUNTER) {
    return tier === SubscriptionTier.PRO ? COMMISSION_RATES.HUNTER_PRO : COMMISSION_RATES.HUNTER_FREE;
  }
  return tier === SubscriptionTier.PRO ? COMMISSION_RATES.BRAND_PRO : COMMISSION_RATES.BRAND_FREE;
}

export function getClearanceDays(tier: SubscriptionTier): number {
  return tier === SubscriptionTier.PRO ? CLEARANCE_PERIODS.HUNTER_PRO_DAYS : CLEARANCE_PERIODS.HUNTER_FREE_MIN_DAYS;
}

export function buildFeaturesDto(entityType: SubscriptionEntityType, tier: SubscriptionTier) {
  const isHunter = entityType === SubscriptionEntityType.HUNTER;
  return {
    commissionRate: getCommissionRate(entityType, tier),
    clearancePeriodDays: isHunter ? getClearanceDays(tier) : 0,
    canCreateClosedBounties: !isHunter && tier === SubscriptionTier.PRO,
    canApplyToClosedBounties: isHunter && tier === SubscriptionTier.PRO,
    hasVerificationBadge: isHunter && tier === SubscriptionTier.PRO,
    hasPrioritySupport: tier === SubscriptionTier.PRO,
  };
}
