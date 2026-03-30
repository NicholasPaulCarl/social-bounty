import { UserRole } from '@social-bounty/shared';

export interface NavItem {
  label: string;
  icon: string;
  href: string;
  badge?: number;
  children?: NavItem[];
}

const participantNav: NavItem[] = [
  { label: 'Browse Bounties', icon: 'pi pi-search', href: '/bounties' },
  { label: 'My Submissions', icon: 'pi pi-list', href: '/my-submissions' },
  { label: 'My Disputes', icon: 'pi pi-flag', href: '/my-disputes' },
  { label: 'Profile', icon: 'pi pi-user', href: '/profile' },
];

const businessNav: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-chart-bar', href: '/business/dashboard' },
  { label: 'Bounties', icon: 'pi pi-megaphone', href: '/business/bounties' },
  { label: 'Review Center', icon: 'pi pi-inbox', href: '/business/review-center' },
  { label: 'Hunters', icon: 'pi pi-users', href: '/hunters' },
  { label: 'Disputes', icon: 'pi pi-flag', href: '/business/disputes' },
  { label: 'Organisation', icon: 'pi pi-building', href: '/business/organisation' },
  { label: 'Profile', icon: 'pi pi-user', href: '/business/profile' },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-chart-bar', href: '/admin/dashboard' },
  { label: 'Users', icon: 'pi pi-users', href: '/admin/users' },
  { label: 'Organisations', icon: 'pi pi-building', href: '/admin/organisations' },
  { label: 'Bounties', icon: 'pi pi-megaphone', href: '/admin/bounties' },
  { label: 'Submissions', icon: 'pi pi-inbox', href: '/admin/submissions' },
  { label: 'Hunters', icon: 'pi pi-users', href: '/hunters' },
  { label: 'Disputes', icon: 'pi pi-flag', href: '/admin/disputes' },
  { label: 'Audit Logs', icon: 'pi pi-history', href: '/admin/audit-logs' },
  { label: 'System Health', icon: 'pi pi-server', href: '/admin/troubleshooting' },
  { label: 'Settings', icon: 'pi pi-cog', href: '/admin/settings' },
  {
    label: 'Component Library',
    icon: 'pi pi-palette',
    href: '/admin/component-library',
    children: [
      { label: 'Design Tokens', icon: 'pi pi-circle-fill', href: '/admin/component-library#design-tokens' },
      { label: 'Atoms', icon: 'pi pi-circle-fill', href: '/admin/component-library#atoms' },
      { label: 'Molecules', icon: 'pi pi-circle-fill', href: '/admin/component-library#molecules' },
      { label: 'Organisms', icon: 'pi pi-circle-fill', href: '/admin/component-library#organisms' },
      { label: 'Form Sections', icon: 'pi pi-circle-fill', href: '/admin/component-library#form-sections' },
      { label: 'PrimeReact', icon: 'pi pi-circle-fill', href: '/admin/component-library#primereact' },
    ],
  },
  { label: 'Profile', icon: 'pi pi-user', href: '/admin/profile' },
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
