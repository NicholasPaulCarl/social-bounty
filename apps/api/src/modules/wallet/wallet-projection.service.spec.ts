import { LedgerEntryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletProjectionService } from './wallet-projection.service';

describe('WalletProjectionService', () => {
  let prisma: any;
  let service: WalletProjectionService;

  beforeEach(() => {
    prisma = {
      ledgerEntry: {
        aggregate: jest.fn(),
      },
    };
    service = new WalletProjectionService(prisma as PrismaService);
  });

  it('computes available = credits - debits on hunter_available', async () => {
    prisma.ledgerEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 10000n } }) // credits
      .mockResolvedValueOnce({ _sum: { amount: 2500n } }); // debits

    const out = await service.availableCents('user_1');
    expect(out).toBe(7500n);

    const firstCall = prisma.ledgerEntry.aggregate.mock.calls[0][0];
    expect(firstCall.where.type).toBe(LedgerEntryType.CREDIT);
  });

  it('pending sums hunter_pending + hunter_clearing + hunter_net_payable', async () => {
    // 3 accounts × 2 aggregates each = 6 calls; credits first, then debits in pairs.
    const queue = [
      { _sum: { amount: 100n } }, // hunter_pending credits
      { _sum: { amount: 20n } }, // hunter_pending debits
      { _sum: { amount: 50n } }, // hunter_clearing credits
      { _sum: { amount: 0n } }, // hunter_clearing debits
      { _sum: { amount: 40n } }, // hunter_net_payable credits
      { _sum: { amount: 10n } }, // hunter_net_payable debits
    ];
    prisma.ledgerEntry.aggregate.mockImplementation(async () => queue.shift());

    const out = await service.pendingCents('user_1');
    expect(out).toBe(80n + 50n + 30n);
  });

  it('treats null aggregates as zero', async () => {
    prisma.ledgerEntry.aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });

    const out = await service.availableCents('user_new');
    expect(out).toBe(0n);
  });
});
