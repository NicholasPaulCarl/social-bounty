import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { BountiesModule } from '../bounties/bounties.module';

@Module({
  imports: [BountiesModule],
  controllers: [FilesController],
})
export class FilesModule {}
