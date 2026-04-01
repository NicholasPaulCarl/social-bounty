'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { BountyAccessType, SocialPlatform } from '@social-bounty/shared';
import type { BountyFormAction } from './types';

const PLATFORM_OPTIONS = [
  { label: 'X (Twitter)', value: SocialPlatform.X },
  { label: 'Instagram', value: SocialPlatform.INSTAGRAM },
  { label: 'Facebook', value: SocialPlatform.FACEBOOK },
  { label: 'TikTok', value: SocialPlatform.TIKTOK },
];

const PLATFORM_LABELS: Record<string, string> = {
  [SocialPlatform.X]: 'X',
  [SocialPlatform.INSTAGRAM]: 'Instagram',
  [SocialPlatform.FACEBOOK]: 'Facebook',
  [SocialPlatform.TIKTOK]: 'TikTok',
};

interface AccessTypeSectionProps {
  accessType: BountyAccessType;
  invitations: Array<{ platform: SocialPlatform; handle: string }>;
  dispatch: React.Dispatch<BountyFormAction>;
}

export function AccessTypeSection({ accessType, invitations, dispatch }: AccessTypeSectionProps) {
  const [invPlatform, setInvPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
  const [invHandle, setInvHandle] = useState('');
  const [invError, setInvError] = useState('');

  function handleAddInvitation() {
    setInvError('');
    const trimmed = invHandle.trim().replace(/^@/, '');
    if (!trimmed) {
      setInvError('Please enter a handle.');
      return;
    }
    const already = invitations.some(
      (i) => i.platform === invPlatform && i.handle.toLowerCase() === trimmed.toLowerCase(),
    );
    if (already) {
      setInvError('This handle is already in the list.');
      return;
    }
    dispatch({ type: 'ADD_INVITATION', payload: { platform: invPlatform, handle: trimmed } });
    setInvHandle('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInvitation();
    }
  }

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div>
        <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-3">
          Access Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_ACCESS_TYPE', payload: BountyAccessType.PUBLIC })}
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
              accessType === BountyAccessType.PUBLIC
                ? 'border-accent-emerald/60 bg-accent-emerald/8 text-text-primary'
                : 'border-glass-border bg-white/2 text-text-secondary hover:border-glass-border/80 hover:bg-white/4'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              accessType === BountyAccessType.PUBLIC ? 'bg-accent-emerald/20' : 'bg-white/5'
            }`}>
              <i className={`pi pi-globe text-sm ${accessType === BountyAccessType.PUBLIC ? 'text-accent-emerald' : 'text-text-muted'}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Open</p>
              <p className="text-xs text-text-muted mt-0.5">Anyone can participate</p>
            </div>
            {accessType === BountyAccessType.PUBLIC && (
              <i className="pi pi-check ml-auto text-accent-emerald text-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_ACCESS_TYPE', payload: BountyAccessType.CLOSED })}
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
              accessType === BountyAccessType.CLOSED
                ? 'border-accent-amber/60 bg-accent-amber/8 text-text-primary'
                : 'border-glass-border bg-white/2 text-text-secondary hover:border-glass-border/80 hover:bg-white/4'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              accessType === BountyAccessType.CLOSED ? 'bg-accent-amber/20' : 'bg-white/5'
            }`}>
              <i className={`pi pi-lock text-sm ${accessType === BountyAccessType.CLOSED ? 'text-accent-amber' : 'text-text-muted'}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Apply Only</p>
              <p className="text-xs text-text-muted mt-0.5">Hunters must apply or be invited</p>
            </div>
            {accessType === BountyAccessType.CLOSED && (
              <i className="pi pi-check ml-auto text-accent-amber text-sm" />
            )}
          </button>
        </div>
      </div>

      {/* Invitation section — only shown when CLOSED */}
      {accessType === BountyAccessType.CLOSED && (
        <div className="space-y-4 pt-1">
          <div className="h-px bg-glass-border" />

          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Pre-invite Hunters <span className="text-text-muted font-normal normal-case">(optional)</span>
            </label>
            <p className="text-xs text-text-secondary mb-3">
              Invite specific social media accounts before the bounty goes live.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Dropdown
                value={invPlatform}
                options={PLATFORM_OPTIONS}
                onChange={(e) => setInvPlatform(e.value)}
                className="w-full sm:w-40 flex-shrink-0"
                placeholder="Platform"
              />
              <div className="flex flex-1 gap-2">
                <span className="p-input-icon-left flex-1">
                  <i className="pi pi-at" />
                  <InputText
                    value={invHandle}
                    onChange={(e) => setInvHandle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="username"
                    className={`w-full ${invError ? 'p-invalid' : ''}`}
                  />
                </span>
                <Button
                  type="button"
                  icon="pi pi-plus"
                  outlined
                  onClick={handleAddInvitation}
                  className="flex-shrink-0"
                  tooltip="Add to invite list"
                />
              </div>
            </div>

            {invError && (
              <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
                <i className="pi pi-exclamation-circle text-xs" />
                {invError}
              </small>
            )}
          </div>

          {/* Invitation list */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted font-medium">
                {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} queued
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {invitations.map((inv, idx) => (
                  <div
                    key={`${inv.platform}-${inv.handle}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/3 border border-glass-border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                        {PLATFORM_LABELS[inv.platform]}
                      </span>
                      <span className="text-sm text-text-primary font-medium">@{inv.handle}</span>
                    </div>
                    <Button
                      type="button"
                      icon="pi pi-times"
                      text
                      size="small"
                      severity="secondary"
                      className="w-7 h-7"
                      onClick={() => dispatch({ type: 'REMOVE_INVITATION', payload: idx })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
