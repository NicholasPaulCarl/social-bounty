import { apiClient } from './client';
import type {
  SubscriptionResponseDto,
  SubscribeRequest,
  SubscriptionPaymentDto,
  SubscriptionPaymentListParams,
  PaginationMeta,
} from '@social-bounty/shared';
import { SubscriptionTier } from '@social-bounty/shared';

export interface InitiateUpgradeResponse {
  /** Hosted Stitch URL — redirect the browser here for card-consent capture. */
  authorizationUrl: string;
  /** Our internal mandate id, for debugging / support lookups. */
  mandateId: string;
  status: 'PENDING' | 'AUTHORISED' | 'UNAUTHORISED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
}

export const subscriptionApi = {
  getSubscription: (): Promise<SubscriptionResponseDto> =>
    apiClient.get('/subscription'),

  subscribe: (data?: SubscribeRequest): Promise<SubscriptionResponseDto> =>
    apiClient.post('/subscription/subscribe', data),

  upgrade: (targetTier: SubscriptionTier = SubscriptionTier.PRO): Promise<InitiateUpgradeResponse> =>
    apiClient.post('/subscription/upgrade', { targetTier }),

  cancel: (): Promise<SubscriptionResponseDto> =>
    apiClient.post('/subscription/cancel'),

  reactivate: (): Promise<SubscriptionResponseDto> =>
    apiClient.post('/subscription/reactivate'),

  getPayments: (params?: SubscriptionPaymentListParams): Promise<{ data: SubscriptionPaymentDto[]; meta: PaginationMeta }> =>
    apiClient.get('/subscription/payments', params as Record<string, unknown>),
};
