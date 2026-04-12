'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { ComponentDemo } from '../ComponentDemo';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { OverrideModal } from '@/components/common/OverrideModal';
import { BountyCard } from '@/components/features/bounty/BountyCard';
import { BountyFilters } from '@/components/features/bounty/BountyFilters';
import type { BountyListItem, BountyListParams } from '@social-bounty/shared';

const MOCK_BOUNTIES: BountyListItem[] = [
  {
    id: 'demo-1',
    title: 'Share our new sneaker drop on Instagram',
    shortDescription: 'Post a Reel or Story featuring our latest sneaker collection. Must tag @brand and use #SneakerDrop.',
    category: 'Fashion',
    rewardType: 'CASH' as BountyListItem['rewardType'],
    rewardValue: '5000',
    rewardDescription: null,
    maxSubmissions: 50,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'LIVE' as BountyListItem['status'],
    submissionCount: 12,
    brand: { id: 'org-1', name: 'Acme Shoes', logo: null },
    createdAt: new Date().toISOString(),
    channels: { INSTAGRAM: ['REEL', 'STORY'] } as BountyListItem['channels'],
    currency: 'ZAR' as BountyListItem['currency'],
    totalRewardValue: '5000',
    rewards: [],
    payoutMetrics: null,
    paymentStatus: 'UNPAID' as BountyListItem['paymentStatus'],
  },
  {
    id: 'demo-2',
    title: 'TikTok product review — wireless earbuds',
    shortDescription: 'Create a 30–60 second TikTok review of our wireless earbuds. Be honest and creative!',
    category: 'Tech',
    rewardType: 'PRODUCT' as BountyListItem['rewardType'],
    rewardValue: null,
    rewardDescription: 'Free pair of earbuds',
    maxSubmissions: 20,
    startDate: null,
    endDate: null,
    status: 'DRAFT' as BountyListItem['status'],
    submissionCount: 0,
    brand: { id: 'org-2', name: 'SoundWave Audio', logo: null },
    createdAt: new Date().toISOString(),
    channels: { TIKTOK: ['VIDEO_POST'] } as BountyListItem['channels'],
    currency: 'USD' as BountyListItem['currency'],
    totalRewardValue: null,
    rewards: [],
    payoutMetrics: null,
    paymentStatus: 'UNPAID' as BountyListItem['paymentStatus'],
  },
];

