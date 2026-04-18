'use client';

import { Camera, ThumbsUp, Video, Check, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SocialChannel, PostFormat, CHANNEL_POST_FORMATS } from '@social-bounty/shared';
import type { ChannelSelection } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

// Lucide deliberately ships no brand glyphs beyond a small whitelist — Instagram/
// Facebook/TikTok aren't in it (ICONS.md §"Social brand marks"). We use neutral
// Lucide icons as semantic stand-ins until the brand-icon commission lands.
const CHANNEL_META: { channel: SocialChannel; label: string; Icon: LucideIcon }[] = [
  { channel: SocialChannel.INSTAGRAM, label: 'Instagram', Icon: Camera },
  { channel: SocialChannel.FACEBOOK, label: 'Facebook', Icon: ThumbsUp },
  { channel: SocialChannel.TIKTOK, label: 'TikTok', Icon: Video },
];

const FORMAT_LABELS: Record<PostFormat, string> = {
  [PostFormat.STORY]: 'Story',
  [PostFormat.REEL]: 'Reel',
  [PostFormat.FEED_POST]: 'Feed Post',
  [PostFormat.VIDEO_POST]: 'Video',
};

interface ChannelSelectionSectionProps {
  channels: ChannelSelection;
  dispatch: React.Dispatch<BountyFormAction>;
  errors: Record<string, string>;
  submitAttempted: boolean;
}

export function ChannelSelectionSection({ channels, dispatch, errors, submitAttempted }: ChannelSelectionSectionProps) {
  const isChannelSelected = (ch: SocialChannel) => ch in channels;
  const isFormatSelected = (ch: SocialChannel, fmt: PostFormat) => channels[ch]?.includes(fmt) ?? false;

  const toggleChannel = (ch: SocialChannel) => {
    const formats = CHANNEL_POST_FORMATS[ch];
    dispatch({ type: 'TOGGLE_CHANNEL', payload: { channel: ch, formats } });
  };

  const toggleFormat = (ch: SocialChannel, fmt: PostFormat) => {
    dispatch({ type: 'TOGGLE_FORMAT', payload: { channel: ch, format: fmt } });
  };

  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-2">
        Social Platforms <span className="text-danger-600">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CHANNEL_META.map(({ channel, label, Icon }) => {
          const selected = isChannelSelected(channel);
          const formats = CHANNEL_POST_FORMATS[channel];
          return (
            <div
              key={channel}
              className={`border rounded-lg p-4 transition-colors ${
                selected
                  ? 'border-2 border-pink-600 bg-pink-600/10'
                  : 'border-glass-border bg-surface hover:border-pink-600'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleChannel(channel)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected
                    ? 'border-pink-600 bg-pink-600'
                    : 'border-glass-border bg-white'
                }`}>
                  {selected && <Check size={12} strokeWidth={3} className="text-white" />}
                </div>
                <Icon size={20} strokeWidth={2} className={selected ? 'text-pink-600' : 'text-text-muted'} />
                <span className={`text-sm font-medium ${selected ? 'text-pink-600' : 'text-text-primary'}`}>
                  {label}
                </span>
              </button>
              {selected && (
                <div className="flex flex-wrap gap-2 mt-3 ml-8">
                  {formats.map((fmt) => {
                    const fmtSelected = isFormatSelected(channel, fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => toggleFormat(channel, fmt)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                          fmtSelected
                            ? 'border-pink-600 bg-pink-600 text-white'
                            : 'border-glass-border bg-white text-text-primary hover:border-pink-600'
                        }`}
                      >
                        {fmtSelected && <Check size={12} strokeWidth={3} />}
                        {FORMAT_LABELS[fmt]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {submitAttempted && errors.channels && (
        <small className="text-xs text-danger-600 mt-2 flex items-center gap-1">
          <AlertCircle size={12} strokeWidth={2} />
          {errors.channels}
        </small>
      )}
    </div>
  );
}
