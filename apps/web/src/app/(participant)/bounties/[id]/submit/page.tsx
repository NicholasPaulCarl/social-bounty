'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useBounty } from '@/hooks/useBounties';
import { useCreateSubmission } from '@/hooks/useSubmissions';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { VerifiedLinkInput } from '@/components/common/VerifiedLinkInput';
import { ApiError } from '@/lib/api/client';

export default function SubmitProofPage() {
  const { id: bountyId } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const { data: bounty, isLoading: bountyLoading } = useBounty(bountyId);
  const createSubmission = useCreateSubmission(bountyId);

  const [proofText, setProofText] = useState('');
  const [proofLinks, setProofLinks] = useState<string[]>(['']);
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');

  const addLink = () => setProofLinks([...proofLinks, '']);
  const removeLink = (index: number) => setProofLinks(proofLinks.filter((_, i) => i !== index));
  const updateLink = (index: number, value: string) => {
    const updated = [...proofLinks];
    updated[index] = value;
    setProofLinks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofText.trim()) {
      setError('Proof text is required');
      return;
    }

    setError('');
    const validLinks = proofLinks.filter((l) => l.trim());

    try {
      await createSubmission.mutateAsync({
        data: {
          proofText: proofText.trim(),
          proofLinks: validLinks.length > 0 ? validLinks : undefined,
        },
        images: images.length > 0 ? images : undefined,
      });
      showSuccess('Proof dropped! Your submission is in the review queue.');
      router.push('/my-submissions');
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
        setError(err.message);
      } else {
        showError('Couldn\'t create submission. Try again.');
      }
    }
  };

  if (bountyLoading) return <LoadingState type="form" />;
  if (!bounty) return <ErrorState error={new Error('Bounty not found')} />;

  const breadcrumbs = [
    { label: 'Bounties', url: '/bounties' },
    { label: bounty.title, url: `/bounties/${bountyId}` },
    { label: 'Submit Proof' },
  ];

  return (
    <>
      <PageHeader title="Submit Proof" breadcrumbs={breadcrumbs} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            {error && <Message severity="error" text={error} className="w-full mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                  Post / Profile Links
                </label>
                <p className="text-xs text-text-muted mb-3">
                  Paste your social media post or profile URL. Links are verified automatically.
                </p>
                {proofLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <VerifiedLinkInput
                      value={link}
                      onChange={(val) => updateLink(index, val)}
                      placeholder="https://instagram.com/p/..."
                      className="flex-1"
                    />
                    {proofLinks.length > 1 && (
                      <Button
                        icon="pi pi-times"
                        severity="danger"
                        outlined
                        onClick={() => removeLink(index)}
                        aria-label="Remove link"
                        type="button"
                      />
                    )}
                  </div>
                ))}
                <Button
                  label="Add Link"
                  icon="pi pi-plus"
                  text
                  size="small"
                  onClick={addLink}
                  type="button"
                />
              </div>

              <div>
                <label htmlFor="proofText" className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                  Notes
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
                  label="Submit Proof"
                  icon="pi pi-check"
                  loading={createSubmission.isPending}
                />
                <Button
                  type="button"
                  label="Cancel"
                  severity="secondary"
                  outlined
                  onClick={() => router.push(`/bounties/${bountyId}`)}
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
