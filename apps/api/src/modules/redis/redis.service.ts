import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      db: this.config.get<number>('REDIS_DB', 0),
      retryStrategy: (times: number) => {
        if (times > 10) {
          this.logger.error('Redis max retry attempts reached');
          return null;
        }
        return Math.min(times * 200, 5000);
      },
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  /**
   * Get a value by key. Returns null if not found.
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Set a key-value pair with an optional TTL in seconds.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Atomic SET NX EX — sets the key with a TTL only if it does not already
   * exist. Returns true if the key was set, false if it was already present.
   * Use for distributed locks and race-condition guards.
   */
  async setNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /**
   * Delete a key.
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if a key exists.
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Get all keys matching a pattern. Use with caution in production.
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  /**
   * Delete all keys matching a pattern using SCAN for safety.
   */
  async flushPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.client.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    return deletedCount;
  }

  /**
   * Atomically get a value and delete the key (for single-use tokens).
   * Uses a Lua script to ensure atomicity.
   */
  async getAndDelete(key: string): Promise<string | null> {
    const script = `
      local value = redis.call('GET', KEYS[1])
      if value then
        redis.call('DEL', KEYS[1])
      end
      return value
    `;
    const result = await this.client.eval(script, 1, key);
    return result as string | null;
  }

  /**
   * Increment a key by 1. Returns the new value after incrementing.
   * If the key does not exist, it is set to 0 before performing the operation.
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Set a timeout on a key in seconds.
   * Returns true if the timeout was set, false if the key does not exist.
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.expire(key, ttlSeconds);
    return result === 1;
  }

  /**
   * Get remaining TTL for a key in seconds.
   * Returns -2 if the key does not exist, -1 if no expiry is set.
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Ping Redis to check connectivity. Returns true if healthy.
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
