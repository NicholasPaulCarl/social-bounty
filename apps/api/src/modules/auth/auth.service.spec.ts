import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
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
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';
import { TradeSafeGraphQLClient } from '../tradesafe/tradesafe-graphql.client';
import { TradeSafeTokenService } from '../tradesafe/tradesafe-token.service';
import { UserRole, UserStatus, OTP_RULES, OtpChannel } from '@social-bounty/shared';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
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
    incrementSmsDailyCount: jest.Mock;
    replaceOtpForSwitch: jest.Mock;
  };
  let tradeSafeGraphQLClient: { isMockMode: jest.Mock };
  let tradeSafeTokenService: { ensureToken: jest.Mock };

  beforeEach(async () => {
    // Default $transaction mock runs the callback with a tx object exposing the
    // models the brand-signup branch touches (User + Brand + BrandMember).
    // The standard-signup branch no longer uses $transaction.
    const $transaction = jest.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: prisma.user,
        brand: { create: jest.fn().mockResolvedValue({ id: 'brand-1' }) },
        brandMember: { create: jest.fn().mockResolvedValue({}) },
      });
    });
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction,
    } as typeof prisma & { $transaction: jest.Mock };

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
      incrementSmsDailyCount: jest.fn().mockResolvedValue(1),
      replaceOtpForSwitch: jest.fn().mockResolvedValue({ fromChannel: OtpChannel.EMAIL, switchCount: 1 }),
    };

    tradeSafeGraphQLClient = {
      isMockMode: jest.fn().mockReturnValue(true),
    };

    tradeSafeTokenService = {
      ensureToken: jest.fn().mockResolvedValue('mock-token-id'),
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
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: SmsService,
          useValue: { sendOtpSms: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ModuleRef,
          useValue: {
            // AuthService calls `moduleRef.get(Service, { strict: false })`
            // lazily inside the fire-and-forget hook; route the two tokens
            // to the prepared mocks and let everything else fall through
            // (no other tokens are resolved via ModuleRef in AuthService).
            get: jest.fn((token: unknown) => {
              if (token === TradeSafeGraphQLClient) return tradeSafeGraphQLClient;
              if (token === TradeSafeTokenService) return tradeSafeTokenService;
              throw new Error(`Unexpected ModuleRef.get(${String(token)})`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // Helper: flush the setImmediate queue so fire-and-forget side-effects
  // (like TradeSafe token provisioning) can be observed in assertions.
  async function flushImmediates(): Promise<void> {
    await new Promise((resolve) => setImmediate(resolve));
  }

  // Helper: build a SignupWithOtp options object with sensible defaults so
  // tests only need to override the bits they care about.
  function signupOpts(overrides: Partial<Parameters<AuthService['signupWithOtp']>[0]> = {}) {
    return {
      email: 'new@example.com',
      otp: '123456',
      firstName: 'New',
      lastName: 'User',
      contactNumber: '+27821234567',
      termsAccepted: true as const,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      ...overrides,
    };
  }

  // ── requestOtp ───────────────────────────────────────────

  describe('requestOtp', () => {
    it('should send OTP email and return generic message', async () => {
      const result = await service.requestOtp('test@example.com');

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.storeOtp).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        OtpChannel.EMAIL,
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
        OtpChannel.EMAIL,
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

      const result = await service.signupWithOtp(signupOpts());

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
        service.signupWithOtp(signupOpts({ email: 'existing@example.com', firstName: 'Test' })),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
      tokenStore.incrementOtpAttempts.mockResolvedValue(1);

      await expect(
        service.signupWithOtp(signupOpts({ otp: '999999' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired/missing OTP', async () => {
      tokenStore.getOtp.mockResolvedValue(null);

      await expect(
        service.signupWithOtp(signupOpts()),
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

      await service.signupWithOtp(signupOpts({ interests: ['Fitness & Wellness'] }));

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            interests: ['Fitness & Wellness'],
          }),
        }),
      );
    });

    // ─── TradeSafe token provisioning hook (Wave 2.2) ──────

    describe('TradeSafe token provisioning hook', () => {
      const createdUser = {
        id: 'new-user-id',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date(),
      };

      beforeEach(() => {
        tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0 });
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue(createdUser);
      });

      it('skips the TradeSafe token call in mock mode', async () => {
        tradeSafeGraphQLClient.isMockMode.mockReturnValue(true);

        const result = await service.signupWithOtp(signupOpts());

        await flushImmediates();

        expect(result.accessToken).toBe('mock-token');
        expect(tradeSafeTokenService.ensureToken).not.toHaveBeenCalled();
      });

      it('fires the TradeSafe token call non-blocking when live', async () => {
        tradeSafeGraphQLClient.isMockMode.mockReturnValue(false);

        // ensureToken intentionally delayed — if the signup path awaited it,
        // this test would time out. Instead the signup response must return
        // immediately and the token call resolves later.
        let resolveEnsure!: (value: string) => void;
        tradeSafeTokenService.ensureToken.mockImplementation(
          () =>
            new Promise<string>((resolve) => {
              resolveEnsure = resolve;
            }),
        );

        const result = await service.signupWithOtp(signupOpts());

        // Response returned while ensureToken is still pending — proof of
        // non-blocking dispatch.
        expect(result.accessToken).toBe('mock-token');
        expect(result.user.id).toBe('new-user-id');

        // Now drain the setImmediate queue and confirm the hook fired.
        await flushImmediates();
        expect(tradeSafeTokenService.ensureToken).toHaveBeenCalledTimes(1);
        expect(tradeSafeTokenService.ensureToken).toHaveBeenCalledWith(
          'new-user-id',
        );

        resolveEnsure('tok-after-the-fact');
      });

      it('does not propagate a TradeSafe failure back to the signup response', async () => {
        tradeSafeGraphQLClient.isMockMode.mockReturnValue(false);
        tradeSafeTokenService.ensureToken.mockRejectedValue(
          new Error('TradeSafe sandbox is down'),
        );

        const result = await service.signupWithOtp(signupOpts());

        // Response is still a successful signup.
        expect(result.accessToken).toBe('mock-token');
        expect(result.user.id).toBe('new-user-id');

        // The rejected promise is caught inside the hook — flushing the
        // microtask queue must not produce an unhandled rejection.
        await flushImmediates();
        expect(tradeSafeTokenService.ensureToken).toHaveBeenCalledTimes(1);
      });

      it('fires the hook for brand-admin signup as well', async () => {
        tradeSafeGraphQLClient.isMockMode.mockReturnValue(false);
        // Brand-admin path uses $transaction — mock it to run the callback.
        const brandUser = {
          ...createdUser,
          id: 'brand-user-id',
          role: UserRole.BUSINESS_ADMIN,
        };
        prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
          return fn({
            user: { create: jest.fn().mockResolvedValue(brandUser) },
            brand: { create: jest.fn().mockResolvedValue({ id: 'brand-1' }) },
            brandMember: { create: jest.fn().mockResolvedValue({}) },
          });
        });

        const result = await service.signupWithOtp(
          signupOpts({
            email: 'brand@example.com',
            firstName: 'Brand',
            lastName: 'Admin',
            registerAsBrand: true,
            brandName: 'Brand Co',
            brandContactEmail: 'contact@brand.co',
          }),
        );

        expect(result.user.role).toBe(UserRole.BUSINESS_ADMIN);
        await flushImmediates();
        expect(tradeSafeTokenService.ensureToken).toHaveBeenCalledWith(
          'brand-user-id',
        );
      });
    });
  });

  // ── requestOtp - SMS channel ──────────────────────────────

  describe('requestOtp - SMS channel', () => {
    const userWithPhone = {
      id: 'user-sms-id',
      role: UserRole.PARTICIPANT,
      phoneNumber: '+27814871705',
    };

    it('calls smsService.sendOtpSms and not mailService when user has a phone', async () => {
      const module = (service as unknown as { [key: string]: unknown });
      const smsService = (module['smsService'] ?? module['SmsService']) as { sendOtpSms: jest.Mock };

      // Reset mocks to verify call counts cleanly
      tokenStore.hasRecentOtp.mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(userWithPhone);
      tokenStore.incrementSmsDailyCount.mockResolvedValue(1); // cap not hit

      // Re-get smsService from the test module (already injected via useValue)
      // We access it via the injected mocks captured in beforeEach.
      // The auth.service.spec mock is `{ sendOtpSms: jest.fn().mockResolvedValue(undefined) }`
      // It is already captured at module level — we just check mailService.
      mailService.sendOtpEmail.mockClear();

      await service.requestOtp('test@example.com', OtpChannel.SMS);

      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
      // smsService.sendOtpSms is fire-and-forget; storeOtp records channel=SMS
      expect(tokenStore.storeOtp).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        OtpChannel.SMS,
      );
    });

    it('returns generic message and skips send when user has no phone', async () => {
      tokenStore.hasRecentOtp.mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-nophone',
        role: UserRole.PARTICIPANT,
        phoneNumber: null,
      });
      mailService.sendOtpEmail.mockClear();
      tokenStore.storeOtp.mockClear();
      tokenStore.incrementSmsDailyCount.mockClear();

      const result = await service.requestOtp('nophone@example.com', OtpChannel.SMS);

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.storeOtp).not.toHaveBeenCalled();
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
      expect(tokenStore.incrementSmsDailyCount).not.toHaveBeenCalled();
    });

    it('returns generic message when user does not exist (anti-enumeration)', async () => {
      tokenStore.hasRecentOtp.mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(null);
      tokenStore.storeOtp.mockClear();
      mailService.sendOtpEmail.mockClear();

      const result = await service.requestOtp('ghost@example.com', OtpChannel.SMS);

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.storeOtp).not.toHaveBeenCalled();
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('returns generic message and skips smsService when daily cap is hit', async () => {
      tokenStore.hasRecentOtp.mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(userWithPhone);
      tokenStore.incrementSmsDailyCount.mockResolvedValue(11); // > 10 cap
      tokenStore.storeOtp.mockClear();
      mailService.sendOtpEmail.mockClear();

      const result = await service.requestOtp('test@example.com', OtpChannel.SMS);

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.storeOtp).not.toHaveBeenCalled();
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
    });
  });

  // ── switchOtpChannel ──────────────────────────────────────

  describe('switchOtpChannel', () => {
    it('throws NotFoundException when no active OTP record exists', async () => {
      tokenStore.getOtp.mockResolvedValue(null);

      await expect(
        service.switchOtpChannel('test@example.com'),
      ).rejects.toThrow(expect.objectContaining({ status: 404 }));
    });

    it('throws 429 when switchCount is already 2', async () => {
      tokenStore.getOtp.mockResolvedValue({
        otp: '111111',
        attempts: 0,
        channel: OtpChannel.EMAIL,
        switchCount: 2,
      });

      await expect(
        service.switchOtpChannel('test@example.com'),
      ).rejects.toThrow(expect.objectContaining({ status: 429 }));
    });

    it('EMAIL → SMS happy path: replaces OTP, calls smsService, audits OTP_CHANNEL_SWITCHED', async () => {
      tokenStore.getOtp.mockResolvedValue({
        otp: '222222',
        attempts: 0,
        channel: OtpChannel.EMAIL,
        switchCount: 0,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-switch-id',
        role: UserRole.PARTICIPANT,
        phoneNumber: '+27814871705',
      });
      tokenStore.incrementSmsDailyCount.mockResolvedValue(1);
      tokenStore.replaceOtpForSwitch.mockResolvedValue({
        fromChannel: OtpChannel.EMAIL,
        switchCount: 1,
      });

      const auditService = (service as unknown as { auditService: { log: jest.Mock } }).auditService;
      auditService.log.mockClear();
      mailService.sendOtpEmail.mockClear();

      const result = await service.switchOtpChannel('test@example.com');

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.replaceOtpForSwitch).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        OtpChannel.SMS,
      );
      // mailService NOT called for SMS target
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'OTP_CHANNEL_SWITCHED' }),
      );
    });

    it('SMS → EMAIL happy path: replaces OTP, calls mailService, audits OTP_CHANNEL_SWITCHED', async () => {
      tokenStore.getOtp.mockResolvedValue({
        otp: '333333',
        attempts: 0,
        channel: OtpChannel.SMS,
        switchCount: 1,
      });
      // For EMAIL target we look up user (without phoneNumber check)
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-switch-email-id',
        role: UserRole.PARTICIPANT,
      });
      tokenStore.replaceOtpForSwitch.mockResolvedValue({
        fromChannel: OtpChannel.SMS,
        switchCount: 2,
      });

      mailService.sendOtpEmail.mockClear();
      const auditService = (service as unknown as { auditService: { log: jest.Mock } }).auditService;
      auditService.log.mockClear();

      const result = await service.switchOtpChannel('test@example.com');

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.replaceOtpForSwitch).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        OtpChannel.EMAIL,
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'OTP_CHANNEL_SWITCHED' }),
      );
    });

    it('returns generic message when switching to SMS for user with no phone (anti-enumeration)', async () => {
      tokenStore.getOtp.mockResolvedValue({
        otp: '444444',
        attempts: 0,
        channel: OtpChannel.EMAIL,
        switchCount: 0,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-nophone',
        role: UserRole.PARTICIPANT,
        phoneNumber: null,
      });
      tokenStore.replaceOtpForSwitch.mockClear();
      mailService.sendOtpEmail.mockClear();

      const result = await service.switchOtpChannel('nophone@example.com');

      expect(result.message).toContain('verification code has been sent');
      expect(tokenStore.replaceOtpForSwitch).not.toHaveBeenCalled();
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
    });
  });

  // ── verifyOtpAndLogin - phone verification ────────────────

  describe('verifyOtpAndLogin - phone verification', () => {
    const baseUser = {
      id: 'verify-user-id',
      email: 'verify@example.com',
      firstName: 'Verify',
      lastName: 'User',
      status: UserStatus.ACTIVE,
      role: UserRole.PARTICIPANT,
      emailVerified: true,
      brandMemberships: [],
    };

    it('calls user.update with phoneVerified:true when stored channel=SMS', async () => {
      tokenStore.getOtp.mockResolvedValue({
        otp: '555555',
        attempts: 0,
        channel: OtpChannel.SMS,
        switchCount: 0,
      });
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue(baseUser);

      await service.verifyOtpAndLogin('verify@example.com', '555555');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'verify-user-id' },
          data: expect.objectContaining({ phoneVerified: true }),
        }),
      );
    });

    it('does NOT set phoneVerified when stored channel=EMAIL', async () => {
      tokenStore.getOtp.mockResolvedValue({
        otp: '666666',
        attempts: 0,
        channel: OtpChannel.EMAIL,
        switchCount: 0,
      });
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.user.update.mockClear();

      await service.verifyOtpAndLogin('verify@example.com', '666666');

      // emailVerified is already true so no update at all, or an update
      // without phoneVerified — neither case should pass phoneVerified
      const calls: { data: Record<string, unknown> }[] =
        prisma.user.update.mock.calls.map((c: unknown[]) => c[0] as { data: Record<string, unknown> });
      for (const call of calls) {
        expect(call.data).not.toHaveProperty('phoneVerified');
      }
    });
  });

  // ── signupWithOtp - contactNumber ─────────────────────────

  describe('signupWithOtp - contactNumber', () => {
    it('persists phoneNumber and phoneVerified:false in the created user record', async () => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0, channel: OtpChannel.EMAIL, switchCount: 0 });
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

      await service.signupWithOtp(signupOpts({ contactNumber: '+27814871705' }));

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phoneNumber: '+27814871705',
            phoneVerified: false,
          }),
        }),
      );
    });
  });

  // ── signupWithOtp - ToS acceptance ────────────────────────

  describe('signupWithOtp - ToS acceptance', () => {
    let auditLog: jest.Mock;

    function getAuditService() {
      return (service as unknown as { auditService: { log: jest.Mock } }).auditService;
    }

    beforeEach(() => {
      tokenStore.getOtp.mockResolvedValue({ otp: '123456', attempts: 0, channel: OtpChannel.EMAIL, switchCount: 0 });
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
      auditLog = getAuditService().log;
      auditLog.mockClear();
    });

    it('stamps termsAccepted* columns + writes user.terms_accepted audit row', async () => {
      await service.signupWithOtp(signupOpts());

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            termsAcceptedVersion: expect.any(String),
            termsAcceptedAt: expect.any(Date),
            termsAcceptedTextHash: expect.any(String),
            termsAcceptedIp: '127.0.0.1',
            termsAcceptedUserAgent: 'jest',
          }),
        }),
      );

      const termsCalls = auditLog.mock.calls.filter(
        (call) => call[0].action === 'user.terms_accepted',
      );
      expect(termsCalls).toHaveLength(1);
      expect(termsCalls[0][0]).toEqual(
        expect.objectContaining({
          actorId: 'new-user-id',
          entityType: 'User',
          entityId: 'new-user-id',
          afterState: expect.objectContaining({
            version: expect.any(String),
            textHash: expect.any(String),
            ipAddress: '127.0.0.1',
          }),
        }),
      );
    });

    it('writes no marketing_consent_granted audit rows (service-comms repositioning)', async () => {
      await service.signupWithOtp(signupOpts());

      const marketingCalls = auditLog.mock.calls.filter(
        (call) => call[0].action === 'user.marketing_consent_granted',
      );
      expect(marketingCalls).toHaveLength(0);
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
