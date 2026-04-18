'use client';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { VerifiedLinkInput } from '@/components/common/VerifiedLinkInput';
import { SocialChannel } from '@social-bounty/shared';

interface SocialLinkData {
  platform: SocialChannel;
  url: string;
  handle: string;
  followerCount: number;
  postCount: number;
}

interface SocialLinkInputProps {
  platform: SocialChannel;
  url: string;
  handle: string;
  followerCount: number;
  postCount: number;
  onChange: (data: SocialLinkData) => void;
  onRemove: () => void;
}

const PLATFORM_ICONS: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'pi pi-instagram',
  [SocialChannel.TIKTOK]: 'pi pi-tiktok',
  [SocialChannel.FACEBOOK]: 'pi pi-facebook',
};

const PLATFORM_COLORS: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'text-pink-400',
  [SocialChannel.TIKTOK]: 'text-pink-600',
  [SocialChannel.FACEBOOK]: 'text-blue-400',
};

const PLATFORM_LABELS: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'Instagram',
  [SocialChannel.TIKTOK]: 'TikTok',
  [SocialChannel.FACEBOOK]: 'Facebook',
};

export function SocialLinkInput({
  platform,
  url,
  handle,
  followerCount,
  postCount,
  onChange,
  onRemove,
}: SocialLinkInputProps) {
  const update = (field: keyof SocialLinkData, value: string | number) => {
    onChange({ platform, url, handle, followerCount, postCount, [field]: value });
  };

  const iconClass = PLATFORM_ICONS[platform] ?? 'pi pi-link';
  const colorClass = PLATFORM_COLORS[platform] ?? 'text-text-muted';
  const label = PLATFORM_LABELS[platform] ?? platform;

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header: platform label + remove button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`${iconClass} ${colorClass} text-lg`} />
          <span className="text-text-primary font-heading font-semibold text-sm">{label}</span>
        </div>
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          size="small"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="!p-1.5"
        />
      </div>

      {/* Profile URL with live verification */}
      <div>
        <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
          Profile URL
        </label>
        <VerifiedLinkInput
          value={url}
          onChange={(val) => update('url', val)}
          placeholder={`https://${label.toLowerCase()}.com/yourprofile`}
        />
      </div>

      {/* Handle */}
      <div>
        <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
          Handle
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm select-none pointer-events-none">
            @
          </span>
          <InputText
            value={handle}
            onChange={(e) => update('handle', e.target.value)}
            placeholder="username"
            className="w-full !pl-7"
          />
        </div>
      </div>

      {/* Follower count + post count */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
            Followers
          </label>
          <InputText
            value={followerCount === 0 ? '' : String(followerCount)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              update('followerCount', isNaN(val) ? 0 : val);
            }}
            placeholder="0"
            keyfilter="int"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
            Posts
          </label>
          <InputText
            value={postCount === 0 ? '' : String(postCount)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              update('postCount', isNaN(val) ? 0 : val);
            }}
            placeholder="0"
            keyfilter="int"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
