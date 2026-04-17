/**
 * RBAC contract tests for RefundsController.
 *
 * Mixed-role controller:
 *   - POST /refunds/bounties/:bountyId/before-approval
 *       -> BUSINESS_ADMIN + SUPER_ADMIN
 *   - POST /refunds/:refundId/approve-before        -> SUPER_ADMIN only
 *   - POST /refunds/submissions/:submissionId/after-approval -> SUPER_ADMIN only
 *   - POST /refunds/submissions/:submissionId/after-payout   -> SUPER_ADMIN only
 *
 * Because the @Roles decorator is set per-handler here (not at the class
 * level), we must read metadata from each method individually — this also
 * guards against a future refactor accidentally widening access by dropping
 * the per-handler decorator.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@social-bounty/shared';
import { ROLES_KEY } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RefundsController } from './refunds.controller';

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

describe('RefundsController RBAC contract', () => {
  let controller: RefundsController;
  let rolesGuard: RolesGuard;
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    const refunds = {
      requestBeforeApproval: jest.fn(),
      approveBeforeApproval: jest.fn(),
      requestAfterApproval: jest.fn(),
      requestAfterPayout: jest.fn(),
    };
    controller = new RefundsController(refunds as any);
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    jwtGuard = new JwtAuthGuard(reflector);
  });

  // [handlerName, expectedRoles, forbiddenRoles (users), allowedRoles (users)]
  type Route = {
    handler: string;
    expected: UserRole[];
    forbidden: AuthUser[];
    allowed: AuthUser[];
  };

  const routes: Route[] = [
    {
      handler: 'requestBefore',
      expected: [UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN],
      forbidden: [PARTICIPANT],
      allowed: [BUSINESS_ADMIN, SUPER_ADMIN],
    },
    {
      handler: 'approveBefore',
      expected: [UserRole.SUPER_ADMIN],
      forbidden: [PARTICIPANT, BUSINESS_ADMIN],
      allowed: [SUPER_ADMIN],
    },
    {
      handler: 'requestAfterApproval',
      expected: [UserRole.SUPER_ADMIN],
      forbidden: [PARTICIPANT, BUSINESS_ADMIN],
      allowed: [SUPER_ADMIN],
    },
    {
      handler: 'requestAfterPayout',
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
