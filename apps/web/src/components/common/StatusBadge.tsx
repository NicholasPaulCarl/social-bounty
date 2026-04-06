'use client';

type StatusType = 'bounty' | 'submission' | 'payout' | 'user' | 'organisation' | 'role' | 'orgMemberRole';

interface StatusConfig {
  bg: string;
  text: string;
  icon?: string;
}

const STATUS_COLOUR_MAP: Record<string, Record<string, StatusConfig>> = {
  bounty: {
    DRAFT: { bg: 'bg-surface-container', text: 'text-on-surface-variant' },
    LIVE: { bg: 'bg-success-container', text: 'text-success' },
    PAUSED: { bg: 'bg-warning-container', text: 'text-warning' },
    CLOSED: { bg: 'bg-error-container', text: 'text-error' },
  },
  submission: {
    SUBMITTED: { bg: 'bg-info-container', text: 'text-info', icon: 'send' },
    IN_REVIEW: { bg: 'bg-warning-container', text: 'text-warning', icon: 'visibility' },
    NEEDS_MORE_INFO: { bg: 'bg-warning-container', text: 'text-warning', icon: 'warning' },
    APPROVED: { bg: 'bg-success-container', text: 'text-success', icon: 'check_circle' },
    REJECTED: { bg: 'bg-error-container', text: 'text-error', icon: 'cancel' },
  },
  payout: {
    NOT_PAID: { bg: 'bg-surface-container', text: 'text-on-surface-variant', icon: 'do_not_disturb_on' },
    PENDING: { bg: 'bg-warning-container', text: 'text-warning', icon: 'schedule' },
    PAID: { bg: 'bg-success-container', text: 'text-success', icon: 'check_circle' },
    FAILED: { bg: 'bg-error-container', text: 'text-error', icon: 'error' },
  },
  user: {
    ACTIVE: { bg: 'bg-success-container', text: 'text-success' },
    SUSPENDED: { bg: 'bg-error-container', text: 'text-error' },
  },
  organisation: {
    ACTIVE: { bg: 'bg-success-container', text: 'text-success' },
    SUSPENDED: { bg: 'bg-error-container', text: 'text-error' },
  },
  role: {
    PARTICIPANT: { bg: 'bg-info-container', text: 'text-info' },
    BUSINESS_ADMIN: { bg: 'bg-primary-container', text: 'text-primary' },
    SUPER_ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700' },
  },
  orgMemberRole: {
    OWNER: { bg: 'bg-primary-container', text: 'text-primary' },
    MEMBER: { bg: 'bg-surface-container', text: 'text-on-surface-variant' },
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

  const sizeClasses = size === 'large'
    ? 'text-sm px-4 py-2'
    : size === 'small'
      ? 'text-xs px-3 py-1'
      : 'text-xs px-4 py-1.5';

  if (!config) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-surface-container text-on-surface-variant ${sizeClasses}`}
        role="status"
        aria-label={`${formatLabel(type)} status: ${label}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${config.bg} ${config.text} ${sizeClasses}`}
      role="status"
      aria-label={`${formatLabel(type)} status: ${label}`}
    >
      {config.icon && (
        <span className="material-symbols-outlined" style={{ fontSize: size === 'small' ? '14px' : '16px', fontVariationSettings: "'FILL' 1" }}>
          {config.icon}
        </span>
      )}
      {label}
    </span>
  );
}
