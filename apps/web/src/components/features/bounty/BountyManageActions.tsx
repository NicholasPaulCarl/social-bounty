'use client';

import type { MouseEvent } from 'react';
import { Pause, Pencil, Play, Trash2, Undo2, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BountyStatus, type BountyListItem } from '@social-bounty/shared';

/**
 * BountyManageActions — footer slot for `<BountyCard variant="manage">`.
 *
 * Replaces the hunter card's "time-left + access pip" footer with the
 * brand's two-column manage layout: submission count on the left
 * (compact tap target → routes to filtered submissions on click), action
 * icons on the right (Edit + status transitions + Delete).
 *
 * Mirrors the row of round-text buttons from the previous business
 * bounties table — same icon set, same severities, same tooltips — but
 * recast as 28×28 ghost buttons that fit the 16px card padding.
 *
 * Status-action surface (matches the existing service rules):
 *  - DRAFT   → Publish (LIVE) + Delete
 *  - LIVE    → Pause (PAUSED) + Close (CLOSED)
 *  - PAUSED  → Resume (LIVE) + Close (CLOSED) + Revert (DRAFT)
 *  - CLOSED  → no transitions; Edit only
 *
 * Click handlers `e.stopPropagation()` so the card-level click doesn't
 * fire underneath the icon press.
 */

export type ManageStatusAction = {
  label: string;
  status: BountyStatus;
  Icon: LucideIcon;
  /** DS color token. Solid for primary, slate for secondary. */
  color: 'success' | 'warning' | 'danger' | 'secondary';
};

interface BountyManageActionsProps {
  bounty: BountyListItem;
  onView: (bounty: BountyListItem) => void;
  onEdit: (bounty: BountyListItem) => void;
  onStatusChange: (bounty: BountyListItem, action: ManageStatusAction) => void;
  onDelete: (bounty: BountyListItem) => void;
  /** True while the publish-payment redirect is in-flight for this bounty. */
  paymentLoading?: boolean;
}

export function getStatusActions(status: BountyStatus): ManageStatusAction[] {
  switch (status) {
    case BountyStatus.DRAFT:
      return [{ label: 'Publish', status: BountyStatus.LIVE, Icon: Play, color: 'success' }];
    case BountyStatus.LIVE:
      return [
        { label: 'Pause', status: BountyStatus.PAUSED, Icon: Pause, color: 'warning' },
        { label: 'Close', status: BountyStatus.CLOSED, Icon: XCircle, color: 'danger' },
      ];
    case BountyStatus.PAUSED:
      return [
        { label: 'Resume', status: BountyStatus.LIVE, Icon: Play, color: 'success' },
        { label: 'Close', status: BountyStatus.CLOSED, Icon: XCircle, color: 'danger' },
        { label: 'Revert to draft', status: BountyStatus.DRAFT, Icon: Undo2, color: 'secondary' },
      ];
    case BountyStatus.CLOSED:
    default:
      return [];
  }
}

const COLOR_TOKEN: Record<ManageStatusAction['color'], string> = {
  success: 'var(--success-600)',
  warning: 'var(--warning-600)',
  danger: 'var(--rose-600, var(--warning-600))',
  secondary: 'var(--text-secondary)',
};

export function BountyManageActions({
  bounty,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  paymentLoading = false,
}: BountyManageActionsProps) {
  const actions = getStatusActions(bounty.status);
  const showDelete = bounty.status === BountyStatus.DRAFT;
  const submissionLabel = bounty.submissionCount === 1 ? 'submission' : 'submissions';

  const stop = (handler: () => void) => (e: MouseEvent) => {
    e.stopPropagation();
    handler();
  };

  return (
    <>
      {/* Left — submission count, opens detail page (same as card click) */}
      <button
        type="button"
        onClick={stop(() => onView(bounty))}
        className="inline-flex items-center cursor-pointer text-text-secondary"
        style={{
          gap: 4,
          padding: 0,
          border: 'none',
          background: 'transparent',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span className="font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {bounty.submissionCount}
        </span>{' '}
        <span style={{ marginLeft: 4 }}>
          {submissionLabel} <span style={{ marginLeft: 2 }}>→</span>
        </span>
      </button>

      {/* Right — action icons */}
      <div className="inline-flex items-center" style={{ gap: 2 }}>
        <IconButton
          Icon={Pencil}
          color="var(--text-secondary)"
          tooltip="Edit"
          onClick={stop(() => onEdit(bounty))}
        />
        {actions.map((a) => (
          <IconButton
            key={a.status}
            Icon={a.Icon}
            color={COLOR_TOKEN[a.color]}
            tooltip={a.label}
            onClick={stop(() => onStatusChange(bounty, a))}
            loading={
              paymentLoading &&
              bounty.status === BountyStatus.DRAFT &&
              a.status === BountyStatus.LIVE
            }
          />
        ))}
        {showDelete && (
          <IconButton
            Icon={Trash2}
            color="var(--rose-600, var(--warning-600))"
            tooltip="Delete"
            onClick={stop(() => onDelete(bounty))}
          />
        )}
      </div>
    </>
  );
}

interface IconButtonProps {
  Icon: LucideIcon;
  color: string;
  tooltip: string;
  onClick: (e: MouseEvent) => void;
  loading?: boolean;
}

function IconButton({ Icon, color, tooltip, onClick, loading }: IconButtonProps) {
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip}
      onClick={onClick}
      disabled={loading}
      className="cursor-pointer transition-all hover:bg-slate-100"
      style={{
        width: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: 'transparent',
        borderRadius: 6,
        color,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
