import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@social-bounty/shared';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
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

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ role: UserRole.PARTICIPANT });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when empty roles array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

    const context = createMockContext({ role: UserRole.PARTICIPANT });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user role matches', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN]);

    const context = createMockContext({ role: UserRole.PARTICIPANT });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user role does not match', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.SUPER_ADMIN]);

    const context = createMockContext({ role: UserRole.PARTICIPANT });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when no user on request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.PARTICIPANT]);

    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow SA when SA role is required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.SUPER_ADMIN]);

    const context = createMockContext({ role: UserRole.SUPER_ADMIN });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny BA access to SA-only endpoints', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.SUPER_ADMIN]);

    const context = createMockContext({ role: UserRole.BUSINESS_ADMIN });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny Participant access to BA/SA endpoints', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN]);

    const context = createMockContext({ role: UserRole.PARTICIPANT });
    expect(guard.canActivate(context)).toBe(false);
  });
});
