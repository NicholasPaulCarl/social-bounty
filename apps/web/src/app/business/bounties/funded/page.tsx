'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import { bountyApi } from '@/lib/api/bounties';

interface Status {
  bountyId: string;
  bountyTitle: string;
  status: string;
  paymentStatus: string;
  stitchPaymentLinkStatus: string | null;
}

const MAX_POLLS = 30; // ~90s at 3s interval

export default function BountyFundedReturnPage() {
  const router = useRouter();
  const params = useSearchParams();

  // Stitch may return with any of these identifier keys — or none of them, if
  // the redirect was stripped. Accept them all, and fall back to a bountyId
  // stashed in sessionStorage before the Go Live redirect left our site.
  const identifiers = useMemo(() => {
    const fromUrl = {
      bountyId: params.get('bountyId') ?? undefined,
      stitchPaymentId:
        params.get('stitchPaymentId') ??
        params.get('paymentId') ??
        params.get('id') ??
        undefined,
      merchantReference:
        params.get('merchantReference') ?? params.get('reference') ?? undefined,
    };
    if (
      !fromUrl.bountyId &&
      !fromUrl.stitchPaymentId &&
      !fromUrl.merchantReference &&
      typeof window !== 'undefined'
    ) {
      const stashed = sessionStorage.getItem('stitchFundingBountyId');
      if (stashed) fromUrl.bountyId = stashed;
    }
    return fromUrl;
  }, [params]);

  const hasIdentifier = Boolean(
    identifiers.bountyId || identifiers.stitchPaymentId || identifiers.merchantReference,
  );

  const [status, setStatus] = useState<Status | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!hasIdentifier) return;
    try {
      const next = await bountyApi.fundingStatus(identifiers);
      setStatus(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funding status');
    }
  }, [hasIdentifier, identifiers]);

  useEffect(() => {
    fetchOnce();
  }, [fetchOnce]);

  // Poll every 3s until paid, errored, or timed out.
  useEffect(() => {
    if (!hasIdentifier) return;
    if (status?.paymentStatus === 'PAID') return;
    if (pollCount >= MAX_POLLS) return;
    const t = setTimeout(() => {
      setPollCount((c) => c + 1);
      fetchOnce();
    }, 3000);
    return () => clearTimeout(t);
  }, [hasIdentifier, status?.paymentStatus, pollCount, fetchOnce]);

  if (!hasIdentifier) {
    // Stitch sometimes returns without any identifier in the URL (e.g. cancelled
    // or the redirect has been stripped). Webhook will still flip server-side.
    return (
      <Card title="Payment completed">
        <Message
          severity="info"
          className="w-full"
          text="We couldn't pick up your bounty from the return URL, but your payment will be reconciled automatically. Check your bounty list."
        />
        <div className="mt-4">
          <Button
            label="Back to bounties"
            icon={<ArrowLeft size={16} strokeWidth={2} />}
            onClick={() => router.push('/business/bounties')}
          />
        </div>
      </Card>
    );
  }

  const isPaid = status?.paymentStatus === 'PAID';
  const waiting = !isPaid && pollCount < MAX_POLLS;
  const timedOut = !isPaid && pollCount >= MAX_POLLS;

  return (
    <Card title={isPaid ? 'Funding confirmed' : 'Finalising funding...'}>
      {isPaid && status && (
        <>
          <Message
            severity="success"
            className="w-full"
            text={`Bounty "${status.bountyTitle}" is now funded and live.`}
          />
          <p className="text-sm text-text-muted mt-4">
            Your ledger shows the funds in reserve. Hunters can now see and apply to this bounty.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              label="View bounty"
              icon={<Eye size={16} strokeWidth={2} />}
              onClick={() => router.push(`/business/bounties/${status.bountyId}`)}
            />
            <Button
              label="Back to bounties"
              icon={<ArrowLeft size={16} strokeWidth={2} />}
              outlined
              onClick={() => router.push('/business/bounties')}
            />
          </div>
        </>
      )}
      {waiting && (
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
            className="w-full"
            text="We haven't received settlement confirmation from Stitch yet. This can take a few minutes."
          />
          <div className="mt-4 flex gap-2">
            <Button
              label="Refresh"
              icon={<RefreshCw size={16} strokeWidth={2} />}
              onClick={() => {
                setPollCount(0);
                fetchOnce();
              }}
            />
            <Button
              label="Back to bounties"
              icon={<ArrowLeft size={16} strokeWidth={2} />}
              outlined
              onClick={() => router.push('/business/bounties')}
            />
          </div>
        </>
      )}
      {error && !isPaid && (
        <Message severity="error" className="w-full mt-3" text={error} />
      )}
    </Card>
  );
}
