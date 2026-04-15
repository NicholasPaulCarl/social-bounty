import { LedgerAccount, LedgerEntryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { BrandFundingHandler } from './brand-funding.handler';

describe('BrandFundingHandler.onPaymentSettled', () => {
  let prisma: any;
  let ledger: Partial<LedgerService>;
  let handler: BrandFundingHandler;
  let postMock: jest.Mock;

  const link = {
    id: 'link_1',
    bountyId: 'bounty_1',
    stitchPaymentLinkId: 'pl_1',
    stitchPaymentId: null as string | null,
    amountCents: 59250n,
    currency: 'ZAR',
    metadata: {
      breakdown: {
        faceValueCents: '50000',
        brandAdminFeeCents: '7500',
        globalFeeCents: '1750',
        brandTotalChargeCents: '59250',
        brandAdminFeeRateBps: 1500,
        globalFeeRateBps: 350,
      },
    },
  };
  const bounty = {
    id: 'bounty_1',
    brandId: 'brand_1',
    status: 'DRAFT',
    faceValueCents: 50000n,
  };

  beforeEach(() => {
    prisma = {
      stitchPaymentLink: {
        findUnique: jest.fn().mockResolvedValue(link),
        update: jest.fn().mockResolvedValue(link),
      },
      bounty: {
        findUnique: jest.fn().mockResolvedValue(bounty),
        update: jest.fn().mockResolvedValue(bounty),
      },
      $transaction: jest.fn(async (ops: unknown[]) => ops),
    };
    postMock = jest.fn().mockResolvedValue({ transactionGroupId: 'grp_1', idempotent: false });
    ledger = { postTransactionGroup: postMock };
    handler = new BrandFundingHandler(prisma as PrismaService, ledger as LedgerService);
  });

  it('posts the canonical brand-funding ledger group for a zero-fee settlement', async () => {
    await handler.onPaymentSettled({
      type: 'payment.settled',
      data: { payment: { id: 'stitch_pay_1', paymentLinkId: 'pl_1', fees: [] } },
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [input] = postMock.mock.calls[0];
    expect(input.actionType).toBe('stitch_payment_settled');
    expect(input.referenceId).toBe('stitch_pay_1');

    const legs: Array<{ account: string; type: string; amountCents: bigint }> = input.legs;
    const map = new Map(legs.map((l) => [`${l.type}:${l.account}`, l.amountCents]));

    expect(map.get(`${LedgerEntryType.DEBIT}:${LedgerAccount.gateway_clearing}`)).toBe(59250n);
    expect(map.get(`${LedgerEntryType.CREDIT}:${LedgerAccount.brand_reserve}`)).toBe(50000n);
    expect(map.get(`${LedgerEntryType.CREDIT}:${LedgerAccount.admin_fee_revenue}`)).toBe(7500n);
    expect(map.get(`${LedgerEntryType.CREDIT}:${LedgerAccount.global_fee_revenue}`)).toBe(1750n);

    // Sum check.
    const totalDebit = legs
      .filter((l) => l.type === LedgerEntryType.DEBIT)
      .reduce((s, l) => s + l.amountCents, 0n);
    const totalCredit = legs
      .filter((l) => l.type === LedgerEntryType.CREDIT)
      .reduce((s, l) => s + l.amountCents, 0n);
    expect(totalDebit).toBe(totalCredit);
  });

  it('adds processing + bank charges as separate legs when Stitch reports fees', async () => {
    await handler.onPaymentSettled({
      type: 'payment.settled',
      data: {
        payment: {
          id: 'stitch_pay_2',
          paymentLinkId: 'pl_1',
          fees: [
            { type: 'PAYMENT_LINKS', amount: 1500 },
            { type: 'BANK_CHARGE', amount: 500 },
          ],
        },
      },
    });

    const [input] = postMock.mock.calls[0];
    const legs: Array<{ account: string; type: string; amountCents: bigint }> = input.legs;
    const map = new Map(legs.map((l) => [`${l.type}:${l.account}`, l.amountCents]));
    expect(map.get(`${LedgerEntryType.CREDIT}:${LedgerAccount.processing_expense}`)).toBe(1500n);
    expect(map.get(`${LedgerEntryType.CREDIT}:${LedgerAccount.bank_charges}`)).toBe(500n);
    // gateway_clearing absorbs both extras.
    expect(map.get(`${LedgerEntryType.DEBIT}:${LedgerAccount.gateway_clearing}`)).toBe(61250n);
  });

  it('ignores events whose paymentId is unknown', async () => {
    prisma.stitchPaymentLink.findUnique.mockResolvedValue(null);

    await handler.onPaymentSettled({
      data: { payment: { id: 'unknown_pay', paymentLinkId: 'unknown_link' } },
    });

    expect(postMock).not.toHaveBeenCalled();
    expect(prisma.bounty.update).not.toHaveBeenCalled();
  });

  it('flips bounty to LIVE + paymentStatus PAID after ledger commit', async () => {
    await handler.onPaymentSettled({
      data: { payment: { id: 'stitch_pay_3', paymentLinkId: 'pl_1' } },
    });

    const bountyUpdate = prisma.bounty.update.mock.calls[0][0];
    expect(bountyUpdate.where).toEqual({ id: 'bounty_1' });
    expect(bountyUpdate.data.status).toBe('LIVE');
    expect(bountyUpdate.data.paymentStatus).toBe('PAID');
  });
});
