'use client';

import { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '@/hooks/useAuth';
import { useBrand, useSubmitKyb } from '@/hooks/useBrand';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { KybStatus } from '@social-bounty/shared';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils/format';
import { Send } from 'lucide-react';

// Keep the country list short and explicit — per spec we offer ZA, US, GB, NA, BW.
// These must be ISO 3166-1 alpha-2 codes (backend validates length === 2).
const COUNTRY_OPTIONS = [
  { label: 'South Africa (ZA)', value: 'ZA' },
  { label: 'United States (US)', value: 'US' },
  { label: 'United Kingdom (GB)', value: 'GB' },
  { label: 'Namibia (NA)', value: 'NA' },
  { label: 'Botswana (BW)', value: 'BW' },
];

export default function BrandKybPage() {
  const { user } = useAuth();
  const toast = useToast();
  const brandId = user?.brandId || '';
  const { data: brand, isLoading, error, refetch } = useBrand(brandId);
  const submitKyb = useSubmitKyb(brandId);

  // Controlled form state — mirrors SubmitKybRequest shape.
  const [registeredName, setRegisteredName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [country, setCountry] = useState<string>('ZA');
  const [contactEmail, setContactEmail] = useState('');
  const [documentsRef, setDocumentsRef] = useState('');
  const [formError, setFormError] = useState('');
  // Hard Rule #6 — confirm dialog for non-rollbackable action (NOT_STARTED → PENDING).
  const [showConfirm, setShowConfirm] = useState(false);

  if (!brandId) {
    return (
      <Message
        severity="warn"
        text="No brand is selected. Create or switch to a brand to continue."
        className="w-full"
      />
    );
  }
  if (isLoading) return <LoadingState type="form" />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!brand) return null;

  const status = brand.kybStatus;
  const canSubmit = status === KybStatus.NOT_STARTED || status === KybStatus.REJECTED;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Mirror the backend validators (class-validator) so users see issues inline.
    if (!registeredName.trim() || registeredName.length > 200) {
      setFormError('Registered name is required (max 200 characters).');
      return;
    }
    if (!registrationNumber.trim() || registrationNumber.length > 100) {
      setFormError('Registration number is required (max 100 characters).');
      return;
    }
    if (vatNumber && vatNumber.length > 50) {
      setFormError('VAT number must be at most 50 characters.');
      return;
    }
    if (!country || country.length !== 2) {
      setFormError('Please select a country.');
      return;
    }
    if (!contactEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
      setFormError('A valid contact email is required.');
      return;
    }
    if (documentsRef && documentsRef.length > 500) {
      setFormError('Documents reference must be at most 500 characters.');
      return;
    }

    // Validation passed — open the confirm dialog. The mutation only fires on
    // explicit confirmation because KYB submission flips the brand into PENDING
    // and locks edits until a Super Admin reviews.
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      await submitKyb.mutateAsync({
        registeredName: registeredName.trim(),
        registrationNumber: registrationNumber.trim(),
        vatNumber: vatNumber.trim() || undefined,
        country,
        contactEmail: contactEmail.trim(),
        documentsRef: documentsRef.trim() || undefined,
      });
      setShowConfirm(false);
      toast.showSuccess('KYB submitted. Awaiting Super Admin review.');
    } catch (err) {
      setShowConfirm(false);
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Couldn't submit KYB. Please try again.");
    }
  };

  const breadcrumbs = [
    { label: 'Brands', url: '/business/brands' },
    { label: 'KYB' },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Know Your Business (KYB)"
        subtitle="Verify your business so you can fund bounties and receive payouts."
        breadcrumbs={breadcrumbs}
      />

      {/* Status panels — render based on current kybStatus. */}
      {status === KybStatus.PENDING && (
        <Card className="mb-6">
          <Message
            severity="info"
            text={
              brand.kybSubmittedAt
                ? `Submitted on ${formatDateTime(brand.kybSubmittedAt)}. Awaiting Super Admin review.`
                : 'Submitted. Awaiting Super Admin review.'
            }
            className="w-full"
          />
        </Card>
      )}

      {status === KybStatus.APPROVED && (
        <Card className="mb-6">
          <Message
            severity="success"
            text={
              brand.kybApprovedAt
                ? `Approved on ${formatDateTime(brand.kybApprovedAt)}. Your brand is verified.`
                : 'Approved. Your brand is verified.'
            }
            className="w-full"
          />
        </Card>
      )}

      {status === KybStatus.REJECTED && (
        <Card className="mb-6">
          <Message
            severity="error"
            // Per scope: don't fetch audit log — just surface the status and ask
            // them to resubmit. Super Admin can follow up through inbox / email.
            text="Your KYB submission was rejected. Please review your details and resubmit below."
            className="w-full"
          />
        </Card>
      )}

      {canSubmit && (
        <Card title="Submit KYB Details" className="p-4 sm:p-6">
          {formError && <Message severity="error" text={formError} className="w-full mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="registeredName"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Registered Name *
              </label>
              <InputText
                id="registeredName"
                value={registeredName}
                onChange={(e) => setRegisteredName(e.target.value)}
                maxLength={200}
                className="w-full"
                placeholder="Exact legal business name"
              />
            </div>

            <div>
              <label
                htmlFor="registrationNumber"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Registration Number *
              </label>
              <InputText
                id="registrationNumber"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                maxLength={100}
                className="w-full"
                placeholder="Company registration number (CIPC / Companies House / etc.)"
              />
            </div>

            <div>
              <label
                htmlFor="vatNumber"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                VAT Number
              </label>
              <InputText
                id="vatNumber"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                maxLength={50}
                className="w-full"
                placeholder="Optional"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Country *
              </label>
              <Dropdown
                id="country"
                value={country}
                options={COUNTRY_OPTIONS}
                onChange={(e) => setCountry(e.value)}
                className="w-full"
                placeholder="Select country"
              />
            </div>

            <div>
              <label
                htmlFor="contactEmail"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Contact Email *
              </label>
              <InputText
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full"
                placeholder="finance@yourbrand.com"
              />
            </div>

            <div>
              <label
                htmlFor="documentsRef"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Documents Reference
              </label>
              <InputText
                id="documentsRef"
                value={documentsRef}
                onChange={(e) => setDocumentsRef(e.target.value)}
                maxLength={500}
                className="w-full"
                placeholder="Link to KYB document folder"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                label={status === KybStatus.REJECTED ? 'Resubmit KYB' : 'Submit KYB'}
                icon={<Send size={16} strokeWidth={2} />}
                loading={submitKyb.isPending}
                disabled={submitKyb.isPending}
              />
            </div>
          </form>
        </Card>
      )}

      <ConfirmAction
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        title="Submit KYB for review?"
        message="Once submitted, the brand cannot edit KYB details until a Super Admin reviews and either approves or rejects the submission."
        confirmLabel="Submit for review"
        confirmSeverity="warning"
        onConfirm={handleConfirmSubmit}
        loading={submitKyb.isPending}
      />
    </div>
  );
}
