'use client';

import type { ReactNode } from 'react';
import { Tag } from 'primereact/tag';
import {
  Send,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Undo2,
  Mail,
  FilePen,
  FolderOpen,
  Lock,
} from 'lucide-react';

type StatusType = 'bounty' | 'submission' | 'payout' | 'user' | 'brand' | 'role' | 'orgMemberRole' | 'dispute' | 'application' | 'invitation' | 'kyb';

type TagSeverity = 'success' | 'info' | 'warning' | 'danger' | null | undefined;

interface StatusConfig {
  severity: TagSeverity;
  icon?: ReactNode;
  className: string;
}

// All status icons share the same visual weight: 14px, strokeWidth 2.
// Color is inherited via `currentColor` from the surrounding Tag className.
function mkIcon(Icon: typeof Send) {
  return <Icon size={14} strokeWidth={2} aria-hidden="true" />;
}

const STATUS_MAP: Record<string, Record<string, StatusConfig>> = {
  bounty: {
    DRAFT: { severity: null, className: 'bg-elevated text-text-muted border border-glass-border' },
    LIVE: { severity: 'success', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    PAUSED: { severity: 'warning', className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    CLOSED: { severity: 'danger', className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  submission: {
    SUBMITTED: { severity: 'info', icon: mkIcon(Send), className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    IN_REVIEW: { severity: 'warning', icon: mkIcon(Eye), className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30 animate-status-pulse' },
    NEEDS_MORE_INFO: { severity: 'warning', icon: mkIcon(AlertTriangle), className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    APPROVED: { severity: 'success', icon: mkIcon(CheckCircle2), className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    REJECTED: { severity: 'danger', icon: mkIcon(XCircle), className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  },
  payout: {
    NOT_PAID: { severity: null, icon: mkIcon(MinusCircle), className: 'bg-elevated text-text-muted border border-glass-border' },
    PENDING: { severity: 'warning', icon: mkIcon(Clock), className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30 animate-status-pulse' },
    PAID: { severity: 'success', icon: mkIcon(CheckCircle2), className: 'bg-pink-600/10 text-pink-600 border border-pink-600/30' },
  },
  user: {
    ACTIVE: { severity: 'success', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    SUSPENDED: { severity: 'danger', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  },
  brand: {
    ACTIVE: { severity: 'success', className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    SUSPENDED: { severity: 'danger', className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  },
  kyb: {
    NOT_STARTED: { severity: null, className: 'bg-elevated text-text-muted border border-glass-border' },
    PENDING: { severity: 'warning', icon: mkIcon(Clock), className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30 animate-status-pulse' },
    APPROVED: { severity: 'success', icon: mkIcon(CheckCircle2), className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    REJECTED: { severity: 'danger', icon: mkIcon(XCircle), className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
  },
  role: {
    PARTICIPANT: { severity: 'info', className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    BUSINESS_ADMIN: { severity: null, className: 'bg-slate-100 text-slate-700 border border-slate-200' },
    SUPER_ADMIN: { severity: null, className: 'bg-pink-600/10 text-pink-600 border border-pink-600/30' },
  },
  orgMemberRole: {
    OWNER: { severity: null, className: 'bg-slate-100 text-slate-700 border border-slate-200' },
    MEMBER: { severity: null, className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  application: {
    PENDING: { severity: 'warning', icon: mkIcon(Clock), className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    APPROVED: { severity: 'success', icon: mkIcon(CheckCircle2), className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    REJECTED: { severity: 'danger', icon: mkIcon(XCircle), className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
    WITHDRAWN: { severity: null, icon: mkIcon(Undo2), className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  invitation: {
    PENDING: { severity: 'warning', icon: mkIcon(Mail), className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30' },
    ACCEPTED: { severity: 'success', icon: mkIcon(CheckCircle2), className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    DECLINED: { severity: 'danger', icon: mkIcon(XCircle), className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30' },
    EXPIRED: { severity: null, icon: mkIcon(Clock), className: 'bg-elevated text-text-muted border border-glass-border' },
  },
  dispute: {
    DRAFT: { severity: null, icon: mkIcon(FilePen), className: 'bg-elevated text-text-muted border border-glass-border' },
    OPEN: { severity: 'info', icon: mkIcon(FolderOpen), className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    UNDER_REVIEW: { severity: 'warning', icon: mkIcon(Eye), className: 'bg-warning-600/10 text-warning-600 border border-warning-600/30 animate-status-pulse' },
    AWAITING_RESPONSE: { severity: 'warning', icon: mkIcon(Clock), className: 'bg-blue-600/10 text-blue-600 border border-blue-600/30' },
    ESCALATED: { severity: 'danger', icon: mkIcon(AlertTriangle), className: 'bg-danger-600/10 text-danger-600 border border-danger-600/30 animate-status-pulse' },
    RESOLVED: { severity: 'success', icon: mkIcon(CheckCircle2), className: 'bg-success-600/10 text-success-600 border border-success-600/30' },
    CLOSED: { severity: null, icon: mkIcon(Lock), className: 'bg-elevated text-text-muted border border-glass-border' },
    WITHDRAWN: { severity: null, icon: mkIcon(Undo2), className: 'bg-elevated text-text-muted border border-glass-border' },
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
