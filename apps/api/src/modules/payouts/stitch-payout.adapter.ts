import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StitchClient } from '../stitch/stitch.client';
import {
  CreateBeneficiaryInput,
  CreateBeneficiaryResult,
  InitiatePayoutInput,
  InitiatePayoutResult,
  PayoutProvider,
  PayoutStatusResult,
} from './payout-provider.interface';

/**
 * Wraps {@link StitchClient} in the {@link PayoutProvider} interface.
 *
 * Stitch Express has no dedicated beneficiary or payout-status endpoint (see
 * the long-form comment inside `StitchClient.createBeneficiary` — ADR 0008).
 * Those methods therefore return the local-synth / derived shapes. When the
 * TradeSafe migration lands those branches go away.
 */
@Injectable()
export class StitchPayoutAdapter implements PayoutProvider {
  readonly name = 'stitch';

  constructor(
    private readonly client: StitchClient,
    private readonly config: ConfigService,
  ) {}

  isMockMode(): boolean {
    // Stitch is "mock-ish" when the provider is `none` in env — the client
    // short-circuits to a local-synth id in that case.
    return !this.client.isEnabled();
  }

  async createBeneficiary(
    input: CreateBeneficiaryInput,
  ): Promise<CreateBeneficiaryResult> {
    const result = await this.client.createBeneficiary({
      accountHolderName: input.accountHolderName,
      bankCode: input.bankCode,
      accountNumber: input.accountNumber,
      accountType: input.accountType,
    });
    return { id: result.id };
  }

  async initiatePayout(
    input: InitiatePayoutInput,
    idempotencyKey: string,
  ): Promise<InitiatePayoutResult> {
    const result = await this.client.createPayout(
      {
        amountCents: input.amountCents,
        beneficiaryId: input.beneficiaryId,
        merchantReference: input.merchantReference,
        speed: input.speed,
      },
      idempotencyKey,
    );
    return { id: result.id, status: result.status };
  }

  async getPayoutStatus(providerPayoutId: string): Promise<PayoutStatusResult> {
    // Stitch does not expose a dedicated GET /payout/:id endpoint — settlement
    // comes via webhook. Adapter reports UNKNOWN; webhook path is the source
    // of truth. ADR 0010 may replace this with a real poller for TradeSafe.
    return { id: providerPayoutId, status: 'UNKNOWN' };
  }
}
