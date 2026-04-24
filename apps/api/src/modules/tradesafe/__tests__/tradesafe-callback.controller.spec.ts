import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { Prisma, WebhookProvider, WebhookStatus } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TradeSafeCallbackController,
  isValidStateParam,
} from '../tradesafe-callback.controller';

/**
 * R33 — TradeSafe OAuth callback controller tests.
 *
 * Covers the five behaviours documented in the controller's JSDoc:
 *   1. Valid code + state -> persist WebhookEvent + AuditLog, 302 success.
 *   2. Invalid / missing state -> 302 failure, no DB side-effect.
 *   3. Provider-side `error` query param -> 302 failure.
 *   4. Replay (state re-used) -> 302 success, no duplicate AuditLog.
 *   5. Missing TRADESAFE_SUCCESS_URL / _FAILURE_URL at runtime ->
 *      InternalServerErrorException (defence-in-depth vs. R35 gate).
 *
 * DB / Prisma is mocked; the UNIQUE-constraint replay path is exercised
 * by throwing a P2002 from `webhookEvent.create`.
 */

function makeConfig(overrides: Record<string, string | undefined> = {}): ConfigService {
  const values: Record<string, string | undefined> = {
    TRADESAFE_SUCCESS_URL: 'https://app.example.com/hunters/me?tradesafe=linked',
    TRADESAFE_FAILURE_URL: 'https://app.example.com/hunters/me?tradesafe=failed',
    SYSTEM_ACTOR_ID: '00000000-0000-0000-0000-000000000001',
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function makePrisma() {
  return {
    webhookEvent: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as PrismaService & {
    webhookEvent: { create: jest.Mock };
    auditLog: { create: jest.Mock };
  };
}

function makeRes() {
  const redirect = jest.fn();
  const res = { redirect } as unknown as { redirect: jest.Mock };
  return { res, redirect };
}

function makeReq(
  query: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  return {
    query,
    headers: { 'user-agent': 'jest', ...headers },
  } as unknown as import('express').Request;
}

describe('TradeSafeCallbackController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists WebhookEvent + AuditLog and 302s to success URL on valid state + code', async () => {
    const config = makeConfig();
    const prisma = makePrisma();
    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'evt_1' });
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      'authcode_abc',
      'state-a1b2c3d4-e5f6',
      undefined,
      makeReq({ code: 'authcode_abc', state: 'state-a1b2c3d4-e5f6' }),
      res as unknown as import('express').Response,
    );

    expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: WebhookProvider.TRADESAFE,
        externalEventId: 'state-a1b2c3d4-e5f6',
        eventType: 'tradesafe.beneficiary_link_callback',
        status: WebhookStatus.PROCESSED,
      }),
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: '00000000-0000-0000-0000-000000000001',
        actorRole: UserRole.SUPER_ADMIN,
        action: 'TRADESAFE_BENEFICIARY_LINK_CALLBACK',
        entityType: 'WebhookEvent',
        entityId: 'state-a1b2c3d4-e5f6',
      }),
    });
    // Success URL 302.
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=linked',
    );

    // Code must never make it into the audit log afterState (treat as secret).
    const auditArg = (prisma.auditLog.create as jest.Mock).mock.calls[0][0];
    expect(JSON.stringify(auditArg.data.afterState)).not.toContain('authcode_abc');
  });

  it('302s to failure URL when state is missing, without touching the DB', async () => {
    const config = makeConfig();
    const prisma = makePrisma();
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      'authcode_abc',
      undefined,
      undefined,
      makeReq({ code: 'authcode_abc' }),
      res as unknown as import('express').Response,
    );

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=failed',
    );
  });

  it('302s to failure URL when state is tampered (contains URL / script shape)', async () => {
    const config = makeConfig();
    const prisma = makePrisma();
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      'authcode_abc',
      'javascript:alert(1)',
      undefined,
      makeReq(),
      res as unknown as import('express').Response,
    );

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=failed',
    );
  });

  it('302s to failure URL when code is missing, without touching the DB', async () => {
    const config = makeConfig();
    const prisma = makePrisma();
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      undefined,
      'state-abc-123-opaque',
      undefined,
      makeReq(),
      res as unknown as import('express').Response,
    );

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=failed',
    );
  });

  it('302s to failure URL when provider returns an error query param', async () => {
    const config = makeConfig();
    const prisma = makePrisma();
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      'authcode_abc',
      'state-abc-123-opaque',
      'access_denied',
      makeReq(),
      res as unknown as import('express').Response,
    );

    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=failed',
    );
  });

  it('is replay-safe: duplicate state short-circuits to success without duplicate AuditLog', async () => {
    const config = makeConfig();
    const prisma = makePrisma();
    // Simulate UNIQUE (provider, externalEventId) constraint violation.
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint violation',
      { code: 'P2002', clientVersion: 'test' },
    );
    (prisma.webhookEvent.create as jest.Mock).mockRejectedValue(p2002);
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      'authcode_abc',
      'state-replayed-abc-123',
      undefined,
      makeReq(),
      res as unknown as import('express').Response,
    );

    // WebhookEvent.create was attempted but threw P2002 (replay).
    expect(prisma.webhookEvent.create).toHaveBeenCalledTimes(1);
    // Audit log MUST NOT be written again on replay.
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    // Still redirect to success — the hunter's browser doesn't know it
    // was a replay and shouldn't be punished for a refresh / back-button.
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=linked',
    );
  });

  it('302s to failure URL on unexpected DB errors (non-P2002)', async () => {
    const config = makeConfig();
    const prisma = makePrisma();
    (prisma.webhookEvent.create as jest.Mock).mockRejectedValue(
      new Error('connection reset'),
    );
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      'authcode_abc',
      'state-opaque-valid-token',
      undefined,
      makeReq(),
      res as unknown as import('express').Response,
    );

    expect(prisma.webhookEvent.create).toHaveBeenCalled();
    // AuditLog is NOT written when the primary record failed.
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=failed',
    );
  });

  it('throws InternalServerErrorException if URLs unset at request time (R35 defence-in-depth)', async () => {
    const config = makeConfig({
      TRADESAFE_SUCCESS_URL: undefined,
      TRADESAFE_FAILURE_URL: undefined,
    });
    const prisma = makePrisma();
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res } = makeRes();

    await expect(
      controller.callback(
        'authcode_abc',
        'state-abc-123-opaque',
        undefined,
        makeReq(),
        res as unknown as import('express').Response,
      ),
    ).rejects.toThrow(InternalServerErrorException);
    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();
  });

  it('still redirects to success when SYSTEM_ACTOR_ID is unset (audit skipped, persistence kept)', async () => {
    const config = makeConfig({ SYSTEM_ACTOR_ID: undefined });
    const prisma = makePrisma();
    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'evt_1' });
    const controller = new TradeSafeCallbackController(
      config,
      prisma as unknown as PrismaService,
    );
    const { res, redirect } = makeRes();

    await controller.callback(
      'authcode_abc',
      'state-abc-123-opaque',
      undefined,
      makeReq(),
      res as unknown as import('express').Response,
    );

    // Webhook event stored.
    expect(prisma.webhookEvent.create).toHaveBeenCalledTimes(1);
    // Audit log skipped because we have no actor id.
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com/hunters/me?tradesafe=linked',
    );
  });
});

