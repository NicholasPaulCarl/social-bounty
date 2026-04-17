/**
 * RBAC contract tests for FinanceExportsController.
 *
 * Mirrors the pattern in finance-admin.controller.rbac.spec.ts: we exercise
 * the real auth gates (JwtAuthGuard + RolesGuard) against real controller
 * handlers, with the service fully mocked. supertest isn't installed, so we
 * assert the contract via the Reflector + guard canActivate()/handleRequest()
 * rather than firing HTTP.
 *
 * Per the task brief: 4 routes x 5 assertions —
 *   (1) @Roles metadata equals [SUPER_ADMIN]
 *   (2) unauthenticated -> 401 (JwtAuthGuard rejects)
 *   (3) PARTICIPANT     -> 403 (RolesGuard returns false)
 *   (4) BUSINESS_ADMIN  -> 403 (RolesGuard returns false)
 *   (5) SUPER_ADMIN     -> not 401/403 (RolesGuard returns true)
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@social-bounty/shared';
import { ROLES_KEY } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FinanceExportsController } from './exports.controller';

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

describe('FinanceExportsController RBAC contract', () => {
  let controller: FinanceExportsController;
  let rolesGuard: RolesGuard;
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    // Mock the service — we never want the export logic to run.
    const svc = {
      inboundCsv: jest.fn(),
      reservesCsv: jest.fn(),
      refundsCsv: jest.fn(),
      ledgerCsv: jest.fn(),
    };
    controller = new FinanceExportsController(svc as any);
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    jwtGuard = new JwtAuthGuard(reflector);
  });

  // [handlerName, expectedRoles] — one entry per CSV endpoint
  const routes: Array<[string, UserRole[]]> = [
    ['inbound', [UserRole.SUPER_ADMIN]],
    ['reserves', [UserRole.SUPER_ADMIN]],
    ['refunds', [UserRole.SUPER_ADMIN]],
    ['ledger', [UserRole.SUPER_ADMIN]],
  ];

  it.each(routes)(
    'route "%s" advertises the expected @Roles metadata',
    (handlerName, expected) => {
      const ctx = makeContext(controller, handlerName, SUPER_ADMIN);
      const roles = reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
      expect(roles).toEqual(expected);
    },
  );

  it.each(routes)(
    'route "%s": unauthenticated request is rejected with 401',
    (handlerName) => {
      // JwtAuthGuard.handleRequest throws UnauthorizedException when Passport
      // yields no user — this is the gate that produces the 401 in production.
      expect(() =>
        jwtGuard.handleRequest(
          null,
          null,
          null,
          makeContext(controller, handlerName, undefined),
        ),
      ).toThrow(UnauthorizedException);
    },
  );

  it.each(routes)(
    'route "%s": wrong-role (PARTICIPANT) is rejected with 403',
    (handlerName) => {
      // Once authenticated, RolesGuard is the 403 gate.
      const ctx = makeContext(controller, handlerName, PARTICIPANT);
      expect(rolesGuard.canActivate(ctx)).toBe(false);
    },
  );

  it.each(routes)(
    'route "%s": wrong-role (BUSINESS_ADMIN) is rejected with 403',
    (handlerName) => {
      const ctx = makeContext(controller, handlerName, BUSINESS_ADMIN);
      expect(rolesGuard.canActivate(ctx)).toBe(false);
    },
  );

  it.each(routes)(
    'route "%s": SUPER_ADMIN passes RolesGuard (not 401/403)',
    (handlerName) => {
      const ctx = makeContext(controller, handlerName, SUPER_ADMIN);
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    },
  );
});
