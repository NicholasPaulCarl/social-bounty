/**
 * Browse Bounties — shared formatting helpers.
 *
 * These power the new BountyCard hierarchy from the Claude Design handoff:
 *  - hashHue(seed)          → stable HSL hue 0..359 for tinted brand avatars
 *  - timeLabel(endDate)     → compact left-time + urgency flag
 *  - formatRewardZAR(value) → "R 1 200" with thin-space grouping
 *  - getFormatIcon(channel) → LucideIcon picked per social channel
 *  - getFormatLabel(channel, format) → "IG Reel" / "TT Video" / "FB Post" pill text
 */

import { Camera, Music2, ThumbsUp, Globe, type LucideIcon } from 'lucide-react';
import { SocialChannel, PostFormat } from '@social-bounty/shared';
import { formatCurrency } from './format';

/** ─────────────────────────────────────────────────────────────
 * hashHue — deterministic 0..359 from any string.
 * Used to colour BrandAvatar discs when the backend hasn't supplied
 * an explicit hue. Same seed always produces the same colour, so a
 * brand keeps its identity across pages. Uses brand.id when present,
 * falls back to brand.name (callers decide).
 * ───────────────────────────────────────────────────────────── */
export function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/** ─────────────────────────────────────────────────────────────
 * timeLabel — compact "Xd left" / "Xh left" / "Xm left" / "Ended".
 * `urgent` is true for < 24h remaining; the card uses it to switch
 * the time row to warning-600 bold per the design.
 * ───────────────────────────────────────────────────────────── */
export interface TimeLabel {
  label: string;
  urgent: boolean;
  ended: boolean;
}

export function timeLabel(endDate: string | null | undefined): TimeLabel | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) return null;
  const diffMs = end - Date.now();
  if (diffMs <= 0) return { label: 'Ended', urgent: false, ended: true };
  const hours = diffMs / 3_600_000;
  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return { label: `${days}d left`, urgent: false, ended: false };
  }
  if (hours >= 1) {
    const h = Math.floor(hours);
    return { label: `${h}h left`, urgent: hours < 24, ended: false };
  }
  const minutes = Math.max(1, Math.floor(hours * 60));
  return { label: `${minutes}m left`, urgent: true, ended: false };
}

/** ─────────────────────────────────────────────────────────────
 * formatRewardZAR — "R 1 200" with thin-space (U+202F) grouping.
 *
 * The design renders rewards as e.g. `R 1 200` (narrow no-break
 * space between R and digits, narrow no-break space as thousands
 * separator). For non-ZAR currencies we fall through to the existing
 * currency formatter so locales stay correct.
 * ───────────────────────────────────────────────────────────── */
export function formatRewardZAR(
  value: string | number | null | undefined,
  currency: string | null | undefined = 'ZAR',
): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return '';
  if ((currency ?? 'ZAR') !== 'ZAR') {
    return formatCurrency(num, currency ?? 'ZAR');
  }
  // Use Intl with grouping then swap commas for narrow no-break spaces.
  const grouped = new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  })
    .format(num)
    .replace(/[,\s\u00A0\u202f]/g, '\u202f');
  return `R\u00A0${grouped}`;
}

/** ─────────────────────────────────────────────────────────────
 * getFormatIcon — Lucide icon per social channel.
 *
 * Lucide 1.8 dropped the brand glyphs (Instagram, TikTok, Facebook)
 * over trademark policy, so we map to neutral semantic stand-ins
 * the same way `ICONS.md` documents for the rest of the app.
 *   INSTAGRAM → Camera
 *   TIKTOK    → Music2
 *   FACEBOOK  → ThumbsUp
 *   (fallback)→ Globe
 * ───────────────────────────────────────────────────────────── */
export function getFormatIcon(channel: SocialChannel | string | null | undefined): LucideIcon {
  switch (channel) {
    case SocialChannel.INSTAGRAM:
      return Camera;
    case SocialChannel.TIKTOK:
      return Music2;
    case SocialChannel.FACEBOOK:
      return ThumbsUp;
    default:
      return Globe;
  }
}

const CHANNEL_SHORT: Record<string, string> = {
  [SocialChannel.INSTAGRAM]: 'IG',
  [SocialChannel.TIKTOK]: 'TT',
  [SocialChannel.FACEBOOK]: 'FB',
};

const FORMAT_SHORT: Record<string, string> = {
  [PostFormat.REEL]: 'Reel',
  [PostFormat.STORY]: 'Story',
  [PostFormat.FEED_POST]: 'Post',
  [PostFormat.VIDEO_POST]: 'Video',
};

/** ─────────────────────────────────────────────────────────────
 * getFormatLabel — short pill text like "IG Reel" / "TT Video".
 * Falls back gracefully when the format is missing — the channel
 * abbreviation alone (e.g. "TT") is enough on a tiny chip.
 * ───────────────────────────────────────────────────────────── */
export function getFormatLabel(
  channel: SocialChannel | string | null | undefined,
  format?: PostFormat | string | null,
): string {
  const c = channel ? (CHANNEL_SHORT[String(channel)] ?? String(channel)) : '';
  const f = format ? (FORMAT_SHORT[String(format)] ?? String(format)) : '';
  return [c, f].filter(Boolean).join(' ').trim();
}
