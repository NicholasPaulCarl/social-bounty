/**
 * TradeSafeTokenService — unit tests.
 *
 * Covers:
 *   1. Fast path — user already has a token → returns it, no network, no audit.
 *   2. Cold path — user has no token → calls tokenCreate, persists, audits.
 *   3. Graphql failure propagates (and is not swallowed).
 *   4. Mock-mode guard throws BadRequestException.
 *   5. User-not-found throws NotFoundException.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  TradeSafeApiError,
  TradeSafeGraphQLClient,
} from './tradesafe-graphql.client';
import { TradeSafeTokenService } from './tradesafe-token.service';

describe('TradeSafeTokenService', () => {
  let service: TradeSafeTokenService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let graphql: {
    isMockMode: jest.Mock;
    tokenCreate: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    graphql = {
      isMockMode: jest.fn().mockReturnValue(false),
      tokenCreate: jest.fn(),
    };

    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeSafeTokenService,
        { provide: PrismaService, useValue: prisma },
        { provide: TradeSafeGraphQLClient, useValue: graphql },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<TradeSafeTokenService>(TradeSafeTokenService);
  });

  // ─── 1. Fast path ────────────────────────────────────────

  describe('fast path', () => {
    it('returns the existing token without calling graphql or audit', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'j@e.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.PARTICIPANT,
        tradeSafeTokenId: 'tok-123',
      });

      const result = await service.ensureToken('user-1');

      expect(result).toBe('tok-123');
      expect(graphql.tokenCreate).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });

  // ─── 2. Cold path ────────────────────────────────────────

  describe('cold path', () => {
    it('creates a token, persists the ID, and writes an audit log', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.PARTICIPANT,
        tradeSafeTokenId: null,
      });
      graphql.tokenCreate.mockResolvedValue({
        id: 'tok-new-42',
        name: 'Jane Doe',
        reference: 'ref-42',
      });

      const result = await service.ensureToken('user-1');

      expect(result).toBe('tok-new-42');
      expect(graphql.tokenCreate).toHaveBeenCalledTimes(1);
      expect(graphql.tokenCreate).toHaveBeenCalledWith({
        givenName: 'Jane',
        familyName: 'Doe',
        email: 'jane@example.com',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tradeSafeTokenId: 'tok-new-42' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'user-1',
          actorRole: UserRole.PARTICIPANT,
          action: 'tradesafe.token_created',
          entityType: 'User',
          entityId: 'user-1',
          afterState: { tradeSafeTokenId: 'tok-new-42' },
        }),
      );
    });

    it('persists token even when AuditService is not provided (Optional)', async () => {
      // Rebuild module without the AuditService — simulates the runtime case
      // where the @Optional() constructor dep resolves to undefined.
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TradeSafeTokenService,
          { provide: PrismaService, useValue: prisma },
          { provide: TradeSafeGraphQLClient, useValue: graphql },
        ],
      }).compile();
      const bareService = module.get<TradeSafeTokenService>(TradeSafeTokenService);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.PARTICIPANT,
        tradeSafeTokenId: null,
      });
      graphql.tokenCreate.mockResolvedValue({
        id: 'tok-opt',
        name: null,
        reference: 'r',
      });

      const result = await bareService.ensureToken('user-2');
      expect(result).toBe('tok-opt');
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  // ─── 3. Graphql failure propagates ───────────────────────

  describe('graphql failure', () => {
    it('rethrows TradeSafeApiError without persisting or auditing', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'j@e.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.PARTICIPANT,
        tradeSafeTokenId: null,
      });
      graphql.tokenCreate.mockRejectedValue(
        new TradeSafeApiError('validation error on email', 400, {}),
      );

      await expect(service.ensureToken('user-1')).rejects.toBeInstanceOf(
        TradeSafeApiError,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });

  // ─── 4. Mock mode guard ──────────────────────────────────

  describe('mock mode', () => {
    it('throws BadRequestException without reading the user', async () => {
      graphql.isMockMode.mockReturnValue(true);

      await expect(service.ensureToken('user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.ensureToken('user-1')).rejects.toThrow(
        /mock mode/i,
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(graphql.tokenCreate).not.toHaveBeenCalled();
    });
  });

  // ─── 5. User not found ───────────────────────────────────

  describe('user not found', () => {
    it('throws NotFoundException without calling graphql', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.ensureToken('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(graphql.tokenCreate).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });
});
