import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { TradeSafeApiError } from './tradesafe.types';

// Token cache — separate from the REST-era `tradesafe:token:v1` key so the
// two clients never collide during the Phase 1 → Phase 4 cutover window.
const TOKEN_CACHE_KEY = 'tradesafe:graphql:token:v1';
const TOKEN_LOCK_KEY = 'tradesafe:graphql:token:lock:v1';
// TradeSafe OAuth returns `expires_in: 1800` (30 min). Cache for 25 min to
// leave a 5-min safety margin before actual expiry.
const TOKEN_TTL_SECONDS = 1500;
const TOKEN_LOCK_TTL_SECONDS = 10;
const DEFAULT_TIMEOUT_MS = 15_000;
const RETRY_MAX_ATTEMPTS = 3;

const DEFAULT_AUTH_URL = 'https://auth.tradesafe.co.za/oauth/token';
const DEFAULT_GRAPHQL_URL = 'https://api-developer.tradesafe.dev/graphql';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
}

/**
 * TradeSafe GraphQL client. Handles OAuth 2.0 Client Credentials
 * authentication, request retries (5xx), token caching, and mock-mode
 * short-circuiting. Higher-level mutation/query helpers (`tokenCreate`,
 * `transactionCreate`, `checkoutLink`, etc.) land in Phase 1b —
 * this class owns the transport layer only.
 *
 * ADR 0011 (upcoming) documents the pivot from REST + per-bounty Stitch
 * payment-links to TradeSafe-as-unified-rail. The REST stub at
 * {@link TradeSafeClient} stays in place until the inbound cutover
 * (Phase 3) and outbound cutover (Phase 4) replace its two live-code
 * consumers.
 *
 * Auth reference: https://docs.tradesafe.co.za/api/authentication/
 * Token endpoint returns `expires_in: 1800` in practice (docs claim 3600);
 * we cache with a 5-min safety margin.
 */
@Injectable()
export class TradeSafeGraphQLClient {
  private readonly logger = new Logger(TradeSafeGraphQLClient.name);
  private readonly authUrl: string;
  private readonly graphqlUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly mockMode: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.authUrl = this.config.get<string>('TRADESAFE_AUTH_URL', DEFAULT_AUTH_URL) ?? DEFAULT_AUTH_URL;
    this.graphqlUrl =
      this.config.get<string>('TRADESAFE_GRAPHQL_URL', DEFAULT_GRAPHQL_URL) ?? DEFAULT_GRAPHQL_URL;
    this.clientId = this.config.get<string>('TRADESAFE_CLIENT_ID', '') ?? '';
    this.clientSecret = this.config.get<string>('TRADESAFE_CLIENT_SECRET', '') ?? '';
    const mockFlag = this.config.get<string>('TRADESAFE_MOCK', '');
    if (mockFlag === 'true' || mockFlag === 'false') {
      this.mockMode = mockFlag === 'true';
    } else {
      this.mockMode = !this.clientId || !this.clientSecret;
    }
    if (this.mockMode) {
      this.logger.warn(
        'TradeSafeGraphQLClient running in MOCK mode — no network calls will be made',
      );
    }
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Fetch a Bearer token for the GraphQL API. Cached in Redis across
   * workers; stampede-guarded via a short-lived lock.
   */
  async getToken(): Promise<string> {
    if (this.mockMode) {
      return 'mock-tradesafe-token';
    }

    const cached = await this.redis.get(TOKEN_CACHE_KEY);
    if (cached) return cached;

    const acquired = await this.redis.setNxEx(TOKEN_LOCK_KEY, '1', TOKEN_LOCK_TTL_SECONDS);
    if (!acquired) {
      // Peer is fetching; poll briefly then fall through.
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const token = await this.redis.get(TOKEN_CACHE_KEY);
        if (token) return token;
      }
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });
      const res = await this.fetchWithRetry(this.authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const json = (await res.json()) as OAuthTokenResponse;
      const token = json?.access_token;
      if (!token) {
        throw new TradeSafeApiError(
          'TradeSafe token response missing access_token',
          500,
          json,
        );
      }
      // Honour `expires_in` if present, with a 5-min safety buffer; fall back
      // to the static TTL otherwise.
      const ttl =
        typeof json.expires_in === 'number' && json.expires_in > 300
          ? json.expires_in - 300
          : TOKEN_TTL_SECONDS;
      await this.redis.set(TOKEN_CACHE_KEY, token, ttl);
      return token;
    } finally {
      await this.redis.del(TOKEN_LOCK_KEY).catch(() => undefined);
    }
  }

  /**
   * Lightweight connectivity probe used by the live-readiness checks /
   * `/admin/finance/probes` endpoint. Round-trips the `apiProfile` query
   * and reports latency or error.
   */
  async probe(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      if (this.mockMode) {
        return { ok: true, latencyMs: 0 };
      }
      // Bypass cache so the probe actually exercises auth.
      await this.redis.del(TOKEN_CACHE_KEY).catch(() => undefined);
      await this.request<{ apiProfile: { organizations: unknown } | null }>(
        `query { apiProfile { organizations { name token } } }`,
      );
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Execute an arbitrary GraphQL query or mutation. Surfaces GraphQL-level
   * `errors` as {@link TradeSafeApiError} so callers don't need to unwrap
   * the response envelope manually. Unauthenticated responses (JWT expired
   * between cache hit and call) retry once with a fresh token.
   */
  async request<T>(
    query: string,
    variables: Record<string, unknown> = {},
    _attempt = 0,
  ): Promise<T> {
    if (this.mockMode) {
      throw new TradeSafeApiError(
        'TradeSafeGraphQLClient.request called in mock mode — callers must short-circuit before hitting transport',
        500,
      );
    }
    const token = await this.getToken();
    const res = await this.fetchWithRetry(this.graphqlUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors && json.errors.length > 0) {
      const firstErr = json.errors[0];
      const isAuthGuard =
        firstErr.message === 'Unauthenticated.' ||
        (firstErr.extensions?.guards as string[] | undefined)?.includes('oauth');
      // One retry on a stale cached token — force-refresh and try again.
      if (isAuthGuard && _attempt === 0) {
        await this.redis.del(TOKEN_CACHE_KEY).catch(() => undefined);
        return this.request<T>(query, variables, 1);
      }
      throw new TradeSafeApiError(
        `TradeSafe GraphQL: ${firstErr.message}`,
        res.status,
        json,
      );
    }
    if (!json.data) {
      throw new TradeSafeApiError(
        'TradeSafe GraphQL response missing data',
        res.status,
        json,
      );
    }
    return json.data;
  }

  private async fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) return res;
        if (res.status >= 400 && res.status < 500) {
          // 4xx is a business error; don't retry. Surface the body.
          const text = await res.text().catch(() => '');
          throw new TradeSafeApiError(
            `TradeSafe ${init.method} ${url} returned ${res.status}: ${text}`,
            res.status,
            text,
          );
        }
        // 5xx → retry with backoff.
        lastError = new TradeSafeApiError(
          `TradeSafe ${init.method} ${url} returned ${res.status}`,
          res.status,
        );
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof TradeSafeApiError && err.status >= 400 && err.status < 500) {
          throw err;
        }
        lastError = err;
      }
      if (attempt < RETRY_MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 200 * 2 ** (attempt - 1)));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('TradeSafe GraphQL request failed after retries');
  }
}
