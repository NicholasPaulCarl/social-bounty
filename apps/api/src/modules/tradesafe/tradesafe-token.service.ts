import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { AUDIT_ACTIONS, ENTITY_TYPES, UserRole } from '@social-bounty/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TradeSafeGraphQLClient } from './tradesafe-graphql.client';

/**
 * TradeSafeTokenService — onboarding primitive for TradeSafe parties (ADR 0011).
 *
 * Every user who participates in a TradeSafe escrow transaction (brand as BUYER,
 * hunter as SELLER) needs a TradeSafe party token (`tokenCreate` mutation).
 * The token is created once, stored on `users.tradeSafeTokenId`, and reused
 * for every subsequent transaction the user is involved in.
 *
 * `ensureToken(userId)` is the single entry point. It is:
 *   - Idempotent — if the user already has `tradeSafeTokenId` set, returns it
 *     immediately with no network call and no audit log.
 *   - Side-effecting on the cold path — creates the TradeSafe token, persists
 *     the ID, writes an AuditLog entry (action = `tradesafe.token_created`).
 *   - Error-propagating — TradeSafeApiError / graphql failures are logged and
 *     rethrown. Fire-and-forget callers (the signup hook) catch those; blocking
 *     callers (bounty-funding path in Phase 3) surface them synchronously.
 *
 * ## Mock-mode contract
 *
 * This service assumes it is only called when TradeSafe is live. Callers MUST
 * check `tradeSafeGraphQLClient.isMockMode()` before invoking `ensureToken`.
 * If called in mock mode, the service throws `BadRequestException` because
 * calling the mock client would itself throw with a less actionable message.
 *
 * ## Banking details
 *
 * `TokenCreateInput` accepts optional banking fields (`bank`, `accountNumber`,
 * `accountType`). Those are not available on the `User` model today — they're
 * only gathered during the hunter's banking-UX step (deferred to Phase 2 hunter
 * banking UX) and for brand admins via the brand KYB flow (also deferred).
 * For now we pass only name + email, which produces a BUYER-eligible token.
 * When banking details are captured later, a separate `tokenUpdate` call (not
 * implemented here) promotes the token to SELLER-eligible. See ADR 0011 §3.
 */
@Injectable()
export class TradeSafeTokenService {
  private readonly logger = new Logger(TradeSafeTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphql: TradeSafeGraphQLClient,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  /**
   * Ensure the user has a TradeSafe party token. Returns the token ID either
   * from the existing User row (fast path — one DB round-trip, no network) or
   * by calling `tokenCreate` and persisting the returned ID (cold path).
   *
   * @throws BadRequestException if TradeSafe is in mock mode (caller contract).
   * @throws NotFoundException if the user does not exist.
   * @throws TradeSafeApiError propagated from the GraphQL client on cold path.
   */
  async ensureToken(userId: string): Promise<string> {
    if (this.graphql.isMockMode()) {
      throw new BadRequestException(
        'TradeSafe is in mock mode — cannot create tokens',
      );
    }

    // Fast-path pre-check. Also fetches the profile fields we need for the
    // cold path so there's exactly one read regardless of branch.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tradeSafeTokenId: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (user.tradeSafeTokenId) {
      return user.tradeSafeTokenId;
    }

    // Cold path — create a TradeSafe token. Any error propagates; the signup
    // hook catches and logs, bounty-funding surfaces synchronously to the
    // caller (Phase 3).
    const created = await this.graphql.tokenCreate({
      givenName: user.firstName,
      familyName: user.lastName,
      email: user.email,
      // Banking details intentionally omitted — captured in Phase 2 hunter
      // banking UX via a separate `tokenUpdate` call.
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { tradeSafeTokenId: created.id },
    });

    this.auditService?.log({
      actorId: userId,
      actorRole: user.role as UserRole,
      action: AUDIT_ACTIONS.TRADESAFE_TOKEN_CREATED,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      afterState: { tradeSafeTokenId: created.id },
    });

    this.logger.log(
      `TradeSafe token created for user=${userId} tokenId=${created.id}`,
    );

    return created.id;
  }
}
