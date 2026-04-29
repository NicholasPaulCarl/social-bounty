'use client';

import { useRef, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import { BRAND_ASSET_LIMITS } from '@social-bounty/shared';
import type { BrandAssetInfo } from '@social-bounty/shared';
import type { BountyFormAction } from './types';
import { formatBytes } from '@/lib/utils/format';
import { useUploadBrandAssets, useDeleteBrandAsset } from '@/hooks/useBounties';
import { Upload, File as FileIcon, Check, X, Trash2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Slot state
// ---------------------------------------------------------------------------

/** A single document slot in the upload UI. */
export interface UploadSlot {
  /** Stable unique id for React keying. */
  id: number;
  /** Null when the slot is in the empty state. */
  file: File | null;
  /** 0–100 — drives the progress bar. Stays at 100 once done. */
  progress: number;
}

// ---------------------------------------------------------------------------
// Simulated-progress tick
// ---------------------------------------------------------------------------

/**
 * Simulates upload progress from 0 → 100% matching the design's tick loop:
 *   each tick bumps progress by 12–30%, every 140 ms.
 * Resolves once progress hits 100.
 *
 * Trade-off: the bar may reach 100% before or after the real upload
 * finishes. On a fast network the real upload completes first (bar is
 * cosmetic confirmation); on a slow network the bar finishes visually but
 * the form blocks until the API responds. This is an accepted limitation
 * of simulated progress — wiring real XHR progress events is a separate,
 * heavier decision.
 */
export function runSimulatedProgress(
  onTick: (progress: number) => void,
  onComplete: () => void,
): () => void {
  let p = 0;
  let cancelled = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const tick = () => {
    if (cancelled) return;
    p += 12 + Math.random() * 18;
    const clamped = Math.min(p, 100);
    onTick(clamped);
    if (clamped < 100) {
      timerId = setTimeout(tick, 140);
    } else {
      onComplete();
    }
  };

  tick();

  return () => {
    cancelled = true;
    if (timerId !== null) clearTimeout(timerId);
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BrandAssetsSectionProps {
  bountyId: string | null;
  brandAssets: BrandAssetInfo[];
  stagedFiles: File[];
  dispatch: React.Dispatch<BountyFormAction>;
}

const ACCEPT = BRAND_ASSET_LIMITS.ALLOWED_MIME_TYPES.join(',');

let _slotIdCounter = Date.now();
function nextSlotId() {
  return ++_slotIdCounter;
}

export function BrandAssetsSection({ bountyId, brandAssets, stagedFiles, dispatch }: BrandAssetsSectionProps) {
  const upload = useUploadBrandAssets(bountyId ?? '');
  const deleteMutation = useDeleteBrandAsset(bountyId ?? '');

  // Local slot state — presentational layer on top of the dispatch path.
  const [slots, setSlots] = useState<UploadSlot[]>([]);

  // Track cancel callbacks for in-flight progress ticks so we can cancel
  // them when the user removes a slot mid-upload.
  const cancelFns = useRef<Map<number, () => void>>(new Map());

  // Total already-uploaded + staged (reducer) + in-progress slots
  const totalFiles = brandAssets.length + stagedFiles.length + slots.filter((s) => s.file !== null).length;

  // Ref to hidden file inputs keyed by slot id
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleFileChange = useCallback(
    (slotId: number, file: File | null) => {
      if (!file) return;

      // Validate size
      if (file.size > BRAND_ASSET_LIMITS.MAX_FILE_SIZE) {
        return; // silently ignore — same as prior impl
      }

      // Attach the file to the slot (start in uploading state, progress = 0)
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, file, progress: 0 } : s,
        ),
      );

      // Start simulated progress
      const cancel = runSimulatedProgress(
        (p) => {
          setSlots((prev) =>
            prev.map((s) => (s.id === slotId ? { ...s, progress: p } : s)),
          );
        },
        () => {
          cancelFns.current.delete(slotId);
          // Dispatch to reducer on progress complete
          if (bountyId) {
            upload.mutate([file]);
          } else {
            dispatch({ type: 'STAGE_BRAND_ASSET_FILES', payload: [file] });
          }
        },
      );
      cancelFns.current.set(slotId, cancel);
    },
    [bountyId, dispatch, upload],
  );

  const addSlot = useCallback(() => {
    if (totalFiles >= BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY) return;
    const id = nextSlotId();
    setSlots((prev) => [...prev, { id, file: null, progress: 0 }]);
    // Focus the hidden input for the new slot on next tick
    setTimeout(() => {
      inputRefs.current.get(id)?.click();
    }, 0);
  }, [totalFiles]);

  const removeSlot = useCallback(
    (slotId: number) => {
      // Cancel any in-flight progress tick
      cancelFns.current.get(slotId)?.();
      cancelFns.current.delete(slotId);

      setSlots((prev) => {
        const slot = prev.find((s) => s.id === slotId);
        if (slot?.file && slot.progress >= 100) {
          // The file was staged via dispatch — remove it from the reducer too.
          const stagedIdx = stagedFiles.indexOf(slot.file);
          if (stagedIdx !== -1) {
            dispatch({ type: 'REMOVE_STAGED_BRAND_ASSET', payload: stagedIdx });
          }
        }
        return prev.filter((s) => s.id !== slotId);
      });
    },
    [stagedFiles, dispatch],
  );

  const handleDelete = useCallback(
    (assetId: string) => {
      if (!bountyId) return;
      deleteMutation.mutate(assetId);
    },
    [bountyId, deleteMutation],
  );

  const triggerInput = useCallback((slotId: number) => {
    inputRefs.current.get(slotId)?.click();
  }, []);

  // -----------------------------------------------------------------------
  // Derived
  // -----------------------------------------------------------------------

  const canAddMore = totalFiles < BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
        <p className="text-sm text-text-secondary">
          Upload logos, banners, and brand guidelines for Hunters to download.
        </p>
        <span className="text-sm text-text-muted whitespace-nowrap">
          {totalFiles} / {BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY} files
        </span>
      </div>

      {/* Already-uploaded assets (saved on the server) */}
      {brandAssets.length > 0 && (
        <div className="border border-glass-border rounded-md divide-y divide-glass-border">
          {brandAssets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-3 px-4 py-3">
              <FileIcon size={16} strokeWidth={2} className="text-text-muted shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{asset.fileName}</p>
                <p className="text-xs text-text-muted font-mono tabular-nums">{formatBytes(asset.fileSize)}</p>
              </div>
              <Check size={14} strokeWidth={2.5} className="text-emerald-500 shrink-0" />
              <Button
                icon={<Trash2 size={14} strokeWidth={2} />}
                severity="danger"
                text
                size="small"
                className="shrink-0"
                onClick={() => handleDelete(asset.id)}
                loading={deleteMutation.isPending && deleteMutation.variables === asset.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Slot grid — in-progress + staged files */}
      {slots.length > 0 && (
        <div className="grid gap-2">
          {slots.map((slot) => {
            if (!slot.file) {
              // Empty slot — shows a file picker trigger
              return (
                <label
                  key={slot.id}
                  className="flex items-center gap-3 px-4 py-3 border border-dashed border-glass-border rounded-md cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    triggerInput(slot.id);
                  }}
                >
                  <Upload size={16} strokeWidth={2} className="text-text-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-text-secondary">
                      Drop a file or{' '}
                      <span className="text-pink-600 font-semibold">browse</span>
                    </span>
                    <span className="block text-xs text-text-muted font-mono mt-0.5">
                      JPEG · PNG · GIF · WebP · PDF · 20 MB max
                    </span>
                  </div>
                  <input
                    ref={(el) => {
                      if (el) inputRefs.current.set(slot.id, el);
                      else inputRefs.current.delete(slot.id);
                    }}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      handleFileChange(slot.id, file);
                      e.target.value = '';
                    }}
                  />
                </label>
              );
            }

            const isUploading = slot.progress < 100;

            return (
              <div
                key={slot.id}
                className="flex items-center gap-3 px-4 py-3 border border-glass-border rounded-md"
              >
                <FileIcon size={16} strokeWidth={2} className="text-text-muted shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-text-primary truncate">{slot.file.name}</p>
                  <p className="text-xs text-text-muted font-mono tabular-nums">
                    {formatBytes(slot.file.size)}
                    {isUploading
                      ? ` · Uploading ${Math.round(slot.progress)}%`
                      : ' · Uploaded'}
                  </p>
                  {/* Progress bar */}
                  <div className="h-1 bg-pink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-600 transition-all duration-100 ease-out rounded-full"
                      style={{ width: `${slot.progress}%` }}
                    />
                  </div>
                </div>
                {!isUploading && (
                  <Check size={14} strokeWidth={2.5} className="text-emerald-500 shrink-0" />
                )}
                <button
                  type="button"
                  aria-label="Remove file"
                  className="shrink-0 p-1 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  onClick={() => removeSlot(slot.id)}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Primary add-file CTA — shown when no slots exist yet */}
      {slots.length === 0 && canAddMore && (
        <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-glass-border rounded-md cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-colors">
          <Upload size={16} strokeWidth={2} className="text-text-muted shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-sm text-text-secondary">
              Drop a file or{' '}
              <span className="text-pink-600 font-semibold">browse</span>
            </span>
            <span className="block text-xs text-text-muted font-mono mt-0.5">
              JPEG · PNG · GIF · WebP · PDF · 20 MB max
            </span>
          </div>
          <input
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) return;
              const id = nextSlotId();
              setSlots([{ id, file: null, progress: 0 }]);
              setTimeout(() => handleFileChange(id, file), 0);
              e.target.value = '';
            }}
          />
        </label>
      )}

      {/* "Add another file" button — visible when there are active slots and capacity remains */}
      {slots.length > 0 && canAddMore && (
        <Button
          type="button"
          label={`Add another file (${BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY - totalFiles} left)`}
          icon={<Upload size={14} strokeWidth={2} className="mr-1.5" />}
          text
          size="small"
          className="text-sm"
          onClick={addSlot}
        />
      )}

      <small className="text-xs text-text-muted block">
        Accepted: JPEG, PNG, GIF, WebP, PDF. Up to {BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY} files,{' '}
        {formatBytes(BRAND_ASSET_LIMITS.MAX_FILE_SIZE)} each.
      </small>
    </div>
  );
}
