'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import {
  useNotifications,
  useMarkAllRead,
  useMarkNotificationRead,
  useConversations,
} from '@/hooks/useInbox';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { NewConversationDialog } from '@/components/features/inbox/NewConversationDialog';
import { NotificationType } from '@social-bounty/shared';
import type { NotificationResponse, ConversationListItem } from '@social-bounty/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function notificationIcon(type: NotificationType): { icon: string; color: string } {
  const map: Record<NotificationType, { icon: string; color: string }> = {
    [NotificationType.SUBMISSION_APPROVED]: { icon: 'pi-check-circle', color: 'text-success-600' },
    [NotificationType.SUBMISSION_REJECTED]: { icon: 'pi-times-circle', color: 'text-danger-600' },
    [NotificationType.SUBMISSION_NEEDS_MORE_INFO]: { icon: 'pi-info-circle', color: 'text-warning-600' },
    [NotificationType.SUBMISSION_RECEIVED]: { icon: 'pi-inbox', color: 'text-pink-600' },
    [NotificationType.APPLICATION_RECEIVED]: { icon: 'pi-user-plus', color: 'text-pink-600' },
    [NotificationType.APPLICATION_APPROVED]: { icon: 'pi-verified', color: 'text-success-600' },
    [NotificationType.APPLICATION_REJECTED]: { icon: 'pi-ban', color: 'text-danger-600' },
    [NotificationType.INVITATION_RECEIVED]: { icon: 'pi-envelope', color: 'text-blue-600' },
    [NotificationType.INVITATION_ACCEPTED]: { icon: 'pi-check', color: 'text-success-600' },
    [NotificationType.INVITATION_DECLINED]: { icon: 'pi-times', color: 'text-danger-600' },
    [NotificationType.BOUNTY_PUBLISHED]: { icon: 'pi-megaphone', color: 'text-pink-600' },
    [NotificationType.BOUNTY_CLOSED]: { icon: 'pi-lock', color: 'text-text-muted' },
    [NotificationType.NEW_MESSAGE]: { icon: 'pi-comment', color: 'text-blue-600' },
    [NotificationType.PAYOUT_STATUS_CHANGED]: { icon: 'pi-wallet', color: 'text-success-600' },
    [NotificationType.SYSTEM_ANNOUNCEMENT]: { icon: 'pi-bell', color: 'text-warning-600' },
    [NotificationType.SUBSCRIPTION_ACTIVATED]: { icon: 'pi-star', color: 'text-success-600' },
    [NotificationType.SUBSCRIPTION_CANCELLED]: { icon: 'pi-times', color: 'text-warning-600' },
    [NotificationType.SUBSCRIPTION_EXPIRING]: { icon: 'pi-clock', color: 'text-warning-600' },
    [NotificationType.SUBSCRIPTION_EXPIRED]: { icon: 'pi-ban', color: 'text-danger-600' },
    [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]: { icon: 'pi-exclamation-triangle', color: 'text-danger-600' },
    [NotificationType.SUBSCRIPTION_RENEWED]: { icon: 'pi-check-circle', color: 'text-success-600' },
  };
  return map[type] ?? { icon: 'pi-bell', color: 'text-text-muted' };
}

function participantInitials(participants: { firstName: string; lastName: string }[]): string {
  const first = participants[0];
  if (!first) return '??';
  return `${first.firstName[0] ?? ''}${first.lastName[0] ?? ''}`.toUpperCase();
}

function participantNames(participants: { firstName: string; lastName: string }[]): string {
  return participants.map((p) => `${p.firstName} ${p.lastName}`).join(', ') || 'Unknown';
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const router = useRouter();
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const notifications = data?.data ?? [];

  function handleClick(n: NotificationResponse) {
    if (!n.isRead) {
      markRead.mutate(n.id);
    }
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  }

  if (isLoading) return <LoadingState type="inline" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
        {notifications.some((n) => !n.isRead) && (
          <Button
            label="Mark all as read"
            icon="pi pi-check-square"
            size="small"
            text
            className="text-pink-600 hover:text-pink-600/80 text-sm"
            loading={markAll.isPending}
            onClick={() => markAll.mutate()}
          />
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-up">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-pink-600/10 mx-auto mb-4">
            <i className="pi pi-bell text-pink-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">All caught up</h3>
          <p className="text-text-muted text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-glass-border animate-fade-up">
          {notifications.map((n) => {
            const { icon, color } = notificationIcon(n.type);
            return (
              <button
                key={n.id}
                className="w-full flex items-start gap-4 px-5 py-4 hover:bg-elevated/40 transition-colors text-left"
                onClick={() => handleClick(n)}
              >
                {/* Unread indicator */}
                <div className="relative mt-0.5 shrink-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-elevated`}>
                    <i className={`pi ${icon} ${color} text-base`} />
                  </div>
                  {!n.isRead && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-danger-600 border-2 border-bg-surface" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-snug ${n.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-text-muted shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">{n.body}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab() {
  const router = useRouter();
  const { data, isLoading } = useConversations({ limit: 50 });
  const conversations = data?.data ?? [];

  if (isLoading) return <LoadingState type="inline" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>

      {conversations.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-up">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 mx-auto mb-4">
            <i className="pi pi-comments text-blue-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No conversations</h3>
          <p className="text-text-muted text-sm">Your message threads will appear here.</p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-glass-border animate-fade-up">
          {conversations.map((conv: ConversationListItem) => {
            const initials = participantInitials(conv.participants);
            const names = participantNames(conv.participants);
            return (
              <button
                key={conv.id}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-elevated/40 transition-colors text-left"
                onClick={() => router.push(`/inbox/conversations/${conv.id}`)}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    {initials}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-danger-600 text-white text-[10px] font-bold leading-none px-1">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {names}
                    </p>
                    <span className="text-xs text-text-muted shrink-0">
                      {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : timeAgo(conv.createdAt)}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-text-secondary font-medium' : 'text-text-muted'}`}>
                    {conv.subject}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs text-text-muted truncate mt-0.5">{conv.lastMessage}</p>
                  )}
                </div>

                <i className="pi pi-chevron-right text-xs text-text-muted shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [showNewConversation, setShowNewConversation] = useState(false);

  const handleConversationCreated = (conversationId: string) => {
    setShowNewConversation(false);
    setActiveTab('messages');
    router.push(`/inbox/conversations/${conversationId}`);
  };

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle="Notifications and messages"
        actions={
          <Button
            label="New Message"
            icon="pi pi-plus"
            onClick={() => setShowNewConversation(true)}
          />
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-card mb-6 animate-fade-up" style={{ borderRadius: '12px' }}>
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'notifications'
              ? 'bg-pink-600/15 text-pink-600 shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
            }`}
          onClick={() => setActiveTab('notifications')}
        >
          <i className="pi pi-bell text-sm" />
          Notifications
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'messages'
              ? 'bg-blue-600/15 text-blue-600 shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
            }`}
          onClick={() => setActiveTab('messages')}
        >
          <i className="pi pi-comments text-sm" />
          Messages
        </button>
      </div>

      {activeTab === 'notifications' ? <NotificationsTab /> : <MessagesTab />}

      <NewConversationDialog
        visible={showNewConversation}
        onHide={() => setShowNewConversation(false)}
        onCreated={handleConversationCreated}
      />
    </>
  );
}
