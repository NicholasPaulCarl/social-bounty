import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookProvider, WebhookStatus } from '@prisma/client';
import {
  TradeSafeTransactionCallbackController,
  isSecretMatch,
} from './tradesafe-transaction-callback.controller';
import { WebhookEventService } from './webhook-event.service';
import { TradeSafeGraphQLClient } from '../tradesafe/tradesafe-graphql.client';
import { TradeSafeTransactionCallbackHandler } from '../tradesafe/tradesafe-transaction-callback.handler';
import type { TransactionData } from '../tradesafe/tradesafe-graphql.operations';

const SECRET = 'x'.repeat(32);

type RecordResult = {
  event: {
    id: string;
    attempts: number;
    externalEventId: string;
    provider: WebhookProvider;
    status: WebhookStatus;
  };
  isDuplicate: boolean;
};

function makeController() {
  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key === 'TRADESAFE_CALLBACK_SECRET' ? SECRET : (defaultValue as string),
    ),
  } as unknown as ConfigService;

  const recordOrFetch = jest.fn<Promise<RecordResult>, [unknown]>();
  const markProcessed = jest.fn().mockResolvedValue(undefined);
  const markFailed = jest.fn().mockResolvedValue(undefined);
  const events = {
    recordOrFetch,
    markProcessed,
    markFailed,
  } as unknown as WebhookEventService;

  const getTransaction = jest.fn<
    Promise<TransactionData['transaction']>,
    [string]
  >();
  const graphql = { getTransaction } as unknown as TradeSafeGraphQLClient;

  const handlerHandle = jest.fn().mockResolvedValue(undefined);
  const handler = {
    handle: handlerHandle,
  } as unknown as TradeSafeTransactionCallbackHandler;

  const controller = new TradeSafeTransactionCallbackController(
    config,
    events,
    graphql,
    handler,
  );
  return {
    controller,
    config,
    recordOrFetch,
    markProcessed,
    markFailed,
    getTransaction,
    handlerHandle,
  };
}

function makeTransaction(id = 'tx_abc'): TransactionData['transaction'] {
  return {
    id,
    title: 'Bounty Funding',
    reference: 'BNT_123',
    state: 'FUNDS_RECEIVED',
    parties: [],
    allocations: [],
    deposits: [],
  };
}

const validBody = { id: 'tx_abc', reference: 'BNT_123', state: 'CREATED', balance: 0 };

