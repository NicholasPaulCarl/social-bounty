import { WalletTxType, WithdrawalStatus, PayoutMethod, Currency } from '../enums';
import type { PaginationMeta } from '../common';

// ─────────────────────────────────────
// Wallet Balance
// ─────────────────────────────────────

export interface WalletBalanceResponse {
  available: string;
  pending: string;
  total: string;
  totalEarned: string;
  totalWithdrawn: string;
  currency: Currency;
}

// ─────────────────────────────────────
// Wallet Transactions (Ledger)
// ─────────────────────────────────────

export interface WalletTransactionListItem {
  id: string;
  type: WalletTxType;
  amount: string;
  description: string;
  referenceType: string;
  referenceId: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
}

export interface WalletTransactionListParams {
  page?: number;
  limit?: number;
  type?: WalletTxType;
  sortOrder?: 'asc' | 'desc';
}

export interface WalletDashboardResponse {
  balance: WalletBalanceResponse;
  recentTransactions: WalletTransactionListItem[];
}

// ─────────────────────────────────────
// Ledger-Projected Wallet Snapshot
// ─────────────────────────────────────
// Derived from LedgerEntry (ADR 0002). Cents are serialized as strings to
// preserve bigint precision across the wire.
export interface LedgerWalletSnapshot {
  availableCents: string;
  pendingCents: string;
  paidCents: string;
}

export interface PaginatedWalletTransactions {
  data: WalletTransactionListItem[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────
// Withdrawal
// ─────────────────────────────────────

export interface RequestWithdrawalRequest {
  amount: number;
  method: PayoutMethod;
  destination: Record<string, string>;
}

export interface WithdrawalListItem {
  id: string;
  amount: string;
  currency: Currency;
  method: PayoutMethod;
  status: WithdrawalStatus;
  destination: Record<string, string>;
  processedAt: string | null;
  failureReason: string | null;
  proofUrl: string | null;
  createdAt: string;
}

export interface WithdrawalListParams {
  page?: number;
  limit?: number;
  status?: WithdrawalStatus;
}

export interface PaginatedWithdrawals {
  data: WithdrawalListItem[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────
// Admin
// ─────────────────────────────────────

export interface AdminWalletListItem {
  userId: string;
  userName: string;
  userEmail: string;
  balance: string;
  pendingBalance: string;
  totalEarned: string;
  totalWithdrawn: string;
  currency: Currency;
  createdAt: string;
}

export interface AdminWalletListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminWalletAdjustRequest {
  amount: number;
  reason: string;
}

export interface AdminWithdrawalListItem extends WithdrawalListItem {
  userId: string;
  userName: string;
  userEmail: string;
}

export interface AdminWithdrawalListParams {
  page?: number;
  limit?: number;
  status?: WithdrawalStatus;
  search?: string;
}

export interface AdminCompleteWithdrawalRequest {
  proofUrl?: string;
}

export interface AdminFailWithdrawalRequest {
  reason: string;
}
