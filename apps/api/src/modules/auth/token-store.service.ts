import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpChannel } from '@social-bounty/shared';
import { RedisService } from '../redis/redis.service';

interface RefreshTokenData {
  userId: string;
  jti: string;
}

interface ResetTokenData {
  userId: string;
}

interface VerificationTokenData {
  userId: string;
}

interface OtpData {
  email: string;
  otp: string;
  attempts: number;
  channel: OtpChannel;
  switchCount: number;
}

@Injectable()
export class TokenStoreService {
  private readonly logger = new Logger(TokenStoreService.name);
  private readonly refreshTtlSeconds: number;

  private static readonly REFRESH_PREFIX = 'refresh';
  private static readonly RESET_PREFIX = 'reset';
  private static readonly VERIFY_PREFIX = 'verify';
  private static readonly OTP_PREFIX = 'otp';
  private static readonly OTP_COOLDOWN_PREFIX = 'otp_cooldown';

  private static readonly RESET_TTL_SECONDS = 3600; // 1 hour
  private static readonly VERIFY_TTL_SECONDS = 86400; // 24 hours
  private static readonly OTP_TTL_SECONDS = 300; // 5 minutes
  private static readonly OTP_COOLDOWN_SECONDS = 60; // 1 minute
  private static readonly SMS_DAILY_TTL_SECONDS = 86400; // 24 hours
  private static readonly SMS_DAILY_PREFIX = 'sms:daily';

  constructor(
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.refreshTtlSeconds = this.parseExpiryToSeconds(
      this.config.get<string>('JWT_REFRESH_EXPIRY', '7d'),
    );
  }

  // --- Refresh Tokens ---

  async storeRefreshToken(
    refreshToken: string,
    userId: string,
    jti: string,
  ): Promise<void> {
    const key = `${TokenStoreService.REFRESH_PREFIX}:${userId}:${refreshToken}`;
    const data: RefreshTokenData = { userId, jti };
    await this.redis.set(key, JSON.stringify(data), this.refreshTtlSeconds);
  }

  async getRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<RefreshTokenData | null> {
    const key = `${TokenStoreService.REFRESH_PREFIX}:${userId}:${refreshToken}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as RefreshTokenData;
  }

  async deleteRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    const key = `${TokenStoreService.REFRESH_PREFIX}:${userId}:${refreshToken}`;
    await this.redis.del(key);
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    const pattern = `${TokenStoreService.REFRESH_PREFIX}:${userId}:*`;
    const deleted = await this.redis.flushPattern(pattern);
    this.logger.log(
      `Invalidated ${deleted} refresh tokens for user ${userId}`,
    );
  }

  // --- Reset Tokens ---

  async storeResetToken(token: string, userId: string): Promise<void> {
    const key = `${TokenStoreService.RESET_PREFIX}:${token}`;
    const data: ResetTokenData = { userId };
    await this.redis.set(
      key,
      JSON.stringify(data),
      TokenStoreService.RESET_TTL_SECONDS,
    );
  }

  async getAndDeleteResetToken(token: string): Promise<ResetTokenData | null> {
    const key = `${TokenStoreService.RESET_PREFIX}:${token}`;
    const data = await this.redis.getAndDelete(key);
    if (!data) return null;
    return JSON.parse(data) as ResetTokenData;
  }

  // --- Verification Tokens ---

  async storeVerificationToken(token: string, userId: string): Promise<void> {
    const key = `${TokenStoreService.VERIFY_PREFIX}:${token}`;
    const data: VerificationTokenData = { userId };
    await this.redis.set(
      key,
      JSON.stringify(data),
      TokenStoreService.VERIFY_TTL_SECONDS,
    );
  }

  async getAndDeleteVerificationToken(
    token: string,
  ): Promise<VerificationTokenData | null> {
    const key = `${TokenStoreService.VERIFY_PREFIX}:${token}`;
    const data = await this.redis.getAndDelete(key);
    if (!data) return null;
    return JSON.parse(data) as VerificationTokenData;
  }

  // --- OTP ---

  async storeOtp(
    email: string,
    otp: string,
    channel: OtpChannel = OtpChannel.EMAIL,
  ): Promise<void> {
    const key = `${TokenStoreService.OTP_PREFIX}:${email}`;
    const data: OtpData = { email, otp, attempts: 0, channel, switchCount: 0 };
    await this.redis.set(
      key,
      JSON.stringify(data),
      TokenStoreService.OTP_TTL_SECONDS,
    );
  }

  async getOtp(email: string): Promise<OtpData | null> {
    const key = `${TokenStoreService.OTP_PREFIX}:${email}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as OtpData;
  }

