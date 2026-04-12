'use client';

import { Checkbox } from 'primereact/checkbox';
import { SocialChannel, PostFormat, CHANNEL_POST_FORMATS } from '@social-bounty/shared';
import type { ChannelSelection } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

const CHANNEL_META: { channel: SocialChannel; label: string; icon: string }[] = [
  { channel: SocialChannel.INSTAGRAM, label: 'Instagram', icon: 'pi-instagram' },
  { channel: SocialChannel.FACEBOOK, label: 'Facebook', icon: 'pi-facebook' },
  { channel: SocialChannel.TIKTOK, label: 'TikTok', icon: 'pi-video' },
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CHANNEL_META.map(({ channel, label, icon }) => {
          const selected = isChannelSelected(channel);
          const formats = CHANNEL_POST_FORMATS[channel];
          return (
            <div
              key={channel}
              role="button"
              tabIndex={0}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selected
                  ? 'border-2 border-accent-cyan bg-accent-cyan/10'
                  : 'border-glass-border bg-surface hover:border-accent-cyan'
              }`}
              onClick={(e) => {
                // Only toggle if the click didn't come from a nested checkbox
                if ((e.target as HTMLElement).closest('.p-checkbox')) return;
                toggleChannel(channel);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChannel(channel); } }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  inputId={`channel-${channel}`}
                  checked={selected}
                  onChange={() => toggleChannel(channel)}
                />
                <i className={`pi ${icon} text-lg ${selected ? 'text-accent-cyan' : 'text-text-muted'}`} />
                <span className={`text-sm font-medium ${selected ? 'text-accent-cyan' : 'text-text-primary'}`}>
                  {label}
                </span>
              </div>
              {selected && (
                <div className="flex flex-wrap gap-3 mt-3 ml-8" onClick={(e) => e.stopPropagation()}>
                  {formats.map((fmt) => (
                    <div key={fmt} className="flex items-center gap-2">
                      <Checkbox
                        inputId={`format-${channel}-${fmt}`}
                        checked={isFormatSelected(channel, fmt)}
                        onChange={() => toggleFormat(channel, fmt)}
                      />
                      <label htmlFor={`format-${channel}-${fmt}`} className="text-sm text-text-primary cursor-pointer">{FORMAT_LABELS[fmt]}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {submitAttempted && errors.channels && (
        <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
          <i className="pi pi-exclamation-circle text-xs" />
          {errors.channels}
        </small>
      )}
    </>
  );
}
