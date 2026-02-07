'use client';

import { Tag } from 'primereact/tag';

type StatusType = 'bounty' | 'submission' | 'payout' | 'user' | 'organisation' | 'role' | 'orgMemberRole';

type TagSeverity = 'success' | 'info' | 'warning' | 'danger' | null | undefined;

interface StatusConfig {
  bg: string;
  text: string;
  severity: TagSeverity;
  icon?: string;
}

const STATUS_COLOUR_MAP: Record<string, Record<string, StatusConfig>> = {
  bounty: {
    DRAFT: { bg: 'bg-neutral-100', text: 'text-neutral-600', severity: null },
    LIVE: { bg: 'bg-success-100', text: 'text-success-700', severity: 'success' },
    PAUSED: { bg: 'bg-warning-100', text: 'text-warning-700', severity: 'warning' },
    CLOSED: { bg: 'bg-danger-100', text: 'text-danger-700', severity: 'danger' },
  },
  submission: {
    SUBMITTED: { bg: 'bg-info-100', text: 'text-info-700', severity: 'info', icon: 'pi pi-send' },
    IN_REVIEW: { bg: 'bg-warning-100', text: 'text-warning-700', severity: 'warning', icon: 'pi pi-eye' },
    NEEDS_MORE_INFO: { bg: 'bg-yellow-100', text: 'text-yellow-800', severity: 'warning', icon: 'pi pi-exclamation-triangle' },
    APPROVED: { bg: 'bg-success-100', text: 'text-success-700', severity: 'success', icon: 'pi pi-check-circle' },
    REJECTED: { bg: 'bg-danger-100', text: 'text-danger-700', severity: 'danger', icon: 'pi pi-times-circle' },
  },
  payout: {
    NOT_PAID: { bg: 'bg-neutral-100', text: 'text-neutral-600', severity: null, icon: 'pi pi-minus-circle' },
    PENDING: { bg: 'bg-warning-100', text: 'text-warning-700', severity: 'warning', icon: 'pi pi-clock' },
    PAID: { bg: 'bg-success-100', text: 'text-success-700', severity: 'success', icon: 'pi pi-check-circle' },
  },
  user: {
    ACTIVE: { bg: 'bg-success-100', text: 'text-success-700', severity: 'success' },
    SUSPENDED: { bg: 'bg-danger-100', text: 'text-danger-700', severity: 'danger' },
  },
  organisation: {
    ACTIVE: { bg: 'bg-success-100', text: 'text-success-700', severity: 'success' },
    SUSPENDED: { bg: 'bg-danger-100', text: 'text-danger-700', severity: 'danger' },
  },
  role: {
    PARTICIPANT: { bg: 'bg-info-100', text: 'text-info-700', severity: 'info' },
    BUSINESS_ADMIN: { bg: 'bg-primary-100', text: 'text-primary-700', severity: null },
    SUPER_ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', severity: null },
  },
  orgMemberRole: {
    OWNER: { bg: 'bg-primary-100', text: 'text-primary-700', severity: null },
    MEMBER: { bg: 'bg-neutral-100', text: 'text-neutral-600', severity: null },
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
  const config = STATUS_COLOUR_MAP[type]?.[value];
  const label = formatLabel(value);

  if (!config) {
    return <Tag value={label} />;
  }

  return (
    <Tag
      value={label}
      severity={config.severity}
      icon={config.icon}
      className={`${config.bg} ${config.text} ${size === 'large' ? 'text-base px-3 py-1' : size === 'small' ? 'text-xs px-1.5 py-0.5' : ''}`}
      role="status"
      aria-label={`${formatLabel(type)} status: ${label}`}
    />
  );
}
