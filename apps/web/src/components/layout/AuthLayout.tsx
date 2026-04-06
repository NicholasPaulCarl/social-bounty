'use client';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tighter text-primary font-headline">Social Bounty</h1>
          <p className="text-on-surface-variant mt-3 text-lg">Complete bounties, earn rewards</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
