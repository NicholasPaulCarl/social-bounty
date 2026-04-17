import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomInt, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  UserStatus,
  BrandMemberRole,
  BrandStatus,
  OTP_RULES,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { TokenStoreService } from './token-store.service';
import { ApifyService } from '../apify/apify.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private mailService: MailService,
    private tokenStore: TokenStoreService,
    private apify: ApifyService,
  ) {}

  async requestOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check cooldown to prevent spam
    const hasCooldown = await this.tokenStore.hasRecentOtp(normalizedEmail);
    if (hasCooldown) {
      // Always return generic message to prevent email enumeration
      return {
        message: 'If an account with that email exists, a verification code has been sent.',
      };
    }

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));

    // Store OTP in Redis
    await this.tokenStore.storeOtp(normalizedEmail, otp);
    await this.tokenStore.setOtpCooldown(normalizedEmail);

    // Send OTP email (fire-and-forget to prevent email enumeration via timing)
    this.mailService.sendOtpEmail(normalizedEmail, otp).catch((err) => {
      this.logger.error(`Failed to send OTP email to ${normalizedEmail}:`, err);
    });

    return {
      message: 'If an account with that email exists, a verification code has been sent.',
    };
  }

  async verifyOtpAndLogin(email: string, otp: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const otpData = await this.tokenStore.getOtp(normalizedEmail);
    if (!otpData) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Check max attempts
    if (otpData.attempts >= OTP_RULES.MAX_ATTEMPTS) {
      await this.tokenStore.deleteOtp(normalizedEmail);
      throw new ForbiddenException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // Timing-safe comparison to prevent timing attacks
    const otpBuffer = Buffer.from(otp.padEnd(6));
    const storedBuffer = Buffer.from(otpData.otp.padEnd(6));
    const isValid = timingSafeEqual(otpBuffer, storedBuffer);

    if (!isValid) {
      const attempts = await this.tokenStore.incrementOtpAttempts(normalizedEmail);
      const remaining = OTP_RULES.MAX_ATTEMPTS - attempts;
      if (remaining > 0) {
        throw new BadRequestException(
          `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        );
      }
      await this.tokenStore.deleteOtp(normalizedEmail);
      throw new ForbiddenException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // OTP valid — clean up
    await this.tokenStore.deleteOtp(normalizedEmail);

    // Look up user
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        brandMemberships: {
          select: { brandId: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new BadRequestException('No account found with this email. Please sign up first.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }

    // Mark email as verified (OTP proves ownership)
    if (!user.emailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    const brandId =
      user.brandMemberships.length > 0
        ? user.brandMemberships[0].brandId
        : null;

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      brandId,
      user.firstName,
      user.lastName,
    );

    // Fire-and-forget: refresh brand social analytics in the background on a
    // business-admin login. Respects its own 24h staleness guard and a Redis
    // lock so rapid repeat logins don't hammer Apify. Never blocks the login
    // response. Every branch of the promise chain is explicitly wrapped so
    // no path can surface as an unhandled rejection and crash the process.
    if (user.role === UserRole.BUSINESS_ADMIN && brandId) {
      const capturedBrandId = brandId;
      setImmediate(async () => {
        try {
          await this.apify.refreshIfStale(capturedBrandId);
        } catch (err) {
          this.logger.error(
            `Background login-triggered refresh failed for ${capturedBrandId}`,
            err,
          );
        }
      });
    }

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: true,
        brandId,
      },
    };
  }

  async signupWithOtp(
    email: string,
    otp: string,
    firstName: string,
    lastName: string,
    interests?: string[],
    registerAsBrand?: boolean,
    brandName?: string,
    brandContactEmail?: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate OTP
    const otpData = await this.tokenStore.getOtp(normalizedEmail);
    if (!otpData) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (otpData.attempts >= OTP_RULES.MAX_ATTEMPTS) {
      await this.tokenStore.deleteOtp(normalizedEmail);
      throw new ForbiddenException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    const otpBuffer = Buffer.from(otp.padEnd(6));
    const storedBuffer = Buffer.from(otpData.otp.padEnd(6));
    const isValid = timingSafeEqual(otpBuffer, storedBuffer);

    if (!isValid) {
      const attempts = await this.tokenStore.incrementOtpAttempts(normalizedEmail);
      const remaining = OTP_RULES.MAX_ATTEMPTS - attempts;
      if (remaining > 0) {
        throw new BadRequestException(
          `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        );
      }
      await this.tokenStore.deleteOtp(normalizedEmail);
      throw new ForbiddenException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // OTP valid — clean up
    await this.tokenStore.deleteOtp(normalizedEmail);

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const role = registerAsBrand ? UserRole.BUSINESS_ADMIN : UserRole.PARTICIPANT;

    if (registerAsBrand) {
      // Create user + brand + membership in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            ...(interests && interests.length > 0 ? { interests } : {}),
          },
        });

        const brand = await tx.brand.create({
          data: {
            name: brandName!,
            contactEmail: brandContactEmail!,
            status: BrandStatus.ACTIVE,
          },
        });

        await tx.brandMember.create({
          data: {
            userId: user.id,
            brandId: brand.id,
            role: BrandMemberRole.OWNER,
          },
        });

        return { user, brandId: brand.id };
      });

      const tokens = await this.generateTokens(
        result.user.id,
        result.user.email,
        result.user.role,
        result.brandId,
        result.user.firstName,
        result.user.lastName,
      );

      return {
        ...tokens,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          status: result.user.status,
          emailVerified: result.user.emailVerified,
          brandId: result.brandId,
        },
      };
    }

    // Standard participant signup
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        ...(interests && interests.length > 0 ? { interests } : {}),
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      null,
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
        brandId: null,
      },
    };
  }

  async switchBrand(userId: string, brandId: string) {
    // Verify the user is a member of the specified brand
    const membership = await this.prisma.brandMember.findUnique({
      where: {
        userId_brandId: {
          userId,
          brandId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this brand',
      );
    }

    // Look up the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Invalid user');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      brandId,
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
        brandId,
      },
    };
  }

  async logout(refreshToken: string) {
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
      });

      if (!user || user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Preserve the selected brand from the refresh token. Fall back to
      // the legacy organisationId claim for tokens issued before the rename.
      const brandId = payload.brandId ?? payload.organisationId ?? null;

      return this.generateTokens(
        user.id,
        user.email,
        user.role,
        brandId,
        user.firstName,
        user.lastName,
      );
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ── Email change (OTP-verified) ────────────

  async requestEmailChange(userId: string, newEmail: string) {
    const normalizedEmail = newEmail.toLowerCase().trim();

    // Reject if user is changing to their own current email
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (currentUser?.email === normalizedEmail) {
      throw new BadRequestException('New email must be different from your current email.');
    }

    // Check new email isn't already taken by another account
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    // Cooldown per user (not per email) to prevent spam
    const cooldownKey = `email_change_cooldown:${userId}`;
    const hasCooldown = await this.redis.exists(cooldownKey);
    if (hasCooldown) {
      return { message: 'A verification code has been sent to your new email.' };
    }

    // Generate and store OTP keyed to the user
    const otp = String(randomInt(100000, 999999));
    const redisKey = `email_change:${userId}`;
    await this.redis.set(
      redisKey,
      JSON.stringify({ newEmail: normalizedEmail, otp, attempts: 0 }),
      300, // 5 minutes
    );
    await this.redis.set(cooldownKey, '1', 60); // 60s cooldown

    // Send OTP to the NEW email
    this.mailService.sendOtpEmail(normalizedEmail, otp).catch((err) => {
      this.logger.error(`Failed to send email-change OTP to ${normalizedEmail}:`, err);
    });

    return { message: 'A verification code has been sent to your new email.' };
  }

  async verifyEmailChange(userId: string, otp: string) {
    const redisKey = `email_change:${userId}`;
    const raw = await this.redis.get(redisKey);
    if (!raw) {
      throw new BadRequestException('No pending email change. Please request a new code.');
    }

    const data = JSON.parse(raw) as { newEmail: string; otp: string; attempts: number };

    // Max attempts
    if (data.attempts >= 5) {
      await this.redis.del(redisKey);
      throw new ForbiddenException('Too many failed attempts. Please request a new code.');
    }

    // Timing-safe comparison
    const otpBuffer = Buffer.from(otp.padEnd(6));
    const storedBuffer = Buffer.from(data.otp.padEnd(6));
    if (!timingSafeEqual(otpBuffer, storedBuffer)) {
      data.attempts += 1;
      const ttl = await this.redis.ttl(redisKey);
      await this.redis.set(redisKey, JSON.stringify(data), ttl > 0 ? ttl : 300);
      const remaining = 5 - data.attempts;
      if (remaining > 0) {
        throw new BadRequestException(
          `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        );
      }
      await this.redis.del(redisKey);
      throw new ForbiddenException('Too many failed attempts. Please request a new code.');
    }

    // OTP valid — check email not taken (race guard)
    const conflict = await this.prisma.user.findUnique({
      where: { email: data.newEmail },
    });
    if (conflict) {
      await this.redis.del(redisKey);
      throw new ConflictException('An account with this email was created while you were verifying.');
    }

    // Update email and get the full user for token generation
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { email: data.newEmail, emailVerified: true },
      include: {
        brandMemberships: {
          select: { brandId: true },
          take: 1,
        },
      },
    });

    await this.redis.del(redisKey);

    // Return fresh tokens so the client JWT reflects the new email
    const brandId = user.brandMemberships[0]?.brandId ?? null;
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      brandId,
      user.firstName,
      user.lastName,
    );

    return {
      message: 'Email updated successfully.',
      email: data.newEmail,
      ...tokens,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    brandId: string | null,
    firstName?: string,
    lastName?: string,
  ) {
    const jti = uuidv4();

    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        brandId,
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
        brandId,
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
}
