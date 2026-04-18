'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import {
  useDispute,
  useSendDisputeMessage,
  useEscalateDispute,
  useAdminTransitionDispute,
  useAdminAssignDispute,
  useAdminResolveDispute,
} from '@/hooks/useDisputes';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { formatDate, formatDateTime, formatEnumLabel } from '@/lib/utils/format';
import {
  DisputeStatus,
  DisputeCategory,
  DisputeResolution,
  DisputeMessageType,
  EvidenceType,
  UserRole,
} from '@social-bounty/shared';
import type {
  DisputeDetailResponse,
  DisputeMessageResponse,
  DisputeEvidenceResponse,
  DisputeStatusHistoryResponse,
} from '@social-bounty/shared';
import { DISPUTE_CATEGORY_COLORS } from '@/lib/constants/disputes';

const categoryColors: Record<string, string> = {
  NON_PAYMENT: 'bg-danger-600/10 text-danger-600 border border-danger-600/30',
  POST_QUALITY: 'bg-warning-600/10 text-warning-600 border border-warning-600/30',
  POST_NON_COMPLIANCE: 'bg-blue-600/10 text-blue-600 border border-blue-600/30',
};

const transitionableStatuses = [
  { label: 'Open', value: DisputeStatus.OPEN },
  { label: 'Under Review', value: DisputeStatus.UNDER_REVIEW },
  { label: 'Awaiting Response', value: DisputeStatus.AWAITING_RESPONSE },
  { label: 'Escalated', value: DisputeStatus.ESCALATED },
  { label: 'Closed', value: DisputeStatus.CLOSED },
];

const resolutionOptions = Object.values(DisputeResolution).map((r) => ({
  label: formatEnumLabel(r),
  value: r,
}));

