'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Lock, Send } from 'lucide-react';
import { useBounty } from '@/hooks/useBounties';
import { useApplyToBounty } from '@/hooks/useBountyAccess';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ApiError } from '@/lib/api/client';
import { BountyAccessType } from '@social-bounty/shared';

const MAX_MESSAGE_LENGTH = 500;

export default function ApplyToBountyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const { data: bounty, isLoading, error } = useBounty(id);
  const applyMutation = useApplyToBounty(id);

  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  if (isLoading) return <LoadingState type="detail" />;
  if (error) return <ErrorState error={error} />;
  if (!bounty) return <ErrorState error={new Error('Bounty not found')} />;

  if (bounty.accessType !== BountyAccessType.CLOSED) {
    router.replace(`/bounties/${id}`);
    return null;
  }

  const breadcrumbs = [
    { label: 'Bounties', url: '/bounties' },
    { label: bounty.title, url: `/bounties/${id}` },
    { label: 'Apply' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    if (message.length > MAX_MESSAGE_LENGTH) {
      setSubmitError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    try {
      await applyMutation.mutateAsync({ message: message.trim() || undefined });
      showSuccess('Application dropped! The brand will review it shortly.');
      router.push(`/bounties/${id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Couldn\'t submit application. Try again.';
      setSubmitError(msg);
      showError(msg);
    }
  }

  const remaining = MAX_MESSAGE_LENGTH - message.length;

  return (
    <>
      <PageHeader
        title="Apply to hunt"
        breadcrumbs={breadcrumbs}
      />

      <div className="max-w-2xl mx-auto">
        {/* Bounty summary */}
        <div className="glass-card p-5 mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-warning-600/20 flex items-center justify-center flex-shrink-0">
            <Lock size={20} strokeWidth={2} className="text-warning-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">{bounty.title}</p>
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">{bounty.shortDescription}</p>
          </div>
        </div>

        {/* Application form */}
        <form onSubmit={handleSubmit}>
          <div className="glass-card p-6 space-y-6">
            <div>
              <h2 className="text-lg font-heading font-semibold text-text-primary mb-1">Your application</h2>
              <p className="text-sm text-text-secondary">
                Introduce yourself. A short note boosts approval odds but isn&apos;t required.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-text-primary">
                Message <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <InputTextarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Tell the business about your social presence, audience, and why you're interested in this bounty..."
                className="w-full resize-none"
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <p className={`text-xs text-right font-mono tabular-nums ${remaining < 50 ? 'text-warning-600' : 'text-text-muted'}`}>
                {remaining} characters remaining
              </p>
            </div>

            {submitError && (
              <Message severity="error" text={submitError} className="w-full" />
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                label="Cancel"
                type="button"
                outlined
                severity="secondary"
                onClick={() => router.push(`/bounties/${id}`)}
              />
              <Button
                label="Submit"
                icon={<Send size={16} strokeWidth={2} />}
                type="submit"
                loading={applyMutation.isPending}
              />
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
