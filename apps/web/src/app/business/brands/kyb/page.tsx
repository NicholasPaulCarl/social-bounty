'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { FileUpload, type FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { useAuth } from '@/hooks/useAuth';
import {
  useBrand,
  useSubmitKyb,
  useKybDocuments,
  useUploadKybDocument,
  useDeleteKybDocument,
} from '@/hooks/useBrand';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ConfirmAction } from '@/components/common/ConfirmAction';
import { KybStatus } from '@social-bounty/shared';
import type { KybDocumentType, KybOrgType, KybDocumentResponse } from '@social-bounty/shared';
import { ApiError } from '@/lib/api/client';
import { formatDateTime, formatDate, formatBytes } from '@/lib/utils/format';
import { Send, Upload, Trash2, ExternalLink, FileText } from 'lucide-react';

// Keep the country list short and explicit — per spec we offer ZA, US, GB, NA, BW.
// These must be ISO 3166-1 alpha-2 codes (backend validates length === 2).
const COUNTRY_OPTIONS = [
  { label: 'South Africa (ZA)', value: 'ZA' },
  { label: 'United States (US)', value: 'US' },
  { label: 'United Kingdom (GB)', value: 'GB' },
  { label: 'Namibia (NA)', value: 'NA' },
  { label: 'Botswana (BW)', value: 'BW' },
];

// Mirrors the `KybOrgType` shared union. Labels chosen for SA-context clarity —
// CIPC + TradeSafe expect these exact org-type strings on `tokenCreate`.
const ORG_TYPE_OPTIONS: { label: string; value: KybOrgType }[] = [
  { label: 'Private company (Pty) Ltd', value: 'PRIVATE' },
  { label: 'Public company (Ltd)', value: 'PUBLIC' },
  { label: 'Non-profit / NGO', value: 'NGO' },
  { label: 'Government / state body', value: 'GOVERNMENT' },
  { label: 'Sole proprietor', value: 'SOLE_PROPRIETOR' },
];

// Mirrors `KybDocumentType` — labels match the SA company-registration document
// vocabulary referenced in `docs/deployment/tradesafe-live-readiness.md`.
const DOCUMENT_TYPE_OPTIONS: { label: string; value: KybDocumentType }[] = [
  { label: 'COR 14.3 (Notice of Incorporation)', value: 'COR_14_3' },
  { label: 'COR 15.1 (Memorandum of Incorporation)', value: 'COR_15_1' },
  { label: 'Bank confirmation letter', value: 'BANK_PROOF' },
  { label: 'Director ID / passport', value: 'ID_DOC' },
  { label: 'Letter of Authority', value: 'LETTER_OF_AUTHORITY' },
  { label: 'Other supporting document', value: 'OTHER' },
];

// Same allowlist as the API multer interceptor — duplicating it client-side
// gives the FileUpload control a meaningful `accept` and lets us reject
// obviously-wrong types before a network round-trip.
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPT_ATTR = ALLOWED_MIME_TYPES.join(',');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB — mirrors KYB_DOCUMENT_LIMITS.MAX_FILE_SIZE.

