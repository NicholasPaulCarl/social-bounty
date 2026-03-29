'use client';

import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';

interface ConfirmActionProps {
  visible: boolean;
  onHide: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmSeverity?: 'danger' | 'warning' | 'success';
  onConfirm: (reason?: string) => void;
  requireReason?: boolean;
  reasonMinLength?: number;
  loading?: boolean;
}

export function ConfirmAction({
  visible,
  onHide,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmSeverity = 'danger',
  onConfirm,
  requireReason = false,
  reasonMinLength = 10,
  loading = false,
}: ConfirmActionProps) {
  const [reason, setReason] = useState('');

  const canConfirm = !requireReason || reason.trim().length >= reasonMinLength;

  const handleConfirm = () => {
    onConfirm(requireReason ? reason.trim() : undefined);
    setReason('');
  };

  const handleHide = () => {
    setReason('');
    onHide();
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button label="Cancel" outlined onClick={handleHide} disabled={loading} />
      <Button
        label={confirmLabel}
        severity={confirmSeverity}
        onClick={handleConfirm}
        disabled={!canConfirm || loading}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={title}
      footer={footer}
      modal
      closable
      className="w-full max-w-lg"
    >
      <p className="text-text-secondary mb-4">{message}</p>
      {requireReason && (
        <div className="space-y-2">
          <label htmlFor="confirm-reason" className="text-sm font-medium text-text-secondary">
            Reason (required)
          </label>
          <InputTextarea
            id="confirm-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full"
            placeholder="Please provide a reason..."
            autoFocus
          />
          <p className="text-xs text-text-muted">
            {reason.trim().length}/{reasonMinLength} minimum characters
          </p>
        </div>
      )}
    </Dialog>
  );
}
