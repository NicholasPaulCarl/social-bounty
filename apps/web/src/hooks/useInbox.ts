'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboxApi } from '@/lib/api/inbox';
import { queryKeys } from '@/lib/query-keys';
import type {
  NotificationListParams,
  ConversationListParams,
  CreateConversationRequest,
  SendMessageRequest,
} from '@social-bounty/shared';

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.inbox.unreadCount(),
    queryFn: () => inboxApi.getUnreadCount(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: queryKeys.inbox.notifications(params ?? {}),
    queryFn: () => inboxApi.listNotifications(params),
    staleTime: 30_000,
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
  return useQuery({
    queryKey: queryKeys.inbox.conversations(params ?? {}),
    queryFn: () => inboxApi.listConversations(params),
    staleTime: 30_000,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.inbox.conversationDetail(id),
    queryFn: () => inboxApi.getConversation(id),
    enabled: !!id,
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
