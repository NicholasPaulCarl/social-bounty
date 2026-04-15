import {
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionEntityType,
  SubscriptionPaymentStatus,
} from '../enums';

// ─── User-facing ────────────────────

export interface SubscriptionFeaturesDto {
  commissionRate: number;
  clearancePeriodDays: number;
  canCreateClosedBounties: boolean;
  canApplyToClosedBounties: boolean;
  hasVerificationBadge: boolean;
  hasPrioritySupport: boolean;
}

export interface SubscriptionResponseDto {
  id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  entityType: SubscriptionEntityType;
  priceAmount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEndsAt: string | null;
  features: SubscriptionFeaturesDto;
}

export interface SubscribeRequest {
  paymentMethodId?: string;
}

export interface SubscriptionPaymentDto {
  id: string;
  amount: number;
  currency: string;
  status: SubscriptionPaymentStatus;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  attemptNumber: number;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface SubscriptionPaymentListParams {
  page?: number;
  limit?: number;
}

// ─── Admin ──────────────────────────

export interface AdminSubscriptionListItem {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  entityType: SubscriptionEntityType;
  priceAmount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  failedPaymentCount: number;
  userName: string | null;
  userEmail: string | null;
  brandName: string | null;
  createdAt: string;
}

export interface AdminSubscriptionListParams {
  page?: number;
  limit?: number;
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
  entityType?: SubscriptionEntityType;
}

export interface AdminSubscriptionDetailDto {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  entityType: SubscriptionEntityType;
  priceAmount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  gracePeriodEndsAt: string | null;
  failedPaymentCount: number;
  provider: string | null;
  providerSubId: string | null;
  userName: string | null;
  userEmail: string | null;
  brandName: string | null;
  payments: SubscriptionPaymentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionOverrideRequest {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  periodEndOverride?: string;
  reason: string;
}

export interface SubscriptionRevenueDto {
  totalActiveHunters: number;
  totalActiveBrands: number;
  hunterMRR: number;
  brandMRR: number;
  totalMRR: number;
  churnedThisMonth: number;
  failedPaymentsThisMonth: number;
}
