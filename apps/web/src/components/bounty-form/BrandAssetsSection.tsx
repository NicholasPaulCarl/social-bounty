'use client';

import { useRef } from 'react';
import { FileUpload, type FileUploadSelectEvent } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BRAND_ASSET_LIMITS } from '@social-bounty/shared';
import type { BrandAssetInfo } from '@social-bounty/shared';
import type { BountyFormAction } from './types';
import { formatBytes } from '@/lib/utils/format';
import { useUploadBrandAssets, useDeleteBrandAsset } from '@/hooks/useBounties';
import { Upload, X, Trash2, File as FileIcon, Image as ImageIcon } from 'lucide-react';

interface BrandAssetsSectionProps {
  bountyId: string | null;
  brandAssets: BrandAssetInfo[];
  stagedFiles: File[];
  dispatch: React.Dispatch<BountyFormAction>;
}

const ACCEPT = BRAND_ASSET_LIMITS.ALLOWED_MIME_TYPES.join(',');

export function BrandAssetsSection({ bountyId, brandAssets, stagedFiles, dispatch }: BrandAssetsSectionProps) {
  const fileUploadRef = useRef<FileUpload>(null);
  const upload = useUploadBrandAssets(bountyId ?? '');
  const deleteMutation = useDeleteBrandAsset(bountyId ?? '');

  const totalFiles = brandAssets.length + stagedFiles.length;
  const remaining = BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY - totalFiles;

  const handleSelect = (e: FileUploadSelectEvent) => {
    const files = Array.from(e.files) as File[];
    if (files.length === 0) return;

    if (files.length > remaining) {
      fileUploadRef.current?.clear();
      return;
    }

    if (bountyId) {
      // Direct upload when bountyId exists
      upload.mutate(files, {
        onSuccess: () => fileUploadRef.current?.clear(),
        onError: () => fileUploadRef.current?.clear(),
      });
    } else {
      // Stage files locally when no bountyId yet
      dispatch({ type: 'STAGE_BRAND_ASSET_FILES', payload: files });
      fileUploadRef.current?.clear();
    }
  };

  const handleDelete = (assetId: string) => {
    if (!bountyId) return;
    deleteMutation.mutate(assetId);
  };

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

      {remaining > 0 && (
        <FileUpload
          ref={fileUploadRef}
          mode="basic"
          name="files"
          accept={ACCEPT}
          maxFileSize={BRAND_ASSET_LIMITS.MAX_FILE_SIZE}
          multiple
          auto
          chooseLabel="Upload files"
          chooseOptions={{ icon: <Upload size={16} strokeWidth={2} />, className: 'p-button-outlined' }}
          onSelect={handleSelect}
          disabled={bountyId ? upload.isPending : false}
        />
      )}

      {bountyId && upload.isPending && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <ProgressSpinner style={{ width: '20px', height: '20px' }} strokeWidth="4" />
          <span>Uploading...</span>
        </div>
      )}

      {/* Staged files (pending upload) */}
      {stagedFiles.length > 0 && (
        <div className="border border-glass-border rounded-md divide-y divide-glass-border">
          {stagedFiles.map((file, index) => (
            <div key={`staged-${index}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {file.type === 'application/pdf' ? (
                  <FileIcon size={16} strokeWidth={2} className="text-text-muted shrink-0" />
                ) : (
                  <ImageIcon size={16} strokeWidth={2} className="text-text-muted shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-text-muted font-mono tabular-nums">{formatBytes(file.size)}</p>
                    <Tag value="Pending" severity="warning" className="text-xs py-0 px-1.5 shrink-0" />
                  </div>
                </div>
              </div>
              <Button
                icon={<X size={14} strokeWidth={2} />}
                severity="danger"
                text
                size="small"
                className="shrink-0"
                onClick={() => dispatch({ type: 'REMOVE_STAGED_BRAND_ASSET', payload: index })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Already-uploaded assets */}
      {brandAssets.length > 0 && (
        <div className="border border-glass-border rounded-md divide-y divide-glass-border">
          {brandAssets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {asset.mimeType === 'application/pdf' ? (
                  <FileIcon size={16} strokeWidth={2} className="text-text-muted shrink-0" />
                ) : (
                  <ImageIcon size={16} strokeWidth={2} className="text-text-muted shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{asset.fileName}</p>
                  <p className="text-xs text-text-muted font-mono tabular-nums">{formatBytes(asset.fileSize)}</p>
                </div>
              </div>
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

      <small className="text-xs text-text-muted block">
        Accepted: JPEG, PNG, GIF, WebP, PDF. Up to {BRAND_ASSET_LIMITS.MAX_FILES_PER_BOUNTY} files, {formatBytes(BRAND_ASSET_LIMITS.MAX_FILE_SIZE)} each.
      </small>
    </div>
  );
}
