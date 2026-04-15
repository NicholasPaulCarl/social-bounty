'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useBounty } from '@/hooks/useBounties';
import { PaymentStatus } from '@social-bounty/shared';

export default function BountyFundedReturnPage() {
  const router = useRouter();
  const params = useSearchParams();
  const bountyId = params.get('bountyId');
  const { data: bounty, refetch } = useBounty(bountyId ?? '');
  const [pollCount, setPollCount] = useState(0);

  // Poll every 3s for up to ~90s while waiting for the webhook to mark PAID.
  useEffect(() => {
    if (!bountyId) return;
    if (bounty?.paymentStatus === PaymentStatus.PAID) return;
    if (pollCount >= 30) return;
    const t = setTimeout(() => {
      setPollCount((c) => c + 1);
      refetch();
    }, 3000);
    return () => clearTimeout(t);
  }, [bountyId, bounty?.paymentStatus, pollCount, refetch]);

  if (!bountyId) {
    return (
      <Card title="Funding confirmation">
        <Message severity="warn" text="Missing bounty reference. Return to bounties list." />
        <div className="mt-4">
          <Button label="Back to bounties" onClick={() => router.push('/business/bounties')} />
        </div>
      </Card>
    );
  }

  const isPaid = bounty?.paymentStatus === PaymentStatus.PAID;
  const stillWaiting = !isPaid && pollCount < 30;
  const timedOut = !isPaid && pollCount >= 30;

  return (
    <Card title={isPaid ? 'Funding confirmed' : 'Finalising funding...'}>
      {isPaid && (
        <>
          <Message severity="success" text={`Bounty "${bounty?.title ?? ''}" is now funded and live.`} />
          <p className="text-sm text-text-muted mt-4">
            Your ledger shows the funds in reserve. Hunters can now see and apply to this bounty.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              label="View bounty"
              icon="pi pi-eye"
              onClick={() => router.push(`/business/bounties/${bountyId}`)}
            />
            <Button
              label="Back to bounties"
              icon="pi pi-arrow-left"
              outlined
              onClick={() => router.push('/business/bounties')}
            />
          </div>
        </>
      )}
      {stillWaiting && (
        <div className="flex flex-col items-center gap-4 py-6">
          <ProgressSpinner style={{ width: 40, height: 40 }} />
          <p className="text-sm text-text-muted">
            Waiting for Stitch to confirm settlement. This usually completes within a minute.
          </p>
        </div>
      )}
      {timedOut && (
        <>
          <Message
            severity="warn"
            text="We haven't received settlement confirmation from Stitch yet. This can take a few minutes. Refresh to check again."
          />
          <div className="mt-4 flex gap-2">
            <Button label="Refresh" icon="pi pi-refresh" onClick={() => { setPollCount(0); refetch(); }} />
            <Button
              label="Back to bounties"
              icon="pi pi-arrow-left"
              outlined
              onClick={() => router.push('/business/bounties')}
            />
          </div>
        </>
      )}
    </Card>
  );
}
