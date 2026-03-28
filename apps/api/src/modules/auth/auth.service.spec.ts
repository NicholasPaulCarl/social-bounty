import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { TokenStoreService } from './token-store.service';
import { UserRole, UserStatus } from '@social-bounty/shared';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let redisService: { get: jest.Mock; incr: jest.Mock; expire: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    redisService = {
      get: jest.fn().mockResolvedValue(null),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordReset: jest.fn().mockResolvedValue(undefined),
            sendEmailVerification: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
        {
          provide: TokenStoreService,
          useValue: {
            storeRefreshToken: jest.fn().mockResolvedValue(undefined),
            getRefreshToken: jest.fn().mockResolvedValue(null),
            deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
            invalidateAllUserTokens: jest.fn().mockResolvedValue(undefined),
            storeResetToken: jest.fn().mockResolvedValue(undefined),
            getAndDeleteResetToken: jest.fn().mockResolvedValue(null),
            storeVerificationToken: jest.fn().mockResolvedValue(undefined),
            getAndDeleteVerificationToken: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PARTICIPANT,
        emailVerified: false,
        createdAt: new Date(),
      });

      const result = await service.signup(
        'test@example.com',
        'SecureP@ss1',
        'Test',
        'User',
      );

      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe(UserRole.PARTICIPANT);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.signup('existing@example.com', 'SecureP@ss1', 'Test', 'User'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for suspended user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password', 10),
        status: UserStatus.SUSPENDED,
        role: UserRole.PARTICIPANT,
        organisationMemberships: [],
      });

      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('SecureP@ss1', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: hash,
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        role: UserRole.PARTICIPANT,
        emailVerified: true,
        organisationMemberships: [],
      });

      const result = await service.login('test@example.com', 'SecureP@ss1');

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
      expect(redisService.del).toHaveBeenCalledWith('login_attempts:test@example.com');
    });

    it('should include remaining attempts in error message on failed login', async () => {
      redisService.incr.mockResolvedValue(2); // 2nd attempt
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
        status: UserStatus.ACTIVE,
        role: UserRole.PARTICIPANT,
        organisationMemberships: [],
      });

      await expect(
        service.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow('Invalid credentials. 3 attempts remaining before temporary lockout.');
      expect(redisService.incr).toHaveBeenCalledWith('login_attempts:test@example.com');
      expect(redisService.expire).toHaveBeenCalledWith('login_attempts:test@example.com', 900);
    });

    it('should throw ForbiddenException when account is locked', async () => {
      redisService.get.mockResolvedValue('5'); // 5 failed attempts already

      await expect(
        service.login('test@example.com', 'any-password'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.login('test@example.com', 'any-password'),
      ).rejects.toThrow('Account temporarily locked. Try again in 15 minutes.');
    });

    it('should record failed attempt for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(redisService.incr).toHaveBeenCalledWith('login_attempts:nonexistent@example.com');
      expect(redisService.expire).toHaveBeenCalledWith('login_attempts:nonexistent@example.com', 900);
    });

    it('should show singular "attempt" when only 1 remaining', async () => {
      redisService.incr.mockResolvedValue(4); // 4th attempt, 1 remaining
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correct-password', 10),
        status: UserStatus.ACTIVE,
        role: UserRole.PARTICIPANT,
        organisationMemberships: [],
      });

      await expect(
        service.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow('Invalid credentials. 1 attempt remaining before temporary lockout.');
    });
  });
});
