import { apiClient } from './client';
import type { HunterPayoutRow } from '@social-bounty/shared';

export interface UpsertBeneficiaryRequest {
  accountHolderName: string;
  bankCode: string;
  accountNumber: string;
  accountType: string;
}

export interface BeneficiaryResponse {
  id: string;
  tradeSafeBeneficiaryId: string;
}

export const payoutsApi = {
  upsertMyBeneficiary: (body: UpsertBeneficiaryRequest): Promise<BeneficiaryResponse> =>
    apiClient.post('/payouts/me/beneficiary', body),
  listMine: (): Promise<HunterPayoutRow[]> => apiClient.get('/payouts/me'),
};
