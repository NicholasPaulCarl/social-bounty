'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
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

  if (currentPayoutStatus === PayoutStatus.PAID) {
    return null;
  }

  return (
    <>
      <div className="bg-surface-container-low rounded-xl p-6 mt-6">
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-on-surface font-headline">Payout Actions</h3>

          <div className="group">
            <label htmlFor="payout-note" className="block text-sm font-semibold text-on-surface mb-2 ml-1 group-focus-within:text-primary transition-colors">
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
      </div>

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
