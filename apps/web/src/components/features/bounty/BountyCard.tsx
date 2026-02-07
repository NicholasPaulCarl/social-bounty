'use client';

import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, timeRemaining } from '@/lib/utils/format';
import type { BountyListItem } from '@social-bounty/shared';

interface BountyCardProps {
  bounty: BountyListItem;
}

export function BountyCard({ bounty }: BountyCardProps) {
  const router = useRouter();

  const header = (
    <div className="flex items-center justify-between p-4 pb-0">
      <StatusBadge type="bounty" value={bounty.status} size="small" />
      {bounty.rewardValue && (
        <span className="text-lg font-bold text-success-700">
          {formatCurrency(bounty.rewardValue)}
        </span>
      )}
    </div>
  );

  const footer = (
    <div className="flex justify-between items-center">
      <span className="text-xs text-neutral-500">
        {bounty.endDate ? timeRemaining(bounty.endDate) : 'No deadline'}
      </span>
      <Button
        label="View Details"
        icon="pi pi-arrow-right"
        iconPos="right"
        text
        size="small"
        onClick={() => router.push(`/bounties/${bounty.id}`)}
      />
    </div>
  );

  return (
    <Card
      header={header}
      footer={footer}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/bounties/${bounty.id}`)}
    >
      <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2">{bounty.title}</h3>
      <p className="text-sm text-neutral-600 line-clamp-3">{bounty.shortDescription}</p>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-neutral-500">{bounty.category}</span>
        {bounty.rewardType && (
          <>
            <span className="text-neutral-300">|</span>
            <span className="text-xs text-neutral-500">{bounty.rewardType}</span>
          </>
        )}
      </div>
    </Card>
  );
}
