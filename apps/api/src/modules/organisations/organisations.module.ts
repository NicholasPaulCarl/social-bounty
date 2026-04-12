import { Module } from '@nestjs/common';
import { BrandsController } from './organisations.controller';
import { BrandsService } from './organisations.service';
import { ApifyModule } from '../apify/apify.module';

@Module({
  imports: [ApifyModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
