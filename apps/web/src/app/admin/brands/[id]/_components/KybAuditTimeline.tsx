'use client';

import { useState } from 'react';
import { Tag } from 'primereact/tag';
import { ChevronDown, ChevronRight, Clock, User } from 'lucide-react';
import { formatDateTime, formatRelativeTime, formatEnumLabel } from '@/lib/utils/format';
import type { BrandKybAuditLogEntry } from '@social-bounty/shared';

interface KybAuditTimelineProps {
  entries: BrandKybAuditLogEntry[];
}

/**
 * Vertical timeline of KYB-related audit log entries, newest-first. Each entry
 * exposes a "View details" toggle that reveals the JSON before/after state
 * blobs — useful for SUPER_ADMIN forensics without having to drop into the
 * raw audit-logs surface.
 */
export function KybAuditTimeline({ entries }: KybAuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-muted py-4">
        No KYB events recorded yet for this brand.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-glass-border ml-3 space-y-5">
      {entries.map((entry) => (
        <AuditRow key={entry.id} entry={entry} />
      ))}
    </ol>
  );
}

function AuditRow({ entry }: { entry: BrandKybAuditLogEntry }) {
  const [open, setOpen] = useState(false);

  const before = entry.beforeState;
  const after = entry.afterState;
  const hasDetails =
    (before && Object.keys(before).length > 0) ||
    (after && Object.keys(after).length > 0);

  return (
    <li className="ml-5 relative">
      <span
        className="absolute -left-[1.625rem] top-1 w-3 h-3 rounded-full bg-pink-600 ring-4 ring-surface-card"
        aria-hidden="true"
      />
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 mb-1">
        <span className="text-sm font-medium text-text-primary">
          {formatActionLabel(entry.action)}
        </span>
        <span className="text-xs text-text-muted font-mono tabular-nums" title={formatDateTime(entry.createdAt)}>
          <Clock size={11} strokeWidth={2} className="inline-block mr-1 -mt-0.5" />
          {formatRelativeTime(entry.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-1">
        <span className="inline-flex items-center gap-1">
          <User size={11} strokeWidth={2} />
          <span className="font-mono tabular-nums">{entry.actorId.slice(0, 8)}…</span>
        </span>
        <Tag value={formatEnumLabel(entry.actorRole)} severity="info" className="text-xs px-1.5 py-0.5" />
        {entry.reason && (
          <span className="text-text-muted italic">"{entry.reason}"</span>
        )}
      </div>

      {hasDetails && (
        <button
          type="button"
          className="text-xs text-pink-600 hover:text-pink-700 inline-flex items-center gap-1 mt-1"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
          {open ? 'Hide details' : 'View details'}
        </button>
      )}

      {open && hasDetails && (
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
          {before && Object.keys(before).length > 0 && (
            <div>
              <div className="text-text-muted mb-1 uppercase tracking-wider">Before</div>
              <pre className="bg-surface-hover/40 rounded-lg px-2.5 py-2 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(before, null, 2)}
              </pre>
            </div>
          )}
          {after && Object.keys(after).length > 0 && (
            <div>
              <div className="text-text-muted mb-1 uppercase tracking-wider">After</div>
              <pre className="bg-surface-hover/40 rounded-lg px-2.5 py-2 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// `kyb.submit` → `Kyb Submit`, `brand.tradesafe_token_created` → `Brand Tradesafe Token Created`
function formatActionLabel(action: string): string {
  return action
    .split(/[._]/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}