  async incrementOtpAttempts(email: string): Promise<number> {
    const key = `${TokenStoreService.OTP_PREFIX}:${email}`;
    const data = await this.redis.get(key);
    if (!data) return -1;
    const parsed = JSON.parse(data) as OtpData;
    parsed.attempts += 1;
    // Preserve remaining TTL by getting it first
    const ttl = await this.redis.ttl(key);
    await this.redis.set(key, JSON.stringify(parsed), ttl > 0 ? ttl : TokenStoreService.OTP_TTL_SECONDS);
    return parsed.attempts;
  }

  async deleteOtp(email: string): Promise<void> {
    const key = `${TokenStoreService.OTP_PREFIX}:${email}`;
    await this.redis.del(key);
  }

  async hasRecentOtp(email: string): Promise<boolean> {
    const key = `${TokenStoreService.OTP_COOLDOWN_PREFIX}:${email}`;
    const data = await this.redis.get(key);
    return data !== null;
  }

  async setOtpCooldown(email: string): Promise<void> {
    const key = `${TokenStoreService.OTP_COOLDOWN_PREFIX}:${email}`;
    await this.redis.set(key, '1', TokenStoreService.OTP_COOLDOWN_SECONDS);
  }

  /**
   * Atomically increment the per-phone SMS daily send count and ensure a
   * 24-hour TTL is set. Returns the post-increment value so callers can
   * enforce the 10/day cap without a second round-trip.
   */
  async incrementSmsDailyCount(phoneNumber: string): Promise<number> {
    const key = `${TokenStoreService.SMS_DAILY_PREFIX}:${phoneNumber}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      // First increment — set TTL so the key expires after 24 hours.
      await this.redis.expire(key, TokenStoreService.SMS_DAILY_TTL_SECONDS);
    }
    return count;
  }

  /**
   * Replace an existing OTP record for a channel switch.  Generates a fresh
   * record with the new channel and otp, resets attempts to 0, and increments
   * the switchCount.  Returns the prior channel for audit logging.
   */
  async replaceOtpForSwitch(
    email: string,
    newOtp: string,
    newChannel: OtpChannel,
  ): Promise<{ fromChannel: OtpChannel; switchCount: number }> {
    const key = `${TokenStoreService.OTP_PREFIX}:${email}`;
    const existing = await this.redis.get(key);
    const parsed = existing ? (JSON.parse(existing) as OtpData) : null;
    const fromChannel = parsed?.channel ?? OtpChannel.EMAIL;
    const newSwitchCount = (parsed?.switchCount ?? 0) + 1;
    const updatedData: OtpData = {
      email,
      otp: newOtp,
      attempts: 0,
      channel: newChannel,
      switchCount: newSwitchCount,
    };
    await this.redis.set(
      key,
      JSON.stringify(updatedData),
      TokenStoreService.OTP_TTL_SECONDS,
    );
    return { fromChannel, switchCount: newSwitchCount };
  }

  // --- Utilities ---

  /**
   * Parse expiry strings like '7d', '24h', '15m', '900s' into seconds.
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      this.logger.warn(
        `Could not parse expiry "${expiry}", defaulting to 7 days`,
      );
      return 604800; // 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 604800;
    }
  }
}
