import { apiClient } from './client';
import type { BusinessDashboardResponse } from '@social-bounty/shared';

export const businessApi = {
  getDashboard: (): Promise<BusinessDashboardResponse> =>
    apiClient.get('/business/dashboard'),
};
