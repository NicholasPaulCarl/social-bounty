// GraphQL operation strings + typed inputs/outputs for TradeSafe.
//
// Kept separate from the client to make them easy to eyeball vs.
// https://docs.tradesafe.co.za/api/ and to enable codegen later without
// churning the client file.
//
// Amount convention at the wire:
//   TradeSafe's GraphQL `value` fields are ZAR decimal (Float), up to 2dp.
//   Our ledger uses integer minor units (cents) — Financial Non-Negotiable #4.
//   Boundary conversion lives in {@link toZar} / {@link toCents}. A live
//   sandbox smoke test in Phase 1b confirms this convention; if TradeSafe
//   turns out to use cents, the converters flip and nothing else moves.

// ─── Amount converters (single source of truth) ────────────

/**
 * Convert integer minor units (cents) to TradeSafe ZAR decimal.
 * `150_00n` cents → `150.00` rand.
 */
export function toZar(cents: bigint): number {
  return Number(cents) / 100;
}

/**
 * Convert TradeSafe ZAR decimal to integer minor units (cents).
 * `150.00` → `15000n`. Guards against float drift via Math.round.
 */
export function toCents(zar: number): bigint {
  return BigInt(Math.round(zar * 100));
}

// ─── Enums (mirror TradeSafe's GraphQL schema) ─────────────

export type TradeSafeIndustry =
  | 'GENERAL_GOODS_SERVICES'
  | 'AGRICULTURE'
  | 'AUTOMOTIVE'
  | 'EDUCATION'
  | 'FINANCIAL_SERVICES'
  | 'HEALTHCARE'
  | 'HOSPITALITY'
  | 'MANUFACTURING'
  | 'PROFESSIONAL_SERVICES'
  | 'REAL_ESTATE'
  | 'RETAIL'
  | 'TECHNOLOGY'
  | 'TRANSPORTATION';

export type TradeSafeWorkflow = 'STANDARD' | 'MILESTONE' | 'DRAWDOWN';

export type TradeSafeFeeAllocation = 'BUYER' | 'SELLER' | 'AGENT';
export type TradeSafeFeeType = 'PERCENT' | 'FIXED';

export type TradeSafePartyRole = 'BUYER' | 'SELLER' | 'AGENT' | 'BENEFICIARY';

export type TradeSafeBankAccountType = 'CHEQUE' | 'SAVINGS' | 'CURRENT';
export type TradeSafeIdType = 'NATIONAL_ID' | 'PASSPORT';

/** Allocation state machine per the quick-start docs. */
export type TradeSafeAllocationState =
  | 'CREATED'
  | 'FUNDS_RECEIVED'
  | 'INITIATED'
  | 'DELIVERED'
  | 'FUNDS_RELEASED'
  | 'DISPUTE'
  | 'CANCELLED';

/** Transaction state — observed + inferred from the quick-start docs. */
export type TradeSafeTransactionState =
  | 'CREATED'
  | 'FUNDS_RECEIVED'
  | 'INITIATED'
  | 'DELIVERED'
  | 'FUNDS_RELEASED'
  | 'DISPUTE'
  | 'CANCELLED';

// ─── apiProfile — sanity / org lookup ──────────────────────

export const API_PROFILE_QUERY = /* GraphQL */ `
  query apiProfile {
    apiProfile {
      organizations {
        name
        token
      }
    }
  }
`;

export interface ApiProfileData {
  apiProfile: {
    organizations: Array<{ name: string; token: string }> | null;
  };
}

// ─── tokenCreate — register a user/org for use as a party ──

export interface TokenCreateInput {
  givenName: string;
  familyName: string;
  email: string;
  mobile?: string;
  idNumber?: string;
  idType?: TradeSafeIdType;
  idCountry?: string;
  /**
   * Optional banking details. Without these, the user can fund a transaction
   * (BUYER) but cannot receive a payout (SELLER). For hunters we must capture
   * these before they can accept bounties that pay out to them.
   */
  bank?: string; // UniversalBranchCode
  accountNumber?: string;
  accountType?: TradeSafeBankAccountType;
  // Organization details (optional — for brand parties)
  organizationName?: string;
  organizationTradeName?: string;
  organizationType?: 'PRIVATE' | 'PUBLIC' | 'NGO' | 'GOVERNMENT' | 'SOLE_PROPRIETOR';
  organizationRegistrationNumber?: string;
  organizationTaxNumber?: string;
}

