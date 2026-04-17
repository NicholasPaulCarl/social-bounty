import { Controller, Get, Query, BadRequestException, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Verify that a URL is reachable (returns 2xx/3xx).
   * Used by the submission form to validate social media links on blur.
   */
  @Get('verify-url')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 checks per minute
  async verifyUrl(@Query('url') url: string) {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException('URL is required');
    }

    // Basic URL format check
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { url, active: false, reason: 'Invalid URL format' };
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { url, active: false, reason: 'Only HTTP/HTTPS URLs are supported' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'SocialBounty-LinkChecker/1.0',
        },
      });

      clearTimeout(timeout);

      // Some sites block HEAD, retry with GET if 405
      if (response.status === 405) {
        const getController = new AbortController();
        const getTimeout = setTimeout(() => getController.abort(), 8000);

        const getResponse = await fetch(url, {
          method: 'GET',
          signal: getController.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'SocialBounty-LinkChecker/1.0',
          },
        });

        clearTimeout(getTimeout);
        const active = getResponse.status >= 200 && getResponse.status < 400;
        return { url, active, statusCode: getResponse.status };
      }

      const active = response.status >= 200 && response.status < 400;
      return { url, active, statusCode: response.status };
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      return {
        url,
        active: false,
        reason: aborted ? 'Request timed out' : 'Could not reach URL',
      };
    }
  }

  @Get()
  @Public()
  async check(@Res() res: Response) {
    let dbStatus: 'ok' | 'error' = 'ok';
    let redisStatus: 'ok' | 'error' = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    try {
      const healthy = await this.redis.ping();
      if (!healthy) {
        redisStatus = 'error';
      }
    } catch {
      redisStatus = 'error';
    }

    const allHealthy = dbStatus === 'ok' && redisStatus === 'ok';
    const overallStatus = allHealthy ? 'ok' : 'degraded';
    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbStatus,
        redis: redisStatus,
        fileStorage: 'ok',
      },
    });
  }
}
