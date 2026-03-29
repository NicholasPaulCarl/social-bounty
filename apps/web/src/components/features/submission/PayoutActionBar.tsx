'use client';

import { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { FileUpload } from 'primereact/fileupload';
import type { FileUploadHandlerEvent } from 'primereact/fileupload';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { PayoutStatus } from '@social-bounty/shared';

interface PayoutActionBarProps {
  currentPayoutStatus: PayoutStatus;
  onAction: (newStatus: PayoutStatus, note?: string) => void;
  loading?: boolean;
}

export function PayoutActionBar({ currentPayoutStatus, onAction, loading = false }: PayoutActionBarProps) {
  const [note, setNote] = useState('');
  const [showConfirmPaid, setShowConfirmPaid] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const fileUploadRef = useRef<FileUpload>(null);

  if (currentPayoutStatus === PayoutStatus.PAID) {
    return null;
  }

  const handleProofSelect = (e: { files: File[] }) => {
    setProofFiles(e.files);
  };

  const handleProofClear = () => {
    setProofFiles([]);
  };

  // Custom upload handler — files are held locally until "Mark as Paid" is confirmed
  const handleCustomUpload = (_e: FileUploadHandlerEvent) => {
    // No-op: files are already captured via onSelect; upload occurs on payout confirmation
  };

  return (
    <>
      <Card className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Payout Actions</h3>

          <div>
            <label htmlFor="payout-note" className="block text-sm font-medium text-text-secondary mb-2">
              Note (optional)
            </label>
            <InputTextarea
              id="payout-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full"
              placeholder="Add a payout note..."
            />
          </div>

          {/* Proof of Payment upload — shown when about to mark as paid */}
          <div className="glass-card p-4 space-y-2">
            <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
              Proof of Payment
              <span className="ml-1 normal-case text-text-muted font-normal">(optional)</span>
            </label>
            <p className="text-xs text-text-muted mb-2">
              Upload a screenshot or receipt confirming the payment was sent.
            </p>
            <FileUpload
              ref={fileUploadRef}
              name="proofOfPayment"
              accept="image/*,application/pdf"
              maxFileSize={5000000}
              multiple
              customUpload
              uploadHandler={handleCustomUpload}
              onSelect={handleProofSelect}
              onClear={handleProofClear}
              onRemove={() => {
                // Re-sync files from the upload component's internal state after individual removal
                if (fileUploadRef.current) {
                  const remaining = (fileUploadRef.current as unknown as { files: File[] }).files ?? [];
                  setProofFiles(remaining);
                }
              }}
              chooseLabel="Attach Files"
              uploadLabel="Stage"
              cancelLabel="Clear"
              emptyTemplate={
                <div className="flex flex-col items-center justify-center py-4 text-text-muted">
                  <i className="pi pi-file-import text-2xl mb-2" />
                  <span className="text-sm">Drag &amp; drop files here, or click Attach Files</span>
                </div>
              }
              className="w-full"
              pt={{
                root: { className: 'border border-glass-border rounded-lg bg-transparent' },
                buttonbar: { className: 'bg-transparent border-b border-glass-border px-3 py-2 rounded-t-lg' },
                content: { className: 'bg-transparent p-3' },
              }}
            />
            {proofFiles.length > 0 && (
              <p className="text-xs text-accent-cyan mt-1">
                {proofFiles.length} file{proofFiles.length > 1 ? 's' : ''} ready to attach
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {currentPayoutStatus === PayoutStatus.NOT_PAID && (
              <Button
                label="Mark as Pending"
                icon="pi pi-clock"
                severity="warning"
                onClick={() => onAction(PayoutStatus.PENDING, note || undefined)}
                disabled={loading}
                loading={loading}
              />
            )}
            <Button
              label="Mark as Paid"
              icon="pi pi-check-circle"
              severity="success"
              onClick={() => setShowConfirmPaid(true)}
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      <ConfirmAction
        visible={showConfirmPaid}
        onHide={() => setShowConfirmPaid(false)}
        title="Confirm Payout"
        message="Mark this submission as paid? Ensure the payment has been processed."
        confirmLabel="Yes, Mark as Paid"
        confirmSeverity="success"
        onConfirm={() => {
          onAction(PayoutStatus.PAID, note || undefined);
          setShowConfirmPaid(false);
        }}
        loading={loading}
      />
    </>
  );
}