function MessageBubble({ message, isAdmin }: { message: DisputeMessageResponse; isAdmin: boolean }) {
  const isInternal = message.messageType === DisputeMessageType.INTERNAL_NOTE;
  const isSystem = message.messageType === DisputeMessageType.SYSTEM;
  const isSelf = message.authorRole === UserRole.SUPER_ADMIN;

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 rounded-full text-xs text-text-muted border border-glass-border bg-elevated">
          {message.content}
        </span>
      </div>
    );
  }

  if (isInternal && !isAdmin) return null;

  return (
    <div className={`space-y-1 ${isInternal ? 'opacity-90' : ''}`}>
      {isInternal && (
        <div className="flex items-center gap-1.5 ml-11">
          <i className="pi pi-lock text-warning-600 text-xs" />
          <span className="text-xs text-warning-600 font-medium">Internal — not visible to parties</span>
        </div>
      )}
      <div className={`flex gap-3 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
          isInternal
            ? 'bg-warning-600/10 border-warning-600/30'
            : isSelf
            ? 'bg-pink-600/10 border-pink-600/30'
            : 'bg-blue-600/10 border-blue-600/30'
        }`}>
          <i className={`pi pi-user text-xs ${
            isInternal ? 'text-warning-600' : isSelf ? 'text-pink-600' : 'text-blue-600'
          }`} />
        </div>
        <div className={`flex-1 max-w-[90%] sm:max-w-[80%] ${isSelf ? 'items-end flex flex-col' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-text-primary">{message.authorName}</span>
            <span className="text-xs text-text-muted">{formatDateTime(message.createdAt)}</span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isInternal
              ? 'bg-warning-600/5 border-warning-600/20'
              : 'glass-card border-l-2 border-blue-600/30'
          }`}>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceCard({ evidence }: { evidence: DisputeEvidenceResponse }) {
  const isLink = evidence.evidenceType === EvidenceType.LINK;
  const isImage = evidence.mimeType?.startsWith('image/');
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-pink-600/10 border border-pink-600/20 flex items-center justify-center flex-shrink-0">
        <i className={`pi ${isLink ? 'pi-link' : isImage ? 'pi-image' : 'pi-file'} text-pink-600`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {evidence.fileName || evidence.url || 'Evidence file'}
        </p>
        {evidence.description && <p className="text-xs text-text-muted mt-0.5">{evidence.description}</p>}
        <p className="text-xs text-text-muted mt-1">
          {evidence.uploadedBy.firstName} {evidence.uploadedBy.lastName} · {formatDate(evidence.createdAt)}
        </p>
      </div>
      {(evidence.fileUrl || evidence.url) && (
        <a href={evidence.fileUrl || evidence.url || '#'} target="_blank" rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-600/70 transition-colors flex-shrink-0">
          <i className="pi pi-external-link text-sm" />
        </a>
      )}
    </div>
  );
}

function StatusTimeline({ history }: { history: DisputeStatusHistoryResponse[] }) {
  return (
    <div className="space-y-3">
      {history.map((entry, i) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
              i === 0 ? 'bg-pink-600' : 'bg-glass-border'
            }`} />
            {i < history.length - 1 && <div className="w-px flex-1 bg-glass-border mt-1" />}
          </div>
          <div className="pb-3">
            <div className="flex items-center gap-2">
              {entry.fromStatus && (
                <>
                  <StatusBadge type="dispute" value={entry.fromStatus} size="small" />
                  <i className="pi pi-arrow-right text-text-muted text-xs" />
                </>
              )}
              <StatusBadge type="dispute" value={entry.toStatus} size="small" />
            </div>
            <p className="text-xs text-text-muted mt-1">
              {entry.changedBy.firstName} {entry.changedBy.lastName} · {formatDateTime(entry.createdAt)}
            </p>
            {entry.note && <p className="text-xs text-text-secondary mt-0.5 italic">{entry.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDisputeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();

  const { data: dispute, isLoading, error, refetch } = useDispute(id);
  const sendMessage = useSendDisputeMessage(id);
  const escalate = useEscalateDispute(id);
  const transitionStatus = useAdminTransitionDispute(id);
  const assignAdmin = useAdminAssignDispute(id);
  const resolveDispute = useAdminResolveDispute(id);

  const [messageText, setMessageText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [newStatus, setNewStatus] = useState<DisputeStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [resolution, setResolution] = useState<DisputeResolution | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showForceClose, setShowForceClose] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!dispute) return null;

  const d = dispute as DisputeDetailResponse;

  const breadcrumbs = [
    { label: 'Disputes', url: '/admin/disputes' },
    { label: d.disputeNumber },
  ];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage.mutate(
      { content: messageText.trim(), isInternal: isInternalNote },
      {
        onSuccess: () => {
          toast.showSuccess(isInternalNote ? 'Internal note added' : 'Message sent');
          setMessageText('');
          setIsInternalNote(false);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t send message. Try again.'),
      },
    );
  };

  const handleChangeStatus = () => {
    if (!newStatus) return;
    transitionStatus.mutate(
      { status: newStatus, note: statusNote || undefined },
      {
        onSuccess: () => {
          toast.showSuccess(`Status changed to ${formatEnumLabel(newStatus)}`);
          setNewStatus(null);
          setStatusNote('');
          refetch();
        },
        onError: () => toast.showError('Couldn\'t change status. Try again.'),
      },
    );
  };

  const handleAssign = () => {
    if (!assignedToId.trim()) return;
    assignAdmin.mutate(
      { assignedToUserId: assignedToId.trim() },
      {
        onSuccess: () => {
          toast.showSuccess('Dispute assigned');
          setAssignedToId('');
          refetch();
        },
        onError: () => toast.showError('Couldn\'t assign dispute. Try again.'),
      },
    );
  };

  const handleResolve = () => {
    if (!resolution) return;
    resolveDispute.mutate(
      { resolutionType: resolution, resolutionSummary },
      {
        onSuccess: () => {
          toast.showSuccess('Dispute resolved');
          setShowResolveConfirm(false);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t resolve dispute. Try again.'),
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
        onError: () => toast.showError('Couldn\'t escalate. Try again.'),
      },
    );
  };

  const handleForceClose = () => {
    transitionStatus.mutate(
      { status: DisputeStatus.CLOSED, note: 'Force closed by admin' },
      {
        onSuccess: () => {
          toast.showSuccess('Dispute force closed');
          setShowForceClose(false);
          refetch();
        },
        onError: () => toast.showError('Couldn\'t force close. Try again.'),
      },
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={d.disputeNumber}
        breadcrumbs={breadcrumbs}
        subtitle={`${formatEnumLabel(d.category)} · ${formatEnumLabel(d.status)}`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 lg:col-span-2 space-y-6">
          {/* Dispute info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Dispute Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag
                  value={formatEnumLabel(d.category)}
                  className={`text-xs ${categoryColors[d.category] ?? 'bg-elevated text-text-muted border border-glass-border'}`}
                />
                <Tag
                  value={formatEnumLabel(d.reason)}
                  className="text-xs bg-elevated text-text-muted border border-glass-border"
                />
                <StatusBadge type="dispute" value={d.status} />
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

          {/* Full message thread */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">Messages</h3>
            {d.messages.length > 0 ? (
              <div className="space-y-4">
                {d.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isAdmin={true} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No messages yet.</p>
            )}

            {/* Add message form */}
            <div className="mt-6 pt-6 border-t border-glass-border space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-text-secondary">Add Message</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    inputId="internal-note"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.checked ?? false)}
                  />
                  <label htmlFor="internal-note" className="text-sm text-warning-600 cursor-pointer">
                    Internal Note (admin only)
                  </label>
                </div>
              </div>
              <InputTextarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                placeholder={isInternalNote ? 'Internal note (not visible to parties)...' : 'Type a message...'}
                className={`w-full ${isInternalNote ? 'border-warning-600/40' : ''}`}
                aria-label="Type your response"
              />
              <div className="flex justify-end">
                <Button
                  label={isInternalNote ? 'Add Note' : 'Send Message'}
                  icon={isInternalNote ? 'pi pi-lock' : 'pi pi-send'}
                  severity={isInternalNote ? 'warning' : 'info'}
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  loading={sendMessage.isPending}
                />
              </div>
            </div>
          </div>

          {/* Evidence */}
          {d.evidence.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
                Evidence <span className="text-sm text-text-muted font-normal">({d.evidence.length})</span>
              </h3>
              <div className="space-y-3">
                {d.evidence.map((ev) => (
                  <EvidenceCard key={ev.id} evidence={ev} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Status transition */}
          <div className="glass-card p-5">
            <h3 className="text-base font-heading font-semibold text-text-primary mb-4">Change Status</h3>
            <div className="space-y-3">
              <Dropdown
                value={newStatus}
                options={transitionableStatuses}
                onChange={(e) => setNewStatus(e.value)}
                placeholder="Select new status"
                className="w-full"
              />
              <InputTextarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={2}
                placeholder="Add a note (optional)..."
                className="w-full text-sm"
              />
              <Button
                label="Change Status"
                icon="pi pi-refresh"
                className="w-full"
                onClick={handleChangeStatus}
                disabled={!newStatus}
                loading={transitionStatus.isPending}
              />
            </div>
          </div>

          {/* Assign admin */}
          <div className="glass-card p-5">
            <h3 className="text-base font-heading font-semibold text-text-primary mb-3">Assign Admin</h3>
            {d.assignedTo ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-600/5 border border-blue-600/20 mb-3">
                <i className="pi pi-user text-blue-600 text-sm" />
                <span className="text-sm text-text-secondary">
                  {d.assignedTo.firstName} {d.assignedTo.lastName}
                </span>
              </div>
            ) : (
              <p className="text-xs text-text-muted mb-3 italic">Currently unassigned</p>
            )}
            <div className="space-y-2">
              <InputText
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                placeholder="Admin user ID..."
                className="w-full text-sm"
              />
              <Button
                label="Assign"
                icon="pi pi-user-plus"
                outlined
                className="w-full"
                onClick={handleAssign}
                disabled={!assignedToId.trim()}
                loading={assignAdmin.isPending}
              />
            </div>
          </div>

          {/* Resolve */}
          {d.status !== DisputeStatus.RESOLVED && (
            <div className="glass-card p-5">
              <h3 className="text-base font-heading font-semibold text-text-primary mb-4">Resolve Dispute</h3>
              <div className="space-y-3">
                <Dropdown
                  value={resolution}
                  options={resolutionOptions}
                  onChange={(e) => setResolution(e.value)}
                  placeholder="Resolution type"
                  className="w-full"
                />
                <InputTextarea
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  rows={3}
                  placeholder="Resolution summary..."
                  className="w-full text-sm"
                />
                <Button
                  label="Resolve Dispute"
                  icon="pi pi-check-circle"
                  severity="success"
                  className="w-full"
                  onClick={() => setShowResolveConfirm(true)}
                  disabled={!resolution || !resolutionSummary.trim()}
                />
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="glass-card p-5">
            <h3 className="text-base font-heading font-semibold text-text-primary mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                label="Escalate"
                icon="pi pi-exclamation-triangle"
                severity="warning"
                outlined
                className="w-full"
                onClick={() => setShowEscalate(true)}
              />
              <Button
                label="Force Close"
                icon="pi pi-times-circle"
                severity="danger"
                outlined
                className="w-full"
                onClick={() => setShowForceClose(true)}
              />
            </div>
          </div>

          {/* Context panel */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-base font-heading font-semibold text-text-primary">Context</h3>

            {/* Submission */}
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Submission</p>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-text-primary">{d.submission.bountyTitle}</p>
                <div className="flex gap-2">
                  <StatusBadge type="submission" value={d.submission.status} size="small" />
                  <StatusBadge type="payout" value={d.submission.payoutStatus} size="small" />
                </div>
                <Button
                  label="View Submission"
                  icon="pi pi-external-link"
                  size="small"
                  text
                  severity="info"
                  className="p-0 mt-1"
                  onClick={() => router.push(`/admin/submissions/${d.submission.id}`)}
                />
              </div>
            </div>

            {/* Participant */}
            <div className="pt-3 border-t border-glass-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Filed By</p>
              <p className="text-sm text-text-primary font-medium">{d.openedBy.firstName} {d.openedBy.lastName}</p>
              <p className="text-xs text-text-muted">{d.openedBy.email}</p>
              <p className="text-xs text-text-muted mt-0.5">{formatEnumLabel(d.openedByRole)}</p>
            </div>

            {/* Brand */}
            <div className="pt-3 border-t border-glass-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Brand</p>
              <p className="text-sm text-text-primary font-medium">{d.brandName}</p>
              <Button
                label="View Brand"
                icon="pi pi-building"
                size="small"
                text
                severity="secondary"
                className="p-0 mt-1"
                onClick={() => router.push(`/admin/brands/${d.brandId}`)}
              />
            </div>
          </div>

          {/* Status history timeline */}
          {d.statusHistory.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-base font-heading font-semibold text-text-primary mb-4">Status History</h3>
              <StatusTimeline history={d.statusHistory} />
            </div>
          )}
        </div>
      </div>

      {/* Resolve confirmation */}
      <ConfirmAction
        visible={showResolveConfirm}
        onHide={() => setShowResolveConfirm(false)}
        title="Resolve Dispute"
        message={`Are you sure you want to resolve this dispute as "${resolution ? formatEnumLabel(resolution) : ''}"? This action will finalise the dispute.`}
        confirmLabel="Resolve"
        confirmSeverity="danger"
        onConfirm={handleResolve}
        loading={resolveDispute.isPending}
      />

      {/* Force close confirmation */}
      <ConfirmAction
        visible={showForceClose}
        onHide={() => setShowForceClose(false)}
        title="Force Close Dispute"
        message="Are you sure you want to force close this dispute? This is a destructive action and cannot be undone."
        confirmLabel="Force Close"
        confirmSeverity="danger"
        onConfirm={handleForceClose}
        loading={transitionStatus.isPending}
      />

      {/* Escalate confirmation */}
      <ConfirmAction
        visible={showEscalate}
        onHide={() => setShowEscalate(false)}
        title="Escalate Dispute"
        message="Provide the reason for escalating this dispute."
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
