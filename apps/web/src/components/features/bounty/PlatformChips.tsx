'use client';

import { Camera, ThumbsUp, Video, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SocialChannel } from '@social-bounty/shared';

/**
 * PlatformChips — small icon-only chips for each social channel in a
 * `BountyListItem.channels` record.
 *
 * Uses the Lucide semantic stand-ins established by the `ui-ds-apply` pass
 * (Lucide 1.8 dropped brand trademark icons):
 *   INSTAGRAM → Camera
 *   FACEBOOK  → ThumbsUp
 *   TIKTOK    → Video
 *   (fallback) → Globe
 *
 * Chip style matches the QuickCreateGrid platform chips for visual
 * consistency across the bounty hub: pink-50 background / pink-600 icon /
 * rounded-full / 20×20px (default).
 */

const ICON_MAP: Record<string, LucideIcon> = {
  [SocialChannel.INSTAGRAM]: Camera,
  [SocialChannel.FACEBOOK]: ThumbsUp,
  [SocialChannel.TIKTOK]: Video,
};

const CHANNEL_LABEL: Record<string, string> = {
  [SocialChannel.INSTAGRAM]: 'Instagram',
  [SocialChannel.FACEBOOK]: 'Facebook',
  [SocialChannel.TIKTOK]: 'TikTok',
};

interface PlatformChipsProps {
  channels: Record<string, unknown> | null | undefined;
  /** Icon size in pixels. Default 14. */
  size?: number;
}

export function PlatformChips({ channels, size = 14 }: PlatformChipsProps) {
  if (!channels) return null;

  const keys = Object.keys(channels);
  if (keys.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1" aria-label="Platforms">
      {keys.map((channel) => {
        const Icon = ICON_MAP[channel] ?? Globe;
        const label = CHANNEL_LABEL[channel] ?? channel;
        return (
          <span
            key={channel}
            aria-label={label}
            title={label}
            className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-600"
            style={{ width: size + 6, height: size + 6, flexShrink: 0 }}
          >
            <Icon size={size - 2} strokeWidth={2} aria-hidden="true" />
          </span>
        );
      })}
    </span>
  );
}
