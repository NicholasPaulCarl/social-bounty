'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useBounty } from '@/hooks/useBounties';
import {
  useCreateSubmission,
  useSubmission,
  useUpdateSubmission,
} from '@/hooks/useSubmissions';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { VerifiedLinkInput } from '@/components/common/VerifiedLinkInput';
import { ApiError } from '@/lib/api/client';
import {
  CHANNEL_URL_PATTERNS,
  PostFormat,
  SocialChannel,
} from '@social-bounty/shared';
import type {
  ProofLinkInput,
  SubmissionUrlScrapeInfo,
} from '@social-bounty/shared';

const CHANNEL_LABELS: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'Instagram',
  [SocialChannel.FACEBOOK]: 'Facebook',
  [SocialChannel.TIKTOK]: 'TikTok',
};

const FORMAT_LABELS: Record<PostFormat, string> = {
  [PostFormat.STORY]: 'Story',
  [PostFormat.REEL]: 'Reel',
  [PostFormat.FEED_POST]: 'Feed Post',
  [PostFormat.VIDEO_POST]: 'Video',
};

// Per-channel placeholder hints — keep tone consistent with VerifiedLinkInput's
// existing default but more specific so each input prompts the right URL shape.
const PLACEHOLDER_BY_CHANNEL: Record<SocialChannel, string> = {
  [SocialChannel.INSTAGRAM]: 'https://instagram.com/p/...',
  [SocialChannel.FACEBOOK]: 'https://facebook.com/...',
  [SocialChannel.TIKTOK]: 'https://tiktok.com/@user/video/...',
};

interface FormatPair {
  channel: SocialChannel;
  format: PostFormat;
  key: string;
}

const pairKey = (channel: SocialChannel, format: PostFormat) =>
  `${channel}_${format}`;

