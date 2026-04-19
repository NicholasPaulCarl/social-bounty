import { UserRole } from '@social-bounty/shared';
import {
  Inbox, Compass, Building2, FolderCheck, Flag, Wallet, Star, UserCircle,
  LayoutDashboard, Megaphone, ClipboardCheck, Users, IdCard, DollarSign,
  Circle, Zap, Server, Settings, Palette, Banknote, History, CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  Icon: LucideIcon;
  href: string;
  badge?: number;
  /** Render the count pip in danger red instead of pink (e.g. review queue). */
  urgent?: boolean;
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ─── Participant ──────────────────────────────────────────────

const participantSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Inbox', Icon: Inbox, href: '/inbox' },
      { label: 'Browse Bounties', Icon: Compass, href: '/bounties' },
      { label: 'Browse Brands', Icon: Building2, href: '/brands' },
      { label: 'My Submissions', Icon: FolderCheck, href: '/my-submissions' },
      { label: 'My Disputes', Icon: Flag, href: '/my-disputes' },
    ],
  },
  {
    label: 'Money',
    items: [
      { label: 'Wallet', Icon: Wallet, href: '/wallet' },
      { label: 'Subscription', Icon: Star, href: '/settings/subscription' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', Icon: UserCircle, href: '/profile' },
    ],
  },
];

// ─── Business Admin ────────────────────────────────────────────

const businessSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Inbox', Icon: Inbox, href: '/inbox' },
      { label: 'Dashboard', Icon: LayoutDashboard, href: '/business/dashboard' },
      { label: 'Bounties', Icon: Megaphone, href: '/business/bounties' },
      { label: 'Review Center', Icon: ClipboardCheck, href: '/business/review-center', urgent: true },
      { label: 'Hunters', Icon: Users, href: '/hunters' },
      { label: 'Disputes', Icon: Flag, href: '/business/disputes' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Brands', Icon: Building2, href: '/business/brands' },
      { label: 'KYB Verification', Icon: IdCard, href: '/business/brands/kyb' },
      { label: 'Subscription', Icon: CreditCard, href: '/business/brands/subscription' },
      { label: 'Profile', Icon: UserCircle, href: '/business/profile' },
    ],
  },
];

// ─── Super Admin ───────────────────────────────────────────────

const adminSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Inbox', Icon: Inbox, href: '/inbox' },
      { label: 'Dashboard', Icon: LayoutDashboard, href: '/admin/dashboard' },
      { label: 'Users', Icon: Users, href: '/admin/users' },
      { label: 'Brands', Icon: Building2, href: '/admin/brands' },
      { label: 'Bounties', Icon: Megaphone, href: '/admin/bounties' },
      { label: 'Submissions', Icon: FolderCheck, href: '/admin/submissions' },
      { label: 'Hunters', Icon: Users, href: '/hunters' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Wallets', Icon: Wallet, href: '/admin/wallets' },
      { label: 'Withdrawals', Icon: Banknote, href: '/admin/withdrawals' },
      { label: 'Disputes', Icon: Flag, href: '/admin/disputes' },
      {
        label: 'Finance',
        Icon: DollarSign,
        href: '/admin/finance',
        children: [
          { label: 'Overview', Icon: Circle, href: '/admin/finance' },
          { label: 'Inbound', Icon: Circle, href: '/admin/finance/inbound' },
          { label: 'Reserves', Icon: Circle, href: '/admin/finance/reserves' },
          { label: 'Earnings & Payouts', Icon: Circle, href: '/admin/finance/earnings-payouts' },
          { label: 'Refunds', Icon: Circle, href: '/admin/finance/refunds' },
          { label: 'Visibility Failures', Icon: Circle, href: '/admin/finance/visibility-failures' },
          { label: 'Exceptions', Icon: Circle, href: '/admin/finance/exceptions' },
          { label: 'Audit Trail', Icon: Circle, href: '/admin/finance/audit-trail' },
          { label: 'Overrides', Icon: Circle, href: '/admin/finance/overrides' },
        ],
      },
      { label: 'Audit Logs', Icon: History, href: '/admin/audit-logs' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Payments Health', Icon: Zap, href: '/admin/payments-health' },
      { label: 'System Health', Icon: Server, href: '/admin/troubleshooting' },
      { label: 'Settings', Icon: Settings, href: '/admin/settings' },
      {
        label: 'Component Library',
        Icon: Palette,
        href: '/admin/component-library',
        children: [
          { label: 'Brand', Icon: Circle, href: '/admin/component-library#brand' },
          { label: 'Design Tokens', Icon: Circle, href: '/admin/component-library#design-tokens' },
          { label: 'Atoms', Icon: Circle, href: '/admin/component-library#atoms' },
          { label: 'Molecules', Icon: Circle, href: '/admin/component-library#molecules' },
          { label: 'Organisms', Icon: Circle, href: '/admin/component-library#organisms' },
          { label: 'Form Sections', Icon: Circle, href: '/admin/component-library#form-sections' },
          { label: 'PrimeReact', Icon: Circle, href: '/admin/component-library#primereact' },
        ],
      },
      { label: 'Profile', Icon: UserCircle, href: '/admin/profile' },
    ],
  },
];

export function getNavSections(role: UserRole): NavSection[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return adminSections;
    case 'BUSINESS_ADMIN':
      return businessSections;
    default:
      return participantSections;
  }
}

/**
 * Back-compat shim — flattens grouped nav into a single list for older
 * callers and tests that still consume `NavItem[]`. New code should use
 * `getNavSections()` instead.
 */
export function getNavItems(role: UserRole): NavItem[] {
  return getNavSections(role).flatMap((s) => s.items);
}
