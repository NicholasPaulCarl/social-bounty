import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { StitchClient } from './stitch.client';

@Module({
  imports: [RedisModule],
  providers: [StitchClient],
  exports: [StitchClient],
})
export class StitchModule {}
