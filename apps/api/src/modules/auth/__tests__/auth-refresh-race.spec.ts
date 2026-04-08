import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { TokenStoreService } from '../token-store.service';
import { UserRole, UserStatus } from '@social-bounty/shared';

/**
 * Tests for refresh token race conditions.
 *
 * When two concurrent refresh calls use the same token,
 * the second call should see the token as deleted and trigger
 * the token-theft protection (invalidateAllUserTokens).
 *
 * The fix is on the client side (refresh mutex), but this test
 * documents the expected backend behavior.
 */
describe('AuthService — Refresh Token Race Condition', () => {
  let service: AuthService;
  let tokenStore: {
    storeRefreshToken: jest.Mock;
    getRefreshToken: jest.Mock;
    deleteRefreshToken: jest.Mock;
    invalidateAllUserTokens: jest.Mock;
    storeOtp: jest.Mock;
    getOtp: jest.Mock;
    incrementOtpAttempts: jest.Mock;
    deleteOtp: jest.Mock;
    hasRecentOtp: jest.Mock;
    setOtpCooldown: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };

  const USER_ID = 'user-123';
  const REFRESH_TOKEN = 'valid-refresh-token';
  const JWT_PAYLOAD = { sub: USER_ID, type: 'refresh', jti: 'jti-1' };

  beforeEach(async () => {
    tokenStore = {
      storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      getRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
      invalidateAllUserTokens: jest.fn().mockResolvedValue(undefined),
      storeOtp: jest.fn().mockResolvedValue(undefined),
      getOtp: jest.fn().mockResolvedValue(null),
      incrementOtpAttempts: jest.fn().mockResolvedValue(1),
      deleteOtp: jest.fn().mockResolvedValue(undefined),
      hasRecentOtp: jest.fn().mockResolvedValue(false),
      setOtpCooldown: jest.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('new-token'),
      verify: jest.fn().mockReturnValue(JWT_PAYLOAD),
    };

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: USER_ID,
          email: 'test@test.com',
          role: UserRole.PARTICIPANT,
          status: UserStatus.ACTIVE,
          firstName: 'Test',
          lastName: 'User',
          organisationMemberships: [],
        }),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRY: '15m',
                JWT_REFRESH_EXPIRY: '7d',
              };
              return config[key];
            }),
          },
        },
        { provide: MailService, useValue: { sendOtpEmail: jest.fn() } },
        { provide: TokenStoreService, useValue: tokenStore },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('single refresh call', () => {
    it('should succeed when refresh token is valid', async () => {
      tokenStore.getRefreshToken.mockResolvedValue({ userId: USER_ID, jti: 'jti-1' });

      const result = await service.refresh(REFRESH_TOKEN);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(tokenStore.deleteRefreshToken).toHaveBeenCalledWith(REFRESH_TOKEN, USER_ID);
      expect(tokenStore.storeRefreshToken).toHaveBeenCalled();
    });

    it('should delete old token before issuing new one', async () => {
      tokenStore.getRefreshToken.mockResolvedValue({ userId: USER_ID, jti: 'jti-1' });

      await service.refresh(REFRESH_TOKEN);

      // Delete must happen before store
      const deleteOrder = tokenStore.deleteRefreshToken.mock.invocationCallOrder[0];
      const storeOrder = tokenStore.storeRefreshToken.mock.invocationCallOrder[0];
      expect(deleteOrder).toBeLessThan(storeOrder);
    });
  });

  describe('race condition — second call with same token', () => {
    it('should trigger token theft protection when token not found in Redis', async () => {
      // Simulate: first call already deleted the token
      tokenStore.getRefreshToken.mockResolvedValue(null);

      await expect(service.refresh(REFRESH_TOKEN)).rejects.toThrow(UnauthorizedException);
      expect(tokenStore.invalidateAllUserTokens).toHaveBeenCalledWith(USER_ID);
    });

    it('should invalidate ALL user tokens on suspected theft', async () => {
      tokenStore.getRefreshToken.mockResolvedValue(null);

      try {
        await service.refresh(REFRESH_TOKEN);
      } catch {
        // expected
      }

      expect(tokenStore.invalidateAllUserTokens).toHaveBeenCalledTimes(1);
      expect(tokenStore.invalidateAllUserTokens).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('concurrent calls simulation', () => {
    it('first call succeeds, second triggers theft protection', async () => {
      let callCount = 0;
      tokenStore.getRefreshToken.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { userId: USER_ID, jti: 'jti-1' };
        }
        // Second call: token already deleted
        return null;
      });

      // First call succeeds
      const result = await service.refresh(REFRESH_TOKEN);
      expect(result.accessToken).toBeDefined();

      // Second call fails with theft detection
      await expect(service.refresh(REFRESH_TOKEN)).rejects.toThrow(UnauthorizedException);
      expect(tokenStore.invalidateAllUserTokens).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('edge cases', () => {
    it('should reject token with wrong type', async () => {
      jwtService.verify.mockReturnValue({ sub: USER_ID, type: 'access', jti: 'jti-1' });

      await expect(service.refresh(REFRESH_TOKEN)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when user is suspended', async () => {
      tokenStore.getRefreshToken.mockResolvedValue({ userId: USER_ID, jti: 'jti-1' });
      prisma.user.findUnique.mockResolvedValue({
        id: USER_ID,
        email: 'test@test.com',
        role: UserRole.PARTICIPANT,
        status: UserStatus.SUSPENDED,
        organisationMemberships: [],
      });

      await expect(service.refresh(REFRESH_TOKEN)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when user not found', async () => {
      tokenStore.getRefreshToken.mockResolvedValue({ userId: USER_ID, jti: 'jti-1' });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh(REFRESH_TOKEN)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject expired/invalid JWT', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh(REFRESH_TOKEN)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should invalidate refresh token on logout', async () => {
      jwtService.verify.mockReturnValue({ sub: USER_ID });

      await service.logout(REFRESH_TOKEN);

      expect(tokenStore.deleteRefreshToken).toHaveBeenCalledWith(REFRESH_TOKEN, USER_ID);
    });

    it('should succeed even if token is expired/invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('expired');
      });

      const result = await service.logout(REFRESH_TOKEN);
      expect(result.message).toBe('Logged out successfully.');
    });
  });
});
