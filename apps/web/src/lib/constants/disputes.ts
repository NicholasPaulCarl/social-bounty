import { DisputeCategory, DisputeStatus } from '@social-bounty/shared';

export const DISPUTE_CATEGORY_COLORS: Record<string, string> = {
  NON_PAYMENT: 'text-accent-amber',
  POST_QUALITY: 'text-accent-rose',
  POST_NON_COMPLIANCE: 'text-accent-violet',
};

export const DISPUTE_STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Awaiting Response', value: 'AWAITING_RESPONSE' },
  { label: 'Escalated', value: 'ESCALATED' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

export const DISPUTE_CATEGORY_OPTIONS = [
  { label: 'All Categories', value: '' },
  { label: 'Non-Payment', value: 'NON_PAYMENT' },
  { label: 'Post Quality', value: 'POST_QUALITY' },
  { label: 'Non-Compliance', value: 'POST_NON_COMPLIANCE' },
];

export function formatDisputeCategory(category: string): string {
  const labels: Record<string, string> = {
    NON_PAYMENT: 'Non-Payment',
    POST_QUALITY: 'Post Quality',
    POST_NON_COMPLIANCE: 'Non-Compliance',
  };
  return labels[category] || category;
}

export function formatDisputeReason(reason: string): string {
  return reason.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}
