import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import {
  ALLOCATION_ACCEPT_DELIVERY_MUTATION,
  ALLOCATION_START_DELIVERY_MUTATION,
  API_PROFILE_QUERY,
  ApiProfileData,
  AllocationStateData,
  CHECKOUT_LINK_MUTATION,
  CheckoutLinkData,
  TOKEN_CREATE_MUTATION,
  TRANSACTION_CREATE_MUTATION,
  TRANSACTION_QUERY,
  TokenCreateData,
  TokenCreateInput,
  TransactionCreateData,
  TransactionCreateInput,
  TransactionData,
} from './tradesafe-graphql.operations';

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
 * Canonical TradeSafe error class. Thrown by the GraphQL client (this file)
 * on OAuth failures, malformed envelopes, GraphQL `errors[]` (HTTP 200 +
 * payload errors — see line ~213), and 4xx HTTP responses from the auth
 * endpoint.
 *
 * Lived in `tradesafe.types.ts` until 2026-04-27. Collapsed here as part of
 * the post-Phase-3 cleanup — once the legacy outbound types went away there
 * was no second occupant of the types file. The class moved without a
 * behavioural change; only the import path updates.
 */
export class TradeSafeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'TradeSafeApiError';
  }
}

/**
 * TradeSafe GraphQL client. Handles OAuth 2.0 Client Credentials
 * authentication, request retries (5xx), token caching, and mock-mode
 * short-circuiting. Owns transport + the typed mutation/query helpers
 * (`tokenCreate`, `transactionCreate`, `checkoutLink`, `getTransaction`,
 * `allocationStartDelivery`, `allocationAcceptDelivery`).
 *
 * ADR 0011 documents the pivot from REST + per-bounty Stitch payment-links
 * to TradeSafe-as-unified-rail. This is the only TradeSafe client post-
 * 2026-04-27 — the legacy REST `TradeSafeClient` (outbound payouts) was
 * deleted along with its dormant adapter + factory now that
 * `PayoutsService` stubs `NotImplementedException` until Phase 4.
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

    // Stampede guard. We track lock ownership locally so the `finally`
    // releases the lock only when WE acquired it — otherwise we'd blow
    // away a peer's still-active lock on our way out.
    let haveLock = await this.redis.setNxEx(
      TOKEN_LOCK_KEY,
      '1',
      TOKEN_LOCK_TTL_SECONDS,
    );
    if (!haveLock) {
      // Peer is fetching. Poll the cache briefly so we can pick up their
      // token without making a parallel OAuth call.
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const token = await this.redis.get(TOKEN_CACHE_KEY);
        if (token) return token;
      }
      // Polling exhausted (peer's OAuth is slow >1s, or peer crashed
      // without releasing the lock). Try once more to claim it ourselves.
      // Worst case: peer is still alive and we make a second OAuth call —
      // unchanged behaviour from pre-cooldown. Best case: peer crashed,
      // we claim the lock, no thundering herd.
      haveLock = await this.redis.setNxEx(
        TOKEN_LOCK_KEY,
        '1',
        TOKEN_LOCK_TTL_SECONDS,
      );
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
      // Only release the lock if WE acquired it — peers' locks are theirs
      // to release. The lock has its own TTL (10s) as a safety net for
      // crashed-mid-fetch peers.
      if (haveLock) {
        await this.redis.del(TOKEN_LOCK_KEY).catch(() => undefined);
      }
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

  // ─── Typed operation wrappers ───────────────────────────

  /**
   * Retrieve the API owner's profile + organization tokens. The platform's
   * own organization token is consumed elsewhere as the AGENT party on every
   * bounty transaction (so TradeSafe knows which merchant is facilitating).
   */
  async getApiProfile(): Promise<ApiProfileData['apiProfile']> {
    const data = await this.request<ApiProfileData>(API_PROFILE_QUERY);
    return data.apiProfile;
  }

  /**
   * Create a party token. One token per user (hunter / brand admin) — stored
   * on the User row so subsequent transactions re-use it. Banking details are
   * required for SELLER parties (i.e. hunters); BUYER-only parties (brand
   * admins who never receive payouts) may omit them.
   */
  async tokenCreate(input: TokenCreateInput): Promise<TokenCreateData['tokenCreate']> {
    const data = await this.request<TokenCreateData>(
      TOKEN_CREATE_MUTATION,
      input as unknown as Record<string, unknown>,
    );
    return data.tokenCreate;
  }

  /**
   * Create an escrow transaction with its allocations + parties. Use
   * {@link toZar} to convert ledger cents → ZAR Float for `allocations[].value`.
   */
  async transactionCreate(
    input: TransactionCreateInput,
  ): Promise<TransactionCreateData['transactionCreate']> {
    const variables = {
      title: input.title,
      description: input.description,
      industry: input.industry,
      workflow: input.workflow,
      feeAllocation: input.feeAllocation,
      reference: input.reference ?? null,
      allocations: input.allocations,
      parties: input.parties,
    };
    const data = await this.request<TransactionCreateData>(
      TRANSACTION_CREATE_MUTATION,
      variables,
    );
    return data.transactionCreate;
  }

  /**
   * Generate the hosted checkout URL for the BUYER. Returns a URL the client
   * must redirect the browser to for card / EFT / OZOW / SnapScan capture.
   */
  async checkoutLink(transactionId: string): Promise<string> {
    const data = await this.request<CheckoutLinkData>(CHECKOUT_LINK_MUTATION, {
      id: transactionId,
    });
    return data.checkoutLink;
  }

  /**
   * Mark an allocation as "delivery started" — hunter has begun work.
   * Transition: FUNDS_RECEIVED → INITIATED.
   */
  async allocationStartDelivery(
    allocationId: string,
  ): Promise<{ id: string; state: string }> {
    const data = await this.request<AllocationStateData>(
      ALLOCATION_START_DELIVERY_MUTATION,
      { id: allocationId },
    );
    if (!data.allocationStartDelivery) {
      throw new TradeSafeApiError('allocationStartDelivery returned no data', 500);
    }
    return data.allocationStartDelivery;
  }

  /**
   * Accept delivery — brand signs off on the hunter's submission. TradeSafe
   * then auto-pays the SELLER's registered bank account from the allocation.
   * Transition: INITIATED/DELIVERED → DELIVERED → FUNDS_RELEASED.
   */
  async allocationAcceptDelivery(
    allocationId: string,
  ): Promise<{ id: string; state: string }> {
    const data = await this.request<AllocationStateData>(
      ALLOCATION_ACCEPT_DELIVERY_MUTATION,
      { id: allocationId },
    );
    if (!data.allocationAcceptDelivery) {
      throw new TradeSafeApiError('allocationAcceptDelivery returned no data', 500);
    }
    return data.allocationAcceptDelivery;
  }

  /**
   * Fetch canonical transaction state. Used by the webhook handler as the
   * authoritative source after receiving a callback (webhook body is
   * treated as untrusted — we re-fetch via this query before acting).
   */
  async getTransaction(id: string): Promise<TransactionData['transaction']> {
    const data = await this.request<TransactionData>(TRANSACTION_QUERY, { id });
    return data.transaction;
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