describe('isValidStateParam', () => {
  it('accepts UUID-shaped strings', () => {
    expect(isValidStateParam('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('accepts base64url / JWT-shaped strings', () => {
    expect(isValidStateParam('eyJhbGciOi.eyJzdWIi.abc123_-.==')).toBe(true);
  });

  it('rejects non-strings', () => {
    expect(isValidStateParam(undefined)).toBe(false);
    expect(isValidStateParam(null)).toBe(false);
    expect(isValidStateParam(42 as unknown)).toBe(false);
  });

  it('rejects empty / too-short / too-long strings', () => {
    expect(isValidStateParam('')).toBe(false);
    expect(isValidStateParam('short')).toBe(false);
    expect(isValidStateParam('a'.repeat(513))).toBe(false);
  });

  it('rejects URL-shaped values', () => {
    expect(isValidStateParam('https://evil.example.com/pwned')).toBe(false);
    expect(isValidStateParam('javascript:alert(1)')).toBe(false);
    expect(isValidStateParam('data:text/html,<script>')).toBe(false);
    expect(isValidStateParam('file:///etc/passwd')).toBe(false);
  });

  it('rejects whitespace / control / quote characters', () => {
    expect(isValidStateParam('state with space')).toBe(false);
    expect(isValidStateParam('state\nwith\nnewline')).toBe(false);
    expect(isValidStateParam("state'with'quote")).toBe(false);
    expect(isValidStateParam('state<with>angles')).toBe(false);
  });
});
