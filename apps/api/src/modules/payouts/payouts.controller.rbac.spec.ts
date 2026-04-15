/**
 * RBAC contract tests for PayoutsController.
 *
 * Two routes, two different roles:
 *   - POST /payouts/me/beneficiary -> PARTICIPANT only (upsert own bank details)
 *   - POST /payouts/:payoutId/retry -> SUPER_ADMIN only (admin retry)
 *
 * PARTICIPANT-only is a notable constraint: Business Admins and Super Admins
 * must *not* be able to upsert a beneficiary for a participant, because that
 * would be a custody bypass.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@social-bounty/shared';
import { ROLES_KEY } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PayoutsController } from './payouts.controller';

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

describe('PayoutsController RBAC contract', () => {
  let controller: PayoutsController;
  let rolesGuard: RolesGuard;
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    const beneficiaries = { upsertForUser: jest.fn() };
    const payouts = { adminRetry: jest.fn() };
    controller = new PayoutsController(beneficiaries as any, payouts as any);
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    jwtGuard = new JwtAuthGuard(reflector);
  });

  type Route = {
    handler: string;
    expected: UserRole[];
    forbidden: AuthUser[];
    allowed: AuthUser[];
  };

  const routes: Route[] = [
    {
      handler: 'upsertMyBeneficiary',
      expected: [UserRole.PARTICIPANT],
      forbidden: [BUSINESS_ADMIN, SUPER_ADMIN],
      allowed: [PARTICIPANT],
    },
    {
      handler: 'retry',
      expected: [UserRole.SUPER_ADMIN],
      forbidden: [PARTICIPANT, BUSINESS_ADMIN],
      allowed: [SUPER_ADMIN],
    },
  ];

  for (const r of routes) {
    describe(`route "${r.handler}"`, () => {
      it('advertises the expected @Roles metadata', () => {
        const ctx = makeContext(controller, r.handler, SUPER_ADMIN);
        const roles = reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
          ctx.getHandler(),
          ctx.getClass(),
        ]);
        expect(roles).toEqual(r.expected);
      });

      it('unauthenticated request is rejected with 401', () => {
        expect(() =>
          jwtGuard.handleRequest(null, null, null, makeContext(controller, r.handler, undefined)),
        ).toThrow(UnauthorizedException);
      });

      for (const user of r.forbidden) {
        it(`wrong-role (${user.role}) is rejected with 403`, () => {
          expect(rolesGuard.canActivate(makeContext(controller, r.handler, user))).toBe(false);
        });
      }

      for (const user of r.allowed) {
        it(`allowed role (${user.role}) passes RolesGuard`, () => {
          expect(rolesGuard.canActivate(makeContext(controller, r.handler, user))).toBe(true);
        });
      }
    });
  }
});
