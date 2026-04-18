'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import {
  AlertTriangle,
  File,
  Info,
  Link2,
  Paperclip,
  Send,
  Undo2,
} from 'lucide-react';
import { useDispute, useWithdrawDispute, useEscalateDispute, useSendDisputeMessage } from '@/hooks/useDisputes';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate, formatDateTime, formatEnumLabel } from '@/lib/utils/format';
import { DisputeStatus, DisputeMessageType } from '@social-bounty/shared';
import type { DisputeMessageResponse, DisputeStatusHistoryResponse, DisputeEvidenceResponse } from '@social-bounty/shared';

const WITHDRAWABLE_STATUSES: DisputeStatus[] = [DisputeStatus.DRAFT, DisputeStatus.OPEN];
const ESCALATABLE_STATUSES: DisputeStatus[] = [
  DisputeStatus.OPEN,
  DisputeStatus.UNDER_REVIEW,
  DisputeStatus.AWAITING_RESPONSE,
];

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const { data: dispute, isLoading, error, refetch } = useDispute(id);

  const [messageContent, setMessageContent] = useState('');
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');

  const sendMessage = useSendDisputeMessage(id);
  const escalate = useEscalateDispute(id);
  const withdraw = useWithdrawDispute(id);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!dispute) return <ErrorState error={new Error('Dispute not found')} />;

  const canWithdraw = WITHDRAWABLE_STATUSES.includes(dispute.status);
  const canEscalate = ESCALATABLE_STATUSES.includes(dispute.status);
  const isClosed =
    dispute.status === DisputeStatus.RESOLVED ||
    dispute.status === DisputeStatus.CLOSED ||
    dispute.status === DisputeStatus.WITHDRAWN;

  const breadcrumbs = [
    { label: 'My disputes', url: '/my-disputes' },
    { label: dispute.disputeNumber },
  ];

  function handleSendMessage() {
    if (!messageContent.trim()) return;
    sendMessage.mutate(
      { content: messageContent.trim() },
      {
        onSuccess: () => {
          setMessageContent('');
          showSuccess('Message sent');
        },
        onError: () => showError('Couldn\'t send message. Try again.'),
      },
    );
  }

  function handleEscalate() {
    if (!escalateReason.trim()) return;
    escalate.mutate(
      { reason: escalateReason.trim() },
      {
        onSuccess: () => {
          setEscalateDialogOpen(false);
          setEscalateReason('');
          showSuccess('Bumped to our team for review.');
        },
        onError: () => showError('Couldn\'t escalate dispute. Try again.'),
      },
    );
  }

  function handleWithdraw() {
    withdraw.mutate(
      withdrawReason.trim() ? { reason: withdrawReason.trim() } : undefined,
      {
        onSuccess: () => {
          setWithdrawDialogOpen(false);
          showSuccess('Dispute withdrawn. Case closed.');
          router.push('/my-disputes');
        },
        onError: () => showError('Couldn\'t withdraw dispute. Try again.'),
      },
    );
  }

  return (
    <>
      <PageHeader
        title={dispute.disputeNumber}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex gap-2">
            {canEscalate && (
              <Button
                label="Escalate"
                icon={<AlertTriangle size={14} strokeWidth={2} />}
                severity="warning"
                outlined
                size="small"
                onClick={() => setEscalateDialogOpen(true)}
              />
            )}
            {canWithdraw && (
              <Button
                label="Withdraw"
                icon={<Undo2 size={14} strokeWidth={2} />}
                severity="danger"
                outlined
                size="small"
                onClick={() => setWithdrawDialogOpen(true)}
              />
            )}
          </div>
        }
      />

      <div className="space-y-6 animate-fade-up">
        {/* Header Meta */}
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge type="dispute" value={dispute.status} />
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {formatEnumLabel(dispute.category)}
          </span>
          <span className="text-text-muted text-sm">
            Reason: <span className="text-text-secondary">{formatEnumLabel(dispute.reason)}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-primary mb-4">Dispute details</h3>

              <div className="space-y-4">
                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">Description</p>
                  <p className="text-text-secondary whitespace-pre-wrap leading-relaxed mt-0.5">{dispute.description}</p>
                </div>

                <Divider className="my-3" />

                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">Desired outcome</p>
                  <p className="text-text-secondary whitespace-pre-wrap leading-relaxed mt-0.5">{dispute.desiredOutcome}</p>
                </div>

                {dispute.submission && (
                  <>
                    <Divider className="my-3" />
                    <div>
                      <p className="eyebrow !text-text-muted !text-[11px]">Related submission</p>
                      <p className="text-text-primary font-medium mt-0.5">{dispute.submission.bountyTitle}</p>
                      <p className="text-text-muted text-sm mt-0.5">
                        Submission status:{' '}
                        <StatusBadge type="submission" value={dispute.submission.status} size="small" />
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Message Thread */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-primary mb-4">Messages</h3>

              {dispute.messages.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-6">No messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {dispute.messages.map((msg: DisputeMessageResponse) => {
                    const isSystem = msg.messageType === DisputeMessageType.SYSTEM;
                    const isInternal = msg.isInternal;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="px-4 py-2 rounded-full bg-elevated border border-glass-border text-text-muted text-xs inline-flex items-center gap-1.5">
                            <Info size={12} strokeWidth={2} />
                            <span>{msg.content}</span>
                            <span className="ml-2 opacity-60">{formatDate(msg.createdAt)}</span>
                          </div>
                        </div>
                      );
                    }

                    const isMine = msg.authorRole === 'PARTICIPANT';

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-3 ${
                            isInternal
                              ? 'bg-warning-600/10 border border-warning-600/20'
                              : isMine
                                ? 'bg-pink-600/10 border border-pink-600/20'
                                : 'bg-elevated border border-glass-border'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-xs font-medium ${isMine ? 'text-pink-600' : 'text-text-secondary'}`}>
                              {msg.authorName}
                            </span>
                            {isInternal && (
                              <span className="text-xs text-warning-600 bg-warning-600/10 px-1.5 py-0.5 rounded">
                                Internal
                              </span>
                            )}
                            <span className="text-xs text-text-muted ml-auto">{formatDateTime(msg.createdAt)}</span>
                          </div>
                          <p className="text-text-primary text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isClosed && (
                <div className="mt-4 pt-4 border-t border-glass-border">
                  <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
                    Send a message
                  </label>
                  <InputTextarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={3}
                    placeholder="Type your message..."
                    className="w-full"
                    autoResize
                    aria-label="Type your response"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      label="Send"
                      icon={<Send size={14} strokeWidth={2} />}
                      size="small"
                      className="bg-pink-600 border-pink-600 text-background hover:bg-pink-700"
                      disabled={!messageContent.trim() || sendMessage.isPending}
                      loading={sendMessage.isPending}
                      onClick={handleSendMessage}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Evidence */}
            {dispute.evidence && dispute.evidence.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-text-primary mb-4">Evidence</h3>
                <div className="space-y-3">
                  {dispute.evidence.map((ev: DisputeEvidenceResponse) => {
                    const isFile =
                      ev.evidenceType === 'SCREENSHOT' || ev.evidenceType === 'DOCUMENT';
                    const isLink = ev.evidenceType === 'LINK';
                    const EvidenceIcon = isFile ? File : isLink ? Link2 : Paperclip;
                    const iconColor = isFile
                      ? 'text-slate-600'
                      : isLink
                        ? 'text-pink-600'
                        : 'text-text-muted';
                    return (
                      <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-elevated border border-glass-border">
                        <EvidenceIcon size={16} strokeWidth={2} className={`mt-0.5 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                              {formatEnumLabel(ev.evidenceType)}
                            </span>
                            <span className="text-xs text-text-muted">
                              by {ev.uploadedBy.firstName} {ev.uploadedBy.lastName}
                            </span>
                          </div>
                          {ev.fileName && (
                            <p className="text-sm text-text-primary mt-1 truncate">{ev.fileName}</p>
                          )}
                          {ev.url && (
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-pink-600 hover:underline truncate block mt-1"
                            >
                              {ev.url}
                            </a>
                          )}
                          {ev.description && (
                            <p className="text-xs text-text-muted mt-1">{ev.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Metadata */}
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-text-primary mb-4">Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="eyebrow !text-text-muted !text-[11px]">Filed</p>
                  <p className="text-sm text-text-primary mt-0.5">{formatDate(dispute.createdAt)}</p>
                </div>
                {dispute.responseDeadline && (
                  <div>
                    <p className="eyebrow !text-text-muted !text-[11px]">Response deadline</p>
                    <p className="text-sm text-warning-600 mt-0.5">{formatDate(dispute.responseDeadline)}</p>
                  </div>
                )}
                {dispute.escalatedAt && (
                  <div>
                    <p className="eyebrow !text-text-muted !text-[11px]">Escalated</p>
                    <p className="text-sm text-danger-600 mt-0.5">{formatDate(dispute.escalatedAt)}</p>
                  </div>
                )}
                {dispute.resolvedAt && (
                  <div>
                    <p className="eyebrow !text-text-muted !text-[11px]">Resolved</p>
                    <p className="text-sm text-success-600 mt-0.5">{formatDate(dispute.resolvedAt)}</p>
                  </div>
                )}
                {dispute.resolutionType && (
                  <div>
                    <p className="eyebrow !text-text-muted !text-[11px]">Resolution</p>
                    <p className="text-sm text-text-primary mt-0.5">{formatEnumLabel(dispute.resolutionType)}</p>
                  </div>
                )}
                {dispute.resolutionSummary && (
                  <div>
                    <p className="eyebrow !text-text-muted !text-[11px]">Summary</p>
                    <p className="text-sm text-text-secondary mt-0.5">{dispute.resolutionSummary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status History */}
            {dispute.statusHistory && dispute.statusHistory.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-text-primary mb-4">Status history</h3>
                <div className="space-y-4">
                  {dispute.statusHistory.map((entry: DisputeStatusHistoryResponse, idx: number) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-pink-600 mt-1.5 shrink-0" />
                        {idx < dispute.statusHistory.length - 1 && (
                          <div className="w-px flex-1 bg-glass-border mt-1" />
                        )}
                      </div>
                      <div className="pb-4 last:pb-0">
                        <StatusBadge type="dispute" value={entry.toStatus} size="small" />
                        <p className="text-xs text-text-muted mt-1">{formatDate(entry.createdAt)}</p>
                        {entry.note && (
                          <p className="text-xs text-text-secondary mt-1 italic">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escalate Dialog */}
      <Dialog
        header="Escalate dispute"
        visible={escalateDialogOpen}
        onHide={() => setEscalateDialogOpen(false)}
        className="w-full max-w-md"
        modal
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Escalating flags this dispute for urgent admin review.
          </p>
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Reason for escalation
            </label>
            <InputTextarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Describe why this dispute needs urgent attention..."
              autoResize
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              label="Cancel"
              outlined
              size="small"
              onClick={() => setEscalateDialogOpen(false)}
            />
            <Button
              label="Escalate"
              icon={<AlertTriangle size={14} strokeWidth={2} />}
              severity="warning"
              size="small"
              disabled={!escalateReason.trim() || escalate.isPending}
              loading={escalate.isPending}
              onClick={handleEscalate}
            />
          </div>
        </div>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog
        header="Withdraw dispute"
        visible={withdrawDialogOpen}
        onHide={() => setWithdrawDialogOpen(false)}
        className="w-full max-w-md"
        modal
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Withdrawing closes this dispute. This can&apos;t be undone.
          </p>
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Reason (optional)
            </label>
            <InputText
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              className="w-full"
              placeholder="Why are you withdrawing this dispute?"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              label="Cancel"
              outlined
              size="small"
              onClick={() => setWithdrawDialogOpen(false)}
            />
            <Button
              label="Withdraw"
              icon={<Undo2 size={14} strokeWidth={2} />}
              severity="danger"
              size="small"
              disabled={withdraw.isPending}
              loading={withdraw.isPending}
              onClick={handleWithdraw}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
