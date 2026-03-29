'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { SubmissionStatus } from '@social-bounty/shared';

interface ReviewActionBarProps {
  currentStatus: SubmissionStatus;
  onAction: (action: SubmissionStatus, note?: string) => void;
  loading?: boolean;
}

export function ReviewActionBar({ currentStatus, onAction, loading = false }: ReviewActionBarProps) {
  const [note, setNote] = useState('');
  const [confirmAction, setConfirmAction] = useState<SubmissionStatus | null>(null);

  const reviewableStatuses = [
    SubmissionStatus.SUBMITTED,
    SubmissionStatus.IN_REVIEW,
    SubmissionStatus.NEEDS_MORE_INFO,
  ];

  if (!reviewableStatuses.includes(currentStatus)) {
    return null;
  }

  return (
    <>
      <Card className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Review Actions</h3>

          <div>
            <label htmlFor="review-note" className="block text-sm font-medium text-text-secondary mb-2">
              Note (optional)
            </label>
            <InputTextarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Add a note for the participant..."
              maxLength={1000}
            />
            <p className="text-xs text-text-muted mt-1">{note.length}/1000 characters</p>
          </div>

          <div className="flex gap-3">
            <Button
              label="Approve"
              icon="pi pi-check"
              severity="success"
              onClick={() => setConfirmAction(SubmissionStatus.APPROVED)}
              disabled={loading}
            />
            <Button
              label="Needs More Info"
              icon="pi pi-exclamation-triangle"
              severity="warning"
              onClick={() => onAction(SubmissionStatus.NEEDS_MORE_INFO, note || undefined)}
              disabled={loading}
              loading={loading}
            />
            <Button
              label="Reject"
              icon="pi pi-times"
              severity="danger"
              onClick={() => setConfirmAction(SubmissionStatus.REJECTED)}
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      <ConfirmAction
        visible={confirmAction === SubmissionStatus.APPROVED}
        onHide={() => setConfirmAction(null)}
        title="Approve Submission"
        message="Are you sure you want to approve this submission?"
        confirmLabel="Yes, Approve"
        confirmSeverity="success"
        onConfirm={() => {
          onAction(SubmissionStatus.APPROVED, note || undefined);
          setConfirmAction(null);
        }}
        loading={loading}
      />

      <ConfirmAction
        visible={confirmAction === SubmissionStatus.REJECTED}
        onHide={() => setConfirmAction(null)}
        title="Reject Submission"
        message="Are you sure you want to reject this submission? This action is final."
        confirmLabel="Yes, Reject"
        confirmSeverity="danger"
        onConfirm={() => {
          onAction(SubmissionStatus.REJECTED, note || undefined);
          setConfirmAction(null);
        }}
        loading={loading}
      />
    </>
  );
}
