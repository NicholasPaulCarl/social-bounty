import { ConfigService } from '@nestjs/config';
import { StitchClient } from '../stitch/stitch.client';
import { StitchPayoutAdapter } from './stitch-payout.adapter';

describe('StitchPayoutAdapter', () => {
  let client: jest.Mocked<StitchClient>;
  let config: ConfigService;

  beforeEach(() => {
    client = {
      isEnabled: jest.fn().mockReturnValue(true),
      createBeneficiary: jest.fn(),
      createPayout: jest.fn(),
    } as unknown as jest.Mocked<StitchClient>;
    config = { get: jest.fn() } as unknown as ConfigService;
  });

  it('name is "stitch"', () => {
    const adapter = new StitchPayoutAdapter(client, config);
    expect(adapter.name).toBe('stitch');
  });

  it('isMockMode reflects StitchClient.isEnabled (inverted)', () => {
    const adapter = new StitchPayoutAdapter(client, config);
    expect(adapter.isMockMode()).toBe(false);
    (client.isEnabled as jest.Mock).mockReturnValue(false);
    expect(adapter.isMockMode()).toBe(true);
  });

  it('delegates createBeneficiary to StitchClient', async () => {
    (client.createBeneficiary as jest.Mock).mockResolvedValue({ id: 'local:abc' });
    const adapter = new StitchPayoutAdapter(client, config);
    const result = await adapter.createBeneficiary({
      accountHolderName: 'X',
      bankCode: '250655',
      accountNumber: '1234567890',
      accountType: 'SAVINGS',
      externalReference: 'u1',
    });
    expect(result.id).toBe('local:abc');
    expect(client.createBeneficiary).toHaveBeenCalledWith({
      accountHolderName: 'X',
      bankCode: '250655',
      accountNumber: '1234567890',
      accountType: 'SAVINGS',
    });
  });

  it('delegates initiatePayout with idempotency key', async () => {
    (client.createPayout as jest.Mock).mockResolvedValue({ id: 'p1', status: 'PENDING' });
    const adapter = new StitchPayoutAdapter(client, config);
    const result = await adapter.initiatePayout(
      {
        amountCents: 5000n,
        beneficiaryId: 'bene_1',
        merchantReference: 'ref_1',
        speed: 'DEFAULT',
      },
      'idem_1',
    );
    expect(result).toEqual({ id: 'p1', status: 'PENDING' });
    expect(client.createPayout).toHaveBeenCalledWith(
      expect.objectContaining({ beneficiaryId: 'bene_1' }),
      'idem_1',
    );
  });

  it('getPayoutStatus returns UNKNOWN (Stitch has no polling endpoint)', async () => {
    const adapter = new StitchPayoutAdapter(client, config);
    const result = await adapter.getPayoutStatus('p1');
    expect(result).toEqual({ id: 'p1', status: 'UNKNOWN' });
  });
});
