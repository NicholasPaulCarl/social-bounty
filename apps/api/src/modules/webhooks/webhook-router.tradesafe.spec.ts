/**
 * WebhookRouterService — TradeSafe dispatch arms (R34, 2026-04-18).
 *
 * Locks the ADR 0009 §6 contract for the three live event names:
 *   - tradesafe.beneficiary.linked → onBeneficiaryLinked
 *   - tradesafe.payout.settled     → onPayoutSettled
 *   - tradesafe.payout.failed      → onPayoutFailed
 *
 * Stitch arms are covered by stitch-webhook.controller.spec.ts and
 * webhook-router.upgrade.spec.ts. This spec only touches the TradeSafe
 * side so the contract is locked independently.
 */
import { ModuleRef } from '@nestjs/core';
import { WebhookEvent, WebhookProvider } from '@prisma/client';
import { WebhookRouterService } from './webhook-router.service';
import { TradeSafeWebhookHandler } from '../tradesafe/tradesafe-webhook.handler';
import { BrandFundingHandler } from '../payments/brand-funding.handler';
import { RefundsService } from '../refunds/refunds.service';
import { PayoutsService } from '../payouts/payouts.service';
import { UpgradeService } from '../subscriptions/upgrade.service';

describe('WebhookRouterService — TradeSafe dispatch', () => {
  let router: WebhookRouterService;
  let tradesafe: {
    onBeneficiaryLinked: jest.Mock;
    onPayoutSettled: jest.Mock;
    onPayoutFailed: jest.Mock;
  };
  let moduleRef: { get: jest.Mock };

  const makeTradeSafeEvent = (eventType: string): WebhookEvent =>
    ({
      id: `evt-${eventType}`,
      provider: WebhookProvider.TRADESAFE,
      externalEventId: `svix-${eventType}`,
      eventType,
      // Other fields on WebhookEvent are irrelevant for the router.
    }) as unknown as WebhookEvent;

  beforeEach(() => {
    tradesafe = {
      onBeneficiaryLinked: jest.fn().mockResolvedValue(undefined),
      onPayoutSettled: jest.fn().mockResolvedValue(undefined),
      onPayoutFailed: jest.fn().mockResolvedValue(undefined),
    };
    moduleRef = {
      get: jest.fn((token: unknown) => {
        if (token === TradeSafeWebhookHandler) return tradesafe;
        // Stitch-side tokens — never called in these tests, but the router
        // may try to resolve them transiently via @nestjs/core. Returning
        // empty objects is safe because the TradeSafe arm exits before the
        // Stitch arm runs.
        if (token === BrandFundingHandler) return {};
        if (token === RefundsService) return {};
        if (token === PayoutsService) return {};
        if (token === UpgradeService) return {};
        return {};
      }),
    };
    router = new WebhookRouterService(moduleRef as unknown as ModuleRef);
  });

  it('routes tradesafe.beneficiary.linked to onBeneficiaryLinked', async () => {
    const event = makeTradeSafeEvent('tradesafe.beneficiary.linked');
    const payload = {
      type: 'tradesafe.beneficiary.linked',
      data: { id: 'ts-bene-1', externalReference: 'hunter-1' },
    };

    await router.dispatch(event, payload);

    expect(tradesafe.onBeneficiaryLinked).toHaveBeenCalledTimes(1);
    expect(tradesafe.onBeneficiaryLinked).toHaveBeenCalledWith(payload);
    expect(tradesafe.onPayoutSettled).not.toHaveBeenCalled();
    expect(tradesafe.onPayoutFailed).not.toHaveBeenCalled();
  });

  it('routes tradesafe.payout.settled to onPayoutSettled', async () => {
    const event = makeTradeSafeEvent('tradesafe.payout.settled');
    const payload = {
      type: 'tradesafe.payout.settled',
      data: { id: 'ts-payout-1' },
    };

    await router.dispatch(event, payload);

    expect(tradesafe.onPayoutSettled).toHaveBeenCalledTimes(1);
    expect(tradesafe.onPayoutSettled).toHaveBeenCalledWith(payload);
    expect(tradesafe.onBeneficiaryLinked).not.toHaveBeenCalled();
    expect(tradesafe.onPayoutFailed).not.toHaveBeenCalled();
  });

  it('routes tradesafe.payout.failed to onPayoutFailed', async () => {
    const event = makeTradeSafeEvent('tradesafe.payout.failed');
    const payload = {
      type: 'tradesafe.payout.failed',
      data: { id: 'ts-payout-2', failureReason: 'bank rejected' },
    };

    await router.dispatch(event, payload);

    expect(tradesafe.onPayoutFailed).toHaveBeenCalledTimes(1);
    expect(tradesafe.onPayoutFailed).toHaveBeenCalledWith(payload);
    expect(tradesafe.onBeneficiaryLinked).not.toHaveBeenCalled();
    expect(tradesafe.onPayoutSettled).not.toHaveBeenCalled();
  });

  it('falls back to event.eventType when payload.type is missing', async () => {
    // The controller writes `payload.type` into `event.eventType` on persist,
    // so even if a re-delivered payload has shed `type` for some reason,
    // the router's eventType fallback keeps routing deterministic.
    const event = makeTradeSafeEvent('tradesafe.payout.settled');
    const payload = { data: { id: 'ts-payout-3' } };

    await router.dispatch(event, payload);

    expect(tradesafe.onPayoutSettled).toHaveBeenCalledTimes(1);
  });

  it('logs-and-skips unknown tradesafe event types without throwing', async () => {
    const event = makeTradeSafeEvent('tradesafe.foo.bar');
    const payload = { type: 'tradesafe.foo.bar' };

    await expect(router.dispatch(event, payload)).resolves.toBeUndefined();

    expect(tradesafe.onBeneficiaryLinked).not.toHaveBeenCalled();
    expect(tradesafe.onPayoutSettled).not.toHaveBeenCalled();
    expect(tradesafe.onPayoutFailed).not.toHaveBeenCalled();
  });

  it('does not leak into the Stitch dispatch branches when provider=TRADESAFE', async () => {
    // Defence against a regression where a TradeSafe event with
    // `type='LINK'`/`'WITHDRAWAL'` payload shape somehow hits a Stitch arm.
    // The top-of-dispatch `provider === TRADESAFE` guard short-circuits
    // before any Stitch resolution happens.
    const event = makeTradeSafeEvent('tradesafe.payout.settled');
    const payload = {
      type: 'WITHDRAWAL', // deliberately Stitch-shaped to probe the isolation
      status: 'PAID',
      data: { id: 'ts-payout-4' },
    };

    await router.dispatch(event, payload);

    // The router's TradeSafe arm routes on eventType string — a
    // WITHDRAWAL/PAID payload with a TradeSafe-provider event falls
    // through to "no handler wired" (no onPayoutSettled call because the
    // TradeSafe arm reads event.eventType='tradesafe.payout.settled'
    // but payload.type='WITHDRAWAL' — the payload.type wins in the
    // readString precedence so we log-and-skip. This test documents that.
    // Result: Stitch handlers never see it (the guard held).
    expect(moduleRef.get).not.toHaveBeenCalledWith(
      PayoutsService,
      expect.anything(),
    );
    expect(moduleRef.get).not.toHaveBeenCalledWith(
      BrandFundingHandler,
      expect.anything(),
    );
    expect(moduleRef.get).not.toHaveBeenCalledWith(
      RefundsService,
      expect.anything(),
    );
    expect(moduleRef.get).not.toHaveBeenCalledWith(
      UpgradeService,
      expect.anything(),
    );
  });
});
