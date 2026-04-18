'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useConversation, useSendMessage, useMarkConversationRead } from '@/hooks/useInbox';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import type { InboxMessageResponse } from '@social-bounty/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function senderInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine }: { msg: InboxMessageResponse; isMine: boolean }) {
  if (msg.isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-elevated border border-glass-border">
          <i className="pi pi-info-circle text-xs text-text-muted" />
          <span className="text-xs text-text-muted italic">{msg.body}</span>
        </div>
      </div>
    );
  }

  if (msg.deletedAt) {
    return (
      <div className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center shrink-0 opacity-40">
          <i className="pi pi-user text-xs text-text-muted" />
        </div>
        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs italic text-text-muted bg-elevated border border-glass-border ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mb-0.5
        ${isMine ? 'bg-pink-600/20 text-pink-600' : 'bg-blue-600/20 text-blue-600'}`}>
        {senderInitials(msg.senderName)}
      </div>

      <div className={`max-w-[70%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Name + time */}
        <div className={`flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium text-text-secondary">{msg.senderName}</span>
          <span className="text-[10px] text-text-muted">{timeAgo(msg.createdAt)}</span>
          {msg.editedAt && <span className="text-[10px] text-text-muted">(edited)</span>}
        </div>

        {/* Bubble */}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isMine
            ? 'bg-pink-600/15 text-text-primary border border-pink-600/20 rounded-br-sm'
            : 'bg-elevated text-text-primary border border-glass-border rounded-bl-sm'
          }`}>
          {msg.body}
        </div>

        {/* Attachment */}
        {msg.attachmentUrl && (
          <a
            href={msg.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-pink-600 hover:text-pink-600/80 transition-colors px-1"
          >
            <i className="pi pi-paperclip" />
            {msg.attachmentName ?? 'Attachment'}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useConversation(id);
  const sendMessage = useSendMessage(id);
  const markRead = useMarkConversationRead(id);

  const [body, setBody] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mark as read on mount. `markRead` is a useMutation result that
  // re-identifies on every render; depending on it would fire the
  // effect on every render. We only want to mark read when the
  // conversation id changes.
  useEffect(() => {
    if (id) {
      markRead.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate(
      { body: trimmed },
      {
        onSuccess: () => {
          setBody('');
          textareaRef.current?.focus();
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (isLoading) return <LoadingState type="page" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const participantNames = data.participants
    .map((p) => `${p.firstName} ${p.lastName}`)
    .join(', ');

  const contextLabel = data.context.charAt(0) + data.context.slice(1).toLowerCase();

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[900px]">
      {/* Header */}
      <div className="glass-card px-5 py-4 mb-4 animate-fade-up shrink-0">
        <div className="flex items-start gap-3">
          <button
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors shrink-0 mt-0.5"
            onClick={() => router.push('/inbox')}
            aria-label="Back to inbox"
          >
            <i className="pi pi-arrow-left text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-text-primary truncate">{data.subject}</h1>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
              <span className="text-xs text-text-muted flex items-center gap-1">
                <i className="pi pi-users text-[10px]" />
                {participantNames}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-600/10 text-pink-600 border border-pink-600/20">
                {contextLabel}
              </span>
              {data.referenceId && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <i className="pi pi-link text-[10px]" />
                  Ref: {data.referenceId.slice(0, 8)}…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card mb-4 overflow-y-auto p-5 space-y-4 animate-fade-up">
        {data.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <i className="pi pi-comments text-text-muted text-3xl mb-3" />
            <p className="text-text-muted text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          data.messages.map((msg: InboxMessageResponse) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-card px-4 py-3 animate-fade-up shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 bg-elevated border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-pink-600/50 transition-colors leading-relaxed"
          />
          <Button
            icon="pi pi-send"
            rounded
            disabled={!body.trim() || sendMessage.isPending}
            loading={sendMessage.isPending}
            className="bg-pink-600 border-pink-600 text-background hover:bg-pink-600/90 shrink-0 mb-0.5"
            onClick={handleSend}
            aria-label="Send message"
          />
        </div>
        <p className="text-[10px] text-text-muted mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