export const TOKEN_CREATE_MUTATION = /* GraphQL */ `
  mutation tokenCreate(
    $givenName: String
    $familyName: String
    $email: Email
    $mobile: String
    $idNumber: String
    $idType: IdType
    $idCountry: Country
    $bank: UniversalBranchCode
    $accountNumber: String
    $accountType: BankAccountType
    $organizationName: String
    $organizationTradeName: String
    $organizationType: OrganizationType
    $organizationRegistrationNumber: String
    $organizationTaxNumber: String
  ) {
    tokenCreate(
      input: {
        user: {
          givenName: $givenName
          familyName: $familyName
          email: $email
          mobile: $mobile
          idNumber: $idNumber
          idType: $idType
          idCountry: $idCountry
        }
        organization: {
          name: $organizationName
          tradeName: $organizationTradeName
          type: $organizationType
          registrationNumber: $organizationRegistrationNumber
          taxNumber: $organizationTaxNumber
        }
        bankAccount: {
          bank: $bank
          accountNumber: $accountNumber
          accountType: $accountType
        }
      }
    ) {
      id
      name
      reference
    }
  }
`;

export interface TokenCreateData {
  tokenCreate: {
    id: string;
    name: string | null;
    reference: string;
  };
}

// ─── transactionCreate — create escrow with allocations + parties ──

export interface TransactionPartyInput {
  token: string;
  role: TradeSafePartyRole;
  fee?: number;
  feeType?: TradeSafeFeeType;
  feeAllocation?: TradeSafeFeeAllocation;
}

export interface TransactionAllocationInput {
  title: string;
  description: string;
  /**
   * Amount in ZAR (Float). Use {@link toZar} to convert from integer cents
   * at the adapter boundary.
   */
  value: number;
  daysToDeliver: number;
  daysToInspect: number;
}

export interface TransactionCreateInput {
  title: string;
  description: string;
  industry: TradeSafeIndustry;
  workflow: TradeSafeWorkflow;
  feeAllocation: TradeSafeFeeAllocation;
  /**
   * Merchant-side reference (our internal ID). TradeSafe echoes this back on
   * webhooks for correlation.
   */
  reference?: string;
  allocations: TransactionAllocationInput[];
  parties: TransactionPartyInput[];
}

export const TRANSACTION_CREATE_MUTATION = /* GraphQL */ `
  mutation transactionCreate(
    $title: String!
    $description: String!
    $industry: Industry!
    $workflow: TransactionWorkflow!
    $feeAllocation: FeeAllocation!
    $reference: String
    $allocations: [AllocationInput!]!
    $parties: [PartyInput!]!
  ) {
    transactionCreate(
      input: {
        title: $title
        description: $description
        industry: $industry
        workflow: $workflow
        currency: ZAR
        feeAllocation: $feeAllocation
        reference: $reference
        allocations: { create: $allocations }
        parties: { create: $parties }
      }
    ) {
      id
      title
      createdAt
      state
      reference
      allocations {
        id
        title
        value
        state
      }
      parties {
        id
        role
      }
    }
  }
`;

export interface TransactionCreateData {
  transactionCreate: {
    id: string;
    title: string;
    createdAt: string;
    state: TradeSafeTransactionState;
    reference: string | null;
    allocations: Array<{
      id: string;
      title: string;
      value: number;
      state: TradeSafeAllocationState;
    }>;
    parties: Array<{ id: string; role: TradeSafePartyRole }>;
  };
}

// ─── checkoutLink — hosted payment page for the BUYER ──────

export const CHECKOUT_LINK_MUTATION = /* GraphQL */ `
  mutation checkoutLink($id: ID!) {
    checkoutLink(transactionId: $id)
  }
`;

export interface CheckoutLinkData {
  checkoutLink: string;
}

// ─── allocationStartDelivery / allocationAcceptDelivery ────

export const ALLOCATION_START_DELIVERY_MUTATION = /* GraphQL */ `
  mutation allocationStartDelivery($id: ID!) {
    allocationStartDelivery(id: $id) {
      id
      state
    }
  }
`;

export const ALLOCATION_ACCEPT_DELIVERY_MUTATION = /* GraphQL */ `
  mutation allocationAcceptDelivery($id: ID!) {
    allocationAcceptDelivery(id: $id) {
      id
      state
    }
  }
`;

export interface AllocationStateData {
  allocationStartDelivery?: { id: string; state: TradeSafeAllocationState };
  allocationAcceptDelivery?: { id: string; state: TradeSafeAllocationState };
}

// ─── transaction query — canonical state re-fetch ──────────

export const TRANSACTION_QUERY = /* GraphQL */ `
  query transaction($id: ID!) {
    transaction(id: $id) {
      id
      title
      reference
      state
      parties {
        id
        role
      }
      allocations {
        id
        title
        value
        state
        deliverBy
        inspectBy
      }
      deposits {
        id
        method
        value
        processed
        paymentLink
      }
    }
  }
`;

export interface TransactionData {
  transaction: {
    id: string;
    title: string;
    reference: string | null;
    state: TradeSafeTransactionState;
    parties: Array<{ id: string; role: TradeSafePartyRole }>;
    allocations: Array<{
      id: string;
      title: string;
      value: number;
      state: TradeSafeAllocationState;
      deliverBy: string | null;
      inspectBy: string | null;
    }>;
    deposits: Array<{
      id: string;
      method: string;
      value: number;
      processed: boolean;
      paymentLink: string | null;
    }>;
  } | null;
}
