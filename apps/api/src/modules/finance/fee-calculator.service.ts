import { Injectable } from '@nestjs/common';
import { FEE_RATES_BPS, SubscriptionTier } from '@social-bounty/shared';
import { feeCents } from './rounding';

export interface BrandFundingInput {
  faceValueCents: bigint;
  planSnapshotBrand: SubscriptionTier;
  processingFeeCents: bigint;
  bankChargeCents: bigint;
}

export interface BrandFundingBreakdown {
  faceValueCents: bigint;
  brandAdminFeeCents: bigint;
  globalFeeCents: bigint;
  processingFeeCents: bigint;
  bankChargeCents: bigint;
  brandTotalChargeCents: bigint;
  brandAdminFeeRateBps: number;
  globalFeeRateBps: number;
}

export interface HunterApprovalInput {
  faceValueCents: bigint;
  planSnapshotHunter: SubscriptionTier;
  payoutFeeCents: bigint;
  bankChargeCents: bigint;
}

export interface HunterApprovalBreakdown {
  faceValueCents: bigint;
  commissionCents: bigint;
  globalFeeCents: bigint;
  payoutFeeCents: bigint;
  bankChargeCents: bigint;
  hunterNetCents: bigint;
  commissionRateBps: number;
  globalFeeRateBps: number;
}

// Pure fee calculation service.
// Non-Negotiable #9: plan snapshot is always passed in, never looked up from DB here.
// Non-Negotiable #4: integer minor units, basis points, banker's rounding.
// Non-Negotiable #10: global fee (3.5%) is calculated independently of tier fees.
@Injectable()
export class FeeCalculatorService {
  forBrandFunding(input: BrandFundingInput): BrandFundingBreakdown {
    this.assertPositive(input.faceValueCents, 'faceValueCents');
    this.assertNonNegative(input.processingFeeCents, 'processingFeeCents');
    this.assertNonNegative(input.bankChargeCents, 'bankChargeCents');

    const brandAdminFeeRateBps =
      input.planSnapshotBrand === SubscriptionTier.PRO
        ? FEE_RATES_BPS.BRAND_PRO_ADMIN
        : FEE_RATES_BPS.BRAND_FREE_ADMIN;

    const brandAdminFeeCents = feeCents(input.faceValueCents, brandAdminFeeRateBps);
    const globalFeeCents = feeCents(input.faceValueCents, FEE_RATES_BPS.GLOBAL_FEE);
    const brandTotalChargeCents =
      input.faceValueCents +
      brandAdminFeeCents +
      globalFeeCents +
      input.processingFeeCents +
      input.bankChargeCents;

    return {
      faceValueCents: input.faceValueCents,
      brandAdminFeeCents,
      globalFeeCents,
      processingFeeCents: input.processingFeeCents,
      bankChargeCents: input.bankChargeCents,
      brandTotalChargeCents,
      brandAdminFeeRateBps,
      globalFeeRateBps: FEE_RATES_BPS.GLOBAL_FEE,
    };
  }

  forHunterApproval(input: HunterApprovalInput): HunterApprovalBreakdown {
    this.assertPositive(input.faceValueCents, 'faceValueCents');
    this.assertNonNegative(input.payoutFeeCents, 'payoutFeeCents');
    this.assertNonNegative(input.bankChargeCents, 'bankChargeCents');

    const commissionRateBps =
      input.planSnapshotHunter === SubscriptionTier.PRO
        ? FEE_RATES_BPS.HUNTER_PRO_COMMISSION
        : FEE_RATES_BPS.HUNTER_FREE_COMMISSION;

    const commissionCents = feeCents(input.faceValueCents, commissionRateBps);
    const globalFeeCents = feeCents(input.faceValueCents, FEE_RATES_BPS.GLOBAL_FEE);
    const hunterNetCents =
      input.faceValueCents -
      commissionCents -
      globalFeeCents -
      input.payoutFeeCents -
      input.bankChargeCents;

    if (hunterNetCents <= 0n) {
      throw new Error(
        `forHunterApproval: hunter_net must be positive; got ${hunterNetCents} for faceValue=${input.faceValueCents}`,
      );
    }

    return {
      faceValueCents: input.faceValueCents,
      commissionCents,
      globalFeeCents,
      payoutFeeCents: input.payoutFeeCents,
      bankChargeCents: input.bankChargeCents,
      hunterNetCents,
      commissionRateBps,
      globalFeeRateBps: FEE_RATES_BPS.GLOBAL_FEE,
    };
  }

  private assertPositive(value: bigint, name: string): void {
    if (value <= 0n) {
      throw new Error(`${name} must be positive; got ${value}`);
    }
  }

  private assertNonNegative(value: bigint, name: string): void {
    if (value < 0n) {
      throw new Error(`${name} must be non-negative; got ${value}`);
    }
  }
}
