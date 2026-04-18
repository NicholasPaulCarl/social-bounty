'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Check, AlertTriangle, X } from 'lucide-react';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { SubmissionStatus } from '@social-bounty/shared';
import type { SubmissionUrlScrapeInfo } from '@social-bounty/shared';

interface ReviewActionBarProps {
  currentStatus: SubmissionStatus;
  onAction: (action: SubmissionStatus, note?: string) => void;
  loading?: boolean;
  urlScrapes?: SubmissionUrlScrapeInfo[];
}

const CHANNEL_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
};

const FORMAT_LABELS: Record<string, string> = {
  STORY: 'Story',
  REEL: 'Reel',
  FEED_POST: 'Feed Post',
  VIDEO_POST: 'Video',
};

function buildNeedsMoreInfoPrefill(scrapes: SubmissionUrlScrapeInfo[]): string {
  const failed = scrapes.filter((s) => s.scrapeStatus === 'FAILED');
  if (failed.length === 0) return '';
  const lines = failed.map((s) => {
    const channel = CHANNEL_LABELS[s.channel] ?? s.channel;
    const format = FORMAT_LABELS[s.format] ?? s.format;
    const reason = s.errorMessage ?? 'verification failed';
    return `- ${channel} ${format}: ${reason}`;
  });
  return `Please resubmit the following URLs:\n${lines.join('\n')}`;
}

export function ReviewActionBar({
  currentStatus,
  onAction,
  loading = false,
  urlScrapes = [],
}: ReviewActionBarProps) {
  const [note, setNote] = useState('');
  const [confirmAction, setConfirmAction] = useState<SubmissionStatus | null>(null);
  // Track whether the user has manually edited the note. We only auto-prefill
  // while the field is untouched so we never clobber a typed-in note.
  const noteEditedRef = useRef(false);

  // Empty array → vacuous truth → Approve enabled. (Bounty has no rules.)
  const allVerified = useMemo(
    () => urlScrapes.every((u) => u.scrapeStatus === 'VERIFIED'),
    [urlScrapes],
  );

  const prefillNote = useMemo(() => buildNeedsMoreInfoPrefill(urlScrapes), [urlScrapes]);

  // Auto-prefill the "Needs More Info" note when failures appear, until the
  // reviewer types something custom. Re-syncs if the failure set changes.
  useEffect(() => {
    if (noteEditedRef.current) return;
    if (prefillNote && note !== prefillNote) {
      setNote(prefillNote);
    }
  }, [prefillNote, note]);

  const reviewableStatuses = [
    SubmissionStatus.SUBMITTED,
    SubmissionStatus.IN_REVIEW,
    SubmissionStatus.NEEDS_MORE_INFO,
  ];

  if (!reviewableStatuses.includes(currentStatus)) {
    return null;
  }

  const approveDisabledReason = !allVerified
    ? "All URLs must verify before approval. Use 'Needs More Info' to send back to hunter."
    : undefined;

  return (
    <>
      <Card className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Review actions</h3>

          <div>
            <label htmlFor="review-note" className="block text-sm font-medium text-text-secondary mb-2">
              Note (optional)
            </label>
            <InputTextarea
              id="review-note"
              value={note}
              onChange={(e) => {
                noteEditedRef.current = true;
                setNote(e.target.value);
              }}
              rows={3}
              className="w-full"
              placeholder="Add a note for the participant..."
              maxLength={1000}
            />
            <p className="text-xs text-text-muted mt-1 font-mono tabular-nums">{note.length}/1000 characters</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              label="Approve"
              icon={<Check size={18} strokeWidth={2} />}
              severity="success"
              onClick={() => setConfirmAction(SubmissionStatus.APPROVED)}
              disabled={loading || !allVerified}
              tooltip={approveDisabledReason}
              tooltipOptions={{ position: 'top', showOnDisabled: true }}
            />
            <Button
              label="Needs more info"
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              severity="warning"
              onClick={() => onAction(SubmissionStatus.NEEDS_MORE_INFO, note || undefined)}
              disabled={loading}
              loading={loading}
            />
            <Button
              label="Reject"
              icon={<X size={18} strokeWidth={2} />}
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
        title="Approve submission"
        message="Approve this submission and release payout?"
        confirmLabel="Approve"
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
        title="Reject submission"
        message="Reject this submission? This is final."
        confirmLabel="Reject"
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
