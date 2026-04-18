'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { User, Link2, Image as ImageIcon, File, ExternalLink, AlertTriangle, Send } from 'lucide-react';
import { useDispute, useSendDisputeMessage, useEscalateDispute } from '@/hooks/useDisputes';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatDateTime, formatEnumLabel } from '@/lib/utils/format';
import { DisputeCategory, DisputeMessageType, EvidenceType } from '@social-bounty/shared';
import type { DisputeDetailResponse, DisputeMessageResponse, DisputeEvidenceResponse } from '@social-bounty/shared';
import { DISPUTE_CATEGORY_COLORS } from '@/lib/constants/disputes';

const categoryColors: Record<string, string> = {
  NON_PAYMENT: 'bg-danger-600/10 text-danger-600 border border-danger-600/30',
  POST_QUALITY: 'bg-warning-600/10 text-warning-600 border border-warning-600/30',
  POST_NON_COMPLIANCE: 'bg-pink-100 text-pink-600 border border-pink-200',
};

function MessageBubble({ message }: { message: DisputeMessageResponse }) {
  const isSystem = message.messageType === DisputeMessageType.SYSTEM;
  const isUser = message.messageType === DisputeMessageType.COMMENT || message.messageType === DisputeMessageType.EVIDENCE;

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 rounded-full text-xs text-text-muted border border-glass-border bg-elevated">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
        <User size={14} strokeWidth={2} />
      </div>
      <div className={`flex-1 max-w-[90%] sm:max-w-[80%] ${isUser ? '' : 'items-end flex flex-col'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text-primary">{message.authorName}</span>
          <span className="text-xs text-text-muted font-mono tabular-nums">{formatDateTime(message.createdAt)}</span>
        </div>
        <div className={`glass-card p-3 rounded-xl ${isUser ? 'border-l-2 border-slate-300' : 'border-l-2 border-pink-600/40'}`}>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

function EvidenceCard({ evidence }: { evidence: DisputeEvidenceResponse }) {
  const isImage = evidence.mimeType?.startsWith('image/');
  const isLink = evidence.evidenceType === EvidenceType.LINK;

  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
        {isLink ? <Link2 size={18} strokeWidth={2} /> : isImage ? <ImageIcon size={18} strokeWidth={2} /> : <File size={18} strokeWidth={2} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {evidence.fileName || evidence.url || 'Evidence file'}
        </p>
        {evidence.description && (
          <p className="text-xs text-text-muted mt-0.5">{evidence.description}</p>
        )}
        <p className="text-xs text-text-muted mt-1">
          Uploaded by {evidence.uploadedBy.firstName} {evidence.uploadedBy.lastName} · {formatDate(evidence.createdAt)}
        </p>
      </div>
      {(evidence.fileUrl || evidence.url) && (
        <a
          href={evidence.fileUrl || evidence.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-700 transition-colors"
        >
          <ExternalLink size={14} strokeWidth={2} />
        </a>
      )}
    </div>
  );
}

export default function BusinessDisputeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: dispute, isLoading, error, refetch } = useDispute(id);
  const sendMessage = useSendDisputeMessage(id);
  const escalate = useEscalateDispute(id);

  const [replyText, setReplyText] = useState('');
  const [showEscalate, setShowEscalate] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!dispute) return null;

  const d = dispute as DisputeDetailResponse;

  const breadcrumbs = [
    { label: 'Disputes', url: '/business/disputes' },
    { label: d.disputeNumber },
  ];

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    sendMessage.mutate(
      { content: replyText.trim() },
      {
        onSuccess: () => {
          toast.showSuccess('Response sent');
          setReplyText('');
          refetch();
        },
        onError: () => toast.showError('Couldn\'t send response. Try again.'),
      },
    );
  };

  const handleEscalate = (reason?: string) => {
    escalate.mutate(
      { reason: reason ?? '' },
      {
        onSuccess: () => {
          toast.showSuccess('Bumped to our team for review.');
          setShowEscalate(false);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t escalate dispute. Try again.'),
      },
    );
  };

  const visibleMessages = d.messages.filter(
    (m) => m.messageType !== DisputeMessageType.INTERNAL_NOTE,
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={d.disputeNumber}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            <Button
              label="Escalate"
              icon={<AlertTriangle size={16} strokeWidth={2} />}
              severity="warning"
              outlined
              onClick={() => setShowEscalate(true)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Dispute Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tag
                  value={formatEnumLabel(d.category)}
                  className={`text-xs ${categoryColors[d.category] ?? 'bg-elevated text-text-muted border border-glass-border'}`}
                />
                <Tag
                  value={formatEnumLabel(d.reason)}
                  className="text-xs bg-elevated text-text-muted border border-glass-border"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{d.description}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Desired Outcome</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{d.desiredOutcome}</p>
              </div>
            </div>
          </div>

          {/* Message thread */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Messages</h3>
            {visibleMessages.length > 0 ? (
              <div className="space-y-4">
                {visibleMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No messages yet.</p>
            )}

            {/* Reply form */}
            <div className="mt-6 pt-6 border-t border-glass-border space-y-3">
              <label className="text-sm font-medium text-text-secondary">Send a Response</label>
              <InputTextarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Type your response..."
                className="w-full"
                aria-label="Type your response"
              />
              <div className="flex justify-end">
                <Button
                  label="Send response"
                  icon={<Send size={16} strokeWidth={2} />}
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  loading={sendMessage.isPending}
                />
              </div>
            </div>
          </div>

          {/* Evidence */}
          {d.evidence.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Evidence</h3>
              <div className="space-y-3">
                {d.evidence.map((ev) => (
                  <EvidenceCard key={ev.id} evidence={ev} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="glass-card p-6">
            <h3 className="text-base font-heading font-semibold text-text-primary mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1">Current Status</p>
                <StatusBadge type="dispute" value={d.status} size="large" />
              </div>
              <div className="border-t border-glass-border pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Opened</span>
                  <span className="text-text-secondary">{formatDate(d.createdAt)}</span>
                </div>
                {d.escalatedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Escalated</span>
                    <span className="text-danger-600">{formatDate(d.escalatedAt)}</span>
                  </div>
                )}
                {d.resolvedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Resolved</span>
                    <span className="text-success-600">{formatDate(d.resolvedAt)}</span>
                  </div>
                )}
                {d.responseDeadline && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Response deadline</span>
                    <span className="text-warning-600">{formatDate(d.responseDeadline)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submission summary */}
          <div className="glass-card p-6">
            <h3 className="text-base font-heading font-semibold text-text-primary mb-4">Submission</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1">Bounty</p>
                <p
                  className="text-sm font-medium text-pink-600 hover:text-pink-600/70 cursor-pointer"
                  onClick={() => router.push(`/business/bounties/${d.submission.bountyId}`)}
                >
                  {d.submission.bountyTitle}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Filed By</p>
                <p className="text-sm text-text-secondary">
                  {d.openedBy.firstName} {d.openedBy.lastName}
                </p>
              </div>
              <Button
                label="View submission"
                icon={<ExternalLink size={14} strokeWidth={2} />}
                size="small"
                outlined
                severity="secondary"
                className="w-full mt-2"
                onClick={() => router.push(`/business/review-center/${d.submission.id}`)}
              />
            </div>
          </div>

          {/* Resolution */}
          {d.resolutionType && (
            <div className="glass-card p-6 border border-success-600/20">
              <h3 className="text-base font-heading font-semibold text-success-600 mb-3">Resolution</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-text-muted mb-1">Resolution Type</p>
                  <p className="text-sm font-medium text-text-primary">{formatEnumLabel(d.resolutionType)}</p>
                </div>
                {d.resolutionSummary && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Summary</p>
                    <p className="text-sm text-text-secondary">{d.resolutionSummary}</p>
                  </div>
                )}
                {d.resolvedBy && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Resolved By</p>
                    <p className="text-sm text-text-secondary">{d.resolvedBy.firstName} {d.resolvedBy.lastName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmAction
        visible={showEscalate}
        onHide={() => setShowEscalate(false)}
        title="Escalate Dispute"
        message="This will escalate the dispute to a super admin for review. Please provide the reason for escalation."
        confirmLabel="Escalate"
        confirmSeverity="warning"
        onConfirm={handleEscalate}
        requireReason
        reasonMinLength={10}
        loading={escalate.isPending}
      />
    </div>
  );
}