export default function SubmitProofPage() {
  const { id: bountyId } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const { data: bounty, isLoading: bountyLoading } = useBounty(bountyId);
  const existingSubmissionId = bounty?.userSubmission?.id ?? '';
  const { data: existingSubmission } = useSubmission(existingSubmissionId);

  const createSubmission = useCreateSubmission(bountyId);
  const updateSubmission = useUpdateSubmission(existingSubmissionId);

  const [proofText, setProofText] = useState('');
  const [linkByPair, setLinkByPair] = useState<Record<string, string>>({});
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');

  // Build the (channel, format) pairs from bounty.channels. One input per pair,
  // no extras (matches the backend coverage validator).
  const formatPairs = useMemo<FormatPair[]>(() => {
    if (!bounty?.channels) return [];
    return Object.entries(bounty.channels).flatMap(([channel, formats]) =>
      (formats || []).map((format) => ({
        channel: channel as SocialChannel,
        format: format as PostFormat,
        key: pairKey(channel as SocialChannel, format as PostFormat),
      })),
    );
  }, [bounty?.channels]);

  // Build a lookup of urlScrapes keyed by `${channel}_${format}` — the
  // resubmit-only-failed UI uses this to pre-populate URLs and lock VERIFIED rows.
  const scrapesByPair = useMemo<Record<string, SubmissionUrlScrapeInfo>>(() => {
    if (!existingSubmission?.urlScrapes) return {};
    const map: Record<string, SubmissionUrlScrapeInfo> = {};
    for (const scrape of existingSubmission.urlScrapes) {
      map[pairKey(scrape.channel, scrape.format)] = scrape;
    }
    return map;
  }, [existingSubmission?.urlScrapes]);

  // Resubmit mode: the participant has a NEEDS_MORE_INFO submission with at
  // least one FAILED url scrape. PATCH the existing submission instead of POSTing
  // a new one; verified URLs render read-only.
  const isResubmit = useMemo(() => {
    if (!existingSubmission) return false;
    if (existingSubmission.status !== 'NEEDS_MORE_INFO') return false;
    return existingSubmission.urlScrapes.some(
      (s) => s.scrapeStatus === 'FAILED',
    );
  }, [existingSubmission]);

  // Pre-populate the form when the existing submission lands.
  useEffect(() => {
    if (!existingSubmission || !isResubmit) return;
    setProofText(existingSubmission.proofText || '');
    const seeded: Record<string, string> = {};
    for (const scrape of existingSubmission.urlScrapes) {
      seeded[pairKey(scrape.channel, scrape.format)] = scrape.url;
    }
    setLinkByPair(seeded);
  }, [existingSubmission, isResubmit]);

  const updateLink = (key: string, value: string) => {
    setLinkByPair((prev) => ({ ...prev, [key]: value }));
    if (linkErrors[key]) {
      setLinkErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Mirror the backend coverage validator (CHANNEL_URL_PATTERNS hostname check).
  // Returns a per-pair error map; empty when valid.
  const validateLinks = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    for (const { channel, format, key } of formatPairs) {
      const scrape = scrapesByPair[key];
      // Verified URLs lock in — skip validation; we'll send the cached URL.
      if (scrape?.scrapeStatus === 'VERIFIED') continue;

      const raw = (linkByPair[key] ?? '').trim();
      if (!raw) {
        errs[key] = `Missing URL for ${CHANNEL_LABELS[channel]} ${FORMAT_LABELS[format]}`;
        continue;
      }
      if (!CHANNEL_URL_PATTERNS[channel].test(raw)) {
        errs[key] = `URL must be a ${CHANNEL_LABELS[channel]} link`;
      }
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!proofText.trim()) {
      setError('Notes are required');
      return;
    }

    const errs = validateLinks();
    if (Object.keys(errs).length > 0) {
      setLinkErrors(errs);
      setError('Fix the highlighted URLs before submitting.');
      return;
    }
    setLinkErrors({});

    // Build the full ProofLinkInput[] — verified URLs come from the cached
    // scrape, others from form state. The backend re-scrapes only PENDING/FAILED
    // rows; VERIFIED rows aren't touched.
    const proofLinks: ProofLinkInput[] = formatPairs.map(({ channel, format, key }) => {
      const scrape = scrapesByPair[key];
      const url =
        scrape?.scrapeStatus === 'VERIFIED'
          ? scrape.url
          : (linkByPair[key] ?? '').trim();
      return { channel, format, url };
    });

    try {
      if (isResubmit) {
        await updateSubmission.mutateAsync({
          data: {
            proofText: proofText.trim(),
            proofLinks,
          },
          images: images.length > 0 ? images : undefined,
        });
        showSuccess('Resubmitted. We\'ll re-check the failed URLs.');
        router.push(`/my-submissions/${existingSubmissionId}`);
      } else {
        await createSubmission.mutateAsync({
          data: {
            proofText: proofText.trim(),
            proofLinks,
          },
          images: images.length > 0 ? images : undefined,
        });
        showSuccess('Proof dropped! Your submission is in the review queue.');
        router.push('/my-submissions');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
        setError(err.message);
        // Server-side coverage errors carry per-field detail — surface inline.
        if (err.details && err.details.length > 0) {
          const serverErrs: Record<string, string> = {};
          for (const detail of err.details) {
            // Best-effort match against pair key based on message contents.
            for (const { channel, format, key } of formatPairs) {
              if (
                detail.message.includes(channel) &&
                detail.message.includes(format)
              ) {
                serverErrs[key] = detail.message;
              }
            }
          }
          if (Object.keys(serverErrs).length > 0) setLinkErrors(serverErrs);
        }
      } else {
        showError('Couldn\'t submit. Try again.');
      }
    }
  };

  if (bountyLoading) return <LoadingState type="form" />;
  if (!bounty) return <ErrorState error={new Error('Bounty not found')} />;

  const breadcrumbs = [
    { label: 'Bounties', url: '/bounties' },
    { label: bounty.title, url: `/bounties/${bountyId}` },
    { label: isResubmit ? 'Resubmit Proof' : 'Submit Proof' },
  ];

  const submitting = createSubmission.isPending || updateSubmission.isPending;
  const hasChannels = formatPairs.length > 0;

  return (
    <>
      <PageHeader
        title={isResubmit ? 'Resubmit Proof' : 'Submit Proof'}
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            {isResubmit && existingSubmission?.reviewerNote && (
              <Message
                severity="warn"
                text={`Reviewer feedback: ${existingSubmission.reviewerNote}`}
                className="w-full mb-4"
              />
            )}
            {isResubmit && (
              <Message
                severity="info"
                text="Verified URLs are locked. We'll only re-check the URLs you update."
                className="w-full mb-4"
              />
            )}
            {error && <Message severity="error" text={error} className="w-full mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!hasChannels && (
                <Message
                  severity="warn"
                  text="This bounty has no channels configured. Contact the brand."
                  className="w-full"
                />
              )}

              {hasChannels && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-1">
                      Post Links <span className="text-accent-rose">*</span>
                    </h3>
                    <p className="text-xs text-text-muted">
                      Paste one URL per required format. Each link is verified automatically.
                    </p>
                  </div>

                  {formatPairs.map(({ channel, format, key }) => {
                    const scrape = scrapesByPair[key];
                    const isVerified = scrape?.scrapeStatus === 'VERIFIED';
                    const isFailed = scrape?.scrapeStatus === 'FAILED';
                    const labelText = `${CHANNEL_LABELS[channel]} ${FORMAT_LABELS[format]} URL`;

                    return (
                      <div key={key}>
                        <label
                          htmlFor={`link-${key}`}
                          className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
                        >
                          {labelText} <span className="text-accent-rose">*</span>
                          {isVerified && (
                            <span className="ml-2 inline-flex items-center gap-1 text-accent-emerald normal-case tracking-normal text-xs font-normal">
                              <i className="pi pi-check-circle text-xs" />
                              Already verified
                            </span>
                          )}
                        </label>

                        {isFailed && scrape?.errorMessage && (
                          <p className="text-xs text-accent-rose mb-1.5 flex items-start gap-1">
                            <i className="pi pi-exclamation-circle text-xs mt-0.5" />
                            <span>Last attempt failed: {scrape.errorMessage}</span>
                          </p>
                        )}

                        {isVerified ? (
                          <div
                            id={`link-${key}`}
                            className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm text-text-secondary truncate"
                            title={scrape.url}
                          >
                            {scrape.url}
                          </div>
                        ) : (
                          <VerifiedLinkInput
                            value={linkByPair[key] ?? ''}
                            onChange={(val) => updateLink(key, val)}
                            placeholder={PLACEHOLDER_BY_CHANNEL[channel]}
                          />
                        )}

                        {linkErrors[key] && (
                          <small className="text-xs text-accent-rose mt-1 flex items-center gap-1">
                            <i className="pi pi-exclamation-circle text-xs" />
                            {linkErrors[key]}
                          </small>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label htmlFor="proofText" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                  Notes <span className="text-accent-rose">*</span>
                </label>
                <InputTextarea
                  id="proofText"
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  rows={4}
                  className="w-full"
                  placeholder="Any additional notes about your submission..."
                  maxLength={10000}
                />
                <p className="text-xs text-text-muted mt-1">{proofText.length}/10000 characters</p>
              </div>

              <div>
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                  Proof Images (optional)
                </label>
                <div className="glass-card rounded-lg overflow-hidden">
                  <FileUpload
                    mode="advanced"
                    name="proofImages"
                    accept="image/*"
                    maxFileSize={5000000}
                    multiple
                    auto={false}
                    chooseLabel="Choose Images"
                    customUpload
                    uploadHandler={(e) => {
                      setImages(e.files as File[]);
                    }}
                    onSelect={(e) => setImages(e.files as File[])}
                    onRemove={(e) => setImages((prev) => prev.filter((f) => f !== e.file))}
                    onClear={() => setImages([])}
                    emptyTemplate={
                      <p className="text-text-muted text-center py-4">
                        Drag and drop images here, or click to browse. Max 5MB per image.
                      </p>
                    }
                    aria-label="Upload proof images, accepts JPEG, PNG, GIF, WebP"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  label={isResubmit ? 'Resubmit Proof' : 'Submit Proof'}
                  icon="pi pi-check"
                  loading={submitting}
                  disabled={!hasChannels}
                />
                <Button
                  type="button"
                  label="Cancel"
                  severity="secondary"
                  outlined
                  onClick={() =>
                    router.push(
                      isResubmit
                        ? `/my-submissions/${existingSubmissionId}`
                        : `/bounties/${bountyId}`,
                    )
                  }
                />
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Bounty Requirements</h3>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{bounty.proofRequirements}</p>
          </div>
        </div>
      </div>
    </>
  );
}
