import { TradeSafeClient } from '../tradesafe/tradesafe.client';
import { TradeSafePayoutAdapter } from './tradesafe-payout.adapter';

describe('TradeSafePayoutAdapter', () => {
  let client: jest.Mocked<TradeSafeClient>;

  beforeEach(() => {
    client = {
      isMockMode: jest.fn().mockReturnValue(true),
      createBeneficiary: jest.fn(),
      initiatePayout: jest.fn(),
      getPayoutStatus: jest.fn(),
    } as unknown as jest.Mocked<TradeSafeClient>;
  });

  it('name is "tradesafe"', () => {
    const adapter = new TradeSafePayoutAdapter(client);
    expect(adapter.name).toBe('tradesafe');
  });

  it('forwards createBeneficiary including externalReference', async () => {
    (client.createBeneficiary as jest.Mock).mockResolvedValue({
      id: 'ts_bene_1',
      status: 'VERIFIED',
    });
    const adapter = new TradeSafePayoutAdapter(client);
    const result = await adapter.createBeneficiary({
      accountHolderName: 'X',
      bankCode: '250655',
      accountNumber: '1234567890',
      accountType: 'SAVINGS',
      externalReference: 'user-42',
    });
    expect(result).toEqual({ id: 'ts_bene_1', status: 'VERIFIED' });
    expect(client.createBeneficiary).toHaveBeenCalledWith(
      expect.objectContaining({ externalReference: 'user-42' }),
    );
  });

  it('forwards initiatePayout with idempotency key', async () => {
    (client.initiatePayout as jest.Mock).mockResolvedValue({
      id: 'ts_p1',
      status: 'ESCROW_HELD',
    });
    const adapter = new TradeSafePayoutAdapter(client);
    const result = await adapter.initiatePayout(
      {
        amountCents: 5000n,
        beneficiaryId: 'ts_bene_1',
        merchantReference: 'ref',
      },
      'idem_1',
    );
    expect(result).toEqual({ id: 'ts_p1', status: 'ESCROW_HELD' });
    expect(client.initiatePayout).toHaveBeenCalledWith(
      expect.objectContaining({ beneficiaryId: 'ts_bene_1' }),
      'idem_1',
    );
  });

  it('forwards getPayoutStatus including failureReason', async () => {
    (client.getPayoutStatus as jest.Mock).mockResolvedValue({
      id: 'ts_p1',
      status: 'FAILED',
      failureReason: 'insufficient_funds',
    });
    const adapter = new TradeSafePayoutAdapter(client);
    const result = await adapter.getPayoutStatus('ts_p1');
    expect(result).toEqual({
      id: 'ts_p1',
      status: 'FAILED',
      failureReason: 'insufficient_funds',
    });
  });
});