export default function OrganismsSection() {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [overrideVisible, setOverrideVisible] = useState(false);
  const [filters, setFilters] = useState<BountyListParams>({ page: 1, limit: 10 });

  return (
    <div className="space-y-12">
      {/* ConfirmAction */}
      <ComponentDemo
        name="ConfirmAction"
        description="Confirmation dialog with optional reason textarea. Used for destructive admin actions."
        importPath="import { ConfirmAction } from '@/components/common/ConfirmAction'"
        code={`<ConfirmAction\n  visible={showConfirm}\n  onHide={() => setShowConfirm(false)}\n  title="Suspend User"\n  message="This will immediately revoke access."\n  confirmLabel="Suspend"\n  confirmSeverity="danger"\n  onConfirm={(reason) => handleSuspend(reason)}\n  requireReason\n/>`}
        props={[
          { name: 'visible', type: 'boolean', default: '—', required: true, description: 'Show/hide the dialog' },
          { name: 'onHide', type: '() => void', default: '—', required: true, description: 'Close handler' },
          { name: 'title', type: 'string', default: '—', required: true, description: 'Dialog title' },
          { name: 'message', type: 'string', default: '—', required: true, description: 'Confirmation message' },
          { name: 'onConfirm', type: '(reason?: string) => void', default: '—', required: true, description: 'Confirm callback' },
          { name: 'requireReason', type: 'boolean', default: 'false', description: 'Show reason textarea' },
          { name: 'confirmSeverity', type: "'danger' | 'warning' | 'success'", default: "'danger'", description: 'Button color' },
        ]}
      >
        <Button label="Open ConfirmAction" icon="pi pi-trash" severity="danger" onClick={() => setConfirmVisible(true)} />
        <ConfirmAction
          visible={confirmVisible}
          onHide={() => setConfirmVisible(false)}
          title="Delete Bounty"
          message="Are you sure you want to delete this bounty? This action cannot be undone."
          confirmLabel="Delete"
          confirmSeverity="danger"
          onConfirm={() => { setConfirmVisible(false); alert('Confirmed!'); }}
          requireReason
        />
      </ComponentDemo>

      {/* OverrideModal */}
      <ComponentDemo
        name="OverrideModal"
        description="Status override dialog for admin force-transitions. Requires a reason."
        importPath="import { OverrideModal } from '@/components/common/OverrideModal'"
        code={`<OverrideModal\n  visible={show}\n  onHide={() => setShow(false)}\n  title="Override Bounty Status"\n  entityType="bounty"\n  currentStatus="DRAFT"\n  statusOptions={[\n    { label: 'Live', value: 'LIVE' },\n    { label: 'Closed', value: 'CLOSED' },\n  ]}\n  onOverride={(status, reason) => handleOverride(status, reason)}\n/>`}
        props={[
          { name: 'entityType', type: "'bounty' | 'submission' | 'payout'", default: '—', required: true, description: 'Status domain' },
          { name: 'currentStatus', type: 'string', default: '—', required: true, description: 'Currently active status' },
          { name: 'statusOptions', type: '{ label: string; value: string }[]', default: '—', required: true, description: 'Available target statuses' },
          { name: 'onOverride', type: '(newStatus, reason) => void', default: '—', required: true, description: 'Override handler' },
        ]}
      >
        <Button label="Open OverrideModal" icon="pi pi-bolt" severity="warning" onClick={() => setOverrideVisible(true)} />
        <OverrideModal
          visible={overrideVisible}
          onHide={() => setOverrideVisible(false)}
          title="Override Bounty Status"
          entityType="bounty"
          currentStatus="DRAFT"
          statusOptions={[
            { label: 'Live', value: 'LIVE' },
            { label: 'Paused', value: 'PAUSED' },
            { label: 'Closed', value: 'CLOSED' },
          ]}
          onOverride={(status, reason) => { setOverrideVisible(false); alert(`Override to ${status}: ${reason}`); }}
        />
      </ComponentDemo>

      {/* BountyCard */}
      <ComponentDemo
        name="BountyCard"
        description="Card preview for bounty listings. Clickable with hover glow effect."
        importPath="import { BountyCard } from '@/components/features/bounty/BountyCard'"
        code={`<BountyCard bounty={bounty} />`}
        props={[
          { name: 'bounty', type: 'BountyListItem', default: '—', required: true, description: 'Bounty data object' },
        ]}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_BOUNTIES.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      </ComponentDemo>

      {/* BountyFilters */}
      <ComponentDemo
        name="BountyFilters"
        description="Search, status, reward type, and sort controls for bounty lists."
        importPath="import { BountyFilters } from '@/components/features/bounty/BountyFilters'"
        code={`const [filters, setFilters] = useState<BountyListParams>({ page: 1, limit: 10 });\n\n<BountyFilters\n  filters={filters}\n  onChange={setFilters}\n  showStatusFilter\n/>`}
        props={[
          { name: 'filters', type: 'BountyListParams', default: '—', required: true, description: 'Current filter state' },
          { name: 'onChange', type: '(filters) => void', default: '—', required: true, description: 'Filter change handler' },
          { name: 'showStatusFilter', type: 'boolean', default: 'false', description: 'Show status dropdown' },
        ]}
      >
        <BountyFilters filters={filters} onChange={setFilters} showStatusFilter />
      </ComponentDemo>

      {/* ReviewActionBar - code only */}
      <ComponentDemo
        name="ReviewActionBar"
        description="Approve / Needs More Info / Reject toolbar for submission review. Includes note field and confirmation dialogs."
        importPath="import { ReviewActionBar } from '@/components/features/submission/ReviewActionBar'"
        code={`<ReviewActionBar\n  currentStatus={SubmissionStatus.SUBMITTED}\n  onAction={(action, note) => handleReviewAction(action, note)}\n  loading={isLoading}\n/>`}
        props={[
          { name: 'currentStatus', type: 'SubmissionStatus', default: '—', required: true, description: 'Current submission status' },
          { name: 'onAction', type: '(action, note?) => void', default: '—', required: true, description: 'Review action handler' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'Disable buttons while processing' },
        ]}
      >
        <p className="text-text-muted text-sm italic">
          Requires submission context. See business/review-center/[id] for live usage.
        </p>
      </ComponentDemo>

      {/* PayoutActionBar - code only */}
      <ComponentDemo
        name="PayoutActionBar"
        description="Mark as Pending / Mark as Paid toolbar with optional proof-of-payment upload."
        importPath="import { PayoutActionBar } from '@/components/features/submission/PayoutActionBar'"
        code={`<PayoutActionBar\n  currentPayoutStatus={PayoutStatus.NOT_PAID}\n  onAction={(status, note) => handlePayout(status, note)}\n  loading={isLoading}\n/>`}
        props={[
          { name: 'currentPayoutStatus', type: 'PayoutStatus', default: '—', required: true, description: 'Current payout status' },
          { name: 'onAction', type: '(newStatus, note?) => void', default: '—', required: true, description: 'Payout action handler' },
          { name: 'loading', type: 'boolean', default: 'false', description: 'Disable buttons while processing' },
        ]}
      >
        <p className="text-text-muted text-sm italic">
          Requires submission context. See business/review-center/[id] for live usage.
        </p>
      </ComponentDemo>
    </div>
  );
}
