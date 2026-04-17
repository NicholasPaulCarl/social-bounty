import { apiClient } from './client';
import type {
  WalletDashboardResponse,
  LedgerWalletSnapshot,
  WalletTransactionListParams,
  PaginatedWalletTransactions,
  RequestWithdrawalRequest,
  WithdrawalListItem,
  WithdrawalListParams,
  PaginatedWithdrawals,
  AdminWalletListItem,
  AdminWalletListParams,
  AdminWalletAdjustRequest,
  AdminWithdrawalListItem,
  AdminWithdrawalListParams,
  AdminCompleteWithdrawalRequest,
  AdminFailWithdrawalRequest,
  PaginatedResponse,
} from '@social-bounty/shared';

export interface PaginatedAdminWallets {
  data: AdminWalletListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PaginatedAdminWithdrawals {
  data: AdminWithdrawalListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const walletApi = {
  getDashboard: (): Promise<WalletDashboardResponse> =>
    apiClient.get('/wallet'),

  getLedgerSnapshot: (): Promise<LedgerWalletSnapshot> =>
    apiClient.get('/wallet/ledger-snapshot'),

  getTransactions: (params: WalletTransactionListParams): Promise<PaginatedWalletTransactions> =>
    apiClient.get('/wallet/transactions', params as Record<string, unknown>),

  requestWithdrawal: (data: RequestWithdrawalRequest): Promise<WithdrawalListItem> =>
    apiClient.post('/wallet/withdraw', data),

  getMyWithdrawals: (params: WithdrawalListParams): Promise<PaginatedWithdrawals> =>
    apiClient.get('/wallet/withdrawals', params as Record<string, unknown>),

  cancelWithdrawal: (id: string): Promise<WithdrawalListItem> =>
    apiClient.patch(`/wallet/withdrawals/${id}/cancel`),

  adminListWallets: (params: AdminWalletListParams): Promise<PaginatedAdminWallets> =>
    apiClient.get('/admin/wallets', params as Record<string, unknown>),

  adminGetWallet: (userId: string): Promise<WalletDashboardResponse & { userId: string; userName: string; userEmail: string }> =>
    apiClient.get(`/admin/wallets/${userId}`),

  adminAdjustWallet: (userId: string, data: AdminWalletAdjustRequest): Promise<WalletDashboardResponse> =>
    apiClient.post(`/admin/wallets/${userId}/adjust`, data),

  adminListWithdrawals: (params: AdminWithdrawalListParams): Promise<PaginatedAdminWithdrawals> =>
    apiClient.get('/admin/withdrawals', params as Record<string, unknown>),

  adminProcessWithdrawal: (id: string): Promise<AdminWithdrawalListItem> =>
    apiClient.patch(`/admin/withdrawals/${id}/process`),

  adminCompleteWithdrawal: (id: string, data: AdminCompleteWithdrawalRequest): Promise<AdminWithdrawalListItem> =>
    apiClient.patch(`/admin/withdrawals/${id}/complete`, data),

  adminFailWithdrawal: (id: string, data: AdminFailWithdrawalRequest): Promise<AdminWithdrawalListItem> =>
    apiClient.patch(`/admin/withdrawals/${id}/fail`, data),
};
