import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

const TOKEN_CACHE_KEY = 'stitch:token:v1';
const TOKEN_LOCK_KEY = 'stitch:token:lock:v1';
const TOKEN_TTL_SECONDS = 840; // 14 min (Stitch tokens live 15 min)
const TOKEN_LOCK_TTL_SECONDS = 10;
const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_MAX_ATTEMPTS = 3;

export interface CreatePaymentLinkParams {
  amountCents: bigint;
  merchantReference: string;
  payerName: string;
  payerEmailAddress?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface CreatePayoutParams {
  amountCents: bigint;
  speed?: 'INSTANT' | 'DEFAULT';
  beneficiaryId: string;
  merchantReference: string;
}

export interface StitchTokenResponse {
  success: boolean;
  data: { accessToken: string };
}

export class StitchApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'StitchApiError';
  }
}

@Injectable()
export class StitchClient {
  private readonly logger = new Logger(StitchClient.name);
  private readonly apiBase: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.apiBase = this.config.get<string>('STITCH_API_BASE', 'https://express.stitch.money');
    this.clientId = this.config.get<string>('STITCH_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('STITCH_CLIENT_SECRET', '');
    this.enabled = this.config.get<string>('PAYMENTS_PROVIDER', 'none') !== 'none';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async getToken(scope = 'client_paymentrequest'): Promise<string> {
    const cached = await this.redis.get(TOKEN_CACHE_KEY);
    if (cached) return cached;

    // Prevent stampede: one caller fetches, others wait briefly.
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
      const res = await this.fetchWithRetry(`${this.apiBase}/api/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          scope,
        }),
      });
      const json = (await res.json()) as StitchTokenResponse;
      const token = json?.data?.accessToken;
      if (!token) {
        throw new StitchApiError('Stitch token response missing accessToken', 500, json);
      }
      await this.redis.set(TOKEN_CACHE_KEY, token, TOKEN_TTL_SECONDS);
      return token;
    } finally {
      await this.redis.del(TOKEN_LOCK_KEY).catch(() => undefined);
    }
  }

  async probeToken(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      // Bypass cache for the probe so we actually test connectivity.
      await this.redis.del(TOKEN_CACHE_KEY).catch(() => undefined);
      await this.getToken();
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getAccountBalance(): Promise<{ balance: number }> {
    const res = await this.authedRequest('GET', '/api/v1/account/balance');
    const json = (await res.json()) as { success?: boolean; data?: { balance: number } };
    return json.data ?? { balance: 0 };
  }

  async createPaymentLink(
    params: CreatePaymentLinkParams,
  ): Promise<{ id: string; url: string; status: string }> {
    const body = {
      amount: Number(params.amountCents), // Stitch expects number cents
      merchantReference: params.merchantReference,
      payerName: params.payerName,
      payerEmailAddress: params.payerEmailAddress,
      expiresAt: params.expiresAt?.toISOString(),
    };
    const res = await this.authedRequest('POST', '/api/v1/payment-links', body);
    const json = (await res.json()) as {
      data?: { payment?: { id: string; link: string; status: string } };
    };
    const payment = json.data?.payment;
    if (!payment?.id || !payment?.link) {
      throw new StitchApiError('Invalid payment-link response', 500, json);
    }
    return { id: payment.id, url: payment.link, status: payment.status };
  }

  async getPayment(stitchPaymentId: string): Promise<Record<string, unknown>> {
    const res = await this.authedRequest('GET', `/api/v1/payment/${stitchPaymentId}`);
    const json = (await res.json()) as { data?: Record<string, unknown> };
    return json.data ?? {};
  }

  async createRefund(
    stitchPaymentId: string,
    amountCents: bigint,
    reason: 'DUPLICATE' | 'FRAUD' | 'REQUESTED_BY_CUSTOMER',
  ): Promise<{ id: string; status: string }> {
    const res = await this.authedRequest(
      'POST',
      `/api/v1/payment/${stitchPaymentId}/refund`,
      { amount: Number(amountCents), reason },
    );
    const json = (await res.json()) as { data?: { id: string; status: string } };
    if (!json.data) throw new StitchApiError('Invalid refund response', 500, json);
    return json.data;
  }

  async createPayout(
    params: CreatePayoutParams,
    idempotencyKey: string,
  ): Promise<{ id: string; status: string }> {
    const res = await this.authedRequest(
      'POST',
      '/api/v1/withdrawal',
      {
        amount: Number(params.amountCents),
        withdrawalType: params.speed ?? 'DEFAULT',
        beneficiaryId: params.beneficiaryId,
        merchantReference: params.merchantReference,
      },
      { 'Idempotency-Key': idempotencyKey },
    );
    const json = (await res.json()) as { data?: { id: string; status: string } };
    if (!json.data) throw new StitchApiError('Invalid payout response', 500, json);
    return json.data;
  }

  /**
   * Create a payout beneficiary.
   *
   * IMPORTANT: Stitch Express does NOT expose a beneficiary / payee / payment-instrument
   * endpoint. The public surface is limited to:
   *   POST /api/v1/token, /api/v1/payment-links, /api/v1/card-consents,
   *   /api/v1/subscriptions, /api/v1/payment/{id}/refund, /api/v1/withdrawal,
   *   /api/v1/withdrawal/max, /api/v1/webhook, /api/v1/redirect-urls
   * `POST /api/v1/withdrawal` only pays to the merchant's single verified bank
   * account (see `GET /api/v1/account/bank-details`). It accepts no
   * beneficiaryId / bankAccountId field.
   *
   * See: https://express.stitch.money/api-docs and local reference
   * .claude/skills/DevStitchPayments/references/api-endpoints.md — neither lists
   * any beneficiary endpoint. Sandbox probing (POST /api/v1/beneficiaries,
   * /api/v1/beneficiary, /api/v1/payees, /api/v1/payee,
   * /api/v1/payment-instrument, /api/v1/withdrawal/beneficiary,
   * /api/v1/recipients, /api/v1/payouts, /api/v1/disbursements, /api/v1/pay,
   * /api/v1/transfers) all returned 404.
   *
   * Interim behaviour: we store bank details locally and mint a synthetic
   * `stitchBeneficiaryId` so the schema + downstream flow are unchanged. When
   * Stitch support confirms the real endpoint (or we move to a product that
   * supports multi-recipient payouts), this method will be updated to hit it.
   *
   * Returned `id` is prefixed `local:` so monitoring can flag any row that
   * should have a real Stitch id.
   */
  async createBeneficiary(
    payload: {
      accountHolderName: string;
      bankCode: string;
      accountNumber: string;
      accountType: string;
    },
  ): Promise<{ id: string }> {
    // Deterministic-ish synthetic id. Callers will overwrite / de-dupe on their
    // own unique index (stitch_beneficiaries.userId is unique).
    const slug = payload.accountNumber.slice(-6);
    const rand = Math.random().toString(36).slice(2, 10);
    this.logger.warn(
      `createBeneficiary: Stitch Express has no beneficiary endpoint; storing locally (holder=${payload.accountHolderName})`,
    );
    return { id: `local:${slug}:${rand}` };
  }

  async registerWebhook(url: string): Promise<{ id: string }> {
    const res = await this.authedRequest('POST', '/api/v1/webhook', { url });
    const json = (await res.json()) as { data?: { id: string } };
    if (!json.data) throw new StitchApiError('Invalid webhook register response', 500, json);
    return json.data;
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
          // 4xx is a business error; don't retry. Surface field errors in the message.
          const text = await res.text().catch(() => '');
          throw new StitchApiError(
            `Stitch ${init.method} ${url} returned ${res.status}: ${text}`,
            res.status,
            text,
          );
        }
        // 5xx: fall through to retry
        lastError = new StitchApiError(
          `Stitch ${init.method} ${url} returned ${res.status}`,
          res.status,
        );
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof StitchApiError && err.status >= 400 && err.status < 500) {
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
      : new Error('Stitch request failed after retries');
  }
}
