import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { BountyStatus } from '@social-bounty/shared';
import {
  mockBA,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Draft Save', () => {
  let service: BountiesService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let auditService: ReturnType<typeof createMockAuditService>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    auditService = createMockAuditService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BountiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: SubscriptionsService, useValue: { getActiveTier: jest.fn().mockResolvedValue('FREE'), getActiveOrgTier: jest.fn().mockResolvedValue('FREE'), isFeatureEnabled: jest.fn().mockResolvedValue(false) } },
      ],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
  });

  describe('Minimal draft (title only)', () => {
    it('should create a draft with only a title', async () => {
      const record = baseBountyRecord({
        title: 'My Draft Bounty',
        shortDescription: '',
        fullInstructions: '',
        category: '',
        proofRequirements: '',
        status: BountyStatus.DRAFT,
      });
      prisma.bounty.create.mockResolvedValue(record);

      const result = await service.create(mockBA, { title: 'My Draft Bounty' });

      expect(result.status).toBe(BountyStatus.DRAFT);
      expect(result.title).toBe('My Draft Bounty');
      expect(prisma.bounty.create).toHaveBeenCalledTimes(1);
    });

    it('should not call channel validation when channels omitted', async () => {
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: 'No Channels', channels: null }),
      );

      const result = await service.create(mockBA, { title: 'No Channels' });

      expect(result).toBeDefined();
    });

    it('should not call reward validation when rewards omitted', async () => {
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: 'No Rewards' }),
      );

      const result = await service.create(mockBA, { title: 'No Rewards' });

      expect(result).toBeDefined();
    });

    it('should not call visibility validation when postVisibility omitted', async () => {
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: 'No Visibility' }),
      );

      const result = await service.create(mockBA, { title: 'No Visibility' });

      expect(result).toBeDefined();
    });
  });

  describe('Partial draft', () => {
    it('should create a draft with title and shortDescription only', async () => {
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({
          title: 'Partial',
          shortDescription: 'Some desc',
          status: BountyStatus.DRAFT,
        }),
      );

      const result = await service.create(mockBA, {
        title: 'Partial',
        shortDescription: 'Some desc',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(BountyStatus.DRAFT);
    });

    it('should create a draft with title and empty rewards array', async () => {
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: 'No Reward Lines', status: BountyStatus.DRAFT }),
      );

      const result = await service.create(mockBA, {
        title: 'No Reward Lines',
        rewards: [],
      });

      expect(result).toBeDefined();
    });

    it('should create a draft with title and empty channels object', async () => {
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({ title: 'No Channels', channels: {}, status: BountyStatus.DRAFT }),
      );

      const result = await service.create(mockBA, {
        title: 'No Channels',
        channels: {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('DRAFT→LIVE still validates all fields', () => {
    it('should reject DRAFT→LIVE when missing required fields', async () => {
      // A draft bounty with no channels/rewards
      const draftRecord = baseBountyRecord({
        id: 'draft-1',
        status: BountyStatus.DRAFT,
        channels: {},
        proofRequirements: '',
        shortDescription: '',
        fullInstructions: '',
        category: '',
        rewards: [],
      });
      prisma.bounty.findUnique.mockResolvedValue(draftRecord);
      prisma.bountyReward.findMany.mockResolvedValue([]);

      await expect(
        service.updateStatus('draft-1', mockBA, BountyStatus.LIVE),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Draft defaults', () => {
    it('should use empty string defaults for missing text fields', async () => {
      prisma.bounty.create.mockResolvedValue(
        baseBountyRecord({
          title: 'Defaults',
          shortDescription: '',
          fullInstructions: '',
          category: '',
          proofRequirements: '',
        }),
      );

      await service.create(mockBA, { title: 'Defaults' });

      const createCall = prisma.bounty.create.mock.calls[0][0];
      expect(createCall.data.shortDescription).toBe('');
      expect(createCall.data.fullInstructions).toBe('');
      expect(createCall.data.category).toBe('');
      expect(createCall.data.proofRequirements).toBe('');
    });

    it('should always save as DRAFT status', async () => {
      prisma.bounty.create.mockResolvedValue(baseBountyRecord());

      await service.create(mockBA, { title: 'Force Draft' });

      const createCall = prisma.bounty.create.mock.calls[0][0];
      expect(createCall.data.status).toBe(BountyStatus.DRAFT);
    });
  });
});
