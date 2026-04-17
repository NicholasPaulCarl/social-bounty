/**
 * RBAC contract tests for ReconciliationController.
 *
 * Both routes are SUPER_ADMIN-only. We verify that JwtAuthGuard rejects
 * unauthenticated callers (401) and RolesGuard rejects lower-privilege
 * callers (403) before the handler runs.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@social-bounty/shared';
import { ROLES_KEY } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReconciliationController } from './reconciliation.controller';

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

describe('ReconciliationController RBAC contract', () => {
  let controller: ReconciliationController;
  let rolesGuard: RolesGuard;
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    const recon = { run: jest.fn() };
    const prisma = { recurringIssue: { findMany: jest.fn() } };
    controller = new ReconciliationController(recon as any, prisma as any);
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    jwtGuard = new JwtAuthGuard(reflector);
  });

  const routes: Array<[string, UserRole[]]> = [
    ['runNow', [UserRole.SUPER_ADMIN]],
    ['listExceptions', [UserRole.SUPER_ADMIN]],
  ];

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
