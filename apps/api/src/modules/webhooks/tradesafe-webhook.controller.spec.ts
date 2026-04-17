import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { WebhookProvider, WebhookStatus } from '@prisma/client';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TradeSafeWebhookController } from './tradesafe-webhook.controller';
import { KbService } from '../kb/kb.service';
import { SvixVerifier } from './svix.verifier';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRouterService } from './webhook-router.service';

function makeSecret() {
  const raw = Buffer.from('tradesafe-unit-secret').toString('base64');
  return { secret: `whsec_${raw}`, raw };
}

function sign(id: string, ts: string, body: string, rawSecret: string) {
  const key = Buffer.from(rawSecret, 'base64');
  return 'v1,' + createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64');
}

describe('TradeSafeWebhookController (integration-shape unit spec)', () => {
  // Integration-shape because it exercises the full Svix-verify → persist →
  // dispatch pipeline via real instances of SvixVerifier + a mocked
  // WebhookEventService. The DB / Prisma layer is stubbed (the webhook-event
  // service is the idempotency boundary — replay tests assert that contract).

  const { secret, raw } = makeSecret();
  let verifier: SvixVerifier;
  let events: WebhookEventService;
  let router: WebhookRouterService;
  let config: ConfigService;
  let controller: TradeSafeWebhookController;
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
      get: jest.fn((k: string) => (k === 'TRADESAFE_WEBHOOK_SECRET' ? secret : undefined)),
    } as unknown as ConfigService;
    kbRecordMock = jest.fn().mockResolvedValue({ isNew: true, issue: {} });
    kb = { recordRecurrence: kbRecordMock } as unknown as KbService;
    controller = new TradeSafeWebhookController(config, verifier, events, router, kb);
  });

  function buildRequest(body: string, headers: Record<string, string>) {
    return {
      rawBody: Buffer.from(body, 'utf8'),
      headers,
    } as any;
  }

  it('persists a signed event as provider=TRADESAFE and dispatches once', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({
      type: 'tradesafe.payout.escrow_held',
      data: { id: 'ts_payout_1' },
    });
    const signature = sign('svix_ts_1', ts, body, raw);
    recordMock.mockResolvedValue({
      event: {
        id: 'evt_ts_1',
        attempts: 0,
        externalEventId: 'svix_ts_1',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.RECEIVED,
        eventType: 'tradesafe.payout.escrow_held',
      },
      isDuplicate: false,
    });

    const result = await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_ts_1',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(result).toEqual({ received: true, duplicate: false });
    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: WebhookProvider.TRADESAFE,
        externalEventId: 'svix_ts_1',
        eventType: 'tradesafe.payout.escrow_held',
      }),
    );
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(markProcessedMock).toHaveBeenCalledWith('evt_ts_1', {});
  });

  it('is replay-safe: duplicate externalEventId short-circuits without dispatch', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'tradesafe.payout.released' });
    const signature = sign('svix_replay', ts, body, raw);
    recordMock.mockResolvedValue({
      event: {
        id: 'evt_replay',
        attempts: 0,
        externalEventId: 'svix_replay',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.PROCESSED,
        eventType: 'tradesafe.payout.released',
      },
      isDuplicate: true,
    });

    const result = await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_replay',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(result).toEqual({ received: true, duplicate: true });
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(markProcessedMock).not.toHaveBeenCalled();
    expect(markFailedMock).not.toHaveBeenCalled();
  });

  it('rejects tampered signatures with 401 and does not persist', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'tradesafe.payout.released' });
    // Sign with the wrong secret.
    const wrongSig = 'v1,' + createHmac('sha256', Buffer.from('wrong', 'utf8'))
      .update(`svix_bad.${ts}.${body}`)
      .digest('base64');

    await expect(
      controller.receive(
        buildRequest(body, {
          'svix-id': 'svix_bad',
          'svix-timestamp': ts,
          'svix-signature': wrongSig,
        }),
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(recordMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('rejects missing raw body with 400', async () => {
    await expect(
      controller.receive({ rawBody: undefined, headers: {} } as any),
    ).rejects.toThrow(BadRequestException);
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('rejects missing svix headers with 400', async () => {
    const body = '{}';
    await expect(
      controller.receive(buildRequest(body, {})),
    ).rejects.toThrow(BadRequestException);
  });

  it('records failure via KB and still returns 200 when dispatch throws', async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: 'tradesafe.payout.failed' });
    const signature = sign('svix_fail', ts, body, raw);
    recordMock.mockResolvedValue({
      event: {
        id: 'evt_fail',
        attempts: 0,
        externalEventId: 'svix_fail',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.RECEIVED,
        eventType: 'tradesafe.payout.failed',
      },
      isDuplicate: false,
    });
    dispatchMock.mockRejectedValueOnce(new Error('handler boom'));

    const result = await controller.receive(
      buildRequest(body, {
        'svix-id': 'svix_fail',
        'svix-timestamp': ts,
        'svix-signature': signature,
      }),
    );

    expect(result).toEqual({ received: true, duplicate: false });
    expect(markFailedMock).toHaveBeenCalledWith('evt_fail', 'handler boom', 1);
    expect(kbRecordMock).toHaveBeenCalledTimes(1);
    const arg = kbRecordMock.mock.calls[0][0];
    expect(arg.category).toBe('webhook-failure');
    expect(arg.system).toBe('webhooks');
    expect(arg.metadata).toMatchObject({ provider: 'tradesafe' });
  });
});
