'use client';

import { Tag } from 'primereact/tag';

type StatusType = 'bounty' | 'submission' | 'payout' | 'user' | 'brand' | 'role' | 'orgMemberRole' | 'dispute' | 'application' | 'invitation';

type TagSeverity = 'success' | 'info' | 'warning' | 'danger' | null | undefined;

interface StatusConfig {
  severity: TagSeverity;
  icon?: string;
  className: string;
}

const STATUS_MAP: Record<string, Record<string, StatusConfig>> = {
  bounty: {
    DRAFT: { severity: null, className: 'bg-elevated text-text-muted border border-glass-border' },
    LIVE: { severity: 'success', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    PAUSED: { severity: 'warning', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    CLOSED: { severity: 'danger', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  submission: {
    SUBMITTED: { severity: 'info', icon: 'pi pi-send', className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    IN_REVIEW: { severity: 'warning', icon: 'pi pi-eye', className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30 animate-status-pulse' },
    NEEDS_MORE_INFO: { severity: 'warning', icon: 'pi pi-exclamation-triangle', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    APPROVED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    REJECTED: { severity: 'danger', icon: 'pi pi-times-circle', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  },
  payout: {
    NOT_PAID: { severity: null, icon: 'pi pi-minus-circle', className: 'bg-elevated text-text-muted border border-glass-border' },
    PENDING: { severity: 'warning', icon: 'pi pi-clock', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30 animate-status-pulse' },
    PAID: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-pink-600/10 text-pink-600 border border-pink-600/30' },
  },
  user: {
    ACTIVE: { severity: 'success', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    SUSPENDED: { severity: 'danger', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  },
  brand: {
    ACTIVE: { severity: 'success', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    SUSPENDED: { severity: 'danger', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  },
  role: {
    PARTICIPANT: { severity: 'info', className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    BUSINESS_ADMIN: { severity: null, className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    SUPER_ADMIN: { severity: null, className: 'bg-pink-600/10 text-pink-600 border border-pink-600/30' },
  },
  orgMemberRole: {
    OWNER: { severity: null, className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    MEMBER: { severity: null, className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  application: {
    PENDING: { severity: 'warning', icon: 'pi pi-clock', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    APPROVED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    REJECTED: { severity: 'danger', icon: 'pi pi-times-circle', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
    WITHDRAWN: { severity: null, icon: 'pi pi-undo', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  invitation: {
    PENDING: { severity: 'warning', icon: 'pi pi-envelope', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    ACCEPTED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    DECLINED: { severity: 'danger', icon: 'pi pi-times-circle', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
    EXPIRED: { severity: null, icon: 'pi pi-clock', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  dispute: {
    DRAFT: { severity: null, icon: 'pi pi-file-edit', className: 'bg-elevated text-text-muted border border-glass-border' },
    OPEN: { severity: 'info', icon: 'pi pi-folder-open', className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    UNDER_REVIEW: { severity: 'warning', icon: 'pi pi-eye', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30 animate-status-pulse' },
    AWAITING_RESPONSE: { severity: 'warning', icon: 'pi pi-clock', className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    ESCALATED: { severity: 'danger', icon: 'pi pi-exclamation-triangle', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30 animate-status-pulse' },
    RESOLVED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    CLOSED: { severity: null, icon: 'pi pi-lock', className: 'bg-elevated text-text-muted border border-glass-border' },
    WITHDRAWN: { severity: null, icon: 'pi pi-undo', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
};

function formatLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

interface StatusBadgeProps {
  type: StatusType;
  value: string;
  size?: 'small' | 'normal' | 'large';
}

export function StatusBadge({ type, value, size }: StatusBadgeProps) {
  const config = STATUS_MAP[type]?.[value];
  const label = formatLabel(value);

  if (!config) {
    return <Tag value={label} className="bg-elevated text-text-muted" />;
  }

  return (
    <Tag
      value={label}
      severity={config.severity}
      icon={config.icon}
      className={`${config.className} ${size === 'large' ? 'text-base px-3 py-1' : size === 'small' ? 'text-xs px-1.5 py-0.5 max-w-[150px] truncate' : 'text-sm px-2.5 py-0.5'}`}
      role="status"
      aria-label={`${formatLabel(type)} status: ${label}`}
    />
  );
}
