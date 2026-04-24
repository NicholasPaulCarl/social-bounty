import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Roles, CurrentUser, Audited } from '../../common/decorators';
import { SubscriptionTier, UserRole } from '@social-bounty/shared';
import { SubscriptionsService } from './subscriptions.service';
import { UpgradeService } from './upgrade.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithIp {
  ip?: string;
}

interface UpgradeBody {
  targetTier?: SubscriptionTier;
}

@Controller('subscription')
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private upgradeService: UpgradeService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Pro subscriptions are feature-gated at the Stitch account level until
   * commercial enablement completes. Until then, the UI hides the CTA and
   * this gate makes direct calls to `POST /subscription/upgrade` return a
   * clean 503 instead of leaking through to Stitch. Flip
   * `SUBSCRIPTION_UPGRADE_ENABLED=true` to re-enable; no other code changes
   * are required (all upgrade plumbing stays wired and tested).
   */
  private isUpgradeEnabled(): boolean {
    return (
      this.config.get<string>('SUBSCRIPTION_UPGRADE_ENABLED', 'false') === 'true'
    );
  }

  @Get()
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN, UserRole.SUPER_ADMIN)
  async getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getSubscription(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
    );
  }

  @Post('subscribe')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async subscribe(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.subscribe(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
    );
  }

  /**
   * Kick off the live card-consent upgrade flow.
   *
   * RBAC: PARTICIPANT (for their own HUNTER sub) and BUSINESS_ADMIN
   * (for their brand's BRAND sub). SUPER_ADMIN is intentionally NOT
   * allowed here — admins must never initiate a charge against a user's
   * card on their behalf; this endpoint only acts for `user.sub` /
   * `user.brandId`.
   *
   * Audited via @Audited decorator (AuditInterceptor writes the AuditLog
   * with actor + ip). UpgradeService also writes a SUBSCRIPTION_UPGRADE_INITIATED
   * audit entry with the resulting mandate id (after-state).
   */
  @Post('upgrade')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  @Audited('SUBSCRIPTION_UPGRADE_INITIATED', 'Subscription')
  async upgrade(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithIp,
    @Body() body?: UpgradeBody,
  ) {
    // Defence-in-depth gate. The UI already hides the CTA when the feature
    // is off; this catches direct API calls and returns a clean 503.
    if (!this.isUpgradeEnabled()) {
      throw new ServiceUnavailableException(
        'Pro subscriptions are launching soon. Check back shortly.',
      );
    }

    const targetTier = body?.targetTier ?? SubscriptionTier.PRO;
    if (targetTier !== SubscriptionTier.PRO) {
      throw new BadRequestException('Only PRO upgrade is supported');
    }

    // Stitch requires the payer's real name + email on the mandate.
    // Look them up from the authenticated user row rather than trusting
    // client-supplied values.
    const userRow = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!userRow) {
      throw new BadRequestException('User not found');
    }
    const fullName = `${userRow.firstName} ${userRow.lastName}`.trim();

    return this.upgradeService.initiateUpgrade(
      {
        userId: user.sub,
        role: user.role as UserRole,
        brandId: user.brandId ?? undefined,
        ipAddress: req?.ip ?? null,
        fullName,
        email: userRow.email,
      },
      targetTier,
    );
  }

  @Post('cancel')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithIp,
    @Body() body?: { immediate?: boolean },
  ) {
    return this.subscriptionsService.cancel(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
      {
        immediate: body?.immediate === true,
        actorId: user.sub,
        actorRole: user.role as UserRole,
        ipAddress: req?.ip ?? null,
      },
    );
  }

  @Post('reactivate')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async reactivate(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.reactivate(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
    );
  }

  @Get('payments')
  @Roles(UserRole.PARTICIPANT, UserRole.BUSINESS_ADMIN)
  async getPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.subscriptionsService.getPaymentHistory(
      user.sub,
      user.role as UserRole,
      user.brandId ?? undefined,
      { page, limit },
    );
  }
}
