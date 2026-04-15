// Typed request/response shapes for the TradeSafe payout adapter.
//
// These shapes are deliberately minimal. ADR 0009 explicitly defers the full
// API surface to ADR 0010 (blocked on sandbox credentials), so the types below
// capture only the three calls the adapter interface exposes:
//
//   - createBeneficiary  — register a hunter as a payout destination
//   - initiatePayout     — push funds from our TradeSafe float to the hunter
//   - getPayoutStatus    — poll/confirm a payout's lifecycle
//
// All amounts are integer minor units (cents) per Financial Non-Negotiable #4.
// External provider ids are opaque strings — shape pinned by ADR 0010.

export interface TradeSafeTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface TradeSafeCreateBeneficiaryRequest {
  accountHolderName: string;
  bankCode: string;
  accountNumber: string;
  accountType: string;
  /** Hunter's internal user id — echoed back on webhook events for correlation. */
  externalReference: string;
}

export interface TradeSafeCreateBeneficiaryResponse {
  id: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
}

export interface TradeSafeInitiatePayoutRequest {
  amountCents: bigint;
  beneficiaryId: string;
  /** Our internal StitchPayout / future ProviderPayout id — idempotency anchor. */
  merchantReference: string;
}

export type TradeSafePayoutStatus =
  | 'CREATED'
  | 'ESCROW_HELD'
  | 'RELEASED'
  | 'FAILED'
  | 'CANCELLED';

export interface TradeSafeInitiatePayoutResponse {
  id: string;
  status: TradeSafePayoutStatus;
}

export interface TradeSafeGetPayoutStatusResponse {
  id: string;
  status: TradeSafePayoutStatus;
  failureReason?: string;
}

export class TradeSafeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'TradeSafeApiError';
  }
}
