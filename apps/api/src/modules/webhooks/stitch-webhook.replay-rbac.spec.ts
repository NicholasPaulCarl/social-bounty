/**
 * RBAC contract tests for StitchWebhookController.replay.
 *
 * This is the dev-only webhook replay endpoint. It has TWO layers of
 * defence in depth:
 *   1. @Roles(SUPER_ADMIN) — RolesGuard rejects non-SA callers with 403.
 *   2. Runtime check — even for SA, the handler throws ForbiddenException
 *      if PAYMENTS_PROVIDER === 'stitch_live'.
 *
 * We verify both layers here. The public POST /webhooks/stitch receive
 * endpoint is marked @Public() and is out of scope for RBAC (Svix signature
 * verification is the gate there, covered elsewhere).
 */
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@social-bounty/shared';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StitchWebhookController } from './stitch-webhook.controller';

type AuthUser = { sub: string; email: string; role: UserRole; brandId: string | null };

const SUPER_ADMIN: AuthUser = {
  sub: 'sa-1',
  email: 'sa@test.com',
  role: UserRole.SUPER_ADMIN,
  brandId: null,
};
const BUSINESS_ADMIN: AuthUser = {
  sub: 'ba-1',
  email: 'ba@test.com',
  role: UserRole.BUSINESS_ADMIN,
  brandId: 'brand-1',
};
const PARTICIPANT: AuthUser = {
  sub: 'p-1',
  email: 'p@test.com',
  role: UserRole.PARTICIPANT,
  brandId: null,
};

function makeContext(
  controller: object,
  handlerName: string,
  user: AuthUser | undefined,
): ExecutionContext {
  const handler = (controller as any)[handlerName];
  return {
    getHandler: () => handler,
    getClass: () => controller.constructor,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('StitchWebhookController /replay RBAC contract', () => {
  let controller: StitchWebhookController;
  let rolesGuard: RolesGuard;
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;
  // captured in beforeEach so each test can tweak PAYMENTS_PROVIDER
  let configStore: Record<string, string>;
  let routerReplay: jest.Mock;

  beforeEach(() => {
    configStore = { PAYMENTS_PROVIDER: 'stitch_sandbox' };
    const config = {
      get: jest.fn((key: string, fallback?: string) => configStore[key] ?? fallback ?? ''),
    };
    const verifier = { verify: jest.fn() };
    const events = {
      recordOrFetch: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn(),
      lastReceivedByProvider: jest.fn(),
    };
    routerReplay = jest.fn().mockResolvedValue({ ok: true });
    const router = { dispatch: jest.fn(), replay: routerReplay };
    const prisma = {};
    controller = new StitchWebhookController(
      config as any,
      verifier as any,
      events as any,
      router as any,
      prisma as any,
    );
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    jwtGuard = new JwtAuthGuard(reflector);
  });

  describe('replay handler metadata', () => {
    it('advertises SUPER_ADMIN on @Roles', () => {
      const ctx = makeContext(controller, 'replay', SUPER_ADMIN);
      const roles = reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
      expect(roles).toEqual([UserRole.SUPER_ADMIN]);
    });

    it('is NOT marked @Public() (replay must never bypass auth)', () => {
      const ctx = makeContext(controller, 'replay', SUPER_ADMIN);
      const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
      expect(isPublic).toBeFalsy();
    });

    it('the public POST /webhooks/stitch "receive" route IS @Public (Svix-gated)', () => {
      // Sanity: confirm we're not accidentally locking down the Stitch->us webhook.
      const ctx = makeContext(controller, 'receive', undefined);
      const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
      expect(isPublic).toBe(true);
    });
  });

  describe('auth gate', () => {
    it('unauthenticated request is rejected with 401', () => {
      expect(() =>
        jwtGuard.handleRequest(null, null, null, makeContext(controller, 'replay', undefined)),
      ).toThrow(UnauthorizedException);
    });

    it('wrong-role (PARTICIPANT) is rejected with 403', () => {
      expect(rolesGuard.canActivate(makeContext(controller, 'replay', PARTICIPANT))).toBe(false);
    });

    it('wrong-role (BUSINESS_ADMIN) is rejected with 403', () => {
      expect(rolesGuard.canActivate(makeContext(controller, 'replay', BUSINESS_ADMIN))).toBe(false);
    });

    it('SUPER_ADMIN passes RolesGuard (gate open)', () => {
      expect(rolesGuard.canActivate(makeContext(controller, 'replay', SUPER_ADMIN))).toBe(true);
    });
  });

  describe('live-mode safety (defence in depth beyond RBAC)', () => {
    it('rejects replay when PAYMENTS_PROVIDER=stitch_live even for SUPER_ADMIN', async () => {
      configStore.PAYMENTS_PROVIDER = 'stitch_live';
      await expect(controller.replay('evt-1')).rejects.toThrow(ForbiddenException);
      expect(routerReplay).not.toHaveBeenCalled();
    });

    it('permits replay in non-live mode for SUPER_ADMIN', async () => {
      configStore.PAYMENTS_PROVIDER = 'stitch_sandbox';
      await expect(controller.replay('evt-1')).resolves.toEqual({ ok: true });
      expect(routerReplay).toHaveBeenCalledWith('evt-1', expect.anything());
    });
  });
});
