/**
 * ESM re-export of the design system's thin React wrappers.
 *
 * The canonical `components.jsx` uses classic JSX runtime (bare `React.*`)
 * and assigns everything to `window` for script-tag usage. This file
 * provides proper ES module exports for the Vite context.
 */
import React, { useRef, useEffect, Fragment } from 'react';
import type { ReactNode, CSSProperties } from 'react';

/* ── Utilities ──────────────────────────────────────────────────────── */
export const cx = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(' ');

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function useStableId(prefix: string) {
  const idRef = useRef<string | null>(null);
  if (!idRef.current) {
    idRef.current = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return idRef.current;
}

/* ── Button ─────────────────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cx('btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, className)}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

/* ── Badge ──────────────────────────────────────────────────────────── */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ tone = 'neutral', children, className, ...rest }: BadgeProps) {
  return (
    <span className={cx('badge', `badge-${tone}`, className)} {...rest}>
      {children}
    </span>
  );
}

/* ── FilterChip ─────────────────────────────────────────────────────── */
interface FilterChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
}

export function FilterChip({ children, onRemove, className, ...rest }: FilterChipProps) {
  return (
    <span className={cx('filter-chip', className)} {...rest}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove filter">
          ✕
        </button>
      )}
    </span>
  );
}

/* ── Card ───────────────────────────────────────────────────────────── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  feature?: boolean;
}

export function Card({ feature = false, children, className, ...rest }: CardProps) {
  return (
    <div className={cx('card', feature && 'card-feature', className)} {...rest}>
      {children}
    </div>
  );
}

/* ── KPI tile ───────────────────────────────────────────────────────── */
interface KPIProps {
  label: string;
  value: string;
  unit?: string;
  meta?: string;
  delta?: { dir: 'up' | 'down'; pct: number };
  feature?: boolean;
  large?: boolean;
  sparkline?: ReactNode;
  className?: string;
}

export function KPI({
  label,
  value,
  unit,
  meta,
  delta,
  feature = false,
  large = false,
  sparkline,
  className,
}: KPIProps) {
  return (
    <div className={cx('kpi', feature && 'kpi-feature', className)}>
      <span className="kpi-label">{label}</span>
      <span className={cx('kpi-value', large && 'kpi-value-lg')}>
        {value}
        {unit && (
          <span
            style={{
              fontSize: '0.6em',
              color: 'var(--text-muted)',
              fontWeight: 400,
              marginLeft: 2,
            }}
          >
            {unit}
          </span>
        )}
      </span>
      {(meta || delta) && (
        <span className="kpi-meta">
          {delta && (
            <span className={delta.dir === 'down' ? 'kpi-delta-down' : 'kpi-delta-up'}>
              {delta.dir === 'down' ? '↓' : '↑'} {delta.pct}%
            </span>
          )}
          {meta && (delta ? ' ' : '')}
          {meta}
        </span>
      )}
      {sparkline}
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────────── */
interface EmptyProps {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'brand';
}

export function Empty({ icon, title, body, action, tone = 'default' }: EmptyProps) {
  const illusStyle: CSSProperties | undefined =
    tone === 'success'
      ? { background: 'var(--success-100)', color: 'var(--success-700)' }
      : tone === 'warning'
        ? { background: 'var(--warning-100)', color: 'var(--warning-700)' }
        : tone === 'brand'
          ? { background: 'var(--pink-600)', color: 'white' }
          : undefined;
  return (
    <div className="empty">
      <div className="empty-illus" style={illusStyle}>
        {icon}
      </div>
      <h5 className="empty-title">{title}</h5>
      <p className="empty-body">{body}</p>
      {action}
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────── */
interface SkeletonProps {
  shape?: 'line' | 'line-lg' | 'circle' | 'rect';
  w?: string | number;
  h?: string | number;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ shape = 'line', w, h, className, style }: SkeletonProps) {
  const cls =
    shape === 'circle'
      ? 'skeleton-circle'
      : shape === 'rect'
        ? 'skeleton-rect'
        : shape === 'line-lg'
          ? 'skeleton-line-lg'
          : 'skeleton-line';
  return <span className={cx('skeleton', cls, className)} style={{ width: w, height: h, ...style }} />;
}

/* ── Spinner ────────────────────────────────────────────────────────── */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  onPink?: boolean;
}

export function Spinner({ size = 'md', onPink = false }: SpinnerProps) {
  return (
    <div
      className={cx(
        'spinner',
        size === 'sm' && 'spinner-sm',
        size === 'lg' && 'spinner-lg',
        onPink && 'spinner-on-pink',
      )}
    />
  );
}

/* ── Verification badge ─────────────────────────────────────────────── */
const VERIF_ICON: Record<string, ReactNode> = {
  verified: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  scraping: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
    </svg>
  ),
  removed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
};
const VERIF_LABEL: Record<string, string> = {
  verified: 'Verified',
  scraping: 'Scraping',
  removed: 'Post removed',
  pending: 'Pending',
};

interface VerifBadgeProps {
  state?: 'verified' | 'scraping' | 'removed' | 'pending';
  label?: string;
}

export function VerifBadge({ state = 'pending', label }: VerifBadgeProps) {
  return (
    <span className={`verif verif-${state}`}>
      {VERIF_ICON[state]}
      {label || VERIF_LABEL[state]}
    </span>
  );
}

/* ── Segmented control ──────────────────────────────────────────────── */
interface SegmentedProps {
  options: (string | { value: string; label: string })[];
  value: string;
  onChange?: (v: string) => void;
}

export function Segmented({ options = [], value, onChange }: SegmentedProps) {
  return (
    <div className="segmented" role="group" aria-label="Options">
      {options.map((opt) => {
        const v = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <button type="button" key={v} aria-pressed={value === v} onClick={() => onChange?.(v)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Stepper ────────────────────────────────────────────────────────── */
interface StepperProps {
  steps: string[];
  current?: number;
}

export function Stepper({ steps = [], current = 0 }: StepperProps) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <Fragment key={i}>
          <div className={cx('stepper-step', i < current && 'is-done', i === current && 'is-current')}>
            <span className="stepper-num">{i < current ? '✓' : i + 1}</span>
            {s}
          </div>
          {i < steps.length - 1 && <div className="stepper-divider" />}
        </Fragment>
      ))}
    </div>
  );
}

/* ── Modal (controlled) ─────────────────────────────────────────────── */
interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}

export function Modal({ open, onClose, title, subtitle, children, footer, danger = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useStableId('sb-modal-title');
  const subtitleId = useStableId('sb-modal-subtitle');

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const focusable = getFocusableElements(dialog);
    const initialTarget = focusable[0] || dialog;
    initialTarget.focus();

    return () => {
      const previousFocus = previousFocusRef.current;
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose?.();
      return;
    }

    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = getFocusableElements(dialog);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div
        ref={dialogRef}
        className={cx('modal', danger && 'modal-danger')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h3 id={titleId}>{title}</h3>
            {subtitle && <p id={subtitleId}>{subtitle}</p>}
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Toast ──────────────────────────────────────────────────────────── */
interface ToastProps {
  tone?: 'info' | 'success' | 'danger' | 'error' | 'warning';
  title?: string;
  body?: string;
  action?: ReactNode;
}

export function Toast({ tone = 'info', title, body, action }: ToastProps) {
  const urgent = tone === 'danger' || tone === 'error';
  return (
    <div
      className={cx('toast', `toast-${tone}`)}
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="toast-body">
        {title && <div className="toast-title">{title}</div>}
        {body && <div className="toast-text">{body}</div>}
      </div>
      {action}
    </div>
  );
}
