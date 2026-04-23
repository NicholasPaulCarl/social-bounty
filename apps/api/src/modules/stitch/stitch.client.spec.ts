import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { StitchClient } from './stitch.client';

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit?]>;

describe('StitchClient', () => {
  let redis: Partial<Record<keyof RedisService, jest.Mock>>;
  let config: Partial<Record<keyof ConfigService, jest.Mock>>;
  let originalFetch: typeof fetch;
  let fetchMock: FetchMock;

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      setNxEx: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    };
    config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const map: Record<string, string> = {
          STITCH_API_BASE: 'https://stitch.test',
          STITCH_CLIENT_ID: 'cid',
          STITCH_CLIENT_SECRET: 'secret',
          PAYMENTS_PROVIDER: 'stitch_sandbox',
        };
        return map[key] ?? fallback;
      }),
    };
    originalFetch = global.fetch;
    fetchMock = jest.fn() as FetchMock;
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function buildClient() {
    return new StitchClient(config as unknown as ConfigService, redis as unknown as RedisService);
  }

  function respond(status: number, body: unknown): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  }

  it('caches tokens in Redis on first fetch', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { data: { accessToken: 'tok_abc' } }));
    const client = buildClient();

    const token = await client.getToken();

    expect(token).toBe('tok_abc');
    // Cache key is scope-suffixed so payment-request vs recurring-consent
    // tokens never collide (subscription endpoints require a different scope).
    expect(redis.set).toHaveBeenCalledWith(
      'stitch:token:v1:client_paymentrequest',
      'tok_abc',
      840,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses distinct cache keys per scope (payment-request vs recurring-consent)', async () => {
    fetchMock
      .mockResolvedValueOnce(respond(200, { data: { accessToken: 'tok_pay' } }))
      .mockResolvedValueOnce(respond(200, { data: { accessToken: 'tok_sub' } }));
    const client = buildClient();

    await client.getToken('client_paymentrequest');
    await client.getToken('client_recurringpaymentconsentrequest');

    expect(redis.set).toHaveBeenCalledWith(
      'stitch:token:v1:client_paymentrequest',
      'tok_pay',
      840,
    );
    expect(redis.set).toHaveBeenCalledWith(
      'stitch:token:v1:client_recurringpaymentconsentrequest',
      'tok_sub',
      840,
    );
  });

  it('returns cached token without hitting the network', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce('cached_tok');
    const client = buildClient();

    const token = await client.getToken();

    expect(token).toBe('cached_tok');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('waits for another worker when lock is held, then reads fresh token', async () => {
    (redis.setNxEx as jest.Mock).mockResolvedValueOnce(false);
    // First 3 polls miss, 4th hits
    (redis.get as jest.Mock)
      .mockResolvedValueOnce(null) // initial cache miss
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('peer_tok');
    const client = buildClient();

    const token = await client.getToken();

    expect(token).toBe('peer_tok');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retries 5xx responses up to 3 times then throws', async () => {
    fetchMock
      .mockResolvedValueOnce(respond(503, {}))
      .mockResolvedValueOnce(respond(502, {}))
      .mockResolvedValueOnce(respond(500, {}));
    const client = buildClient();

    await expect(client.getToken()).rejects.toThrow(/returned 500/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry 4xx responses', async () => {
    fetchMock.mockResolvedValueOnce(respond(401, { error: 'bad creds' }));
    const client = buildClient();

    await expect(client.getToken()).rejects.toThrow(/returned 401/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends Idempotency-Key header on payouts', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce('tok_live');
    fetchMock.mockResolvedValueOnce(respond(200, { data: { id: 'payout_1', status: 'PENDING' } }));
    const client = buildClient();

    await client.createPayout(
      {
        amountCents: 5000n,
        beneficiaryId: 'bene_1',
        merchantReference: 'payout:u1:2026',
        speed: 'DEFAULT',
      },
      'idem_abc',
    );

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe('idem_abc');
    expect(headers['Authorization']).toBe('Bearer tok_live');
  });
});
