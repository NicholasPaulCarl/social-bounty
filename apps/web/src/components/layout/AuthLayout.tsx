'use client';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg-abyss px-4 py-12 overflow-hidden">
      {/* ── Animated gradient mesh background ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Blob 1 — cyan, top-left drift */}
        <div
          className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-30 blur-[120px] animate-mesh-drift"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />
        {/* Blob 2 — violet, bottom-right drift (offset timing via animation-delay) */}
        <div
          className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full opacity-25 blur-[140px] animate-mesh-drift"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            animationDelay: '-7s',
          }}
        />
        {/* Blob 3 — blue, center drift (offset timing) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px] animate-mesh-drift"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            animationDelay: '-13s',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* ── Branding ── */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold tracking-tight bg-gradient-to-r from-accent-cyan to-accent-violet bg-clip-text text-transparent">
            Social Bounty
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Complete bounties, earn rewards
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
