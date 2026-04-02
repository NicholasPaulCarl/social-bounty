import { NotificationType, ConversationContext } from '../enums';
import type { PaginationMeta } from '../common';

// ─── Notifications ───────────────────

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType: string | null;
  referenceId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}

export interface PaginatedNotifications {
  data: NotificationResponse[];
  meta: PaginationMeta;
}

export interface UnreadCountResponse {
  notifications: number;
  messages: number;
  total: number;
}

// ─── Conversations ───────────────────

export interface CreateConversationRequest {
  context: ConversationContext;
  referenceType?: string;
  referenceId?: string;
  subject: string;
  initialMessage: string;
  participantIds: string[];
}

export interface SendMessageRequest {
  body: string;
}

export interface EditMessageRequest {
  body: string;
}

export interface ConversationListItem {
  id: string;
  subject: string;
  context: ConversationContext;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  participants: { id: string; firstName: string; lastName: string }[];
  createdAt: string;
}

export interface ConversationDetailResponse {
  id: string;
  subject: string;
  context: ConversationContext;
  referenceType: string | null;
  referenceId: string | null;
  participants: { id: string; firstName: string; lastName: string; role: string }[];
  messages: InboxMessageResponse[];
  createdAt: string;
}

export interface InboxMessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  isSystemMessage: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface ConversationListParams {
  page?: number;
  limit?: number;
}
