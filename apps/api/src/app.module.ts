import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BrandsModule } from './modules/organisations/organisations.module';
import { BountiesModule } from './modules/bounties/bounties.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { AdminModule } from './modules/admin/admin.module';
import { BusinessModule } from './modules/business/business.module';
import { HealthModule } from './modules/health/health.module';
import { FilesModule } from './modules/files/files.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { StitchModule } from './modules/stitch/stitch.module';
import { TradeSafeModule } from './modules/tradesafe/tradesafe.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { FinanceModule } from './modules/finance/finance.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { FinanceAdminModule } from './modules/finance-admin/finance-admin.module';
import { KbModule } from './modules/kb/kb.module';
import { AuditModule } from './modules/audit/audit.module';
import { MailModule } from './modules/mail/mail.module';
import { SettingsModule } from './modules/settings/settings.module';
import { BountyAccessModule } from './modules/bounty-access/bounty-access.module';
import { SocialHandlesModule } from './modules/social-handles/social-handles.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ApifyModule } from './modules/apify/apify.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { UserStatusGuard } from './common/guards/user-status.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnv } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    PrismaModule,
    RedisModule,
    AuditModule,
    MailModule,
    SettingsModule,
    AuthModule,
    UsersModule,
    BrandsModule,
    BountiesModule,
    SubmissionsModule,
    DisputesModule,
    AdminModule,
    BusinessModule,
    HealthModule,
    FilesModule,
    PaymentsModule,
    WalletModule,
    StitchModule,
    TradeSafeModule,
    WebhooksModule,
    FinanceModule,
    LedgerModule,
    RefundsModule,
    ReconciliationModule,
    PayoutsModule,
    FinanceAdminModule,
    KbModule,
    BountyAccessModule,
    SocialHandlesModule,
    InboxModule,
    SubscriptionsModule,
    ApifyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserStatusGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
