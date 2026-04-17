// Canonical ledger constants — runtime values, not types.
// Source of truth: md-files/payment-gateway.md + md-files/financial-architecture.md.
// Financial Non-Negotiable #4: integer minor units, basis points for rates.

export const LEDGER_ACCOUNTS = {
  BRAND_CASH_RECEIVED: 'brand_cash_received',
  BRAND_RESERVE: 'brand_reserve',
  BRAND_REFUNDABLE: 'brand_refundable',
  HUNTER_PENDING: 'hunter_pending',
  HUNTER_CLEARING: 'hunter_clearing',
  HUNTER_AVAILABLE: 'hunter_available',
  HUNTER_PAID: 'hunter_paid',
  HUNTER_NET_PAYABLE: 'hunter_net_payable',
  COMMISSION_REVENUE: 'commission_revenue',
  ADMIN_FEE_REVENUE: 'admin_fee_revenue',
  GLOBAL_FEE_REVENUE: 'global_fee_revenue',
  PROCESSING_EXPENSE: 'processing_expense',
  PAYOUT_FEE_RECOVERY: 'payout_fee_recovery',
  BANK_CHARGES: 'bank_charges',
  GATEWAY_CLEARING: 'gateway_clearing',
  PAYOUT_IN_TRANSIT: 'payout_in_transit',
} as const;

export type LedgerAccountName =
  (typeof LEDGER_ACCOUNTS)[keyof typeof LEDGER_ACCOUNTS];

// Canonical idempotency action types. Paired with a stable referenceId per flow,
// they form the UNIQUE(referenceId, actionType) constraint on LedgerTransactionGroup.
export const LEDGER_ACTION_TYPES = {
  STITCH_PAYMENT_SETTLED: 'stitch_payment_settled',
  STITCH_PAYMENT_FAILED: 'stitch_payment_failed',
  SUBMISSION_APPROVED: 'submission_approved',
  CLEARANCE_RELEASED: 'clearance_released',
  PAYOUT_INITIATED: 'payout_initiated',
  STITCH_PAYOUT_SETTLED: 'stitch_payout_settled',
  STITCH_PAYOUT_FAILED: 'stitch_payout_failed',
  REFUND_PROCESSED: 'refund_processed',
  SUBSCRIPTION_CHARGED: 'subscription_charged',
  BOUNTY_EXPIRED_RELEASE: 'bounty_expired_release',
  COMPENSATING_ENTRY: 'compensating_entry',
} as const;

export type LedgerActionType =
  (typeof LEDGER_ACTION_TYPES)[keyof typeof LEDGER_ACTION_TYPES];

// Fee rates in basis points (1 bp = 0.01%). All ledger math uses these,
// never the decimal COMMISSION_RATES in constants.ts (kept for legacy display only).
export const FEE_RATES_BPS = {
  BRAND_FREE_ADMIN: 1500, // 15%
  BRAND_PRO_ADMIN: 500, //  5%
  HUNTER_FREE_COMMISSION: 2000, // 20%
  HUNTER_PRO_COMMISSION: 1000, // 10%
  GLOBAL_FEE: 350, //  3.5% — independent of tier (Non-Negotiable #10)
} as const;

// Clearance periods before hunter_pending -> hunter_available.
// Source: payment-gateway.md §9.
export const CLEARANCE_HOURS = {
  FREE: 72,
  PRO: 0,
} as const;
