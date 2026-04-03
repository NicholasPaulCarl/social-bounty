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
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Upload logos, banners, and brand guidelines for Hunters to download.
        </p>
        <span className="text-sm text-text-muted whitespace-nowrap ml-4">
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
          chooseLabel="Upload Files"
          chooseOptions={{ icon: 'pi pi-upload', className: 'p-button-outlined' }}
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
            <div key={`staged-${index}`} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <i className={`pi ${file.type === 'application/pdf' ? 'pi-file-pdf' : 'pi-image'} text-text-muted`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatBytes(file.size)}</p>
                </div>
                <Tag value="Pending" severity="warning" className="ml-2" />
              </div>
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                size="small"
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
            <div key={asset.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <i className={`pi ${asset.mimeType === 'application/pdf' ? 'pi-file-pdf' : 'pi-image'} text-text-muted`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{asset.fileName}</p>
                  <p className="text-xs text-text-muted">{formatBytes(asset.fileSize)}</p>
                </div>
              </div>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                onClick={() => handleDelete(asset.id)}
                loading={deleteMutation.isPending && deleteMutation.variables === asset.id}
              />
            </div>
          ))}
        </div>
      )}

      <small className="text-xs text-text-muted block">
        Accepted: JPEG, PNG, GIF, WebP, PDF. Max {formatBytes(BRAND_ASSET_LIMITS.MAX_FILE_SIZE)} per file.
      </small>
    </div>
  );
}
