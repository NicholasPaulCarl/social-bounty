import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenStoreService } from './token-store.service';
import { RedisService } from '../redis/redis.service';

describe('TokenStoreService', () => {
  let service: TokenStoreService;
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
    flushPattern: jest.Mock;
    getAndDelete: jest.Mock;
  };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
      flushPattern: jest.fn().mockResolvedValue(0),
      getAndDelete: jest.fn().mockResolvedValue(null),
    };

    configService = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'JWT_REFRESH_EXPIRY') return '7d';
        return fallback;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenStoreService,
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<TokenStoreService>(TokenStoreService);
  });

  // ── storeRefreshToken ────────────────────────────────────

  describe('storeRefreshToken', () => {
    it('should store with the configured TTL', async () => {
      await service.storeRefreshToken('tok-abc', 'user-1', 'jti-1');

      expect(redis.set).toHaveBeenCalledWith(
        'refresh:user-1:tok-abc',
        JSON.stringify({ userId: 'user-1', jti: 'jti-1' }),
        604800, // 7 days in seconds
      );
    });
  });

  // ── getRefreshToken ──────────────────────────────────────

  describe('getRefreshToken', () => {
    it('should return parsed data when key exists', async () => {
      redis.get.mockResolvedValue(
        JSON.stringify({ userId: 'user-1', jti: 'jti-1' }),
      );

      const result = await service.getRefreshToken('tok-abc', 'user-1');

      expect(redis.get).toHaveBeenCalledWith('refresh:user-1:tok-abc');
      expect(result).toEqual({ userId: 'user-1', jti: 'jti-1' });
    });

    it('should return null when key does not exist', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.getRefreshToken('missing-tok', 'user-1');

      expect(result).toBeNull();
    });
  });

  // ── deleteRefreshToken ───────────────────────────────────

  describe('deleteRefreshToken', () => {
    it('should delete the correct key', async () => {
      await service.deleteRefreshToken('tok-abc', 'user-1');

      expect(redis.del).toHaveBeenCalledWith('refresh:user-1:tok-abc');
    });
  });

  // ── invalidateAllUserTokens ──────────────────────────────

  describe('invalidateAllUserTokens', () => {
    it('should flush the user pattern', async () => {
      redis.flushPattern.mockResolvedValue(3);

      await service.invalidateAllUserTokens('user-1');

      expect(redis.flushPattern).toHaveBeenCalledWith('refresh:user-1:*');
    });
  });

  // ── storeResetToken ──────────────────────────────────────

  describe('storeResetToken', () => {
    it('should store with 1h TTL (3600 seconds)', async () => {
      await service.storeResetToken('reset-tok', 'user-1');

      expect(redis.set).toHaveBeenCalledWith(
        'reset:reset-tok',
        JSON.stringify({ userId: 'user-1' }),
        3600,
      );
    });
  });

  // ── getAndDeleteResetToken ───────────────────────────────

  describe('getAndDeleteResetToken', () => {
    it('should return parsed data and delete atomically', async () => {
      redis.getAndDelete.mockResolvedValue(
        JSON.stringify({ userId: 'user-1' }),
      );

      const result = await service.getAndDeleteResetToken('reset-tok');

      expect(redis.getAndDelete).toHaveBeenCalledWith('reset:reset-tok');
      expect(result).toEqual({ userId: 'user-1' });
    });

    it('should return null when token does not exist', async () => {
      redis.getAndDelete.mockResolvedValue(null);

      const result = await service.getAndDeleteResetToken('not-found');

      expect(result).toBeNull();
    });
  });
});
