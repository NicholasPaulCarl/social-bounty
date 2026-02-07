'use client';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Social Bounty</h1>
          <p className="text-sm text-neutral-500 mt-2">Complete bounties, earn rewards</p>
        </div>
        {children}
      </div>
    </div>
  );
}
