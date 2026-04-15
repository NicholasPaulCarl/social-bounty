import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TokenStoreService } from './token-store.service';
import { RedisService } from '../redis/redis.service';
import { ApifyService } from '../apify/apify.service';
import { UserRole, UserStatus, OTP_RULES } from '@social-bounty/shared';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let mailService: { sendOtpEmail: jest.Mock };
  let tokenStore: {
    storeOtp: jest.Mock;
    getOtp: jest.Mock;
    incrementOtpAttempts: jest.Mock;
    deleteOtp: jest.Mock;
    hasRecentOtp: jest.Mock;
    setOtpCooldown: jest.Mock;
    storeRefreshToken: jest.Mock;
    getRefreshToken: jest.Mock;
    deleteRefreshToken: jest.Mock;
    invalidateAllUserTokens: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    mailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    tokenStore = {
      storeOtp: jest.fn().mockResolvedValue(undefined),
      getOtp: jest.fn().mockResolvedValue(null),
      incrementOtpAttempts: jest.fn().mockResolvedValue(1),
      deleteOtp: jest.fn().mockResolvedValue(undefined),
      hasRecentOtp: jest.fn().mockResolvedValue(false),
      setOtpCooldown: jest.fn().mockResolvedValue(undefined),
      storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      getRefreshToken: jest.fn().mockResolvedValue(null),
      deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
      invalidateAllUserTokens: jest.fn().mockResolvedValue(undefined),
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
                CORS_ORIGIN: 'http://localhost:3000',
              };
              return config[key];
            }),
          },
        },
        { provide: MailService, useValue: mailService },
        { provide: TokenStoreService, useValue: tokenStore },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
            exists: jest.fn().mockResolvedValue(false),
            ttl: jest.fn().mockResolvedValue(-2),
            setNxEx: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ApifyService,
          useValue: {
            refreshIfStale: jest.fn().mockResolvedValue(undefined),
            refreshForBrand: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── requestOtp ───────────────────────────────────────────

  describe('requestOtp', () => {
    it('should send OTP email and return generic message', async () => {
      const result = await service.requestOtp('test@example.com');

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.storeOtp).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(tokenStore.setOtpCooldown).toHaveBeenCalledWith('test@example.com');
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('should return generic message without sending when cooldown is active', async () => {
      tokenStore.hasRecentOtp.mockResolvedValue(true);

      const result = await service.requestOtp('test@example.com');

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.storeOtp).not.toHaveBeenCalled();
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase and trim', async () => {
      await service.requestOtp('  Test@Example.COM  ');

      expect(tokenStore.storeOtp).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });
  });

  // ── verifyOtpAndLogin ─────────────────────────────────────

  describe('verifyOtpAndLogin', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      status: UserStatus.ACTIVE,
      role: UserRole.PARTICIPANT,
      emailVerified: true,
      brandMemberships: [],
    };

    it('should return tokens and user for valid OTP', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.verifyOtpAndLogin('test@example.com', '123456');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe(UserRole.PARTICIPANT);
      expect(tokenStore.deleteOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should set emailVerified to true when not already verified', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      await service.verifyOtpAndLogin('test@example.com', '123456');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { emailVerified: true },
      });
    });

    it('should throw BadRequestException for invalid OTP and increment attempts', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      tokenStore.incrementOtpAttempts.mockResolvedValue(1);

      await expect(
        service.verifyOtpAndLogin('test@example.com', '999999'),
      ).rejects.toThrow(BadRequestException);
      expect(tokenStore.incrementOtpAttempts).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw BadRequestException for expired/missing OTP', async () => {
      tokenStore.getOtp.mockResolvedValue(null);

      await expect(
        service.verifyOtpAndLogin('test@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when max attempts exceeded', async () => {
      tokenStore.getOtp.mockResolvedValue({
        otp: '123456',
        attempts: OTP_RULES.MAX_ATTEMPTS,
      });

      await expect(
        service.verifyOtpAndLogin('test@example.com', '123456'),
      ).rejects.toThrow(ForbiddenException);
      expect(tokenStore.deleteOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw ForbiddenException for suspended user', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.verifyOtpAndLogin('test@example.com', '123456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when user not found', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyOtpAndLogin('test@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── signupWithOtp ─────────────────────────────────────────

  describe('signupWithOtp', () => {
    it('should create user and return tokens for valid OTP', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date(),
      });

      const result = await service.signupWithOtp(
        'new@example.com',
        '123456',
        'New',
        'User',
      );

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.role).toBe(UserRole.PARTICIPANT);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(tokenStore.deleteOtp).toHaveBeenCalledWith('new@example.com');
    });

    it('should throw ConflictException for duplicate email', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.signupWithOtp('existing@example.com', '123456', 'Test', 'User'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      tokenStore.incrementOtpAttempts.mockResolvedValue(1);

      await expect(
        service.signupWithOtp('new@example.com', '999999', 'New', 'User'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired/missing OTP', async () => {
      tokenStore.getOtp.mockResolvedValue(null);

      await expect(
        service.signupWithOtp('new@example.com', '123456', 'New', 'User'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should pass interests when provided', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date(),
      });

      await service.signupWithOtp(
        'new@example.com',
        '123456',
        'New',
        'User',
        ['Fitness & Wellness'],
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            interests: ['Fitness & Wellness'],
          }),
        }),
      );
    });
  });

  // ── logout ────────────────────────────────────────────────

  describe('logout', () => {
    it('should delegate to tokenStore to delete refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-id' });

      await service.logout('valid-refresh-token');

      expect(tokenStore.deleteRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
        'user-id',
      );
    });

    it('should succeed even if token is expired/invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('expired');
      });

      const result = await service.logout('invalid-token');
      expect(result.message).toBe('Logged out successfully.');
    });
  });

  // ── refresh ───────────────────────────────────────────────

  describe('refresh', () => {
    const USER_ID = 'user-123';

    it('should rotate tokens on valid refresh', async () => {
      jwtService.verify.mockReturnValue({
        sub: USER_ID,
        type: 'refresh',
        jti: 'jti-1',
      });
      tokenStore.getRefreshToken.mockResolvedValue({
        userId: USER_ID,
        jti: 'jti-1',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: USER_ID,
        email: 'test@test.com',
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        firstName: 'Test',
        lastName: 'User',
        brandMemberships: [],
      });

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(tokenStore.deleteRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
        USER_ID,
      );
      expect(tokenStore.storeRefreshToken).toHaveBeenCalled();
    });

    it('should trigger theft detection when token not found in store', async () => {
      jwtService.verify.mockReturnValue({
        sub: USER_ID,
        type: 'refresh',
        jti: 'jti-1',
      });
      tokenStore.getRefreshToken.mockResolvedValue(null);

      await expect(service.refresh('stolen-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(tokenStore.invalidateAllUserTokens).toHaveBeenCalledWith(USER_ID);
    });

    it('should reject when user is suspended', async () => {
      jwtService.verify.mockReturnValue({
        sub: USER_ID,
        type: 'refresh',
        jti: 'jti-1',
      });
      tokenStore.getRefreshToken.mockResolvedValue({
        userId: USER_ID,
        jti: 'jti-1',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: USER_ID,
        email: 'test@test.com',
        role: UserRole.PARTICIPANT,
        status: UserStatus.SUSPENDED,
        brandMemberships: [],
      });

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject token with wrong type', async () => {
      jwtService.verify.mockReturnValue({
        sub: USER_ID,
        type: 'access',
        jti: 'jti-1',
      });

      await expect(service.refresh('access-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject expired/invalid JWT', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
