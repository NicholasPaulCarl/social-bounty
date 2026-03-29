import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// Mock ioredis before importing the service so its constructor does not
// open a real TCP connection during tests.
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  keys: jest.fn(),
  scan: jest.fn(),
  eval: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisClient);
});

import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => fallback),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  // ── get ──────────────────────────────────────────────────

  describe('get', () => {
    it('should return the stored string value', async () => {
      mockRedisClient.get.mockResolvedValue('hello');

      const result = await service.get('my-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('my-key');
      expect(result).toBe('hello');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('absent');

      expect(result).toBeNull();
    });
  });

  // ── set ──────────────────────────────────────────────────

  describe('set', () => {
    it('should call SET EX when TTL is provided', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('k', 'v', 300);

      expect(mockRedisClient.set).toHaveBeenCalledWith('k', 'v', 'EX', 300);
    });

    it('should call SET without EX when no TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('k', 'v');

      expect(mockRedisClient.set).toHaveBeenCalledWith('k', 'v');
    });
  });

  // ── del ──────────────────────────────────────────────────

  describe('del', () => {
    it('should delete the specified key', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.del('to-remove');

      expect(mockRedisClient.del).toHaveBeenCalledWith('to-remove');
    });
  });

  // ── exists ───────────────────────────────────────────────

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists('present');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.exists('absent');

      expect(result).toBe(false);
    });
  });

  // ── keys ─────────────────────────────────────────────────

  describe('keys', () => {
    it('should return matching keys from Redis', async () => {
      mockRedisClient.keys.mockResolvedValue(['refresh:u1:tok1', 'refresh:u1:tok2']);

      const result = await service.keys('refresh:u1:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('refresh:u1:*');
      expect(result).toHaveLength(2);
    });
  });

  // ── flushPattern ─────────────────────────────────────────

  describe('flushPattern', () => {
    it('should scan and delete all matching keys, returning count', async () => {
      // First SCAN call returns cursor '0' with some keys (terminates the loop)
      mockRedisClient.scan.mockResolvedValue(['0', ['key:1', 'key:2']]);
      mockRedisClient.del.mockResolvedValue(2);

      const deleted = await service.flushPattern('key:*');

      expect(mockRedisClient.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'key:*',
        'COUNT',
        100,
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith('key:1', 'key:2');
      expect(deleted).toBe(2);
    });

    it('should return 0 and skip del when no keys match', async () => {
      mockRedisClient.scan.mockResolvedValue(['0', []]);

      const deleted = await service.flushPattern('nomatch:*');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(deleted).toBe(0);
    });
  });

  // ── ping ─────────────────────────────────────────────────

  describe('ping', () => {
    it('should return true when Redis responds PONG', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe(true);
    });

    it('should return false when ping throws', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('connection refused'));

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });
});
