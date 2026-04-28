'use client';

import { useRef, type MouseEvent } from 'react';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import {
  Eye,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BountyStatus, type BountyListItem } from '@social-bounty/shared';
import {
  getStatusActions,
  type ManageStatusAction,
} from './BountyManageActions';
import { getManageMenuPolicy } from './manage-menu-policy';

/**
 * BountyManageRowMenu — list-row replacement for the always-visible
 * icon strip in `BountyManageActions`.
 *
 * Brief §4 calls for "Each row has a three-dot options menu" in list
 * mode, with the same action vocabulary (View / Edit / Status-change /
 * Delete) but condensed behind an ellipsis trigger so a 25-row table
 * stays scannable.
 *
 * Edit visibility is decided by `getManageMenuPolicy` — for LIVE/PAUSED
 * bounties with submissions, the Edit item drops out and a "View
 * submissions" shortcut takes its place. Destructive actions (Delete,
 * Close) still go through the parent's `ConfirmAction` dialogs; the
 * menu just emits the same handler calls `BountyManageActions` does.
 *
 * Keeps grid-mode untouched — the brief explicitly says the existing
 * `BountyManageCard` footer's compact icon row stays as-is.
 */

const STATUS_COLOR: Record<ManageStatusAction['color'], string> = {
  success: 'var(--success-600)',
  warning: 'var(--warning-600)',
  danger: 'var(--rose-600, var(--warning-600))',
  secondary: 'var(--text-secondary)',
};

interface BountyManageRowMenuProps {
  bounty: BountyListItem;
  onView: (bounty: BountyListItem) => void;
  onEdit: (bounty: BountyListItem) => void;
  onStatusChange: (bounty: BountyListItem, action: ManageStatusAction) => void;
  onDelete: (bounty: BountyListItem) => void;
  /** True while the publish-payment redirect is in-flight for this row. */
  paymentLoading?: boolean;
}

/**
 * Builds a small `<span>` tag with the status icon — used by the
 * MenuItem.icon function slot so the icon picks up the action's color
 * token (success/warning/danger).
 */
function MenuIcon({ Icon, color }: { Icon: LucideIcon; color: string }) {
  return (
    <span
      className="mr-2 inline-flex shrink-0 items-center justify-center"
      style={{ color, width: 16, height: 16 }}
      aria-hidden="true"
    >
      <Icon size={16} strokeWidth={2} />
    </span>
  );
}

export function BountyManageRowMenu({
  bounty,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  paymentLoading = false,
}: BountyManageRowMenuProps) {
  const menuRef = useRef<Menu>(null);
  const policy = getManageMenuPolicy(bounty);
  const statusActions = getStatusActions(bounty.status);
  const showDelete = bounty.status === BountyStatus.DRAFT;
  const isPublishLoading =
    paymentLoading && bounty.status === BountyStatus.DRAFT;

  const items: MenuItem[] = [];

  // View — always available.
  items.push({
    label: 'View',
    icon: () => (
      <MenuIcon Icon={Eye} color="var(--text-secondary)" />
    ),
    command: () => onView(bounty),
  });

  if (policy.showSubmissions && !policy.canEdit) {
    items.push({
      label: 'View submissions',
      icon: () => (
        <MenuIcon Icon={ListChecks} color="var(--text-secondary)" />
      ),
      command: () => onView(bounty),
    });
  }

  if (policy.canEdit) {
    items.push({
      label: 'Edit',
      icon: () => (
        <MenuIcon Icon={Pencil} color="var(--text-secondary)" />
      ),
      command: () => onEdit(bounty),
    });
  }

  if (statusActions.length > 0) {
    items.push({ separator: true });
    for (const action of statusActions) {
      const isPublishItem =
        bounty.status === BountyStatus.DRAFT &&
        action.status === BountyStatus.LIVE;
      items.push({
        label: action.label,
        icon: () => (
          <MenuIcon
            Icon={
              isPublishItem && isPublishLoading ? Loader2 : action.Icon
            }
            color={STATUS_COLOR[action.color]}
          />
        ),
        disabled: isPublishItem && isPublishLoading,
        command: () => onStatusChange(bounty, action),
      });
    }
  }

  if (showDelete) {
    items.push({ separator: true });
    items.push({
      label: 'Delete',
      icon: () => (
        <MenuIcon
          Icon={Trash2}
          color="var(--rose-600, var(--warning-600))"
        />
      ),
      command: () => onDelete(bounty),
    });
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    menuRef.current?.toggle(e);
  };

  return (
    <>
      <Menu
        model={items}
        popup
        ref={menuRef}
        appendTo={typeof document !== 'undefined' ? document.body : undefined}
        aria-label={`Actions for ${bounty.title}`}
      />
      <button
        type="button"
        onClick={handleClick}
        title="More actions"
        aria-label={`More actions for ${bounty.title}`}
        aria-haspopup="menu"
        className="inline-flex items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-slate-100 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
        style={{ width: 32, height: 32, border: 'none', background: 'transparent' }}
      >
        <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </>
  );
}

