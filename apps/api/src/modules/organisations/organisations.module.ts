import { Module } from '@nestjs/common';
import { BrandsController } from './organisations.controller';
import { BrandsService } from './organisations.service';

@Module({
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
