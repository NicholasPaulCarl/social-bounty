import { Injectable } from '@nestjs/common';
import { TradeSafeClient } from '../tradesafe/tradesafe.client';
import {
  CreateBeneficiaryInput,
  CreateBeneficiaryResult,
  InitiatePayoutInput,
  InitiatePayoutResult,
  PayoutProvider,
  PayoutStatusResult,
} from './payout-provider.interface';

/**
 * Wraps {@link TradeSafeClient} in the provider-agnostic
 * {@link PayoutProvider} interface. Adapter is a pure translation layer — all
 * mock / live branching lives in the client.
 */
@Injectable()
export class TradeSafePayoutAdapter implements PayoutProvider {
  readonly name = 'tradesafe';

  constructor(private readonly client: TradeSafeClient) {}

  isMockMode(): boolean {
    return this.client.isMockMode();
  }

  async createBeneficiary(
    input: CreateBeneficiaryInput,
  ): Promise<CreateBeneficiaryResult> {
    const result = await this.client.createBeneficiary({
      accountHolderName: input.accountHolderName,
      bankCode: input.bankCode,
      accountNumber: input.accountNumber,
      accountType: input.accountType,
      externalReference: input.externalReference,
    });
    return { id: result.id, status: result.status };
  }

  async initiatePayout(
    input: InitiatePayoutInput,
    idempotencyKey: string,
  ): Promise<InitiatePayoutResult> {
    const result = await this.client.initiatePayout(
      {
        amountCents: input.amountCents,
        beneficiaryId: input.beneficiaryId,
        merchantReference: input.merchantReference,
      },
      idempotencyKey,
    );
    return { id: result.id, status: result.status };
  }

  async getPayoutStatus(providerPayoutId: string): Promise<PayoutStatusResult> {
    const result = await this.client.getPayoutStatus(providerPayoutId);
    return {
      id: result.id,
      status: result.status,
      failureReason: result.failureReason,
    };
  }
}
