import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { TradeSafeGraphQLClient } from './tradesafe-graphql.client';
import { TradeSafeApiError } from './tradesafe.types';

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
