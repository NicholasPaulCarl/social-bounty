'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, timeRemaining } from '@/lib/utils/format';
import type { BountyListItem } from '@social-bounty/shared';

interface BountyCardProps {
  bounty: BountyListItem;
}

export function BountyCard({ bounty }: BountyCardProps) {
  const router = useRouter();

  return (
    <div
      className="bg-surface-container-low rounded-xl p-6 cursor-pointer hover:bg-surface-container-lowest transition-all duration-200 group"
      onClick={() => router.push(`/bounties/${bounty.id}`)}
    >
      <div className="flex items-center justify-between mb-4">
        <StatusBadge type="bounty" value={bounty.status} size="small" />
        {bounty.rewardValue && (
          <span className="text-lg font-bold text-accent">
            {formatCurrency(bounty.rewardValue)}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-on-surface mb-2 line-clamp-2 font-headline">{bounty.title}</h3>
      <p className="text-sm text-on-surface-variant line-clamp-3">{bounty.shortDescription}</p>

      <div className="flex items-center gap-2 mt-4">
        <span className="bg-surface-container text-on-surface-variant text-xs px-3 py-1 rounded-full font-bold">{bounty.category}</span>
        {bounty.rewardType && (
          <span className="bg-surface-container text-on-surface-variant text-xs px-3 py-1 rounded-full font-bold">{bounty.rewardType}</span>
        )}
      </div>

      <div className="flex justify-between items-center mt-5 pt-4 border-t border-outline-variant">
        <span className="text-xs text-on-surface-variant">
          {bounty.endDate ? timeRemaining(bounty.endDate) : 'No deadline'}
        </span>
        <Button
          label="View Details"
          icon="pi pi-arrow-right"
          iconPos="right"
          text
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/bounties/${bounty.id}`);
          }}
        />
      </div>
    </div>
  );
}
