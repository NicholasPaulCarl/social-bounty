import { SubscriptionTier } from '@social-bounty/shared';
import { FeeCalculatorService } from './fee-calculator.service';

describe('FeeCalculatorService.forBrandFunding', () => {
  const svc = new FeeCalculatorService();

  it('applies Free brand admin fee 15% + global 3.5% on R500', () => {
    const out = svc.forBrandFunding({
      faceValueCents: 50_000n,
      planSnapshotBrand: SubscriptionTier.FREE,
      processingFeeCents: 0n,
      bankChargeCents: 0n,
    });
    expect(out.brandAdminFeeCents).toBe(7_500n);
    expect(out.globalFeeCents).toBe(1_750n);
    expect(out.brandTotalChargeCents).toBe(59_250n);
    expect(out.brandAdminFeeRateBps).toBe(1500);
    expect(out.globalFeeRateBps).toBe(350);
  });

  it('applies Pro brand admin fee 5% + global 3.5% on R500', () => {
    const out = svc.forBrandFunding({
      faceValueCents: 50_000n,
      planSnapshotBrand: SubscriptionTier.PRO,
      processingFeeCents: 0n,
      bankChargeCents: 0n,
    });
    expect(out.brandAdminFeeCents).toBe(2_500n);
    expect(out.globalFeeCents).toBe(1_750n);
    expect(out.brandTotalChargeCents).toBe(54_250n);
    expect(out.brandAdminFeeRateBps).toBe(500);
  });

  it('passes processing + bank charges through into the total', () => {
    const out = svc.forBrandFunding({
      faceValueCents: 100_000n, // R1000
      planSnapshotBrand: SubscriptionTier.FREE,
      processingFeeCents: 2_900n, // R29 gateway
      bankChargeCents: 500n, // R5 bank
    });
    // face 100000 + admin 15000 + global 3500 + processing 2900 + bank 500 = 121900
    expect(out.brandTotalChargeCents).toBe(121_900n);
  });

  it('global fee is independent of tier (Non-Negotiable #10)', () => {
    const free = svc.forBrandFunding({
      faceValueCents: 50_000n,
      planSnapshotBrand: SubscriptionTier.FREE,
      processingFeeCents: 0n,
      bankChargeCents: 0n,
    });
    const pro = svc.forBrandFunding({
      faceValueCents: 50_000n,
      planSnapshotBrand: SubscriptionTier.PRO,
      processingFeeCents: 0n,
      bankChargeCents: 0n,
    });
    expect(free.globalFeeCents).toBe(pro.globalFeeCents);
    expect(free.globalFeeRateBps).toBe(pro.globalFeeRateBps);
  });

  it('rejects zero or negative face value', () => {
    expect(() =>
      svc.forBrandFunding({
        faceValueCents: 0n,
        planSnapshotBrand: SubscriptionTier.FREE,
        processingFeeCents: 0n,
        bankChargeCents: 0n,
      }),
    ).toThrow('faceValueCents must be positive');
    expect(() =>
      svc.forBrandFunding({
        faceValueCents: -1n,
        planSnapshotBrand: SubscriptionTier.FREE,
        processingFeeCents: 0n,
        bankChargeCents: 0n,
      }),
    ).toThrow('faceValueCents must be positive');
  });

  it('rejects negative processing or bank charges', () => {
    expect(() =>
      svc.forBrandFunding({
        faceValueCents: 50_000n,
        planSnapshotBrand: SubscriptionTier.FREE,
        processingFeeCents: -1n,
        bankChargeCents: 0n,
      }),
    ).toThrow('processingFeeCents must be non-negative');
  });
});

describe('FeeCalculatorService.forHunterApproval', () => {
  const svc = new FeeCalculatorService();

  it('Free hunter: 20% commission + 3.5% global on R500', () => {
    const out = svc.forHunterApproval({
      faceValueCents: 50_000n,
      planSnapshotHunter: SubscriptionTier.FREE,
      payoutFeeCents: 0n,
      bankChargeCents: 0n,
    });
    expect(out.commissionCents).toBe(10_000n);
    expect(out.globalFeeCents).toBe(1_750n);
    expect(out.hunterNetCents).toBe(38_250n);
    expect(out.commissionRateBps).toBe(2000);
  });

  it('Pro hunter: 10% commission + 3.5% global on R500', () => {
    const out = svc.forHunterApproval({
      faceValueCents: 50_000n,
      planSnapshotHunter: SubscriptionTier.PRO,
      payoutFeeCents: 0n,
      bankChargeCents: 0n,
    });
    expect(out.commissionCents).toBe(5_000n);
    expect(out.globalFeeCents).toBe(1_750n);
    expect(out.hunterNetCents).toBe(43_250n);
    expect(out.commissionRateBps).toBe(1000);
  });

  it('subtracts payout + bank charges from hunter_net', () => {
    const out = svc.forHunterApproval({
      faceValueCents: 100_000n,
      planSnapshotHunter: SubscriptionTier.FREE,
      payoutFeeCents: 1_000n,
      bankChargeCents: 200n,
    });
    // 100000 - 20000 commission - 3500 global - 1000 payout - 200 bank = 75300
    expect(out.hunterNetCents).toBe(75_300n);
  });

  it('throws when fees exceed face value (hunter_net invariant)', () => {
    expect(() =>
      svc.forHunterApproval({
        faceValueCents: 100n,
        planSnapshotHunter: SubscriptionTier.FREE,
        payoutFeeCents: 500n, // exceeds post-fee remainder
        bankChargeCents: 0n,
      }),
    ).toThrow('hunter_net must be positive');
  });

  it('global fee independent of tier', () => {
    const free = svc.forHunterApproval({
      faceValueCents: 50_000n,
      planSnapshotHunter: SubscriptionTier.FREE,
      payoutFeeCents: 0n,
      bankChargeCents: 0n,
    });
    const pro = svc.forHunterApproval({
      faceValueCents: 50_000n,
      planSnapshotHunter: SubscriptionTier.PRO,
      payoutFeeCents: 0n,
      bankChargeCents: 0n,
    });
    expect(free.globalFeeCents).toBe(pro.globalFeeCents);
  });

  it('rejects zero or negative face value', () => {
    expect(() =>
      svc.forHunterApproval({
        faceValueCents: 0n,
        planSnapshotHunter: SubscriptionTier.FREE,
        payoutFeeCents: 0n,
        bankChargeCents: 0n,
      }),
    ).toThrow('faceValueCents must be positive');
  });
});
