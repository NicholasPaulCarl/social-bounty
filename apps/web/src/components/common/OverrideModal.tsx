'use client';

import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { StatusBadge } from './StatusBadge';

interface OverrideModalProps {
  visible: boolean;
  onHide: () => void;
  title: string;
  entityType: 'bounty' | 'submission' | 'payout';
  currentStatus: string;
  statusOptions: { label: string; value: string }[];
  onOverride: (newStatus: string, reason: string) => void;
  loading?: boolean;
}

export function OverrideModal({
  visible,
  onHide,
  title,
  entityType,
  currentStatus,
  statusOptions,
  onOverride,
  loading = false,
}: OverrideModalProps) {
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const canOverride = newStatus && reason.trim().length >= 10;

  const handleOverride = () => {
    if (newStatus && reason.trim()) {
      onOverride(newStatus, reason.trim());
      setNewStatus(null);
      setReason('');
    }
  };

  const handleHide = () => {
    setNewStatus(null);
    setReason('');
    onHide();
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button label="Cancel" outlined onClick={handleHide} disabled={loading} />
      <Button
        label="Override"
        severity="danger"
        onClick={handleOverride}
        disabled={!canOverride || loading}
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
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-on-surface mb-2 ml-1">Current Status</p>
          <StatusBadge type={entityType} value={currentStatus} />
        </div>

        <div className="group">
          <label htmlFor="override-status" className="block text-sm font-semibold text-on-surface mb-2 ml-1">
            New Status
          </label>
          <Dropdown
            id="override-status"
            value={newStatus}
            options={statusOptions}
            onChange={(e) => setNewStatus(e.value)}
            placeholder="Select new status"
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="override-reason" className="block text-sm font-semibold text-on-surface mb-2 ml-1">
            Reason (required)
          </label>
          <InputTextarea
            id="override-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full"
            placeholder="Provide a reason for this override..."
          />
          <p className="text-xs text-on-surface-variant mt-1 ml-1">
            {reason.trim().length}/10 minimum characters
          </p>
        </div>
      </div>
    </Dialog>
  );
}
