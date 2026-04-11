import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ApifyService } from './apify.service';
import { ApifySocialScheduler } from './apify-social.scheduler';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [ApifyService, ApifySocialScheduler],
  exports: [ApifyService],
})
export class ApifyModule {}
