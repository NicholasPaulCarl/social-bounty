import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { TradeSafeGraphQLClient } from './tradesafe-graphql.client';
import { TradeSafeApiError } from './tradesafe.types';
import { toCents, toZar } from './tradesafe-graphql.operations';

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit?]>;

describe('TradeSafeGraphQLClient', () => {
  let redis: Partial<Record<keyof RedisService, jest.Mock>>;
  let originalFetch: typeof fetch;
  let fetchMock: FetchMock;

  function buildConfig(overrides: Record<string, string> = {}): ConfigService {
    const map: Record<string, string> = {
      TRADESAFE_AUTH_URL: 'https://auth.tradesafe.test/oauth/token',
      TRADESAFE_GRAPHQL_URL: 'https://api.tradesafe.test/graphql',
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
    return new TradeSafeGraphQLClient(config, redis as unknown as RedisService);
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
    it('returns mock token when TRADESAFE_MOCK=true', async () => {
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

    it('probe() returns ok=true instantly in mock mode', async () => {
      const client = buildClient(buildConfig({ TRADESAFE_MOCK: 'true' }));
      const result = await client.probe();
      expect(result.ok).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('request() throws in mock mode — callers must short-circuit before transport', async () => {
      const client = buildClient(buildConfig({ TRADESAFE_MOCK: 'true' }));
      await expect(client.request('query { ping }')).rejects.toThrow(TradeSafeApiError);
    });
  });

  describe('token fetch', () => {
    it('POSTs form-encoded client_credentials to the auth URL', async () => {
      fetchMock.mockResolvedValueOnce(
        respond(200, { access_token: 'tok_abc', token_type: 'Bearer', expires_in: 1800 }),
      );
      const client = buildClient(buildConfig());

      const token = await client.getToken();

      expect(token).toBe('tok_abc');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://auth.tradesafe.test/oauth/token');
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );
      expect(init?.body).toContain('grant_type=client_credentials');
      expect(init?.body).toContain('client_id=cid');
      expect(init?.body).toContain('client_secret=secret');
    });

    it('caches the token in Redis with expires_in minus a 5-min safety margin', async () => {
      fetchMock.mockResolvedValueOnce(
        respond(200, { access_token: 'tok_abc', token_type: 'Bearer', expires_in: 1800 }),
      );
      const client = buildClient(buildConfig());

      await client.getToken();

      // 1800 - 300 (safety margin) = 1500
      expect(redis.set).toHaveBeenCalledWith(
        'tradesafe:graphql:token:v1',
        'tok_abc',
        1500,
      );
    });

    it('uses the static TTL floor when expires_in is missing or too short', async () => {
      fetchMock.mockResolvedValueOnce(
        respond(200, { access_token: 'tok_abc', token_type: 'Bearer', expires_in: 60 }),
      );
      const client = buildClient(buildConfig());

      await client.getToken();

      expect(redis.set).toHaveBeenCalledWith(
        'tradesafe:graphql:token:v1',
        'tok_abc',
        1500,
      );
    });

    it('returns cached token without re-fetching', async () => {
      (redis.get as jest.Mock).mockResolvedValueOnce('cached_tok');
      const client = buildClient(buildConfig());

      const token = await client.getToken();

      expect(token).toBe('cached_tok');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws when token response is malformed', async () => {
      fetchMock.mockResolvedValueOnce(respond(200, { token_type: 'Bearer' }));
      const client = buildClient(buildConfig());

      await expect(client.getToken()).rejects.toThrow(TradeSafeApiError);
    });
  });

  describe('request()', () => {
    it('sends the GraphQL query with a Bearer token', async () => {
      fetchMock
        // Token fetch
        .mockResolvedValueOnce(
          respond(200, { access_token: 'tok', token_type: 'Bearer', expires_in: 1800 }),
        )
        // GraphQL call
        .mockResolvedValueOnce(respond(200, { data: { apiProfile: { organizations: [] } } }));
      const client = buildClient(buildConfig());

      const data = await client.request<{ apiProfile: { organizations: unknown[] } }>(
        'query { apiProfile { organizations { name } } }',
      );

      expect(data.apiProfile.organizations).toEqual([]);
      const [url, init] = fetchMock.mock.calls[1];
      expect(url).toBe('https://api.tradesafe.test/graphql');
      expect((init?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer tok',
      );
      expect(init?.body).toContain('apiProfile');
    });

    it('surfaces GraphQL errors as TradeSafeApiError', async () => {
      fetchMock
        .mockResolvedValueOnce(
          respond(200, { access_token: 'tok', token_type: 'Bearer', expires_in: 1800 }),
        )
        .mockResolvedValueOnce(
          respond(200, {
            errors: [{ message: 'Validation failed on field x', path: ['x'] }],
            data: null,
          }),
        );
      const client = buildClient(buildConfig());

      await expect(client.request('mutation { foo }')).rejects.toThrow(
        /Validation failed on field x/,
      );
    });

    it('retries once on Unauthenticated guard — forces token refresh', async () => {
      fetchMock
        // Initial token fetch
        .mockResolvedValueOnce(
          respond(200, { access_token: 'stale', token_type: 'Bearer', expires_in: 1800 }),
        )
        // First GraphQL call — stale token rejected
        .mockResolvedValueOnce(
          respond(200, {
            errors: [
              {
                message: 'Unauthenticated.',
                extensions: { guards: ['oauth', 'sanctum'] },
              },
            ],
            data: null,
          }),
        )
        // Retry token fetch
        .mockResolvedValueOnce(
          respond(200, { access_token: 'fresh', token_type: 'Bearer', expires_in: 1800 }),
        )
        // Retry GraphQL call
        .mockResolvedValueOnce(respond(200, { data: { apiProfile: null } }));
      const client = buildClient(buildConfig());

      const data = await client.request<{ apiProfile: unknown }>(
        'query { apiProfile { organizations { name } } }',
      );

      expect(data.apiProfile).toBeNull();
      // 2 token fetches, 2 GraphQL calls
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('does NOT retry endlessly — only one Unauthenticated retry', async () => {
      fetchMock
        .mockResolvedValueOnce(
          respond(200, { access_token: 'stale1', token_type: 'Bearer', expires_in: 1800 }),
        )
        .mockResolvedValueOnce(
          respond(200, {
            errors: [
              {
                message: 'Unauthenticated.',
                extensions: { guards: ['oauth'] },
              },
            ],
          }),
        )
        .mockResolvedValueOnce(
          respond(200, { access_token: 'stale2', token_type: 'Bearer', expires_in: 1800 }),
        )
        .mockResolvedValueOnce(
          respond(200, {
            errors: [
              {
                message: 'Unauthenticated.',
                extensions: { guards: ['oauth'] },
              },
            ],
          }),
        );
      const client = buildClient(buildConfig());

      await expect(client.request('query { foo }')).rejects.toThrow(/Unauthenticated/);
      // 2 token fetches + 2 GraphQL calls — no third round
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('throws on missing data envelope with no errors', async () => {
      fetchMock
        .mockResolvedValueOnce(
          respond(200, { access_token: 'tok', token_type: 'Bearer', expires_in: 1800 }),
        )
        .mockResolvedValueOnce(respond(200, {}));
      const client = buildClient(buildConfig());

      await expect(client.request('query { foo }')).rejects.toThrow(
        /missing data/,
      );
    });
  });

  describe('typed operation wrappers', () => {
    function mockTokenAndResponse(body: unknown) {
      fetchMock
        .mockResolvedValueOnce(
          respond(200, { access_token: 'tok', token_type: 'Bearer', expires_in: 1800 }),
        )
        .mockResolvedValueOnce(respond(200, body));
    }

    it('getApiProfile() unwraps the apiProfile envelope', async () => {
      mockTokenAndResponse({
        data: { apiProfile: { organizations: [{ name: 'Acme', token: 'org-tok' }] } },
      });
      const client = buildClient(buildConfig());

      const profile = await client.getApiProfile();

      expect(profile.organizations).toEqual([{ name: 'Acme', token: 'org-tok' }]);
    });

    it('tokenCreate() sends user/org/bank fields as variables', async () => {
      mockTokenAndResponse({
        data: {
          tokenCreate: { id: 'new-token-id', name: 'Jane Doe', reference: 'REF123' },
        },
      });
      const client = buildClient(buildConfig());

      const result = await client.tokenCreate({
        givenName: 'Jane',
        familyName: 'Doe',
        email: 'jane@example.com',
      });

      expect(result.id).toBe('new-token-id');
      const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
      expect(body.query).toContain('tokenCreate');
      expect(body.variables.givenName).toBe('Jane');
      expect(body.variables.email).toBe('jane@example.com');
    });

    it('transactionCreate() passes allocations + parties through as-is', async () => {
      mockTokenAndResponse({
        data: {
          transactionCreate: {
            id: 'tx-1',
            title: 'Bounty #1',
            createdAt: '2026-04-24T00:00:00Z',
            state: 'CREATED',
            reference: 'bounty-xyz',
            allocations: [{ id: 'alloc-1', title: 'Reward', value: 100, state: 'CREATED' }],
            parties: [
              { id: 'p-1', role: 'BUYER' },
              { id: 'p-2', role: 'SELLER' },
            ],
          },
        },
      });
      const client = buildClient(buildConfig());

      const result = await client.transactionCreate({
        title: 'Bounty #1',
        description: 'Description',
        industry: 'GENERAL_GOODS_SERVICES',
        workflow: 'STANDARD',
        feeAllocation: 'BUYER',
        reference: 'bounty-xyz',
        allocations: [
          { title: 'Reward', description: 'Hunter payout', value: 100, daysToDeliver: 30, daysToInspect: 7 },
        ],
        parties: [
          { token: 'brand-tok', role: 'BUYER' },
          { token: 'hunter-tok', role: 'SELLER' },
        ],
      });

      expect(result.id).toBe('tx-1');
      const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
      expect(body.variables.allocations).toEqual([
        { title: 'Reward', description: 'Hunter payout', value: 100, daysToDeliver: 30, daysToInspect: 7 },
      ]);
      expect(body.variables.parties).toEqual([
        { token: 'brand-tok', role: 'BUYER' },
        { token: 'hunter-tok', role: 'SELLER' },
      ]);
    });

    it('checkoutLink() returns the URL string', async () => {
      mockTokenAndResponse({
        data: { checkoutLink: 'https://pay-sandbox.tradesafe.dev/checkout/abc' },
      });
      const client = buildClient(buildConfig());

      const url = await client.checkoutLink('tx-1');
      expect(url).toBe('https://pay-sandbox.tradesafe.dev/checkout/abc');
    });

    it('allocationStartDelivery() returns state', async () => {
      mockTokenAndResponse({
        data: { allocationStartDelivery: { id: 'alloc-1', state: 'INITIATED' } },
      });
      const client = buildClient(buildConfig());

      const result = await client.allocationStartDelivery('alloc-1');
      expect(result.state).toBe('INITIATED');
    });

    it('allocationAcceptDelivery() returns state', async () => {
      mockTokenAndResponse({
        data: { allocationAcceptDelivery: { id: 'alloc-1', state: 'DELIVERED' } },
      });
      const client = buildClient(buildConfig());

      const result = await client.allocationAcceptDelivery('alloc-1');
      expect(result.state).toBe('DELIVERED');
    });

    it('getTransaction() returns null when transaction not found', async () => {
      mockTokenAndResponse({ data: { transaction: null } });
      const client = buildClient(buildConfig());

      const tx = await client.getTransaction('missing');
      expect(tx).toBeNull();
    });

    it('getTransaction() surfaces deposits + allocations for webhook re-fetch', async () => {
      mockTokenAndResponse({
        data: {
          transaction: {
            id: 'tx-1',
            title: 'Bounty',
            reference: 'bounty-xyz',
            state: 'FUNDS_RECEIVED',
            parties: [{ id: 'p-1', role: 'BUYER' }],
            allocations: [
              {
                id: 'alloc-1',
                title: 'Reward',
                value: 100,
                state: 'FUNDS_RECEIVED',
                deliverBy: null,
                inspectBy: null,
              },
            ],
            deposits: [
              {
                id: 'dep-1',
                method: 'OZOW',
                value: 105,
                processed: true,
                paymentLink: null,
              },
            ],
          },
        },
      });
      const client = buildClient(buildConfig());

      const tx = await client.getTransaction('tx-1');
      expect(tx?.state).toBe('FUNDS_RECEIVED');
      expect(tx?.deposits[0].processed).toBe(true);
      expect(tx?.allocations[0].value).toBe(100);
    });
  });

  describe('amount converters', () => {
    it('toZar converts cents → rand Float', () => {
      expect(toZar(10000n)).toBe(100);
      expect(toZar(15050n)).toBe(150.5);
      expect(toZar(0n)).toBe(0);
    });

    it('toCents converts rand Float → cents (round-safe)', () => {
      expect(toCents(100)).toBe(10000n);
      expect(toCents(150.5)).toBe(15050n);
      expect(toCents(0)).toBe(0n);
      // Float drift guard: 0.1 + 0.2 = 0.30000000000000004
      expect(toCents(0.1 + 0.2)).toBe(30n);
    });

    it('round-trips cents → zar → cents without drift', () => {
      const amounts = [10000n, 15000n, 123456n, 1n, 99n, 99999n];
      for (const cents of amounts) {
        expect(toCents(toZar(cents))).toBe(cents);
      }
    });
  });

  describe('retry on 5xx', () => {
    it('retries the auth call on 503', async () => {
      fetchMock
        .mockResolvedValueOnce(respond(503, {}))
        .mockResolvedValueOnce(
          respond(200, { access_token: 'tok_abc', token_type: 'Bearer', expires_in: 1800 }),
        );
      const client = buildClient(buildConfig());

      const token = await client.getToken();

      expect(token).toBe('tok_abc');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not retry 4xx on the auth call', async () => {
      fetchMock.mockResolvedValueOnce(respond(401, { error: 'invalid_client' }));
      const client = buildClient(buildConfig());

      await expect(client.getToken()).rejects.toThrow(/returned 401/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