describe('TradeSafeTransactionCallbackController', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── 5-test matrix per CLAUDE.md §5 ───

  it('happy path: valid secret + valid id -> 200, getTransaction called, handler invoked, webhook_events row inserted', async () => {
    const {
      controller,
      recordOrFetch,
      markProcessed,
      getTransaction,
      handlerHandle,
    } = makeController();
    recordOrFetch.mockResolvedValue({
      event: {
        id: 'evt_1',
        attempts: 0,
        externalEventId: 'tx_abc',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.RECEIVED,
      },
      isDuplicate: false,
    });
    getTransaction.mockResolvedValue(makeTransaction());

    const result = await controller.receive(SECRET, validBody);

    expect(result).toEqual({ received: true, duplicate: false });
    expect(recordOrFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: WebhookProvider.TRADESAFE,
        externalEventId: 'tx_abc',
        eventType: 'tradesafe.transaction.created',
        payload: validBody,
      }),
    );
    expect(getTransaction).toHaveBeenCalledWith('tx_abc');
    expect(handlerHandle).toHaveBeenCalledTimes(1);
    expect(handlerHandle).toHaveBeenCalledWith(expect.objectContaining({ id: 'tx_abc' }));
    expect(markProcessed).toHaveBeenCalledWith('evt_1', {});
  });

  it('duplicate/retry: same id twice -> 200 both times, only one handler invocation', async () => {
    const {
      controller,
      recordOrFetch,
      getTransaction,
      handlerHandle,
      markProcessed,
    } = makeController();

    // First call — fresh insert.
    recordOrFetch.mockResolvedValueOnce({
      event: {
        id: 'evt_1',
        attempts: 0,
        externalEventId: 'tx_abc',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.RECEIVED,
      },
      isDuplicate: false,
    });
    getTransaction.mockResolvedValueOnce(makeTransaction());

    // Second call — unique-constraint collision reported by the service.
    recordOrFetch.mockResolvedValueOnce({
      event: {
        id: 'evt_1',
        attempts: 1,
        externalEventId: 'tx_abc',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.PROCESSED,
      },
      isDuplicate: true,
    });

    const first = await controller.receive(SECRET, validBody);
    const second = await controller.receive(SECRET, validBody);

    expect(first).toEqual({ received: true, duplicate: false });
    expect(second).toEqual({ received: true, duplicate: true });

    // Handler fires exactly once — the replay MUST NOT call it again.
    expect(handlerHandle).toHaveBeenCalledTimes(1);
    // getTransaction also called exactly once — replays skip the re-fetch
    // because recordOrFetch short-circuits before we reach it.
    expect(getTransaction).toHaveBeenCalledTimes(1);
    // First invocation is the only markProcessed.
    expect(markProcessed).toHaveBeenCalledTimes(1);
  });

  it('partial failure rollback: getTransaction throws -> 5xx, markFailed called with attempt count', async () => {
    const {
      controller,
      recordOrFetch,
      getTransaction,
      handlerHandle,
      markFailed,
      markProcessed,
    } = makeController();
    recordOrFetch.mockResolvedValue({
      event: {
        id: 'evt_1',
        attempts: 0,
        externalEventId: 'tx_abc',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.RECEIVED,
      },
      isDuplicate: false,
    });
    getTransaction.mockRejectedValue(new Error('graphql: 500'));

    await expect(controller.receive(SECRET, validBody)).rejects.toThrow(
      'graphql: 500',
    );

    // The event row WAS inserted (that's how we detected this as not-a-replay),
    // but it's marked FAILED rather than PROCESSED. The re-fetch failure must
    // NOT be recorded as a successful dispatch.
    expect(markFailed).toHaveBeenCalledWith('evt_1', 'graphql: 500', 1);
    expect(markProcessed).not.toHaveBeenCalled();
    expect(handlerHandle).not.toHaveBeenCalled();
  });

  it('replay idempotent: same id after handler completed -> 200, no re-invocation of handler or re-fetch', async () => {
    const {
      controller,
      recordOrFetch,
      getTransaction,
      handlerHandle,
      markProcessed,
    } = makeController();
    // Simulate a replay where the row already exists in PROCESSED state.
    recordOrFetch.mockResolvedValue({
      event: {
        id: 'evt_existing',
        attempts: 0,
        externalEventId: 'tx_abc',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.PROCESSED,
      },
      isDuplicate: true,
    });

    const result = await controller.receive(SECRET, validBody);

    expect(result).toEqual({ received: true, duplicate: true });
    expect(getTransaction).not.toHaveBeenCalled();
    expect(handlerHandle).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it('bad secret: wrong path segment -> 401, no work done', async () => {
    const {
      controller,
      recordOrFetch,
      getTransaction,
      handlerHandle,
    } = makeController();

    const wrongSecret = 'y'.repeat(32); // same length, different bytes
    await expect(controller.receive(wrongSecret, validBody)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(recordOrFetch).not.toHaveBeenCalled();
    expect(getTransaction).not.toHaveBeenCalled();
    expect(handlerHandle).not.toHaveBeenCalled();
  });

  // ─── Additional defensive checks ───

  it('401s on wrong-length secret (timingSafeEqual guard)', async () => {
    const { controller, recordOrFetch } = makeController();
    await expect(controller.receive('short', validBody)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(controller.receive('a'.repeat(31), validBody)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(controller.receive('a'.repeat(64), validBody)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(recordOrFetch).not.toHaveBeenCalled();
  });

  it('401s when TRADESAFE_CALLBACK_SECRET is unset (refuses to treat empty env as valid)', async () => {
    const config = {
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue ?? ''),
    } as unknown as ConfigService;
    const events = {
      recordOrFetch: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn(),
    } as unknown as WebhookEventService;
    const graphql = {
      getTransaction: jest.fn(),
    } as unknown as TradeSafeGraphQLClient;
    const handler = {
      handle: jest.fn(),
    } as unknown as TradeSafeTransactionCallbackHandler;
    const controller = new TradeSafeTransactionCallbackController(
      config,
      events,
      graphql,
      handler,
    );

    await expect(controller.receive(SECRET, validBody)).rejects.toThrow(
      UnauthorizedException,
    );
    // Even the right-length secret is rejected when the expected one is empty.
    await expect(controller.receive('', validBody)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('400s on missing id in body', async () => {
    const { controller, recordOrFetch } = makeController();
    await expect(
      controller.receive(SECRET, { reference: 'no-id' }),
    ).rejects.toThrow(BadRequestException);
    await expect(controller.receive(SECRET, null)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.receive(SECRET, 'not-an-object')).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.receive(SECRET, [])).rejects.toThrow(
      BadRequestException,
    );
    expect(recordOrFetch).not.toHaveBeenCalled();
  });

  it('falls back to tradesafe.transaction.callback eventType when body has no state', async () => {
    const { controller, recordOrFetch, getTransaction, handlerHandle } =
      makeController();
    recordOrFetch.mockResolvedValue({
      event: {
        id: 'evt_1',
        attempts: 0,
        externalEventId: 'tx_abc',
        provider: WebhookProvider.TRADESAFE,
        status: WebhookStatus.RECEIVED,
      },
      isDuplicate: false,
    });
    getTransaction.mockResolvedValue(makeTransaction());

    await controller.receive(SECRET, { id: 'tx_abc' });

    expect(recordOrFetch).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'tradesafe.transaction.callback' }),
    );
    expect(handlerHandle).toHaveBeenCalledTimes(1);
  });
});

describe('isSecretMatch (constant-time compare)', () => {
  it('matches identical strings', () => {
    expect(isSecretMatch('abc123', 'abc123')).toBe(true);
  });
  it('rejects different same-length strings', () => {
    expect(isSecretMatch('abcdef', 'abcxyz')).toBe(false);
  });
  it('rejects different-length strings without throwing', () => {
    expect(isSecretMatch('abc', 'abcd')).toBe(false);
    expect(isSecretMatch('abcd', 'abc')).toBe(false);
  });
  it('rejects non-string `provided`', () => {
    expect(isSecretMatch(undefined, 'abc')).toBe(false);
    expect(isSecretMatch(null, 'abc')).toBe(false);
    expect(isSecretMatch(42 as unknown, 'abc')).toBe(false);
  });
});
