import { apiClient } from './client';
import type {
  UnreadCountResponse,
  NotificationResponse,
  NotificationListParams,
  PaginatedNotifications,
  ConversationListItem,
  ConversationListParams,
  ConversationDetailResponse,
  CreateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
  InboxMessageResponse,
} from '@social-bounty/shared';

export const inboxApi = {
  getUnreadCount: (): Promise<UnreadCountResponse> =>
    apiClient.get('/inbox/unread-count'),

  listNotifications: (params?: NotificationListParams): Promise<PaginatedNotifications> =>
    apiClient.get('/notifications', params as Record<string, unknown>),

  markNotificationRead: (id: string): Promise<NotificationResponse> =>
    apiClient.post(`/notifications/${id}/read`),

  markAllRead: (): Promise<void> =>
    apiClient.post('/notifications/read-all'),

  listConversations: (params?: ConversationListParams): Promise<{ data: ConversationListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> =>
    apiClient.get('/conversations', params as Record<string, unknown>),

  createConversation: (data: CreateConversationRequest): Promise<ConversationDetailResponse> =>
    apiClient.post('/conversations', data),

  getConversation: (id: string): Promise<ConversationDetailResponse> =>
    apiClient.get(`/conversations/${id}`),

  sendMessage: (conversationId: string, data: SendMessageRequest): Promise<InboxMessageResponse> =>
    apiClient.post(`/conversations/${conversationId}/messages`, data),

  editMessage: (conversationId: string, messageId: string, data: EditMessageRequest): Promise<InboxMessageResponse> =>
    apiClient.put(`/conversations/${conversationId}/messages/${messageId}`, data),

  deleteMessage: (conversationId: string, messageId: string): Promise<void> =>
    apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`),

  markConversationRead: (id: string): Promise<void> =>
    apiClient.post(`/conversations/${id}/read`),
};
