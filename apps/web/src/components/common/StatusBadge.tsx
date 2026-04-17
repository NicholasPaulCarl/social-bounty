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
    LIVE: { severity: 'success', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
    PAUSED: { severity: 'warning', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
    CLOSED: { severity: 'danger', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  submission: {
    SUBMITTED: { severity: 'info', icon: 'pi pi-send', className: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30' },
    IN_REVIEW: { severity: 'warning', icon: 'pi pi-eye', className: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30 animate-status-pulse' },
    NEEDS_MORE_INFO: { severity: 'warning', icon: 'pi pi-exclamation-triangle', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
    APPROVED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
    REJECTED: { severity: 'danger', icon: 'pi pi-times-circle', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
  },
  payout: {
    NOT_PAID: { severity: null, icon: 'pi pi-minus-circle', className: 'bg-elevated text-text-muted border border-glass-border' },
    PENDING: { severity: 'warning', icon: 'pi pi-clock', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30 animate-status-pulse' },
    PAID: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' },
  },
  user: {
    ACTIVE: { severity: 'success', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
    SUSPENDED: { severity: 'danger', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
  },
  brand: {
    ACTIVE: { severity: 'success', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
    SUSPENDED: { severity: 'danger', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
  },
  role: {
    PARTICIPANT: { severity: 'info', className: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30' },
    BUSINESS_ADMIN: { severity: null, className: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30' },
    SUPER_ADMIN: { severity: null, className: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' },
  },
  orgMemberRole: {
    OWNER: { severity: null, className: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30' },
    MEMBER: { severity: null, className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  application: {
    PENDING: { severity: 'warning', icon: 'pi pi-clock', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
    APPROVED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
    REJECTED: { severity: 'danger', icon: 'pi pi-times-circle', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
    WITHDRAWN: { severity: null, icon: 'pi pi-undo', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  invitation: {
    PENDING: { severity: 'warning', icon: 'pi pi-envelope', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30' },
    ACCEPTED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
    DECLINED: { severity: 'danger', icon: 'pi pi-times-circle', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30' },
    EXPIRED: { severity: null, icon: 'pi pi-clock', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  dispute: {
    DRAFT: { severity: null, icon: 'pi pi-file-edit', className: 'bg-elevated text-text-muted border border-glass-border' },
    OPEN: { severity: 'info', icon: 'pi pi-folder-open', className: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30' },
    UNDER_REVIEW: { severity: 'warning', icon: 'pi pi-eye', className: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30 animate-status-pulse' },
    AWAITING_RESPONSE: { severity: 'warning', icon: 'pi pi-clock', className: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/30' },
    ESCALATED: { severity: 'danger', icon: 'pi pi-exclamation-triangle', className: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/30 animate-status-pulse' },
    RESOLVED: { severity: 'success', icon: 'pi pi-check-circle', className: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30' },
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
