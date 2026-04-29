import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ModuleRef } from '@nestjs/core';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  UserStatus,
  BrandMemberRole,
  BrandStatus,
  OTP_RULES,
  OtpChannel,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  LEGAL_VERSION,
  TERMS_ACCEPTANCE_STATEMENT,
} from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { TokenStoreService } from './token-store.service';
import { ApifyService } from '../apify/apify.service';
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';
import { TradeSafeGraphQLClient } from '../tradesafe/tradesafe-graphql.client';
import { TradeSafeTokenService } from '../tradesafe/tradesafe-token.service';

// SHA-256 over an NFC-normalized UTF-8 string. Locks User.termsAcceptedTextHash
// to the exact wording the user agreed to (Unicode normalization keeps
// cross-platform hashes stable).
function sha256Nfc(text: string): string {
  return createHash('sha256').update(Buffer.from(text.normalize('NFC'), 'utf8')).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private static readonly SMS_DAILY_CAP = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private mailService: MailService,
    private tokenStore: TokenStoreService,
    private apify: ApifyService,
    private auditService: AuditService,
    private smsService: SmsService,
    private moduleRef: ModuleRef,
  ) {}

  /**
   * Fire-and-forget: provision a TradeSafe party token for a newly-created
   * user. Called right after email-verified signup so the user can act as
   * BUYER/SELLER in any subsequent escrow transaction without a network
   * round-trip delay on the first bounty-funding request.
   *
   * Intentionally non-blocking: if TradeSafe is down the signup response must
   * still return immediately. The Phase 3 bounty-funding path calls
   * `ensureToken` blocking so any error surfaces there synchronously instead.
   * Idempotent — `ensureToken` no-ops if the token was already created.
   *
   * **Lazy resolution via ModuleRef.** TradeSafeModule can't be imported at
   * compile time into AuthModule without closing a cycle with WebhooksModule.
   * Resolving lazily keeps the cycle out of the module graph entirely —
   * same idiom `WebhookRouterService` uses for its handler fan-out
   * (`webhook-router.service.ts:130`).
   *
   * Short-circuited in mock mode so dev/test flows don't fail when
   * TradeSafe creds are unset. Mirrors the background-apify pattern at
   * `verifyOtpAndLogin` (line ~155) — every branch is wrapped so no path
   * surfaces as an unhandled rejection.
   */
  private scheduleTradeSafeTokenProvisioning(userId: string): void {
    let graphqlClient: TradeSafeGraphQLClient;
    let tokenService: TradeSafeTokenService;
    try {
      graphqlClient = this.moduleRef.get(TradeSafeGraphQLClient, {
        strict: false,
      });
      tokenService = this.moduleRef.get(TradeSafeTokenService, {
        strict: false,
      });
    } catch (err) {
      // DI resolution failed — treat as disabled, don't block signup.
      this.logger.warn(
        `Skipping TradeSafe token provisioning for user=${userId} — service not resolvable: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }

    if (graphqlClient.isMockMode()) {
      this.logger.debug(
        `Skipping TradeSafe token provisioning for user=${userId} — mock mode`,
      );
      return;
    }
    setImmediate(() => {
      tokenService.ensureToken(userId).catch((err) => {
        this.logger.warn(
          `Non-blocking TradeSafe token creation failed for user=${userId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
    });
  }

  async requestOtp(
    identifier: { email?: string; phoneNumber?: string },
    channel: OtpChannel = OtpChannel.EMAIL,
    ipAddress?: string,
  ) {
    const normalizedEmail = identifier.email?.toLowerCase().trim();
    const normalizedPhone = identifier.phoneNumber?.trim();
    // The lookup key for Redis cooldown/OTP storage — email or phone
    const lookupKey = normalizedEmail ?? normalizedPhone!;
    const genericMessage = 'If an account exists, a verification code has been sent.';

    // Check cooldown to prevent spam
    const hasCooldown = await this.tokenStore.hasRecentOtp(lookupKey);
    if (hasCooldown) {
      return { message: genericMessage };
    }

    // Resolve user — by phone when phoneNumber provided, otherwise by email
    let phoneNumber: string | null = null;
    let user: { id: string; role: UserRole } | null = null;

    if (normalizedPhone) {
      // Phone-based login: look up user by phoneNumber
      const found = await this.prisma.user.findUnique({
        where: { phoneNumber: normalizedPhone },
        select: { id: true, role: true, phoneNumber: true },
      });
      if (!found) {
        await this.tokenStore.setOtpCooldown(lookupKey);
        return { message: genericMessage };
      }
      user = { id: found.id, role: found.role as UserRole };
      phoneNumber = found.phoneNumber;
    } else if (channel === OtpChannel.SMS) {
      // Email-based identifier but SMS channel: resolve phone from user record
      const found = await this.prisma.user.findUnique({
        where: { email: normalizedEmail! },
        select: { id: true, role: true, phoneNumber: true },
      });
      if (!found || !found.phoneNumber) {
        await this.tokenStore.setOtpCooldown(lookupKey);
        return { message: genericMessage };
      }
      user = { id: found.id, role: found.role as UserRole };
      phoneNumber = found.phoneNumber;
    }

    // Enforce per-phone daily SMS cap when sending via SMS
    if (channel === OtpChannel.SMS && phoneNumber) {
      const dailyCount = await this.tokenStore.incrementSmsDailyCount(phoneNumber);
      if (dailyCount > AuthService.SMS_DAILY_CAP) {
        this.logger.warn(
          `sms-daily-cap-hit { phone: ${phoneNumber.slice(0, 4)}*** }`,
        );
        await this.tokenStore.setOtpCooldown(lookupKey);
        return { message: genericMessage };
      }
    }

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));

    // Store OTP in Redis with channel info
    await this.tokenStore.storeOtp(lookupKey, otp, channel);
    await this.tokenStore.setOtpCooldown(lookupKey);

    // Fire-and-forget send on the appropriate channel
    if (channel === OtpChannel.SMS && phoneNumber) {
      this.smsService.sendOtpSms(phoneNumber, otp).catch((err) => {
        this.logger.error(`Failed to send OTP SMS to ${phoneNumber!.slice(0, 4)}***:`, err);
      });
    } else if (normalizedEmail) {
      this.mailService.sendOtpEmail(normalizedEmail, otp).catch((err) => {
        this.logger.error(`Failed to send OTP email to ${normalizedEmail}:`, err);
      });
    }

    // Audit log — skip when user is unknown (anonymous pre-signup flow)
    if (user) {
      this.auditService.log({
        actorId: user.id,
        actorRole: user.role as UserRole,
        action: 'OTP_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        afterState: { channel },
        ipAddress: ipAddress ?? null,
      });
    }

    return { message: genericMessage };
  }

  async verifyOtpAndLogin(
    identifier: { email?: string; phoneNumber?: string },
    otp: string,
    ipAddress?: string,
  ) {
    const normalizedEmail = identifier.email?.toLowerCase().trim();
    const normalizedPhone = identifier.phoneNumber?.trim();
    const lookupKey = normalizedEmail ?? normalizedPhone!;

    const otpData = await this.tokenStore.getOtp(lookupKey);
    if (!otpData) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Check max attempts
    if (otpData.attempts >= OTP_RULES.MAX_ATTEMPTS) {
      await this.tokenStore.deleteOtp(lookupKey);
      throw new ForbiddenException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // Timing-safe comparison to prevent timing attacks
    const otpBuffer = Buffer.from(otp.padEnd(6));
    const storedBuffer = Buffer.from(otpData.otp.padEnd(6));
    const isValid = timingSafeEqual(otpBuffer, storedBuffer);

    if (!isValid) {
      const attempts = await this.tokenStore.incrementOtpAttempts(lookupKey);
      const remaining = OTP_RULES.MAX_ATTEMPTS - attempts;
      if (remaining > 0) {
        throw new BadRequestException(
          `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        );
      }
      await this.tokenStore.deleteOtp(lookupKey);
      throw new ForbiddenException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // OTP valid — clean up
    await this.tokenStore.deleteOtp(lookupKey);

    // Look up user — by phone or email
    const user = normalizedPhone
      ? await this.prisma.user.findUnique({
          where: { phoneNumber: normalizedPhone },
          include: {
            brandMemberships: {
              select: { brandId: true },
              take: 1,
            },
          },
        })
      : await this.prisma.user.findUnique({
          where: { email: normalizedEmail! },
          include: {
            brandMemberships: {
              select: { brandId: true },
              take: 1,
            },
          },
        });

    if (!user) {
      throw new BadRequestException('No account found. Please sign up first.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }

    // Mark email as verified (OTP proves ownership).
    // If the OTP was delivered via SMS, also mark the phone as verified.
    const verifiedChannel = otpData.channel ?? OtpChannel.EMAIL;
    const updateData: Record<string, unknown> = {};
    if (!user.emailVerified) {
      updateData.emailVerified = true;
    }
    if (verifiedChannel === OtpChannel.SMS) {
      updateData.phoneVerified = true;
    }
    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // Audit successful login
    this.auditService.log({
      actorId: user.id,
      actorRole: user.role as UserRole,
      action: 'OTP_VERIFIED_LOGIN',
      entityType: 'User',
      entityId: user.id,
      afterState: { channel: verifiedChannel },
      ipAddress: ipAddress ?? null,
    });

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

  async signupWithOtp(opts: {
    email: string;
    otp: string;
    firstName: string;
    lastName: string;
    contactNumber: string;
    interests?: string[];
    registerAsBrand?: boolean;
    brandName?: string;
    brandContactEmail?: string;
    termsAccepted: true;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const {
      email,
      otp,
      firstName,
      lastName,
      contactNumber,
      interests,
      registerAsBrand,
      brandName,
      brandContactEmail,
      ipAddress,
      userAgent,
    } = opts;
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

    // Compute hashes outside the tx so the work isn't repeated under retry.
    const termsStatement = TERMS_ACCEPTANCE_STATEMENT(LEGAL_VERSION);
    const termsAcceptedTextHash = sha256Nfc(termsStatement);
    const termsAcceptedAt = new Date();

    if (registerAsBrand) {
      // Create user + brand + membership in one transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role,
            status: UserStatus.ACTIVE,
            emailVerified: true,
            phoneNumber: contactNumber,
            phoneVerified: false,
            termsAcceptedVersion: LEGAL_VERSION,
            termsAcceptedAt,
            termsAcceptedTextHash,
            termsAcceptedIp: ipAddress ?? null,
            termsAcceptedUserAgent: userAgent ?? null,
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

      // Fire-and-forget: provision a TradeSafe party token for the brand
      // admin so the first bounty-funding call doesn't pay the cold-path
      // tokenCreate latency. Signup response is never blocked on this.
      this.scheduleTradeSafeTokenProvisioning(result.user.id);

      this.auditService.log({
        actorId: result.user.id,
        actorRole: result.user.role as UserRole,
        action: 'SIGNUP_COMPLETED',
        entityType: 'User',
        entityId: result.user.id,
        afterState: { userId: result.user.id, hasPhone: true },
      });

      this.auditService.log({
        actorId: result.user.id,
        actorRole: result.user.role as UserRole,
        action: AUDIT_ACTIONS.USER_TERMS_ACCEPTED,
        entityType: ENTITY_TYPES.USER,
        entityId: result.user.id,
        afterState: {
          version: LEGAL_VERSION,
          textHash: termsAcceptedTextHash,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      });

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
        phoneNumber: contactNumber,
        phoneVerified: false,
        termsAcceptedVersion: LEGAL_VERSION,
        termsAcceptedAt,
        termsAcceptedTextHash,
        termsAcceptedIp: ipAddress ?? null,
        termsAcceptedUserAgent: userAgent ?? null,
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

    // Fire-and-forget: provision a TradeSafe party token for the hunter.
    // BUYER-eligible only; banking details (for SELLER eligibility) are
    // captured later in Phase 2 hunter banking UX and pushed via tokenUpdate.
    this.scheduleTradeSafeTokenProvisioning(user.id);

    this.auditService.log({
      actorId: user.id,
      actorRole: user.role as UserRole,
      action: 'SIGNUP_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      afterState: { userId: user.id, hasPhone: true },
    });

    this.auditService.log({
      actorId: user.id,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.USER_TERMS_ACCEPTED,
      entityType: ENTITY_TYPES.USER,
      entityId: user.id,
      afterState: {
        version: LEGAL_VERSION,
        textHash: termsAcceptedTextHash,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

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

  async switchOtpChannel(
    identifier: { email?: string; phoneNumber?: string },
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = identifier.email?.toLowerCase().trim();
    const normalizedPhone = identifier.phoneNumber?.trim();
    const lookupKey = normalizedEmail ?? normalizedPhone!;
    const genericMessage = 'If an account exists, a verification code has been sent.';

    const record = await this.tokenStore.getOtp(lookupKey);
    if (!record) {
      throw new NotFoundException('No active OTP session. Please request a new code.');
    }

    if (record.switchCount >= 2) {
      throw new HttpException(
        'Too many channel switches. Please request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const newChannel =
      record.channel === OtpChannel.SMS ? OtpChannel.EMAIL : OtpChannel.SMS;

    // Resolve user for phone/email lookup and SMS target
    let phoneNumber: string | null = null;
    let userEmail: string | null = normalizedEmail ?? null;
    let userId: string | null = null;
    let userRole: UserRole = UserRole.PARTICIPANT;

    if (normalizedPhone) {
      // Phone-based identifier: look up user by phone
      const found = await this.prisma.user.findUnique({
        where: { phoneNumber: normalizedPhone },
        select: { id: true, role: true, phoneNumber: true, email: true },
      });
      if (!found) {
        return { message: genericMessage };
      }
      userId = found.id;
      userRole = found.role as UserRole;
      phoneNumber = found.phoneNumber;
      userEmail = found.email;
    } else if (newChannel === OtpChannel.SMS) {
      const found = await this.prisma.user.findUnique({
        where: { email: normalizedEmail! },
        select: { id: true, role: true, phoneNumber: true },
      });
      if (!found || !found.phoneNumber) {
        return { message: genericMessage };
      }
      userId = found.id;
      userRole = found.role as UserRole;
      phoneNumber = found.phoneNumber;
    } else {
      // Switching to email — look up user for audit
      if (normalizedEmail) {
        const found = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, role: true },
        });
        if (found) {
          userId = found.id;
          userRole = found.role as UserRole;
        }
      }
    }

    // Enforce daily SMS cap when switching to SMS
    if (newChannel === OtpChannel.SMS && phoneNumber) {
      const dailyCount = await this.tokenStore.incrementSmsDailyCount(phoneNumber);
      if (dailyCount > AuthService.SMS_DAILY_CAP) {
        this.logger.warn(
          `sms-daily-cap-hit on channel-switch { phone: ${phoneNumber.slice(0, 4)}*** }`,
        );
        return { message: genericMessage };
      }
    }

    // Generate fresh OTP and replace the Redis record
    const newOtp = String(randomInt(100000, 999999));
    const { fromChannel, switchCount } = await this.tokenStore.replaceOtpForSwitch(
      lookupKey,
      newOtp,
      newChannel,
    );

    // Fire-and-forget send on new channel
    if (newChannel === OtpChannel.SMS && phoneNumber) {
      this.smsService.sendOtpSms(phoneNumber, newOtp).catch((err) => {
        this.logger.error(
          `Failed to send switch OTP SMS to ${phoneNumber!.slice(0, 4)}***:`,
          err,
        );
      });
    } else if (userEmail) {
      this.mailService.sendOtpEmail(userEmail, newOtp).catch((err) => {
        this.logger.error(`Failed to send switch OTP email to ${userEmail}:`, err);
      });
    }

    // Audit log when user identity is known
    if (userId) {
      this.auditService.log({
        actorId: userId,
        actorRole: userRole as UserRole,
        action: 'OTP_CHANNEL_SWITCHED',
        entityType: 'User',
        entityId: userId,
        afterState: { fromChannel, toChannel: newChannel, switchCount },
        ipAddress: ipAddress ?? null,
      });
    }

    return { message: genericMessage };
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
