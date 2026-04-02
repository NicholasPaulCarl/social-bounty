'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { inboxApi } from '@/lib/api/inbox';
import { userApi } from '@/lib/api/users';
import { queryKeys } from '@/lib/query-keys';
import type {
  NotificationListParams,
  ConversationListParams,
  CreateConversationRequest,
  SendMessageRequest,
  EditMessageRequest,
} from '@social-bounty/shared';

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.inbox.unreadCount(),
    queryFn: () => inboxApi.getUnreadCount(),
    staleTime: 30_000,
    refetchInterval: isAuthenticated ? 30_000 : false,
    enabled: isAuthenticated,
  });
}

export function useNotifications(params?: NotificationListParams) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.inbox.notifications(params ?? {}),
    queryFn: () => inboxApi.listNotifications(params),
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inboxApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.notificationsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.unreadCount() });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => inboxApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.notificationsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.unreadCount() });
    },
  });
}

export function useConversations(params?: ConversationListParams) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.inbox.conversations(params ?? {}),
    queryFn: () => inboxApi.listConversations(params),
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
}

export function useConversation(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.inbox.conversationDetail(id),
    queryFn: () => inboxApi.getConversation(id),
    enabled: isAuthenticated && !!id,
    staleTime: 30_000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConversationRequest) => inboxApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.conversationsAll() });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageRequest) => inboxApi.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.conversationDetail(conversationId) });
    },
  });
}

export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, data }: { messageId: string; data: EditMessageRequest }) =>
      inboxApi.editMessage(conversationId, messageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.conversationDetail(conversationId) });
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => inboxApi.deleteMessage(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.conversationDetail(conversationId) });
    },
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => userApi.searchUsers(query, 10),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}

export function useMarkConversationRead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => inboxApi.markConversationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.conversationsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inbox.unreadCount() });
    },
  });
}