// Friendly labels for the document-type chip in the saved-documents list.
function formatDocumentType(type: KybDocumentType): string {
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatOrgType(type: KybOrgType | null | undefined): string {
  if (!type) return '—';
  return ORG_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export default function BrandKybPage() {
  const { user } = useAuth();
  const toast = useToast();
  const brandId = user?.brandId || '';
  const { data: brand, isLoading, error, refetch } = useBrand(brandId);
  const { data: documents, isLoading: documentsLoading } = useKybDocuments(brandId);
  const submitKyb = useSubmitKyb(brandId);
  const uploadDocument = useUploadKybDocument(brandId);
  const deleteDocument = useDeleteKybDocument(brandId);
  const fileUploadRef = useRef<FileUpload>(null);

  // Controlled form state — mirrors SubmitKybRequest shape (Wave 1).
  const [registeredName, setRegisteredName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [country, setCountry] = useState<string>('ZA');
  const [contactEmail, setContactEmail] = useState('');
  const [orgType, setOrgType] = useState<KybOrgType | null>(null);
  const [formError, setFormError] = useState('');
  // Hard Rule #6 — confirm dialog for non-rollbackable action (NOT_STARTED → PENDING).
  const [showConfirm, setShowConfirm] = useState(false);

  // Document upload form state. The picker stays separate from the file input
  // so we can show the chosen file before submit and validate inline.
  const [docType, setDocType] = useState<KybDocumentType | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docExpiresAt, setDocExpiresAt] = useState<Date | null>(null);
  const [docNotes, setDocNotes] = useState('');
  const [docError, setDocError] = useState('');

  // Confirm dialog for document deletion (Hard Rule #6).
  const [pendingDeleteDocId, setPendingDeleteDocId] = useState<string | null>(null);

  // When the brand record arrives (or refreshes), pre-populate form from the
  // persisted KYB fields. This drives the REJECTED resubmit flow — the brand
  // sees their previous answers ready to edit. NOT_STARTED keeps the empty
  // defaults. We only run on first arrival per kybStatus to avoid clobbering
  // edits the user has already made on this session.
  const lastSyncedStatusRef = useRef<KybStatus | null>(null);
  useEffect(() => {
    if (!brand) return;
    if (lastSyncedStatusRef.current === brand.kybStatus) return;
    lastSyncedStatusRef.current = brand.kybStatus;

    setRegisteredName(brand.kybRegisteredName ?? '');
    setTradeName(brand.kybTradeName ?? '');
    setRegistrationNumber(brand.kybRegistrationNumber ?? '');
    setVatNumber(brand.kybVatNumber ?? '');
    setTaxNumber(brand.kybTaxNumber ?? '');
    setCountry(brand.kybCountry ?? 'ZA');
    setContactEmail(brand.kybContactEmail ?? brand.contactEmail ?? '');
    setOrgType(brand.kybOrgType ?? null);
  }, [brand]);

  const status = brand?.kybStatus ?? KybStatus.NOT_STARTED;
  const canSubmit = status === KybStatus.NOT_STARTED || status === KybStatus.REJECTED;
  const canUploadDocs = status !== KybStatus.APPROVED;

  // Memoised so the empty-state branch keeps a stable reference.
  const documentRows = useMemo<KybDocumentResponse[]>(
    () => documents ?? [],
    [documents],
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Mirror the backend validators (class-validator) so users see issues inline.
    if (!registeredName.trim() || registeredName.length > 200) {
      setFormError('Registered name is required (max 200 characters).');
      return;
    }
    if (tradeName && tradeName.length > 200) {
      setFormError('Trading name must be at most 200 characters.');
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
    if (taxNumber && taxNumber.length > 50) {
      setFormError('Tax number must be at most 50 characters.');
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
    if (!orgType) {
      setFormError('Please select an organisation type.');
      return;
    }

    // Validation passed — open the confirm dialog. The mutation only fires on
    // explicit confirmation because KYB submission flips the brand into PENDING
    // and locks edits until a Super Admin reviews.
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!orgType) {
      // Defence-in-depth — handleSubmit already gated this, but TS doesn't
      // narrow `orgType` through the dialog round-trip.
      setShowConfirm(false);
      setFormError('Please select an organisation type.');
      return;
    }
    try {
      await submitKyb.mutateAsync({
        registeredName: registeredName.trim(),
        tradeName: tradeName.trim() || undefined,
        registrationNumber: registrationNumber.trim(),
        vatNumber: vatNumber.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        country,
        contactEmail: contactEmail.trim(),
        orgType,
      });
      setShowConfirm(false);
      // Reset the per-status sync ref so the form re-syncs from the new
      // PENDING brand row on the next render — picks up authoritative values.
      lastSyncedStatusRef.current = null;
      toast.showSuccess('KYB submitted. Awaiting Super Admin review.');
    } catch (err) {
      setShowConfirm(false);
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Couldn't submit KYB. Please try again.");
    }
  };

  const handleFileSelect = (e: FileUploadSelectEvent) => {
    setDocError('');
    const file = (e.files?.[0] ?? null) as File | null;
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setDocError('Only PDF, JPEG, and PNG files are accepted.');
      fileUploadRef.current?.clear();
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setDocError('File too large — maximum 10 MB.');
      fileUploadRef.current?.clear();
      return;
    }
    setDocFile(file);
  };

  const handleUpload = async () => {
    setDocError('');
    if (!docType) {
      setDocError('Select a document type before uploading.');
      return;
    }
    if (!docFile) {
      setDocError('Choose a file to upload.');
      return;
    }
    if (docNotes.length > 500) {
      setDocError('Notes must be at most 500 characters.');
      return;
    }
    try {
      await uploadDocument.mutateAsync({
        file: docFile,
        documentType: docType,
        expiresAt: docExpiresAt ? docExpiresAt.toISOString() : undefined,
        notes: docNotes.trim() || undefined,
      });
      // Clear all upload-form state on success so the user can chain another upload.
      setDocType(null);
      setDocFile(null);
      setDocExpiresAt(null);
      setDocNotes('');
      fileUploadRef.current?.clear();
      toast.showSuccess('Document uploaded.');
    } catch (err) {
      if (err instanceof ApiError) setDocError(err.message);
      else setDocError("Couldn't upload document. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteDocId) return;
    try {
      await deleteDocument.mutateAsync(pendingDeleteDocId);
      toast.showSuccess('Document removed.');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Couldn't delete document.";
      toast.showError(msg);
    } finally {
      setPendingDeleteDocId(null);
    }
  };

  const breadcrumbs = [
    { label: 'Brands', url: '/business/brands' },
    { label: 'KYB' },
  ];

  // Read-only "your submitted KYB" panel — used for PENDING and APPROVED.
  const submittedFieldsPanel = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DefinitionRow label="Registered name" value={brand.kybRegisteredName} />
      <DefinitionRow label="Trading name" value={brand.kybTradeName} />
      <DefinitionRow label="Registration number" value={brand.kybRegistrationNumber} />
      <DefinitionRow label="Organisation type" value={formatOrgType(brand.kybOrgType)} />
      <DefinitionRow label="VAT number" value={brand.kybVatNumber} />
      <DefinitionRow label="Tax number" value={brand.kybTaxNumber} />
      <DefinitionRow label="Country" value={brand.kybCountry} />
      <DefinitionRow label="Contact email" value={brand.kybContactEmail} />
    </div>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Know Your Business (KYB)"
        subtitle="Verify your business so you can fund bounties and receive payouts."
        breadcrumbs={breadcrumbs}
      />

      {/* REJECTED — surface the rejection reason at the top so it's the first thing the
          brand sees. The form below is pre-populated with their previous answers and the
          submit button label switches to "Resubmit for review". */}
      {status === KybStatus.REJECTED && (
        <Card className="mb-6">
          <Message
            severity="error"
            content={
              <div className="flex flex-col gap-1">
                <p className="font-semibold">
                  Your KYB submission was rejected
                  {brand.kybRejectedAt ? ` on ${formatDateTime(brand.kybRejectedAt)}` : ''}.
                </p>
                {brand.kybRejectionReason ? (
                  <p>
                    <span className="text-text-muted text-xs uppercase tracking-wider mr-2">Reason</span>
                    {brand.kybRejectionReason}
                  </p>
                ) : (
                  <p className="text-sm">No reason provided. Contact support if you need detail.</p>
                )}
                <p className="text-sm">Update the details below and resubmit when ready.</p>
              </div>
            }
            className="w-full"
          />
        </Card>
      )}

      {/* PENDING — read-only summary of what was submitted, plus the "awaiting review" banner. */}
      {status === KybStatus.PENDING && (
        <>
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
          <Card title="Submitted KYB details" className="mb-6">
            {submittedFieldsPanel}
          </Card>
        </>
      )}

      {/* APPROVED — success state, read-only fields, locked documents list. */}
      {status === KybStatus.APPROVED && (
        <>
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
          <Card title="Approved KYB details" className="mb-6">
            {submittedFieldsPanel}
          </Card>
        </>
      )}

      {/* Form — rendered for NOT_STARTED + REJECTED. */}
      {canSubmit && (
        <Card title={status === KybStatus.REJECTED ? 'Update KYB details' : 'Submit KYB details'} className="mb-6">
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
                htmlFor="tradeName"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Trading Name
              </label>
              <InputText
                id="tradeName"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                maxLength={200}
                className="w-full"
                placeholder="DBA / 'trading as' name (optional)"
              />
              <small className="text-xs text-text-muted mt-1 block">
                Leave blank if your trading name matches the registered name.
              </small>
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
                htmlFor="orgType"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Organisation Type *
              </label>
              <Dropdown
                id="orgType"
                value={orgType}
                options={ORG_TYPE_OPTIONS}
                onChange={(e) => setOrgType(e.value as KybOrgType)}
                className="w-full"
                placeholder="Select organisation type"
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
                htmlFor="taxNumber"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Tax Number
              </label>
              <InputText
                id="taxNumber"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                maxLength={50}
                className="w-full"
                placeholder="Optional"
              />
              <small className="text-xs text-text-muted mt-1 block">
                SARS income-tax reference (mandatory for org parties on TradeSafe).
              </small>
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

            <div className="flex justify-end">
              <Button
                type="submit"
                label={status === KybStatus.REJECTED ? 'Resubmit for review' : 'Submit KYB'}
                icon={<Send size={16} strokeWidth={2} />}
                loading={submitKyb.isPending}
                disabled={submitKyb.isPending}
              />
            </div>
          </form>
        </Card>
      )}

      {/* Documents section — surfaces in all states. Upload UI hides on APPROVED. */}
      <Card title="KYB Documents" className="mb-6">
        {!canUploadDocs && (
          <Message
            severity="info"
            text="KYB approved — documents are locked. Contact support to update."
            className="w-full mb-4"
          />
        )}

        {canUploadDocs && (
          <div className="space-y-4 mb-6">
            <p className="text-sm text-text-secondary">
              Upload the supporting documents we need to verify your business — typically the
              CIPC registration certificate, a recent bank-confirmation letter, and a director ID.
            </p>

            {docError && <Message severity="error" text={docError} className="w-full" />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="docType"
                  className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
                >
                  Document type *
                </label>
                <Dropdown
                  id="docType"
                  value={docType}
                  options={DOCUMENT_TYPE_OPTIONS}
                  onChange={(e) => setDocType(e.value as KybDocumentType)}
                  className="w-full"
                  placeholder="Select document type"
                />
              </div>

              <div>
                <label
                  htmlFor="docExpiresAt"
                  className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
                >
                  Expiry date
                </label>
                <Calendar
                  id="docExpiresAt"
                  value={docExpiresAt}
                  onChange={(e) => setDocExpiresAt((e.value as Date | null) ?? null)}
                  showIcon
                  className="w-full"
                  placeholder="Optional"
                  minDate={new Date()}
                />
                <small className="text-xs text-text-muted mt-1 block">
                  Leave blank for documents that don't expire (e.g. CIPC).
                </small>
              </div>
            </div>

            <div>
              <label
                htmlFor="docNotes"
                className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5"
              >
                Notes
              </label>
              <InputTextarea
                id="docNotes"
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full"
                placeholder="Optional internal note for the reviewer"
              />
              <small className="text-xs text-text-muted mt-1 block font-mono tabular-nums">
                {docNotes.length}/500
              </small>
            </div>

            <div>
              <label className="block text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
                File *
              </label>
              <FileUpload
                ref={fileUploadRef}
                mode="basic"
                name="file"
                accept={ACCEPT_ATTR}
                maxFileSize={MAX_FILE_SIZE}
                chooseLabel={docFile ? docFile.name : 'Choose file'}
                chooseOptions={{
                  icon: <Upload size={16} strokeWidth={2} />,
                  className: 'p-button-outlined',
                }}
                onSelect={handleFileSelect}
                onClear={() => setDocFile(null)}
                disabled={uploadDocument.isPending}
              />
              <small className="text-xs text-text-muted mt-1 block">
                PDF, JPEG, or PNG — up to 10 MB.
              </small>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                label="Upload document"
                icon={<Upload size={16} strokeWidth={2} />}
                loading={uploadDocument.isPending}
                disabled={uploadDocument.isPending || !docType || !docFile}
                onClick={handleUpload}
              />
            </div>
          </div>
        )}

        {/* Existing documents list — visible regardless of status. */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Uploaded documents{' '}
            <span className="text-text-muted font-mono tabular-nums">
              ({documentRows.length})
            </span>
          </h3>

          {documentsLoading && (
            <p className="text-sm text-text-muted">Loading documents…</p>
          )}

          {!documentsLoading && documentRows.length === 0 && (
            <p className="text-sm text-text-muted">
              No documents uploaded yet. Upload at least one supporting document before submitting.
            </p>
          )}

          {!documentsLoading && documentRows.length > 0 && (
            <ul className="border border-glass-border rounded-md divide-y divide-glass-border">
              {documentRows.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3"
                >
                  <FileText size={20} strokeWidth={2} className="text-text-muted shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium truncate">{doc.fileName}</span>
                      <Tag
                        value={formatDocumentType(doc.documentType)}
                        severity="info"
                        className="text-xs"
                      />
                    </div>
                    <div className="text-xs text-text-muted flex flex-wrap gap-x-3 gap-y-1 font-mono tabular-nums">
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>Uploaded {formatDateTime(doc.uploadedAt)}</span>
                      {doc.expiresAt && (
                        <span>Expires {formatDate(doc.expiresAt)}</span>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-text-secondary italic">{doc.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      label="View"
                      icon={<ExternalLink size={14} strokeWidth={2} />}
                      outlined
                      size="small"
                      onClick={() => window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')}
                    />
                    {canUploadDocs && (
                      <Button
                        type="button"
                        icon={<Trash2 size={14} strokeWidth={2} />}
                        severity="danger"
                        outlined
                        size="small"
                        aria-label={`Delete ${doc.fileName}`}
                        onClick={() => setPendingDeleteDocId(doc.id)}
                        disabled={deleteDocument.isPending}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <ConfirmAction
        visible={showConfirm}
        onHide={() => setShowConfirm(false)}
        title={status === KybStatus.REJECTED ? 'Resubmit KYB for review?' : 'Submit KYB for review?'}
        message="Once submitted, the brand cannot edit KYB details until a Super Admin reviews and either approves or rejects the submission."
        confirmLabel={status === KybStatus.REJECTED ? 'Resubmit for review' : 'Submit for review'}
        confirmSeverity="warning"
        onConfirm={handleConfirmSubmit}
        loading={submitKyb.isPending}
      />

      <ConfirmAction
        visible={pendingDeleteDocId !== null}
        onHide={() => setPendingDeleteDocId(null)}
        title="Delete this document?"
        message="The document will be permanently removed from the KYB submission. You can upload it again afterwards."
        confirmLabel="Delete"
        confirmSeverity="danger"
        onConfirm={handleConfirmDelete}
        loading={deleteDocument.isPending}
      />
    </div>
  );
}

// Small read-only label/value row used in the PENDING + APPROVED summary panels.
function DefinitionRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-text-muted text-xs uppercase tracking-wider font-medium mb-1.5">
        {label}
      </dt>
      <dd className="text-sm text-text-primary break-words">{value && value.length > 0 ? value : '—'}</dd>
    </div>
  );
}
