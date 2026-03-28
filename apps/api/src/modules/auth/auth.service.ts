import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  UserStatus,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { TokenStoreService } from './token-store.service';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TTL = 900; // 15 minutes in seconds

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private auditService: AuditService,
    private mailService: MailService,
    private tokenStore: TokenStoreService,
    private redis: RedisService,
  ) {}

  async signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: UserRole.PARTICIPANT,
        status: UserStatus.ACTIVE,
        emailVerified: false,
      },
    });

    // Send verification email
    const verificationToken = uuidv4();
    this.tokenStore
      .storeVerificationToken(verificationToken, user.id)
      .then(() =>
        this.mailService.sendEmailVerification(user.email, verificationToken),
      )
      .catch((err) => {
        console.error('Failed to send verification email:', err);
      });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if account is temporarily locked due to too many failed attempts
    await this.checkLoginAttempts(normalizedEmail);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organisationMemberships: {
          select: { organisationId: true },
          take: 1,
        },
      },
    });

    if (!user) {
      await this.recordFailedAttempt(normalizedEmail);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      const attempts = await this.recordFailedAttempt(normalizedEmail);
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      if (remaining > 0) {
        throw new UnauthorizedException(
          `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before temporary lockout.`,
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Successful login — clear any tracked failed attempts
    await this.clearLoginAttempts(normalizedEmail);

    const organisationId =
      user.organisationMemberships.length > 0
        ? user.organisationMemberships[0].organisationId
        : null;

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      organisationId,
      user.firstName,
      user.lastName,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        organisationId,
      },
    };
  }

  async logout(refreshToken: string) {
    // Invalidate the refresh token -- decode to get userId for the key
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      await this.tokenStore.deleteRefreshToken(refreshToken, payload.sub);
    } catch {
      // Token may be expired/invalid, but logout should always succeed
    }

    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (user) {
      const token = uuidv4();
      await this.tokenStore.storeResetToken(token, user.id);
      await this.mailService.sendPasswordReset(user.email, token);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetEntry = await this.tokenStore.getAndDeleteResetToken(token);

    if (!resetEntry) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: resetEntry.userId },
      data: { passwordHash },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: resetEntry.userId },
    });

    if (user) {
      this.auditService.log({
        actorId: user.id,
        actorRole: user.role as UserRole,
        action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
        entityType: ENTITY_TYPES.USER,
        entityId: user.id,
      });
    }

    return { message: 'Password has been reset successfully.' };
  }

  async verifyEmail(token: string) {
    const entry = await this.tokenStore.getAndDeleteVerificationToken(token);

    if (!entry) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: entry.userId },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully.' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const token = uuidv4();
    await this.tokenStore.storeVerificationToken(token, user.id);
    await this.mailService.sendEmailVerification(user.email, token);

    return { message: 'Verification email sent.' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const stored = await this.tokenStore.getRefreshToken(
        refreshToken,
        payload.sub,
      );
      if (!stored) {
        // Potential token theft -- invalidate all tokens for user
        await this.tokenStore.invalidateAllUserTokens(payload.sub);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Invalidate old refresh token
      await this.tokenStore.deleteRefreshToken(refreshToken, payload.sub);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          organisationMemberships: {
            select: { organisationId: true },
            take: 1,
          },
        },
      });

      if (!user || user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const organisationId =
        user.organisationMemberships.length > 0
          ? user.organisationMemberships[0].organisationId
          : null;

      return this.generateTokens(
        user.id,
        user.email,
        user.role,
        organisationId,
        user.firstName,
        user.lastName,
      );
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Check if the account is temporarily locked due to excessive failed login attempts.
   * Throws ForbiddenException if the attempt count has reached the maximum.
   */
  private async checkLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    const attempts = await this.redis.get(key);
    if (attempts !== null && parseInt(attempts, 10) >= MAX_LOGIN_ATTEMPTS) {
      throw new ForbiddenException(
        'Account temporarily locked. Try again in 15 minutes.',
      );
    }
  }

  /**
   * Record a failed login attempt. Increments the counter and sets a 15-minute TTL.
   * Returns the current attempt count after incrementing.
   */
  private async recordFailedAttempt(email: string): Promise<number> {
    const key = `login_attempts:${email}`;
    const attempts = await this.redis.incr(key);
    // Set/reset TTL on every failed attempt so the window is always 15 minutes
    // from the most recent failure
    await this.redis.expire(key, LOGIN_LOCKOUT_TTL);
    return attempts;
  }

  /**
   * Clear login attempt tracking on successful login.
   */
  private async clearLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    await this.redis.del(key);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organisationId: string | null,
    firstName?: string,
    lastName?: string,
  ) {
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        organisationId,
        firstName: firstName || '',
        lastName: lastName || '',
        type: 'access',
      },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        type: 'refresh',
        jti,
      },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
      },
    );

    await this.tokenStore.storeRefreshToken(refreshToken, userId, jti);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Store a password reset token (used by AdminService for force resets)
   */
  async storeResetToken(token: string, userId: string): Promise<void> {
    await this.tokenStore.storeResetToken(token, userId);
  }
}
