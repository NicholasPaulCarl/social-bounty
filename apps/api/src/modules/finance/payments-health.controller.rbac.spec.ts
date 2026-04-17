/**
 * RBAC contract tests for PaymentsHealthController.
 *
 * Single route — GET /admin/payments-health — must be SUPER_ADMIN only.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@social-bounty/shared';
import { ROLES_KEY } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaymentsHealthController } from './payments-health.controller';

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

describe('PaymentsHealthController RBAC contract', () => {
  let controller: PaymentsHealthController;
  let rolesGuard: RolesGuard;
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    const config = { get: jest.fn(() => '') };
    const stitch = { isEnabled: jest.fn().mockReturnValue(false), probeToken: jest.fn() };
    const webhooks = { lastReceivedByProvider: jest.fn() };
    const prisma = { systemSetting: { findUnique: jest.fn() } };
    controller = new PaymentsHealthController(
      config as any,
      stitch as any,
      webhooks as any,
      prisma as any,
    );
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    jwtGuard = new JwtAuthGuard(reflector);
  });

  const routes: Array<[string, UserRole[]]> = [['get', [UserRole.SUPER_ADMIN]]];

  it.each(routes)('route "%s" advertises the expected @Roles metadata', (handlerName, expected) => {
    const ctx = makeContext(controller, handlerName, SUPER_ADMIN);
    const roles = reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    expect(roles).toEqual(expected);
  });

  it.each(routes)('route "%s": unauthenticated request is rejected with 401', (handlerName) => {
    expect(() =>
      jwtGuard.handleRequest(null, null, null, makeContext(controller, handlerName, undefined)),
    ).toThrow(UnauthorizedException);
  });

  it.each(routes)('route "%s": wrong-role (PARTICIPANT) is rejected with 403', (handlerName) => {
    expect(rolesGuard.canActivate(makeContext(controller, handlerName, PARTICIPANT))).toBe(false);
  });

  it.each(routes)('route "%s": wrong-role (BUSINESS_ADMIN) is rejected with 403', (handlerName) => {
    expect(rolesGuard.canActivate(makeContext(controller, handlerName, BUSINESS_ADMIN))).toBe(false);
  });

  it.each(routes)('route "%s": SUPER_ADMIN passes RolesGuard (gate open)', (handlerName) => {
    expect(rolesGuard.canActivate(makeContext(controller, handlerName, SUPER_ADMIN))).toBe(true);
  });
});
