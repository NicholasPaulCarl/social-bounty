import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class TokenStoreService {
  private readonly logger = new Logger(TokenStoreService.name);
  private readonly refreshTtlSeconds: number;

  private static readonly REFRESH_PREFIX = 'refresh';
  private static readonly RESET_PREFIX = 'reset';
  private static readonly VERIFY_PREFIX = 'verify';

  private static readonly RESET_TTL_SECONDS = 3600; // 1 hour
  private static readonly VERIFY_TTL_SECONDS = 86400; // 24 hours

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
