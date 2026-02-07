import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Public()
  async check(@Res() res: Response) {
    let dbStatus: 'ok' | 'error' = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    const overallStatus = dbStatus === 'ok' ? 'ok' : 'degraded';
    const statusCode = overallStatus === 'ok' ? 200 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbStatus,
        fileStorage: 'ok',
      },
    });
  }
}
