import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WebhookEvent, WebhookProvider, WebhookStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordEventInput {
  provider: WebhookProvider;
  externalEventId: string;
  eventType: string;
  payload: unknown;
  signatureHeader?: string;
  svixTimestamp?: Date;
}

@Injectable()
export class WebhookEventService {
  private readonly logger = new Logger(WebhookEventService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Insert a new WebhookEvent, or return the existing row on UNIQUE conflict.
   * Returns `{ event, isDuplicate }` — duplicates must short-circuit with 2xx,
   * no side effects (Non-Negotiable #7).
   */
  async recordOrFetch(input: RecordEventInput): Promise<{ event: WebhookEvent; isDuplicate: boolean }> {
    try {
      const event = await this.prisma.webhookEvent.create({
        data: {
          provider: input.provider,
          externalEventId: input.externalEventId,
          eventType: input.eventType,
          status: WebhookStatus.RECEIVED,
          payload: input.payload as Prisma.InputJsonValue,
          signatureHeader: input.signatureHeader,
          svixTimestamp: input.svixTimestamp,
        },
      });
      return { event, isDuplicate: false };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing = await this.prisma.webhookEvent.findUnique({
          where: {
            provider_externalEventId: {
              provider: input.provider,
              externalEventId: input.externalEventId,
            },
          },
        });
        if (existing) {
          this.logger.log(
            `webhook replay: ${input.provider}/${input.externalEventId} (status=${existing.status})`,
          );
          return { event: existing, isDuplicate: true };
        }
      }
      throw err;
    }
  }

  async markProcessed(id: string, result: Record<string, unknown>): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: {
        status: WebhookStatus.PROCESSED,
        processedAt: new Date(),
        result: result as Prisma.InputJsonValue,
      },
    });
  }

  async markFailed(id: string, error: string, attempts: number): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { status: WebhookStatus.FAILED, errorMessage: error, attempts },
    });
  }

  async lastReceivedByProvider(provider: WebhookProvider): Promise<WebhookEvent | null> {
    return this.prisma.webhookEvent.findFirst({
      where: { provider },
      orderBy: { receivedAt: 'desc' },
    });
  }
}
