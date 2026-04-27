'use client';

import Link from 'next/link';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ExternalLink, FileText, AlertTriangle } from 'lucide-react';
import { formatBytes, formatDate, formatEnumLabel } from '@/lib/utils/format';
import { getUploadUrl } from '@/lib/api/client';
import type { KybDocumentResponse } from '@social-bounty/shared';

interface KybDocumentsCardProps {
  documents: KybDocumentResponse[];
}

const EXPIRY_WARN_DAYS = 30;

function expiryStatus(expiresAt: string | null): {
  label: string;
  severity: 'success' | 'warning' | 'danger';
  daysFromNow: number;
} | null {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  if (!Number.isFinite(t)) return null;
  const diffDays = Math.ceil((t - Date.now()) / 86_400_000);
  if (diffDays < 0) {
    return {
      label: `expired ${Math.abs(diffDays)}d ago`,
      severity: 'danger',
      daysFromNow: diffDays,
    };
  }
  if (diffDays < EXPIRY_WARN_DAYS) {
    return {
      label: `expires in ${diffDays}d`,
      severity: 'warning',
      daysFromNow: diffDays,
    };
  }
  return {
    label: `expires ${formatDate(expiresAt)}`,
    severity: 'success',
    daysFromNow: diffDays,
  };
}

/**
 * Right-column card on the KYB review surface. Lists every uploaded document
 * with type, size, upload date, optional expiry warning, and a "View" button
 * that opens the signed file URL in a new tab.
 */
export function KybDocumentsCard({ documents }: KybDocumentsCardProps) {
  return (
    <section className="glass-card p-6">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-text-primary">
          Documents
          <span className="ml-2 text-sm font-normal text-text-muted font-mono tabular-nums">
            ({documents.length})
          </span>
        </h3>
      </header>

      {documents.length === 0 ? (
        <Message
          severity="warn"
          text="No documents uploaded yet — KYB cannot be approved without supporting evidence."
          className="w-full"
        />
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DocumentRow({ doc }: { doc: KybDocumentResponse }) {
  const expiry = expiryStatus(doc.expiresAt);
  const url = getUploadUrl(doc.fileUrl) ?? doc.fileUrl;

  return (
    <li className="rounded-xl border border-glass-border p-4 bg-surface-card/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} strokeWidth={2} className="text-text-muted shrink-0" />
            <Tag
              value={formatEnumLabel(doc.documentType)}
              severity="info"
              className="text-xs px-1.5 py-0.5"
            />
          </div>
          <p className="text-sm text-text-primary font-medium truncate" title={doc.fileName}>
            {doc.fileName}
          </p>
          <p className="text-xs text-text-muted font-mono tabular-nums mt-0.5">
            {formatBytes(doc.fileSize)} · uploaded {formatDate(doc.uploadedAt)}
          </p>
          {doc.notes && (
            <p className="text-xs text-text-secondary italic mt-1">"{doc.notes}"</p>
          )}
        </div>
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-700 text-sm inline-flex items-center gap-1 shrink-0"
        >
          View <ExternalLink size={14} strokeWidth={2} />
        </Link>
      </div>

      {expiry && (
        <div className="mt-3">
          {expiry.severity === 'danger' ? (
            <Message
              severity="error"
              icon={<AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />}
              text={expiry.label}
              className="w-full"
            />
          ) : expiry.severity === 'warning' ? (
            <Message
              severity="warn"
              icon={<AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />}
              text={expiry.label}
              className="w-full"
            />
          ) : (
            <p className="text-xs text-text-muted">{expiry.label}</p>
          )}
        </div>
      )}
    </li>
  );
}
