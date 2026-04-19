'use client';

interface StatusDotProps {
  /** Hex / CSS color for the inner dot. Default success-500 (live). */
  color?: string;
  /** Uppercase label rendered next to the dot. Default "LIVE". */
  label?: string;
}

/**
 * StatusDot — 8px round + soft ring + uppercase label.
 *
 * Per the Claude Design handoff (`bounty-card.jsx:63-76`). The ring
 * uses currentColor at ~13% alpha (the `${color}22` trick). Default
 * pairing is success-500 + "LIVE" because that's what every browse
 * card defaults to; pass a different colour/label for other states.
 */
export function StatusDot({
  color = 'var(--success-500)',
  label = 'LIVE',
}: StatusDotProps) {
  return (
    <span
      className="inline-flex items-center"
      style={{ gap: 6 }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 9999,
          background: color,
          // Soft ring — relative to the dot color (var-token aware).
          boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 13%, transparent)`,
          flex: 'none',
        }}
      />
      <span
        className="font-bold uppercase text-text-muted"
        style={{ fontSize: 10, letterSpacing: '0.08em' }}
      >
        {label}
      </span>
    </span>
  );
}
