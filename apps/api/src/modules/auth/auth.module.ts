import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenStoreService } from './token-store.service';
import { ApifyModule } from '../apify/apify.module';
import { SmsModule } from '../sms/sms.module';

/**
 * NOTE: `TradeSafeModule` is intentionally NOT imported here. A compile-time
 * import would introduce a cycle — `AppModule → AuthModule → TradeSafeModule
 * → LedgerModule → … → WebhooksModule → TradeSafeModule` — that makes
 * `WebhooksModule.imports[0]` undefined at scan time. `AuthService` resolves
 * `TradeSafeTokenService` lazily through `ModuleRef` at signup time instead
 * (same idiom `WebhookRouterService` uses for its handler fan-out). The
 * service still runs because it's in the app-level DI graph via
 * `AppModule → TradeSafeModule`.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
    }),
    ApifyModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenStoreService],
  exports: [AuthService],
})
export class AuthModule {}
