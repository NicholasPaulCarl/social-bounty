// Shared TradeSafe error type.
//
// 2026-04-27 (post-Phase-3 cleanup): the legacy outbound types
// (TradeSafeTokenResponse, TradeSafeCreateBeneficiaryRequest,
// TradeSafeInitiatePayoutRequest, TradeSafeGetPayoutStatusResponse,
// TradeSafePayoutStatus) were removed alongside `tradesafe.client.ts` —
// the legacy outbound HTTP client had zero live callers since
// PayoutsService stubbed NotImplementedException on the cutover. Phase 4
// outbound work will use TradeSafeGraphQLClient directly, not a separate
// REST client, so those shapes won't be coming back.
//
// `TradeSafeApiError` stays — it's the canonical error class thrown by
// `tradesafe-graphql.client.ts` (request envelope, OAuth token,
// allocationStartDelivery, allocationAcceptDelivery) and asserted by
// `tradesafe-token.service.spec.ts`.

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
