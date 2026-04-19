'use client';

import { useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import {
  RewardType,
  BountyStatus,
  type BountyListItem,
  type SocialChannel,
  type PostFormat,
} from '@social-bounty/shared';
import { FormatChip } from './FormatChip';
import { StatusDot } from './StatusDot';
import {
  formatRewardZAR,
  getFormatIcon,
  getFormatLabel,
} from '@/lib/utils/bounty-format';

/**
 * BountyManageCard — brand-side sibling of `BountyCard`.
 *
 * Same hierarchy + DS as the hunter card so both surfaces feel like one
 * product, but tuned for managing your own bounties:
 *
 *   1. Reward value (mono, pink-600 for CASH, reward-600 otherwise)
 *      with the bounty status dot top-right (DRAFT / LIVE / PAUSED /
 *      CLOSED — not pinned to LIVE like the hunter card)
 *   2. Single-line truncated title
 *   3. Format chips (one per channel × format pair)
 *   4. Footer slot: caller-supplied (typically `<BountyManageActions>`)
 *
 * Differences from the hunter card:
 *  - No brand row (it's always your brand on this surface)
 *  - No Applied/Submitted ribbon (you're the brand, not a hunter)
 *  - No slots-full overlay (brand sees actual status, not vacancy)
 *  - No time-left + access pip footer (replaced by actions row)
 *  - Click target is `/business/bounties/{id}` (not `/bounties/{id}`)
 *
 * Footer is a slot so the page wires its own action row + handlers
 * without the card needing to know about delete dialogs / payment flows.
 */

const STATUS_DOT: Record<BountyStatus, { color: string; label: string }> = {
  [BountyStatus.DRAFT]: { color: 'var(--slate-400)', label: 'DRAFT' },
  [BountyStatus.LIVE]: { color: 'var(--success-500)', label: 'LIVE' },
  [BountyStatus.PAUSED]: { color: 'var(--warning-500)', label: 'PAUSED' },
  [BountyStatus.CLOSED]: { color: 'var(--slate-700)', label: 'CLOSED' },
};

interface BountyManageCardProps {
  bounty: BountyListItem;
  /** Footer slot — typically `<BountyManageActions>`. */
  footer?: ReactNode;
}

export function BountyManageCard({ bounty, footer }: BountyManageCardProps) {
  const router = useRouter();

  const isCash = bounty.rewardType === RewardType.CASH;
  const rewardColor = isCash ? 'var(--pink-600)' : 'var(--reward-600)';
  const dot = STATUS_DOT[bounty.status];

  // Format chips — one per (channel, format) pair on `bounty.channels`.
  const chips = useMemo(() => {
    const out: Array<{ key: string; channel: SocialChannel; format?: PostFormat }> = [];
    if (!bounty.channels) return out;
    (Object.entries(bounty.channels) as Array<[SocialChannel, PostFormat[] | undefined]>).forEach(
      ([channel, formats]) => {
        if (!formats || formats.length === 0) {
          out.push({ key: channel, channel });
          return;
        }
        formats.forEach((format) => {
          out.push({ key: `${channel}_${format}`, channel, format });
        });
      },
    );
    return out;
  }, [bounty.channels]);

  const goToDetail = () => router.push(`/business/bounties/${bounty.id}`);
  const rewardText = formatRewardZAR(bounty.rewardValue, bounty.currency);
  const ariaLabel = `Bounty: ${bounty.title}${rewardText ? `, reward ${rewardText}` : ''}`;

  return (
    <article
      role="article"
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToDetail();
        }
      }}
      className="bounty-card relative flex cursor-pointer flex-col bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
      style={{
        border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-xl)',
        padding: 16,
        gap: 10,
        minHeight: 168,
        boxShadow: 'var(--shadow-level-1)',
        overflow: 'hidden',
      }}
    >
      {/* Row 1 — reward + status dot */}
      <div className="flex items-start justify-between" style={{ gap: 8 }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <div
            className="font-mono tabular-nums"
            style={{
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1,
              color: rewardColor,
              letterSpacing: '-0.02em',
            }}
          >
            {rewardText || '—'}
          </div>
          {!isCash && bounty.rewardType !== RewardType.OTHER && (
            <div
              className="uppercase"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--reward-600)',
                letterSpacing: '0.05em',
                marginTop: 2,
              }}
            >
              {bounty.rewardType === RewardType.PRODUCT ? 'Product value' : 'Service value'}
            </div>
          )}
        </div>
        <StatusDot color={dot.color} label={dot.label} />
      </div>

      {/* Row 2 — title (single-line truncated) */}
      <h3
        className="font-heading text-text-primary"
        style={{
          fontWeight: 600,
          fontSize: 16,
          lineHeight: 1.25,
          margin: 0,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {bounty.title}
      </h3>

      {/* Row 3 — format chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          {chips.map((c) => (
            <FormatChip
              key={c.key}
              Icon={getFormatIcon(c.channel)}
              label={getFormatLabel(c.channel, c.format)}
            />
          ))}
        </div>
      )}

      {/* Spacer pushes footer to the bottom */}
      <div style={{ flex: 1 }} />

      {/* Footer slot — caller supplies the action row */}
      {footer && (
        <div
          className="flex items-center justify-between"
          style={{
            paddingTop: 8,
            borderTop: '1px solid var(--slate-100)',
          }}
        >
          {footer}
        </div>
      )}
    </article>
  );
}
