import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BountiesService } from '../bounties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  SocialChannel,
  PostFormat,
} from '@social-bounty/shared';
import {
  mockBA,
  validCreateBountyData,
  baseBountyRecord,
  createMockPrisma,
  createMockAuditService,
} from './test-fixtures';

describe('BountiesService - Channel Selection Validation', () => {
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

  describe('Valid channel selections', () => {
    it('should accept single channel with one format', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.REEL],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord({ channels: data.channels }));

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept INSTAGRAM with STORY, REEL, FEED_POST', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.STORY, PostFormat.REEL, PostFormat.FEED_POST],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord({ channels: data.channels }));

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept FACEBOOK with FEED_POST, STORY, REEL', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.STORY, PostFormat.REEL],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord({ channels: data.channels }));

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept TIKTOK with VIDEO_POST', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord({ channels: data.channels }));

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });

    it('should accept all three channels simultaneously', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.REEL],
        [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST],
        [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
      };
      prisma.bounty.create.mockResolvedValue(baseBountyRecord({ channels: data.channels }));

      const result = await service.create(mockBA, data);

      expect(result).toBeDefined();
    });
  });

  describe('Invalid channel selections', () => {
    it('VE-07: should allow empty channels object (draft saving)', async () => {
      const data = validCreateBountyData();
      data.channels = {};
      prisma.bounty.create.mockResolvedValue(baseBountyRecord({ channels: {} }));

      const result = await service.create(mockBA, data);
      expect(result).toBeDefined();
    });

    it('VE-06: should reject channel with empty format array', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.INSTAGRAM]: [],
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-08: should reject invalid format for TIKTOK (STORY)', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.TIKTOK]: [PostFormat.STORY as PostFormat],
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-08: should reject invalid format for INSTAGRAM (VIDEO_POST)', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.VIDEO_POST as PostFormat],
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('VE-28: should reject unknown channel enum value', async () => {
      const data = validCreateBountyData();
      (data.channels as Record<string, string[]>)['YOUTUBE'] = ['VIDEO_POST'];
      delete (data.channels as Record<string, unknown>)[SocialChannel.INSTAGRAM];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject unknown format string', async () => {
      const data = validCreateBountyData();
      (data.channels as Record<string, string[]>)[SocialChannel.INSTAGRAM] = ['LIVESTREAM' as PostFormat];

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('AP-15: should reject duplicate formats in same channel', async () => {
      const data = validCreateBountyData();
      data.channels = {
        [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.REEL],
      };

      await expect(service.create(mockBA, data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
