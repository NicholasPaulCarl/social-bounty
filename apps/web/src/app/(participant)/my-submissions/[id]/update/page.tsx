'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { useSubmission, useUpdateSubmission } from '@/hooks/useSubmissions';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ApiError } from '@/lib/api/client';

export default function UpdateSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const { data: submission, isLoading } = useSubmission(id);
  const updateSubmission = useUpdateSubmission(id);

  const [proofText, setProofText] = useState('');
  const [proofLinks, setProofLinks] = useState<string[]>(['']);
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (submission) {
      setProofText(submission.proofText || '');
      setProofLinks(
        submission.proofLinks && submission.proofLinks.length > 0
          ? submission.proofLinks
          : [''],
      );
    }
  }, [submission]);

  if (isLoading) return <LoadingState type="form" />;
  if (!submission) return <ErrorState error={new Error('Submission not found')} />;

  if (submission.status !== 'NEEDS_MORE_INFO') {
    return (
      <div className="text-center py-16">
        <Message severity="warn" text="This submission cannot be updated in its current status." />
        <Button
          label="Back to Submission"
          icon="pi pi-arrow-left"
          outlined
          className="mt-4"
          onClick={() => router.push(`/my-submissions/${id}`)}
        />
      </div>
    );
  }

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
      await updateSubmission.mutateAsync({
        data: {
          proofText: proofText.trim(),
          proofLinks: validLinks.length > 0 ? validLinks : undefined,
        },
        images: images.length > 0 ? images : undefined,
      });
      showSuccess('Submission updated successfully!');
      router.push(`/my-submissions/${id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
        setError(err.message);
      } else {
        showError('Failed to update submission');
      }
    }
  };

  const breadcrumbs = [
    { label: 'My Submissions', url: '/my-submissions' },
    { label: `Submission #${id.slice(0, 8)}`, url: `/my-submissions/${id}` },
    { label: 'Update' },
  ];

  return (
    <>
      <PageHeader title="Update Submission" breadcrumbs={breadcrumbs} />

      {submission.reviewerNote && (
        <Message
          severity="warn"
          text={`Reviewer feedback: ${submission.reviewerNote}`}
          className="w-full mb-4"
        />
      )}

      <Card>
        {error && <Message severity="error" text={error} className="w-full mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="proofText" className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Proof Description <span className="text-error">*</span>
            </label>
            <InputTextarea
              id="proofText"
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              rows={6}
              className="w-full"
              maxLength={10000}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Proof Links (optional)
            </label>
            {proofLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <InputText
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  placeholder="https://..."
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
            <label className="block text-sm font-semibold mb-2 ml-4 text-on-surface">
              Additional Images (optional)
            </label>
            <FileUpload
              mode="advanced"
              name="proofImages"
              accept="image/*"
              maxFileSize={5000000}
              multiple
              auto={false}
              chooseLabel="Choose Images"
              customUpload
              uploadHandler={(e) => setImages(e.files as File[])}
              onSelect={(e) => setImages(e.files as File[])}
              onRemove={(e) => setImages((prev) => prev.filter((f) => f !== e.file))}
              onClear={() => setImages([])}
              emptyTemplate={
                <p className="text-on-surface-variant text-center py-4">
                  Drag and drop images here. Max 5MB per image.
                </p>
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              label="Update Submission"
              icon="pi pi-check"
              loading={updateSubmission.isPending}
            />
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => router.push(`/my-submissions/${id}`)}
            />
          </div>
        </form>
      </Card>
    </>
  );
}
