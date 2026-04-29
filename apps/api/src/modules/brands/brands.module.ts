import { Module, forwardRef } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { KybController } from './kyb.controller';
import { KybService } from './kyb.service';
import { KybDocumentsService } from './kyb-documents.service';
import { ApifyModule } from '../apify/apify.module';
import { TradeSafeModule } from '../tradesafe/tradesafe.module';

/**
 * BrandsModule.
 *
 * `forwardRef(() => TradeSafeModule)` — TradeSafeModule already
 * `forwardRef`s into LedgerModule + FinanceModule + SubscriptionsModule,
 * so we keep the same defensive shape here. The actual cycle risk is
 * minimal post-Wave-1 (no module currently imports BrandsModule besides
 * `app.module.ts`), but the forwardRef costs nothing and protects
 * against future churn.
 */
@Module({
  imports: [ApifyModule, forwardRef(() => TradeSafeModule)],
  controllers: [BrandsController, KybController],
  providers: [BrandsService, KybService, KybDocumentsService],
  exports: [BrandsService, KybService, KybDocumentsService],
})
export class BrandsModule {}
