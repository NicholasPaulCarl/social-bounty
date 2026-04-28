/* @jsxRuntime classic */
/* @jsxFrag React.Fragment */
/* ═══════════════════════════════════════════════════════════════════
   Social Bounty — thin React wrappers
   Drop in alongside the CSS files. All wrappers are stateless presentation
   layers that emit the canonical class names from components.css / patterns.css.

   Usage:
     <script type="text/babel" src="../components.jsx"></script>
     <Button variant="primary" size="lg">Send payouts</Button>
     <Badge tone="success">Live</Badge>
     <KPI label="Earnings" value="$1,247" delta={{ dir: "up", pct: 18 }} feature />
     <VerifBadge state="verified" />
   ═══════════════════════════════════════════════════════════════════ */

const cx = (...xs) => xs.filter(Boolean).join(" ");

/* ── Button ──────────────────────────────────────────────────────── */
function Button({ variant = "primary", size = "md", icon, iconRight, children, className, ...rest }) {
  return (
    <button
      className={cx("btn", `btn-${variant}`, size !== "md" && `btn-${size}`, className)}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

/* ── Badge / Chip ────────────────────────────────────────────────── */
function Badge({ tone = "neutral", children, className, ...rest }) {
  return (
    <span className={cx("badge", `badge-${tone}`, className)} {...rest}>
      {children}
    </span>
  );
}

function FilterChip({ children, onRemove, className, ...rest }) {
  return (
    <span className={cx("filter-chip", className)} {...rest}>
      {children}
      {onRemove && (
        <button onClick={onRemove} aria-label="Remove filter">✕</button>
      )}
    </span>
  );
}

/* ── Card ────────────────────────────────────────────────────────── */
function Card({ feature = false, children, className, ...rest }) {
  return (
    <div className={cx("card", feature && "card-feature", className)} {...rest}>
      {children}
    </div>
  );
}

/* ── KPI tile ────────────────────────────────────────────────────── */
function KPI({ label, value, unit, meta, delta, feature = false, large = false, sparkline, className }) {
  return (
    <div className={cx("kpi", feature && "kpi-feature", className)}>
      <span className="kpi-label">{label}</span>
      <span className={cx("kpi-value", large && "kpi-value-lg")}>
        {value}{unit && <span style={{ fontSize: "0.6em", color: "var(--text-muted)", fontWeight: 400, marginLeft: 2 }}>{unit}</span>}
      </span>
      {(meta || delta) && (
        <span className="kpi-meta">
          {delta && (
            <span className={delta.dir === "down" ? "kpi-delta-down" : "kpi-delta-up"}>
              {delta.dir === "down" ? "↓" : "↑"} {delta.pct}%
            </span>
          )}
          {meta && (delta ? " " : "")}{meta}
        </span>
      )}
      {sparkline}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */
function Empty({ icon, title, body, action, tone = "default" }) {
  const illusStyle =
    tone === "success" ? { background: "var(--success-100)", color: "var(--success-700)" }
    : tone === "warning" ? { background: "var(--warning-100)", color: "var(--warning-700)" }
    : tone === "brand"   ? { background: "var(--pink-600)", color: "white" }
    : null;
  return (
    <div className="empty">
      <div className="empty-illus" style={illusStyle}>{icon}</div>
      <h5 className="empty-title">{title}</h5>
      <p className="empty-body">{body}</p>
      {action}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────── */
function Skeleton({ shape = "line", w, h, className, style }) {
  const cls = shape === "circle" ? "skeleton-circle" : shape === "rect" ? "skeleton-rect" : shape === "line-lg" ? "skeleton-line-lg" : "skeleton-line";
  return <span className={cx("skeleton", cls, className)} style={{ width: w, height: h, ...style }} />;
}

/* ── Spinner ─────────────────────────────────────────────────────── */
function Spinner({ size = "md", onPink = false }) {
  return <div className={cx("spinner", size === "sm" && "spinner-sm", size === "lg" && "spinner-lg", onPink && "spinner-on-pink")} />;
}

/* ── Verification badge ──────────────────────────────────────────── */
const VERIF_ICON = {
  verified: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  scraping: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>,
  removed:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  pending:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
};
const VERIF_LABEL = { verified: "Verified", scraping: "Scraping", removed: "Post removed", pending: "Pending" };
function VerifBadge({ state = "pending", label }) {
  return (
    <span className={`verif verif-${state}`}>
      {VERIF_ICON[state]}
      {label || VERIF_LABEL[state]}
    </span>
  );
}

/* ── Segmented control ───────────────────────────────────────────── */
function Segmented({ options = [], value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map(opt => {
        const v = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <button
            key={v}
            aria-pressed={value === v}
            onClick={() => onChange?.(v)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Stepper ─────────────────────────────────────────────────────── */
function Stepper({ steps = [], current = 0 }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={cx("stepper-step", i < current && "is-done", i === current && "is-current")}>
            <span className="stepper-num">{i < current ? "✓" : i + 1}</span>{s}
          </div>
          {i < steps.length - 1 && <div className="stepper-divider" />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Modal (controlled) ──────────────────────────────────────────── */
function Modal({ open, onClose, title, subtitle, children, footer, danger = false }) {
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className={cx("modal", danger && "modal-danger")} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────── */
function Toast({ tone = "info", title, body, action }) {
  return (
    <div className={cx("toast", `toast-${tone}`)}>
      <div className="toast-body">
        {title && <div className="toast-title">{title}</div>}
        {body && <div className="toast-text">{body}</div>}
      </div>
      {action}
    </div>
  );
}

/* Export to window for cross-script access */
Object.assign(window, {
  Button, Badge, FilterChip, Card, KPI,
  Empty, Skeleton, Spinner,
  VerifBadge, Segmented, Stepper,
  Modal, Toast,
});
