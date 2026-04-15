import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { WebhookProvider } from '@prisma/client';
import { UserRole } from '@social-bounty/shared';
import { Roles } from '../../common/decorators';
import { StitchClient } from '../stitch/stitch.client';
import { WebhookEventService } from '../webhooks/webhook-event.service';
import { PrismaService } from '../prisma/prisma.service';

export interface PaymentsHealthResponse {
  paymentsProvider: string;
  stitchTokenProbe: { ok: boolean; latencyMs: number; error?: string };
  lastWebhook: {
    receivedAt: string;
    eventType: string;
    status: string;
    externalEventId: string;
  } | null;
  killSwitch: { active: boolean; reason?: string };
  credsHashes: { clientId: string; clientSecret: string; webhookSecret: string };
}

@Controller('admin/payments-health')
@Roles(UserRole.SUPER_ADMIN)
export class PaymentsHealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly stitch: StitchClient,
    private readonly webhooks: WebhookEventService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async get(): Promise<PaymentsHealthResponse> {
    const provider = this.config.get<string>('PAYMENTS_PROVIDER', 'none');

    const [probe, lastWebhook, killSwitchRow] = await Promise.all([
      this.stitch.isEnabled()
        ? this.stitch.probeToken()
        : Promise.resolve({ ok: false, latencyMs: 0, error: 'provider disabled' }),
      this.webhooks.lastReceivedByProvider(WebhookProvider.STITCH),
      this.prisma.systemSetting.findUnique({
        where: { key: 'financial.kill_switch.active' },
      }),
    ]);

    return {
      paymentsProvider: provider,
      stitchTokenProbe: probe,
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
        clientId: this.hash(this.config.get<string>('STITCH_CLIENT_ID', '')),
        clientSecret: this.hash(this.config.get<string>('STITCH_CLIENT_SECRET', '')),
        webhookSecret: this.hash(this.config.get<string>('STITCH_WEBHOOK_SECRET', '')),
      },
    };
  }

  private hash(value: string): string {
    if (!value) return 'unset';
    return createHash('sha256').update(value).digest('hex').slice(0, 12);
  }
}
