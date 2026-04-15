import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import {
  TradeSafeApiError,
  TradeSafeCreateBeneficiaryRequest,
  TradeSafeCreateBeneficiaryResponse,
  TradeSafeGetPayoutStatusResponse,
  TradeSafeInitiatePayoutRequest,
  TradeSafeInitiatePayoutResponse,
  TradeSafeTokenResponse,
} from './tradesafe.types';

const TOKEN_CACHE_KEY = 'tradesafe:token:v1';
const TOKEN_LOCK_KEY = 'tradesafe:token:lock:v1';
const TOKEN_TTL_SECONDS = 840; // mirror StitchClient; ADR 0010 pins the real value
const TOKEN_LOCK_TTL_SECONDS = 10;
const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_MAX_ATTEMPTS = 3;

/**
 * TradeSafe HTTP client. Mirrors the shape of {@link StitchClient} so the two
 * payout providers are interchangeable via the {@link PayoutProviderFactory}.
 *
 * ADR 0009 defines this as the adapter-shape only; the concrete endpoint paths
 * and request/response shapes are stubs until ADR 0010 lands (post-sandbox).
 *
 * Mock mode (`TRADESAFE_MOCK=true`, or unset creds) short-circuits every method
 * to deterministic in-memory fixtures. No network is made. Mock mode is the
 * default for dev / CI — live mode only fires when creds are configured and
 * the mock flag is explicitly false.
 */
@Injectable()
export class TradeSafeClient {
  private readonly logger = new Logger(TradeSafeClient.name);
  private readonly apiBase: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly mockMode: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.apiBase = this.config.get<string>(
      'TRADESAFE_API_BASE',
      'https://api.tradesafe.co.za',
    );
    this.clientId = this.config.get<string>('TRADESAFE_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('TRADESAFE_CLIENT_SECRET', '');
    const mockFlag = this.config.get<string>('TRADESAFE_MOCK', '');
    // Mock mode is ON when explicitly set, OR when no creds are configured.
    // This means scaffolding is safe-by-default: live calls only happen when
    // creds are present AND TRADESAFE_MOCK is explicitly set to 'false'.
    if (mockFlag === 'true' || mockFlag === 'false') {
      this.mockMode = mockFlag === 'true';
    } else {
      this.mockMode = !this.clientId || !this.clientSecret;
    }
    if (this.mockMode) {
      this.logger.warn(
        'TradeSafeClient running in MOCK mode — no network calls will be made (ADR 0009 scaffold)',
      );
    }
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  async getToken(): Promise<string> {
    if (this.mockMode) {
      return 'mock-tradesafe-token';
    }

    const cached = await this.redis.get(TOKEN_CACHE_KEY);
    if (cached) return cached;

    const acquired = await this.redis.setNxEx(TOKEN_LOCK_KEY, '1', TOKEN_LOCK_TTL_SECONDS);
    if (!acquired) {
      // Another worker is fetching; poll briefly then fall through.
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const token = await this.redis.get(TOKEN_CACHE_KEY);
        if (token) return token;
      }
    }

    try {
      const res = await this.fetchWithRetry(`${this.apiBase}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantType: 'client_credentials',
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        }),
      });
      const json = (await res.json()) as TradeSafeTokenResponse;
      const token = json?.accessToken;
      if (!token) {
        throw new TradeSafeApiError(
          'TradeSafe token response missing accessToken',
          500,
          json,
        );
      }
      await this.redis.set(TOKEN_CACHE_KEY, token, TOKEN_TTL_SECONDS);
      return token;
    } finally {
      await this.redis.del(TOKEN_LOCK_KEY).catch(() => undefined);
    }
  }

  async createBeneficiary(
    payload: TradeSafeCreateBeneficiaryRequest,
  ): Promise<TradeSafeCreateBeneficiaryResponse> {
    if (this.mockMode) {
      return {
        id: `mock-bene-${this.deterministicSuffix(payload.externalReference)}`,
        status: 'VERIFIED',
      };
    }
    const res = await this.authedRequest('POST', '/api/v1/beneficiaries', payload);
    const json = (await res.json()) as {
      data?: TradeSafeCreateBeneficiaryResponse;
    };
    if (!json.data) {
      throw new TradeSafeApiError('Invalid beneficiary response', 500, json);
    }
    return json.data;
  }

  async initiatePayout(
    params: TradeSafeInitiatePayoutRequest,
    idempotencyKey: string,
  ): Promise<TradeSafeInitiatePayoutResponse> {
    if (this.mockMode) {
      return {
        id: `mock-payout-${this.deterministicSuffix(params.merchantReference)}`,
        status: 'ESCROW_HELD',
      };
    }
    const res = await this.authedRequest(
      'POST',
      '/api/v1/payouts',
      {
        amount: Number(params.amountCents),
        beneficiaryId: params.beneficiaryId,
        merchantReference: params.merchantReference,
      },
      { 'Idempotency-Key': idempotencyKey },
    );
    const json = (await res.json()) as { data?: TradeSafeInitiatePayoutResponse };
    if (!json.data) {
      throw new TradeSafeApiError('Invalid initiatePayout response', 500, json);
    }
    return json.data;
  }

  async getPayoutStatus(
    tradesafePayoutId: string,
  ): Promise<TradeSafeGetPayoutStatusResponse> {
    if (this.mockMode) {
      return { id: tradesafePayoutId, status: 'ESCROW_HELD' };
    }
    const res = await this.authedRequest('GET', `/api/v1/payouts/${tradesafePayoutId}`);
    const json = (await res.json()) as { data?: TradeSafeGetPayoutStatusResponse };
    if (!json.data) {
      throw new TradeSafeApiError('Invalid payout-status response', 500, json);
    }
    return json.data;
  }

  private deterministicSuffix(seed: string): string {
    // Deterministic short suffix so fixtures in tests are stable without
    // pulling in a crypto hash. NOT a security primitive.
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36).slice(0, 10).padStart(6, '0');
  }

  private async authedRequest(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<Response> {
    const token = await this.getToken();
    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    return this.fetchWithRetry(`${this.apiBase}${path}`, init);
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
          const text = await res.text().catch(() => '');
          throw new TradeSafeApiError(
            `TradeSafe ${init.method} ${url} returned ${res.status}: ${text}`,
            res.status,
            text,
          );
        }
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
      : new Error('TradeSafe request failed after retries');
  }
}
