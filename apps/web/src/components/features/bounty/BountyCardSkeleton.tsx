'use client';

/**
 * BountyCardSkeleton — shimmer placeholder matching the new card hierarchy.
 *
 * Per the Claude Design handoff (`bounty-card.jsx:249-285`). Mirrors the live
 * card frame: reward bar (88×28), brand row (24-disc + 110-bar), title bar,
 * two format-chip bars, footer with time + slots bars. Uses `@keyframes
 * sk-shimmer` declared in `globals.css`.
 */
export function BountyCardSkeleton() {
  const bar = (width: number | string, height = 10, marginTop = 0) => (
    <div
      style={{
        width,
        height,
        borderRadius: 4,
        background:
          'linear-gradient(90deg, var(--slate-100) 0%, var(--slate-200) 50%, var(--slate-100) 100%)',
        backgroundSize: '200% 100%',
        animation: 'sk-shimmer 1.4s infinite',
        marginTop,
      }}
    />
  );

  return (
    <div
      aria-hidden="true"
      className="flex flex-col bg-surface"
      style={{
        border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-xl)',
        padding: 16,
        minHeight: 168,
        gap: 10,
      }}
    >
      {bar(88, 28)}
      <div className="flex items-center" style={{ gap: 8, marginTop: 4 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 9999,
            background: 'var(--slate-100)',
          }}
        />
        {bar(110, 12)}
      </div>
      {bar('90%', 14, 4)}
      <div className="flex" style={{ gap: 6, marginTop: 4 }}>
        {bar(60, 18)}
        {bar(48, 18)}
      </div>
      <div style={{ flex: 1 }} />
      <div
        className="flex justify-between"
        style={{ paddingTop: 8, borderTop: '1px solid var(--slate-100)' }}
      >
        {bar(56, 12)}
        {bar(72, 12)}
      </div>
    </div>
  );
}
