import { apiClient } from './client';
import type {
  PublicHunterProfile,
  HunterListItem,
  HunterListParams,
  PaginatedResponse,
} from '@social-bounty/shared';

export const hunterApi = {
  getPublicProfile: (id: string): Promise<PublicHunterProfile> =>
    apiClient.get(`/hunters/${id}`),

  listHunters: (params: HunterListParams): Promise<PaginatedResponse<HunterListItem>> =>
    apiClient.get('/hunters', params as Record<string, unknown>),
};
