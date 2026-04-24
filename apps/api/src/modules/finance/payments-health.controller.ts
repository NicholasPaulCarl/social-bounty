import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { WebhookProvider } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { Roles } from '../../common/decorators';
import { TradeSafeGraphQLClient } from '../tradesafe/tradesafe-graphql.client';
import { WebhookEventService } from '../webhooks/webhook-event.service';
import { PrismaService } from '../prisma/prisma.service';

export interface PaymentsHealthResponse {
  paymentsProvider: string;
  tradeSafeTokenProbe: { ok: boolean; latencyMs: number; error?: string };
  lastWebhook: {
    receivedAt: string;
    eventType: string;
    status: string;
    externalEventId: string;
  } | null;
  killSwitch: { active: boolean; reason?: string };
  credsHashes: { clientId: string; clientSecret: string; callbackSecret: string };
}

/**
 * Admin payments-health probe (ADR 0011 — TradeSafe unified rail).
 *
 * Post-cutover: Stitch probes removed. The probe round-trips the
 * TradeSafe OAuth + `apiProfile` query so operators can eyeball auth
 * + provider connectivity alongside kill-switch / last-webhook state.
 */
@Controller('admin/payments-health')
@Roles(UserRole.SUPER_ADMIN)
export class PaymentsHealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly tradeSafe: TradeSafeGraphQLClient,
    private readonly webhooks: WebhookEventService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async get(): Promise<PaymentsHealthResponse> {
    // Single-rail architecture (ADR 0011) — TradeSafe is the only payments
    // provider. The field stays in the health response for UI back-compat
    // and to flag mock-vs-live explicitly.
    const mockMode = this.config.get<string>('TRADESAFE_MOCK', 'true') === 'true';
    const provider = mockMode ? 'tradesafe_mock' : 'tradesafe_live';

    const [probe, lastWebhook, killSwitchRow] = await Promise.all([
      this.tradeSafe.probe(),
      this.webhooks.lastReceivedByProvider(WebhookProvider.TRADESAFE),
      this.prisma.systemSetting.findUnique({
        where: { key: 'financial.kill_switch.active' },
      }),
    ]);

    return {
      paymentsProvider: provider,
      tradeSafeTokenProbe: probe,
      lastWebhook: lastWebhook
        ? {
            receivedAt: lastWebhook.receivedAt.toISOString(),
            eventType: lastWebhook.eventType,
            status: lastWebhook.status,
            externalEventId: lastWebhook.externalEventId,
          }
        : null,
      killSwitch: {
        active: killSwitchRow?.value === 'true',
        reason: killSwitchRow?.value === 'true' ? 'see audit log' : undefined,
      },
      credsHashes: {
        clientId: this.hash(this.config.get<string>('TRADESAFE_CLIENT_ID', '')),
        clientSecret: this.hash(this.config.get<string>('TRADESAFE_CLIENT_SECRET', '')),
        callbackSecret: this.hash(this.config.get<string>('TRADESAFE_CALLBACK_SECRET', '')),
      },
    };
  }

  private hash(value: string): string {
    if (!value) return 'unset';
    return createHash('sha256').update(value).digest('hex').slice(0, 12);
  }
}
