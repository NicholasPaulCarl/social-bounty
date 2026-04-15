import { Global, Module } from '@nestjs/common';
import { KbController } from './kb.controller';
import { KbService } from './kb.service';

@Global()
@Module({
  controllers: [KbController],
  providers: [KbService],
  exports: [KbService],
})
export class KbModule {}
