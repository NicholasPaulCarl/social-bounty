import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserStatusGuard } from './user-status.guard';
import { UserStatus } from '@social-bounty/shared';

describe('UserStatusGuard', () => {
  let guard: UserStatusGuard;
  let reflector: Reflector;
  let prisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    guard = new UserStatusGuard(reflector, prisma);
  });

  function createMockContext(user?: any, isPublic = false): ExecutionContext {
    if (isPublic) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    } else {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    }

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

  it('should allow access on public routes', async () => {
    const context = createMockContext(undefined, true);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow access when no user (let JwtAuthGuard handle)', async () => {
    const context = createMockContext(undefined, false);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow active users', async () => {
    prisma.user.findUnique.mockResolvedValue({ status: UserStatus.ACTIVE });

    const context = createMockContext({ sub: 'user-1' }, false);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should reject suspended users with ForbiddenException', async () => {
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.SUSPENDED,
    });

    const context = createMockContext({ sub: 'user-1' }, false);
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should cache user status for subsequent calls', async () => {
    prisma.user.findUnique.mockResolvedValue({ status: UserStatus.ACTIVE });

    const context = createMockContext({ sub: 'user-cache-test' }, false);
    await guard.canActivate(context);
    await guard.canActivate(context);

    // Should only query DB once due to caching
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should default to ACTIVE if user not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const context = createMockContext({ sub: 'non-existent' }, false);
    expect(await guard.canActivate(context)).toBe(true);
  });
});
