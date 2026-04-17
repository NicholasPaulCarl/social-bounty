import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { TradeSafeClient } from './tradesafe.client';

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit?]>;

describe('TradeSafeClient', () => {
  let redis: Partial<Record<keyof RedisService, jest.Mock>>;
  let originalFetch: typeof fetch;
  let fetchMock: FetchMock;

  function buildConfig(overrides: Record<string, string> = {}) {
    const map: Record<string, string> = {
      TRADESAFE_API_BASE: 'https://tradesafe.test',
      TRADESAFE_CLIENT_ID: 'cid',
      TRADESAFE_CLIENT_SECRET: 'secret',
      TRADESAFE_MOCK: 'false',
      ...overrides,
    };
    return {
      get: jest.fn((key: string, fallback?: unknown) => map[key] ?? fallback),
    } as unknown as ConfigService;
  }

  function buildClient(config: ConfigService) {
    return new TradeSafeClient(config, redis as unknown as RedisService);
  }

  function respond(status: number, body: unknown): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  }

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      setNxEx: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    };
    originalFetch = global.fetch;
    fetchMock = jest.fn() as FetchMock;
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('mock mode', () => {
    it('enters mock mode when TRADESAFE_MOCK=true', async () => {
      const client = buildClient(buildConfig({ TRADESAFE_MOCK: 'true' }));
      expect(client.isMockMode()).toBe(true);
      await expect(client.getToken()).resolves.toBe('mock-tradesafe-token');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('defaults to mock mode when creds are unset', () => {
      const client = buildClient(
        buildConfig({
          TRADESAFE_CLIENT_ID: '',
          TRADESAFE_CLIENT_SECRET: '',
          TRADESAFE_MOCK: '',
        }),
      );
      expect(client.isMockMode()).toBe(true);
    });

    it('returns deterministic beneficiary fixture in mock mode', async () => {
      const client = buildClient(buildConfig({ TRADESAFE_MOCK: 'true' }));
      const result1 = await client.createBeneficiary({
        accountHolderName: 'A',
        bankCode: '250655',
        accountNumber: '1234567890',
        accountType: 'SAVINGS',
        externalReference: 'user-123',
      });
      const result2 = await client.createBeneficiary({
        accountHolderName: 'B',
        bankCode: '250655',
        accountNumber: '9999999999',
        accountType: 'SAVINGS',
        externalReference: 'user-123',
      });
      // Same externalReference → same deterministic id even with different
      // holder / account. Tests asserting fixture stability can rely on this.
      expect(result1.id).toBe(result2.id);
      expect(result1.status).toBe('VERIFIED');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns deterministic payout fixture in mock mode', async () => {
      const client = buildClient(buildConfig({ TRADESAFE_MOCK: 'true' }));
      const result = await client.initiatePayout(
        {
          amountCents: 5000n,
          beneficiaryId: 'mock-bene-abc',
          merchantReference: 'payoutuser2026',
        },
        'idem_1',
      );
      expect(result.id).toMatch(/^mock-payout-/);
      expect(result.status).toBe('ESCROW_HELD');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns payout status fixture in mock mode', async () => {
      const client = buildClient(buildConfig({ TRADESAFE_MOCK: 'true' }));
      const result = await client.getPayoutStatus('mock-payout-xyz');
      expect(result.status).toBe('ESCROW_HELD');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('live mode', () => {
    it('caches tokens in Redis on first fetch', async () => {
      fetchMock.mockResolvedValueOnce(
        respond(200, { accessToken: 'tok_abc', expiresIn: 900 }),
      );
      const client = buildClient(buildConfig());
      expect(client.isMockMode()).toBe(false);

      const token = await client.getToken();

      expect(token).toBe('tok_abc');
      expect(redis.set).toHaveBeenCalledWith('tradesafe:token:v1', 'tok_abc', 840);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns cached token without hitting the network', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce('cached_tok');
      const client = buildClient(buildConfig());

      const token = await client.getToken();

      expect(token).toBe('cached_tok');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('waits for another worker when token lock is held', async () => {
      (redis.setNxEx as jest.Mock).mockResolvedValueOnce(false);
      (redis.get as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('peer_tok');
      const client = buildClient(buildConfig());

      const token = await client.getToken();

      expect(token).toBe('peer_tok');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends Idempotency-Key header on initiatePayout', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce('tok_live');
      fetchMock.mockResolvedValueOnce(
        respond(200, { data: { id: 'ts_payout_1', status: 'ESCROW_HELD' } }),
      );
      const client = buildClient(buildConfig());

      await client.initiatePayout(
        {
          amountCents: 5000n,
          beneficiaryId: 'ts_bene_1',
          merchantReference: 'payoutu12026',
        },
        'idem_abc',
      );

      const [, init] = fetchMock.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers['Idempotency-Key']).toBe('idem_abc');
      expect(headers['Authorization']).toBe('Bearer tok_live');
    });

    it('POSTs to /api/v1/beneficiaries for createBeneficiary', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce('tok_live');
      fetchMock.mockResolvedValueOnce(
        respond(200, { data: { id: 'ts_bene_1', status: 'VERIFIED' } }),
      );
      const client = buildClient(buildConfig());

      const result = await client.createBeneficiary({
        accountHolderName: 'Holder',
        bankCode: '250655',
        accountNumber: '1234567890',
        accountType: 'SAVINGS',
        externalReference: 'user-123',
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://tradesafe.test/api/v1/beneficiaries');
      expect(init?.method).toBe('POST');
      expect(result.id).toBe('ts_bene_1');
    });

    it('GETs /api/v1/payouts/:id for getPayoutStatus', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce('tok_live');
      fetchMock.mockResolvedValueOnce(
        respond(200, { data: { id: 'ts_payout_1', status: 'RELEASED' } }),
      );
      const client = buildClient(buildConfig());

      const result = await client.getPayoutStatus('ts_payout_1');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://tradesafe.test/api/v1/payouts/ts_payout_1');
      expect(init?.method).toBe('GET');
      expect(result.status).toBe('RELEASED');
    });

    it('does not retry 4xx responses', async () => {
      fetchMock.mockResolvedValueOnce(respond(401, { error: 'bad creds' }));
      const client = buildClient(buildConfig());
      await expect(client.getToken()).rejects.toThrow(/returned 401/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries 5xx responses up to 3 times then throws', async () => {
      fetchMock
        .mockResolvedValueOnce(respond(503, {}))
        .mockResolvedValueOnce(respond(502, {}))
        .mockResolvedValueOnce(respond(500, {}));
      const client = buildClient(buildConfig());
      await expect(client.getToken()).rejects.toThrow(/returned 500/);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
