import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { WebhookProvider, WebhookStatus } from '@prisma/client';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { StitchWebhookController } from './stitch-webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { KbService } from '../kb/kb.service';
import { SvixVerifier } from './svix.verifier';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRouterService } from './webhook-router.service';

function makeSecret() {
  const raw = Buffer.from('unittestsecret').toString('base64');
  return { secret: `whsec_${raw}`, raw };
}

function sign(id: string, ts: string, body: string, rawSecret: string) {
  const key = Buffer.from(rawSecret, 'base64');
  return 'v1,' + createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64');
}

describe('StitchWebhookController', () => {
  const { secret, raw } = makeSecret();
  let verifier: SvixVerifier;
  let events: WebhookEventService;
  let router: WebhookRouterService;
  let config: ConfigService;
  let controller: StitchWebhookController;
  let recordMock: jest.Mock;
  let markProcessedMock: jest.Mock;
  let markFailedMock: jest.Mock;
  let dispatchMock: jest.Mock;
  let kbRecordMock: jest.Mock;
  let kb: KbService;

  beforeEach(() => {
    verifier = new SvixVerifier();
    recordMock = jest.fn();
    markProcessedMock = jest.fn().mockResolvedValue(undefined);
    markFailedMock = jest.fn().mockResolvedValue(undefined);
    dispatchMock = jest.fn().mockResolvedValue(undefined);
    events = {
      recordOrFetch: recordMock,
      markProcessed: markProcessedMock,
      markFailed: markFailedMock,
    } as unknown as WebhookEventService;
    router = { dispatch: dispatchMock } as unknown as WebhookRouterService;
    config = {
      get: jest.fn((k: string) => (k === 'STITCH_WEBHOOK_SECRET' ? secret : undefined)),
    } as unknown as ConfigService;
    const prisma = { webhookEvent: { findUnique: jest.fn() } } as unknown as PrismaService;
    kbRecordMock = jest.fn().mockResolvedValue({ isNew: true, issue: {} });
    kb = { recordRecurrence: kbRecordMock } as unknown as KbService;
    controller = new StitchWebhookController(config, verifier, events, router, prisma, kb);
  });

  function buildRequest(body: string, headers: Record<string, string>) {
    return {
      rawBody: Buffer.from(body, 'utf8'),
      headers,
    } as any;
  }

  it('stores a new event and dispatches once', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'payment.settled', data: { id: 'pay_1' } });
    const signature = sign('svix_1', ts, body, raw);
    recordMock.mockResolvedValue({
      event: { id: 'evt_1', attempts: 0, externalEventId: 'svix_1', provider: WebhookProvider.STITCH, status: WebhookStatus.RECEIVED },
      isDuplicate: false,
    });

    const result = await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_1',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(result).toEqual({ received: true, duplicate: false });
    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'payment.settled' }));
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(markProcessedMock).toHaveBeenCalledWith('evt_1', {});
  });

  it('returns duplicate=true and does not dispatch on replay', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'payment.settled' });
    const signature = sign('svix_2', ts, body, raw);
    recordMock.mockResolvedValue({
      event: { id: 'evt_x', attempts: 0, externalEventId: 'svix_2', provider: WebhookProvider.STITCH, status: WebhookStatus.PROCESSED },
      isDuplicate: true,
    });

    const result = await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_2',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(result).toEqual({ received: true, duplicate: true });
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(markProcessedMock).not.toHaveBeenCalled();
  });

  it('rejects requests with a bad signature', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = '{"type":"x"}';
    await expect(
      controller.receive(
        buildRequest(body, {
          'svix-id': 's_3',
          'svix-timestamp': ts,
          'svix-signature': 'v1,bogus',
        }),
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('rejects when raw body is missing', async () => {
    await expect(
      controller.receive({ rawBody: undefined, headers: {} } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('records failure and still returns 200 when dispatch throws', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'payout.failed' });
    const signature = sign('svix_4', ts, body, raw);
    recordMock.mockResolvedValue({
      event: { id: 'evt_4', attempts: 0, externalEventId: 'svix_4', provider: WebhookProvider.STITCH, status: WebhookStatus.RECEIVED },
      isDuplicate: false,
    });
    dispatchMock.mockRejectedValueOnce(new Error('handler boom'));

    const result = await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_4',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(result).toEqual({ received: true, duplicate: false });
    expect(markFailedMock).toHaveBeenCalledWith('evt_4', 'handler boom', 1);
  });

  it('routes a dispatch failure through KbService.recordRecurrence with stable (category, system, errorCode)', async () => {
    // Locks the Phase 4 webhook-failure → KB auto-stub wiring. Stable triple is
    //   (category='webhook-failure', system='webhooks', errorCode=eventType)
    // so KbService.signature hashes to the same RecurringIssue on repeat and
    // the admin dashboard confidence score for `webhooks` can group on
    // metadata.system.
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'payout.failed' });
    const signature = sign('svix_kb', ts, body, raw);
    recordMock.mockResolvedValue({
      event: {
        id: 'evt_kb',
        attempts: 0,
        externalEventId: 'svix_kb',
        provider: WebhookProvider.STITCH,
        status: WebhookStatus.RECEIVED,
        eventType: 'payout.failed',
      },
      isDuplicate: false,
    });
    dispatchMock.mockRejectedValueOnce(new Error('handler boom'));

    await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_kb',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(kbRecordMock).toHaveBeenCalledTimes(1);
    const arg = kbRecordMock.mock.calls[0][0];
    expect(arg.category).toBe('webhook-failure');
    expect(arg.system).toBe('webhooks');
    expect(arg.errorCode).toBe('payout.failed');
    expect(arg.severity).toBe('warning');
    expect(arg.title).toContain('payout.failed');
    expect(arg.metadata).toMatchObject({
      svixId: 'svix_kb',
      errorMessage: 'handler boom',
      system: 'webhooks',
    });
  });

  it('swallows KbService errors so a broken KB never 500s the webhook', async () => {
    // Webhook endpoint must stay 200 on dispatch failure so Svix doesn't retry
    // storm. Same contract must hold when the KB write itself throws.
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'payment.failed' });
    const signature = sign('svix_kb_err', ts, body, raw);
    recordMock.mockResolvedValue({
      event: {
        id: 'evt_kb_err',
        attempts: 0,
        externalEventId: 'svix_kb_err',
        provider: WebhookProvider.STITCH,
        status: WebhookStatus.RECEIVED,
        eventType: 'payment.failed',
      },
      isDuplicate: false,
    });
    dispatchMock.mockRejectedValueOnce(new Error('handler boom'));
    kbRecordMock.mockRejectedValueOnce(new Error('kb down'));

    const result = await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_kb_err',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(result).toEqual({ received: true, duplicate: false });
    expect(markFailedMock).toHaveBeenCalledWith('evt_kb_err', 'handler boom', 1);
  });
});
