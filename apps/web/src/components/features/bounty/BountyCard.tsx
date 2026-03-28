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
      className="glass-card p-5 cursor-pointer hover:-translate-y-1 hover:shadow-glow-cyan/30 transition-all duration-250 group"
      onClick={() => router.push(`/bounties/${bounty.id}`)}
      role="article"
    >
      {/* Header: Status + Reward */}
      <div className="flex items-center justify-between mb-4">
        <StatusBadge type="bounty" value={bounty.status} size="small" />
        {bounty.rewardValue && (
          <span className="text-lg font-heading font-bold text-accent-emerald">
            {formatCurrency(bounty.rewardValue)}
          </span>
        )}
      </div>

      {/* Title + Description */}
      <h3 className="text-base font-heading font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-accent-cyan transition-colors">
        {bounty.title}
      </h3>
      <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
        {bounty.shortDescription}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-3">
        {bounty.category && (
          <span className="text-xs text-text-muted bg-elevated px-2 py-0.5 rounded-full">
            {bounty.category}
          </span>
        )}
        {bounty.rewardType && (
          <span className="text-xs text-text-muted bg-elevated px-2 py-0.5 rounded-full">
            {bounty.rewardType}
          </span>
        )}
      </div>

      {/* Footer: Time + CTA */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-glass-border">
        <span className="text-xs text-text-muted">
          {bounty.endDate ? timeRemaining(bounty.endDate) : 'No deadline'}
        </span>
        <Button
          label="View"
          icon="pi pi-arrow-right"
          iconPos="right"
          text
          size="small"
          className="text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/bounties/${bounty.id}`);
          }}
        />
      </div>
    </div>
  );
}
