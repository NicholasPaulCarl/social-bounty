import { apiClient } from './client';

export interface UpsertBeneficiaryRequest {
  accountHolderName: string;
  bankCode: string;
  accountNumber: string;
  accountType: string;
}

export interface BeneficiaryResponse {
  id: string;
  stitchBeneficiaryId: string;
}

export const payoutsApi = {
  upsertMyBeneficiary: (body: UpsertBeneficiaryRequest): Promise<BeneficiaryResponse> =>
    apiClient.post('/payouts/me/beneficiary', body),
};
