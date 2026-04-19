'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { BadgeCheck, Clock, Globe, Lock, Users } from 'lucide-react';
import {
  RewardType,
  BountyAccessType,
  type BountyListItem,
  type SocialChannel,
  type PostFormat,
} from '@social-bounty/shared';
import { BrandAvatar } from './BrandAvatar';
import { FormatChip } from './FormatChip';
import { StatusDot } from './StatusDot';
import {
  formatRewardZAR,
  getFormatIcon,
  getFormatLabel,
  hashHue,
  timeLabel,
} from '@/lib/utils/bounty-format';

/**
 * BountyCard — the heart of the Browse Bounties page.
 *
 * Per the Claude Design handoff (`bounty-card.jsx`). Hierarchy from top:
 *   1. Reward value (mono, pink-600 for CASH, reward-600 otherwise)
 *   2. Brand row (tinted disc + name + optional verified tick)
 *   3. Single-line truncated title
 *   4. Format chips (one per channel × format pair)
 *   5. Footer: time-left (warning-600 + bold when <24h) + access pip
 *
 * Optional Applied/Submitted ribbon (top-right) and slots-full overlay
 * ("Apply closed" + "View results →") render conditionally.
 *
 * Forward-compat: reads `userHasApplied` / `userHasSubmitted` /
 * `brand.verified` / `brand.hue` via `unknown` cast — these aren't on the
 * DTO yet (R-tracked backend ticket). Until they ship the optional chain
 * falls through and the card renders cleanly.
 */
interface BountyCardProps {
  bounty: BountyListItem;
}

// Forward-compat shape — backend ticket pending. See plan §"Out (deferred)".
type ForwardCompat = BountyListItem & {
  userHasApplied?: boolean;
  userHasSubmitted?: boolean;
  brand: BountyListItem['brand'] & { verified?: boolean; hue?: number };
};

export function BountyCard({ bounty }: BountyCardProps) {
  const router = useRouter();
  const fc = bounty as ForwardCompat;

  const isCash = bounty.rewardType === RewardType.CASH;
  const rewardColor = isCash ? 'var(--pink-600)' : 'var(--reward-600)';

  // Slots derived from existing fields; backend has no slot model.
  const slotsTotal = bounty.maxSubmissions;
  const slotsRemaining =
    slotsTotal != null ? Math.max(0, slotsTotal - bounty.submissionCount) : null;
  const slotsFull = slotsRemaining === 0;

  const time = useMemo(() => timeLabel(bounty.endDate), [bounty.endDate]);
  const isClosed = slotsFull || time?.ended === true;
  const isApplied = fc.userHasApplied === true && !fc.userHasSubmitted;
  const isSubmitted = fc.userHasSubmitted === true;

  // Access pip: closed bounty wins, then slot-capped, then open.
  const access = (() => {
    if (bounty.accessType === BountyAccessType.CLOSED) {
      return { Icon: Lock, label: 'Apply', color: 'var(--warning-600)' };
    }
    if (slotsTotal != null) {
      return {
        Icon: Users,
        label: `${slotsRemaining}/${slotsTotal} slots`,
        color: 'var(--slate-500)',
      };
    }
    return { Icon: Globe, label: 'Open', color: 'var(--success-600)' };
  })();

  // Format chips — one per (channel, format) pair on `bounty.channels`.
  // Falls back to channel-only chip when a channel has no formats listed.
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

  const goToDetail = () => router.push(`/bounties/${bounty.id}`);
  const goToResults = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    router.push(`/bounties/${bounty.id}`);
  };

  const rewardText = formatRewardZAR(bounty.rewardValue, bounty.currency);
  const ariaLabel = `Bounty: ${bounty.title}${rewardText ? `, reward ${rewardText}` : ''}`;
  const brandHue = fc.brand.hue ?? hashHue(fc.brand.id ?? fc.brand.name ?? '');

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
        opacity: isSubmitted ? 0.72 : 1,
        overflow: 'hidden',
      }}
    >
      {/* Ribbon — APPLIED / SUBMITTED */}
      {(isApplied || isSubmitted) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: isSubmitted ? 'var(--slate-700)' : 'var(--pink-600)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '4px 10px',
            borderBottomLeftRadius: 8,
            textTransform: 'uppercase',
          }}
        >
          {isSubmitted ? 'Submitted' : 'Applied'}
        </div>
      )}

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
              textDecoration: isClosed ? 'line-through' : 'none',
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
        <StatusDot />
      </div>

      {/* Row 2 — brand */}
      <div className="flex items-center" style={{ gap: 8, marginTop: -2 }}>
        <BrandAvatar name={fc.brand.name} hue={brandHue} />
        <span
          className="text-text-secondary"
          style={{
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 180,
          }}
        >
          {fc.brand.name}
        </span>
        {fc.brand.verified === true && (
          <span style={{ color: 'var(--pink-600)', display: 'inline-flex' }}>
            <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Row 3 — title (single-line truncated) */}
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

      {/* Row 4 — format chips */}
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

      {/* Row 5 — footer: time + access pip */}
      <div
        className="flex items-center justify-between"
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          paddingTop: 8,
          borderTop: '1px solid var(--slate-100)',
        }}
      >
        {time ? (
          <span
            className="inline-flex items-center"
            style={{
              gap: 4,
              color: time.urgent ? 'var(--warning-600)' : 'var(--text-secondary)',
              fontWeight: time.urgent ? 700 : 500,
            }}
          >
            <Clock size={12} strokeWidth={2} aria-hidden="true" />
            {time.label}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No deadline</span>
        )}
        <span
          className="inline-flex items-center"
          style={{ gap: 4, color: access.color, fontWeight: 500 }}
        >
          <access.Icon size={12} strokeWidth={2} aria-hidden="true" />
          {access.label}
        </span>
      </div>

      {/* Slots-full / closed overlay */}
      {isClosed && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(2px)',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          <div
            className="font-heading text-slate-800"
            style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}
          >
            Apply closed
          </div>
          <a
            href={`/bounties/${bounty.id}`}
            onClick={goToResults}
            className="text-pink-600"
            style={{
              fontSize: 12,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              pointerEvents: 'auto',
            }}
          >
            View results →
          </a>
        </div>
      )}
    </article>
  );
}
