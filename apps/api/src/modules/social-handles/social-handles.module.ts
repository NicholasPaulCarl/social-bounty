import { Module } from '@nestjs/common';
import { SocialHandlesController } from './social-handles.controller';
import { SocialHandlesService } from './social-handles.service';

@Module({
  controllers: [SocialHandlesController],
  providers: [SocialHandlesService],
  exports: [SocialHandlesService],
})
export class SocialHandlesModule {}
