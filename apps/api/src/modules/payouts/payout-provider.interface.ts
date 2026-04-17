// Provider-agnostic payout interface (ADR 0008, ADR 0009).
//
// StitchPayoutAdapter and TradeSafePayoutAdapter both implement this. The
// `PayoutProviderFactory` picks the concrete implementation from the
// `PAYOUT_PROVIDER` env flag so the rest of the payout pipeline (ledger legs,
// scheduler, retry policy) is provider-unaware.
//
// This is a scaffolding interface — no call site consumes it yet. The 8
// `TRADESAFE MIGRATION (ADR 0008)` markers in `payouts.service.ts`,
// `beneficiary.service.ts`, and `stitch.client.ts` are the future callers.
// They remain pointing at the Stitch code until the provider-agnostic payout
// workstream lands (ADR 0010).

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
