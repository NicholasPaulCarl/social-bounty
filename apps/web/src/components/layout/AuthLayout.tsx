'use client';

import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #eff6ff 40%, #fce7f3 70%, #dbeafe 100%)' }}>
      {/* ── Subtle gradient blobs ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-20 blur-[120px] animate-mesh-drift"
          style={{ background: 'radial-gradient(circle, #db2777 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full opacity-15 blur-[140px] animate-mesh-drift"
          style={{
            background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
            animationDelay: '-7s',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-10 blur-[100px] animate-mesh-drift"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            animationDelay: '-13s',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* ── Branding ── */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-heading font-bold tracking-tight text-pink-600 hover:text-pink-500 transition-colors duration-200">
            Social Bounty
          </Link>
          <p className="text-sm text-slate-600 mt-2">
            Complete bounties, earn rewards
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
