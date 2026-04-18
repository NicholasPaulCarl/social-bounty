'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Inbox as InboxIcon,
  Info,
  Lock,
  Mail,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Plus,
  Star,
  UserPlus,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

// NEW_MESSAGE was blue in the legacy config — swapped to slate since
// blue is reserved for gradient/.info per DS §Non-negotiables.
// INVITATION_RECEIVED same swap (was blue → now pink = brand) since
// this is a high-priority actionable invite.
function notificationIcon(type: NotificationType): { Icon: LucideIcon; color: string } {
  const map: Record<NotificationType, { Icon: LucideIcon; color: string }> = {
    [NotificationType.SUBMISSION_APPROVED]: { Icon: CheckCircle2, color: 'text-success-600' },
    [NotificationType.SUBMISSION_REJECTED]: { Icon: XCircle, color: 'text-danger-600' },
    [NotificationType.SUBMISSION_NEEDS_MORE_INFO]: { Icon: Info, color: 'text-warning-600' },
    [NotificationType.SUBMISSION_RECEIVED]: { Icon: InboxIcon, color: 'text-pink-600' },
    [NotificationType.APPLICATION_RECEIVED]: { Icon: UserPlus, color: 'text-pink-600' },
    [NotificationType.APPLICATION_APPROVED]: { Icon: BadgeCheck, color: 'text-success-600' },
    [NotificationType.APPLICATION_REJECTED]: { Icon: Ban, color: 'text-danger-600' },
    [NotificationType.INVITATION_RECEIVED]: { Icon: Mail, color: 'text-pink-600' },
    [NotificationType.INVITATION_ACCEPTED]: { Icon: Check, color: 'text-success-600' },
    [NotificationType.INVITATION_DECLINED]: { Icon: X, color: 'text-danger-600' },
    [NotificationType.BOUNTY_PUBLISHED]: { Icon: Megaphone, color: 'text-pink-600' },
    [NotificationType.BOUNTY_CLOSED]: { Icon: Lock, color: 'text-text-muted' },
    [NotificationType.NEW_MESSAGE]: { Icon: MessageSquare, color: 'text-slate-600' },
    [NotificationType.PAYOUT_STATUS_CHANGED]: { Icon: Wallet, color: 'text-success-600' },
    [NotificationType.SYSTEM_ANNOUNCEMENT]: { Icon: Bell, color: 'text-warning-600' },
    [NotificationType.SUBSCRIPTION_ACTIVATED]: { Icon: Star, color: 'text-success-600' },
    [NotificationType.SUBSCRIPTION_CANCELLED]: { Icon: X, color: 'text-warning-600' },
    [NotificationType.SUBSCRIPTION_EXPIRING]: { Icon: Clock, color: 'text-warning-600' },
    [NotificationType.SUBSCRIPTION_EXPIRED]: { Icon: Ban, color: 'text-danger-600' },
    [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]: { Icon: AlertTriangle, color: 'text-danger-600' },
    [NotificationType.SUBSCRIPTION_RENEWED]: { Icon: CheckCircle2, color: 'text-success-600' },
  };
  return map[type] ?? { Icon: Bell, color: 'text-text-muted' };
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
        <p className="text-sm text-text-muted"><span className="font-mono tabular-nums">{notifications.length}</span> notification{notifications.length !== 1 ? 's' : ''}</p>
        {notifications.some((n) => !n.isRead) && (
          <Button
            label="Mark all read"
            icon={<CheckSquare size={14} strokeWidth={2} />}
            size="small"
            text
            className="text-pink-600 hover:text-pink-700 text-sm"
            loading={markAll.isPending}
            onClick={() => markAll.mutate()}
          />
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-up">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-pink-600/10 mx-auto mb-4">
            <Bell size={24} strokeWidth={2} className="text-pink-600" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">All caught up</h3>
          <p className="text-text-muted text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-glass-border animate-fade-up">
          {notifications.map((n) => {
            const { Icon, color } = notificationIcon(n.type);
            return (
              <button
                key={n.id}
                className="w-full flex items-start gap-4 px-5 py-4 hover:bg-elevated/40 transition-colors text-left"
                onClick={() => handleClick(n)}
              >
                {/* Unread indicator */}
                <div className="relative mt-0.5 shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-elevated">
                    <Icon size={20} strokeWidth={2} className={color} />
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
      <p className="text-sm text-text-muted"><span className="font-mono tabular-nums">{conversations.length}</span> conversation{conversations.length !== 1 ? 's' : ''}</p>

      {conversations.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-up">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4">
            <MessagesSquare size={24} strokeWidth={2} className="text-slate-600" />
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
                  <div className="w-10 h-10 rounded-full bg-pink-600/15 text-pink-600 flex items-center justify-center text-sm font-semibold">
                    {initials}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-danger-600 text-white text-[10px] font-bold leading-none px-1 font-mono tabular-nums">
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

                <ChevronRight size={14} strokeWidth={2} className="text-text-muted shrink-0" />
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
            label="New message"
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => setShowNewConversation(true)}
          />
        }
      />

      {/* Tabs — active state uses pink (brand) for both; inactive uses slate.
          Standalone-blue removal: Messages active was text-blue-600; swapped
          to pink-600 to match Notifications. */}
      <div className="flex gap-1 p-1 glass-card mb-6 animate-fade-up" style={{ borderRadius: '12px' }}>
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'notifications'
              ? 'bg-pink-600/15 text-pink-600 shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
            }`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={14} strokeWidth={2} />
          Notifications
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'messages'
              ? 'bg-pink-600/15 text-pink-600 shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
            }`}
          onClick={() => setActiveTab('messages')}
        >
          <MessagesSquare size={14} strokeWidth={2} />
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
