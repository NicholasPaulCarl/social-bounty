import { UserRole } from '@social-bounty/shared';
import {
  Inbox, Search, Building2, List, Flag, Wallet, Star, User,
  BarChart3, Megaphone, Users, IdCard, DollarSign, Circle,
  Zap, Server, Settings, Palette, Banknote, History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  Icon: LucideIcon;
  href: string;
  badge?: number;
  children?: NavItem[];
}

const participantNav: NavItem[] = [
  { label: 'Inbox', Icon: Inbox, href: '/inbox' },
  { label: 'Browse Bounties', Icon: Search, href: '/bounties' },
  { label: 'Browse Brands', Icon: Building2, href: '/brands' },
  { label: 'My Submissions', Icon: List, href: '/my-submissions' },
  { label: 'My Disputes', Icon: Flag, href: '/my-disputes' },
  { label: 'Wallet', Icon: Wallet, href: '/wallet' },
  { label: 'Subscription', Icon: Star, href: '/settings/subscription' },
  { label: 'Profile', Icon: User, href: '/profile' },
];

const businessNav: NavItem[] = [
  { label: 'Inbox', Icon: Inbox, href: '/inbox' },
  { label: 'Dashboard', Icon: BarChart3, href: '/business/dashboard' },
  { label: 'Bounties', Icon: Megaphone, href: '/business/bounties' },
  { label: 'Review Center', Icon: Inbox, href: '/business/review-center' },
  { label: 'Hunters', Icon: Users, href: '/hunters' },
  { label: 'Disputes', Icon: Flag, href: '/business/disputes' },
  { label: 'Brands', Icon: Building2, href: '/business/brands' },
  { label: 'KYB Verification', Icon: IdCard, href: '/business/brands/kyb' },
  { label: 'Subscription', Icon: Star, href: '/business/brands/subscription' },
  { label: 'Profile', Icon: User, href: '/business/profile' },
];

const adminNav: NavItem[] = [
  { label: 'Inbox', Icon: Inbox, href: '/inbox' },
  { label: 'Dashboard', Icon: BarChart3, href: '/admin/dashboard' },
  { label: 'Users', Icon: Users, href: '/admin/users' },
  { label: 'Brands', Icon: Building2, href: '/admin/brands' },
  { label: 'Bounties', Icon: Megaphone, href: '/admin/bounties' },
  { label: 'Submissions', Icon: Inbox, href: '/admin/submissions' },
  { label: 'Hunters', Icon: Users, href: '/hunters' },
  { label: 'Wallets', Icon: Wallet, href: '/admin/wallets' },
  { label: 'Withdrawals', Icon: Banknote, href: '/admin/withdrawals' },
  { label: 'Disputes', Icon: Flag, href: '/admin/disputes' },
  { label: 'Audit Logs', Icon: History, href: '/admin/audit-logs' },
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
  { label: 'Profile', Icon: User, href: '/admin/profile' },
];

export function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return adminNav;
    case 'BUSINESS_ADMIN':
      return businessNav;
    default:
      return participantNav;
  }
}
