import { Module } from '@nestjs/common';
import { BrandsController } from './organisations.controller';
import { BrandsService } from './organisations.service';
import { KybController } from './kyb.controller';
import { KybService } from './kyb.service';
import { ApifyModule } from '../apify/apify.module';

@Module({
  imports: [ApifyModule],
  controllers: [BrandsController, KybController],
  providers: [BrandsService, KybService],
  exports: [BrandsService, KybService],
})
export class BrandsModule {}
