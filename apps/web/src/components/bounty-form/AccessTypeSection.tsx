'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { BountyAccessType } from '@social-bounty/shared';
import type { HunterListItem } from '@social-bounty/shared';
import { hunterApi } from '@/lib/api/hunters';
import { getUploadUrl } from '@/lib/api/client';
import type { BountyFormAction } from './types';

interface AccessTypeSectionProps {
  accessType: BountyAccessType;
  selectedHunters: Array<{ id: string; firstName: string; lastName: string; profilePictureUrl: string | null }>;
  dispatch: React.Dispatch<BountyFormAction>;
}

export function AccessTypeSection({ accessType, selectedHunters, dispatch }: AccessTypeSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HunterListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await hunterApi.listHunters({ search: searchQuery.trim(), limit: 10 });
        // Filter out already-selected hunters
        const filtered = res.data.filter(
          (h) => !selectedHunters.some((s) => s.id === h.id),
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedHunters]);

  function handleSelectHunter(hunter: HunterListItem) {
    dispatch({
      type: 'ADD_SELECTED_HUNTER',
      payload: {
        id: hunter.id,
        firstName: hunter.firstName,
        lastName: hunter.lastName,
        profilePictureUrl: hunter.profilePictureUrl,
      },
    });
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
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

      {/* Hunter search — only shown when CLOSED */}
      {accessType === BountyAccessType.CLOSED && (
        <div className="space-y-4 pt-1">
          <div className="h-px bg-glass-border" />

          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Invite Hunters <span className="text-text-muted font-normal normal-case">(optional)</span>
            </label>
            <p className="text-xs text-text-secondary mb-3">
              Search for hunters on Social Bounty by name or handle to invite them.
            </p>

            <div className="relative" ref={wrapperRef}>
              <span className="p-input-icon-left w-full">
                <i className={`pi ${isSearching ? 'pi-spin pi-spinner' : 'pi-search'}`} />
                <InputText
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  placeholder="Search by name or handle..."
                  className="w-full"
                />
              </span>

              {/* Search results dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 border border-glass-border rounded-lg bg-white shadow-level-3 max-h-60 overflow-y-auto">
                  {searchResults.map((hunter) => (
                    <button
                      key={hunter.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left border-b border-glass-border last:border-b-0"
                      onClick={() => handleSelectHunter(hunter)}
                    >
                      {hunter.profilePictureUrl ? (
                        <img
                          src={getUploadUrl(hunter.profilePictureUrl) ?? ''}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center shrink-0">
                          <i className="pi pi-user text-accent-cyan text-xs" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {hunter.firstName} {hunter.lastName}
                        </p>
                        {hunter.socialLinks.length > 0 && (
                          <p className="text-xs text-text-muted truncate">
                            @{hunter.socialLinks[0].handle}
                          </p>
                        )}
                      </div>
                      <i className="pi pi-plus text-text-muted text-xs shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="absolute z-50 w-full mt-1 border border-glass-border rounded-lg bg-white shadow-level-3 px-4 py-3">
                  <p className="text-sm text-text-muted text-center">No hunters found</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected hunters */}
          {selectedHunters.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted font-medium">
                {selectedHunters.length} hunter{selectedHunters.length !== 1 ? 's' : ''} selected
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedHunters.map((hunter) => (
                  <div
                    key={hunter.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-abyss border border-glass-border"
                  >
                    <div className="flex items-center gap-2">
                      {hunter.profilePictureUrl ? (
                        <img
                          src={getUploadUrl(hunter.profilePictureUrl) ?? ''}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                          <i className="pi pi-user text-accent-cyan text-[10px]" />
                        </div>
                      )}
                      <span className="text-sm text-text-primary font-medium">
                        {hunter.firstName} {hunter.lastName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      icon="pi pi-times"
                      text
                      size="small"
                      severity="secondary"
                      className="w-7 h-7"
                      onClick={() => dispatch({ type: 'REMOVE_SELECTED_HUNTER', payload: hunter.id })}
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
