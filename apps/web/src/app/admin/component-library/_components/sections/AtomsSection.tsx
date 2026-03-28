'use client';

import { ComponentDemo } from '../ComponentDemo';
import { StatusBadge } from '@/components/common/StatusBadge';

const STATUS_GROUPS: { type: 'bounty' | 'submission' | 'payout' | 'user' | 'dispute' | 'role'; values: string[] }[] = [
  { type: 'bounty', values: ['DRAFT', 'LIVE', 'PAUSED', 'CLOSED'] },
  { type: 'submission', values: ['SUBMITTED', 'IN_REVIEW', 'NEEDS_MORE_INFO', 'APPROVED', 'REJECTED'] },
  { type: 'payout', values: ['NOT_PAID', 'PENDING', 'PAID'] },
  { type: 'user', values: ['ACTIVE', 'SUSPENDED'] },
  { type: 'dispute', values: ['DRAFT', 'OPEN', 'UNDER_REVIEW', 'AWAITING_RESPONSE', 'ESCALATED', 'RESOLVED', 'CLOSED', 'WITHDRAWN'] },
  { type: 'role', values: ['PARTICIPANT', 'BUSINESS_ADMIN', 'SUPER_ADMIN'] },
];

export default function AtomsSection() {
  return (
    <div className="space-y-12">
      <ComponentDemo
        name="StatusBadge"
        description="Semantic status indicator using PrimeReact Tag. Supports bounty, submission, payout, user, dispute, and role types."
        importPath="import { StatusBadge } from '@/components/common/StatusBadge'"
        code={`<StatusBadge type="bounty" value="LIVE" />\n<StatusBadge type="submission" value="APPROVED" size="small" />`}
        props={[
          { name: 'type', type: "'bounty' | 'submission' | 'payout' | 'user' | 'dispute' | 'role'", default: '—', required: true, description: 'Which status domain to use' },
          { name: 'value', type: 'string', default: '—', required: true, description: 'Status value (e.g. LIVE, APPROVED)' },
          { name: 'size', type: "'small' | 'normal' | 'large'", default: "'normal'", description: 'Badge size variant' },
        ]}
      >
        <div className="space-y-4">
          {STATUS_GROUPS.map((group) => (
            <div key={group.type}>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
                {group.type}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.values.map((val) => (
                  <StatusBadge key={`${group.type}-${val}`} type={group.type} value={val} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        name="AppHeader"
        description="Top navigation bar with hamburger toggle and user avatar. Rendered inside MainLayout — cannot be demoed standalone."
        importPath="import { AppHeader } from '@/components/layout/AppHeader'"
        code={`<AppHeader onMenuToggle={() => setMenuOpen(!menuOpen)} />`}
      >
        <p className="text-text-muted text-sm italic">
          AppHeader is part of the layout shell. See MainLayout for usage.
        </p>
      </ComponentDemo>

      <ComponentDemo
        name="AuthLayout"
        description="Centered card layout for login, signup, and password-reset screens. Glass-card with logo and gradient backdrop."
        importPath="import { AuthLayout } from '@/components/layout/AuthLayout'"
        code={`<AuthLayout>\n  <LoginForm />\n</AuthLayout>`}
      >
        <p className="text-text-muted text-sm italic">
          AuthLayout wraps (auth) route group. See apps/web/src/app/(auth)/layout.tsx.
        </p>
      </ComponentDemo>
    </div>
  );
}
