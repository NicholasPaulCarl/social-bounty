// Provider-agnostic payout interface (ADR 0008, ADR 0009, ADR 0011).
//
// Single-rail cutover (2026-04-24): only `TradeSafePayoutAdapter` implements
// this. `StitchPayoutAdapter` was deleted along with the Stitch module.
// `PayoutProviderFactory` resolves directly to the TradeSafe adapter
// (mock mode when creds absent).
//
// Outbound payout flow is Phase 4 — `PayoutsService` is currently a stub
// throwing `NotImplementedException` until the TradeSafe-native payout
// table + submission-approval trigger land. The interface itself stays
// as the contract for that future work.

export interface CreateBeneficiaryInput {
  accountHolderName: string;
  bankCode: string;
  accountNumber: string;
  accountType: string;
  /** Hunter user id — echoed back on webhook events for correlation. */
  externalReference: string;
}

export interface CreateBeneficiaryResult {
  id: string;
  status?: string;
}

export interface InitiatePayoutInput {
  amountCents: bigint;
  beneficiaryId: string;
  merchantReference: string;
  speed?: 'INSTANT' | 'DEFAULT';
}

export interface InitiatePayoutResult {
  id: string;
  status: string;
}

export interface PayoutStatusResult {
  id: string;
  status: string;
  failureReason?: string;
}

/**
 * Common shape for an outbound payout adapter. Consumers never instantiate
 * these directly — they go through {@link PayoutProviderFactory}.
 */
export interface PayoutProvider {
  /** Opaque provider identifier — 'stitch', 'tradesafe', 'mock'. */
  readonly name: string;

  /** True when this adapter is NOT talking to a live API (test / CI / scaffold). */
  isMockMode(): boolean;

  createBeneficiary(
    input: CreateBeneficiaryInput,
  ): Promise<CreateBeneficiaryResult>;

  initiatePayout(
    input: InitiatePayoutInput,
    idempotencyKey: string,
  ): Promise<InitiatePayoutResult>;

  getPayoutStatus(providerPayoutId: string): Promise<PayoutStatusResult>;
}
