'use client';

import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';

const MIN_LEN = 10;
const MAX_LEN = 2000;

interface RejectKybDialogProps {
  visible: boolean;
  onHide: () => void;
  brandName: string;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

/**
 * Reject KYB submission dialog. Reason is required, ≥10 chars, ≤2000 chars,
 * matching the API's RejectKybRequest validation. Persisted to
 * `brand.kybRejectionReason` and emitted in the audit trail.
 */
export function RejectKybDialog({
  visible,
  onHide,
  brandName,
  onConfirm,
  loading = false,
}: RejectKybDialogProps) {
  const [reason, setReason] = useState('');

  const trimmed = reason.trim();
  const len = trimmed.length;
  const tooShort = len > 0 && len < MIN_LEN;
  const tooLong = len > MAX_LEN;
  const canSubmit = len >= MIN_LEN && len <= MAX_LEN && !loading;

  const handleHide = () => {
    setReason('');
    onHide();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(trimmed);
    setReason('');
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button label="Cancel" outlined onClick={handleHide} disabled={loading} />
      <Button
        label="Reject submission"
        severity="danger"
        onClick={handleSubmit}
        disabled={!canSubmit}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header="Reject KYB submission"
      footer={footer}
      modal
      closable
      className="w-full max-w-lg"
    >
      <p className="text-text-secondary mb-3 text-sm">
        Tell <span className="font-medium text-text-primary">{brandName}</span>{' '}
        what needs to change before they can resubmit. The reason is shown to
        the brand and recorded in the audit trail.
      </p>

      <label htmlFor="kyb-reject-reason" className="text-sm font-medium text-text-secondary block mb-1">
        Rejection reason (required)
      </label>
      <InputTextarea
        id="kyb-reject-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={5}
        className="w-full"
        placeholder="e.g. The COR 14.3 is illegible — please re-upload as a colour PDF."
        autoFocus
        maxLength={MAX_LEN + 1 /* allow over-typing so the warning shows */}
      />
      <div className="flex items-center justify-between mt-1">
        <p className={`text-xs font-mono tabular-nums ${tooLong ? 'text-danger-600' : 'text-text-muted'}`}>
          {len}/{MAX_LEN}
        </p>
        <p className="text-xs text-text-muted">Minimum {MIN_LEN} characters</p>
      </div>

      {tooShort && (
        <Message
          severity="warn"
          text={`At least ${MIN_LEN} characters required.`}
          className="mt-3 w-full"
        />
      )}
      {tooLong && (
        <Message
          severity="error"
          text={`Reason must be ${MAX_LEN} characters or fewer.`}
          className="mt-3 w-full"
        />
      )}
    </Dialog>
  );
}
