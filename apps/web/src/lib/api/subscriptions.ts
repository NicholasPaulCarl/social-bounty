import { apiClient } from './client';
import type {
  SubscriptionResponseDto,
  SubscribeRequest,
  SubscriptionPaymentDto,
  SubscriptionPaymentListParams,
  PaginationMeta,
} from '@social-bounty/shared';

export const subscriptionApi = {
  getSubscription: (): Promise<SubscriptionResponseDto> =>
    apiClient.get('/subscription'),

  subscribe: (data?: SubscribeRequest): Promise<SubscriptionResponseDto> =>
    apiClient.post('/subscription/subscribe', data),

  cancel: (): Promise<SubscriptionResponseDto> =>
    apiClient.post('/subscription/cancel'),

  reactivate: (): Promise<SubscriptionResponseDto> =>
    apiClient.post('/subscription/reactivate'),

  getPayments: (params?: SubscriptionPaymentListParams): Promise<{ data: SubscriptionPaymentDto[]; meta: PaginationMeta }> =>
    apiClient.get('/subscription/payments', params as Record<string, unknown>),
};
