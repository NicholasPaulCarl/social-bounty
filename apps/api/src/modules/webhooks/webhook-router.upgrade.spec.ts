/**
 * WebhookRouterService — subscription upgrade routing.
 *
 * Covers the new CONSENT + SUBSCRIPTION dispatch paths added in batch 10.
 * Other flows (LINK, WITHDRAWAL, REFUND) are covered by
 * stitch-webhook.controller.spec.ts.
 */
import { ModuleRef } from '@nestjs/core';
import { WebhookEvent } from '@prisma/client';
import { WebhookRouterService } from './webhook-router.service';
import { UpgradeService } from '../subscriptions/upgrade.service';
import { BrandFundingHandler } from '../payments/brand-funding.handler';
import { RefundsService } from '../refunds/refunds.service';
import { PayoutsService } from '../payouts/payouts.service';

describe('WebhookRouterService — subscription upgrade dispatch', () => {
  let router: WebhookRouterService;
  let upgrade: {
    processConsentAuthorised: jest.Mock;
    processRecurringCharge: jest.Mock;
    processChargeFailed: jest.Mock;
  };
  let moduleRef: { get: jest.Mock };

  const fakeEvent = { id: 'evt-1', eventType: 'stitch.event', externalEventId: 'svix-1' } as unknown as WebhookEvent;

  beforeEach(() => {
    upgrade = {
      processConsentAuthorised: jest.fn(),
      processRecurringCharge: jest.fn(),
      processChargeFailed: jest.fn(),
    };
    moduleRef = {
      get: jest.fn((token: any) => {
        if (token === UpgradeService) return upgrade;
        if (token === BrandFundingHandler) return {};
        if (token === RefundsService) return {};
        if (token === PayoutsService) return {};
        return {};
      }),
    };
    router = new WebhookRouterService(moduleRef as unknown as ModuleRef);
  });

  it('routes SUBSCRIPTION/AUTHORISED to processConsentAuthorised', async () => {
    await router.dispatch(fakeEvent, { type: 'SUBSCRIPTION', status: 'AUTHORISED', subscriptionId: 's1' });
    expect(upgrade.processConsentAuthorised).toHaveBeenCalled();
  });

  it('routes CONSENT/AUTHORIZED to processConsentAuthorised (spelling tolerance)', async () => {
    await router.dispatch(fakeEvent, { type: 'CONSENT', status: 'AUTHORIZED', consentRequestId: 'c1' });
    expect(upgrade.processConsentAuthorised).toHaveBeenCalled();
  });

  it('routes SUBSCRIPTION/PAID to processRecurringCharge', async () => {
    await router.dispatch(fakeEvent, {
      type: 'SUBSCRIPTION',
      status: 'PAID',
      subscriptionId: 's1',
      paymentId: 'p1',
      amount: 35000,
    });
    expect(upgrade.processRecurringCharge).toHaveBeenCalled();
  });

  it('routes SUBSCRIPTION/SETTLED to processRecurringCharge', async () => {
    await router.dispatch(fakeEvent, {
      type: 'SUBSCRIPTION',
      status: 'SETTLED',
      subscriptionId: 's1',
      paymentId: 'p1',
      amount: 35000,
    });
    expect(upgrade.processRecurringCharge).toHaveBeenCalled();
  });

  it('routes SUBSCRIPTION/FAILED to processChargeFailed', async () => {
    await router.dispatch(fakeEvent, { type: 'SUBSCRIPTION', status: 'FAILED', subscriptionId: 's1' });
    expect(upgrade.processChargeFailed).toHaveBeenCalled();
  });

  it('ignores unknown (type, status) tuples', async () => {
    await router.dispatch(fakeEvent, { type: 'SUBSCRIPTION', status: 'UNKNOWN_STATUS', subscriptionId: 's1' });
    expect(upgrade.processConsentAuthorised).not.toHaveBeenCalled();
    expect(upgrade.processRecurringCharge).not.toHaveBeenCalled();
    expect(upgrade.processChargeFailed).not.toHaveBeenCalled();
  });
});
