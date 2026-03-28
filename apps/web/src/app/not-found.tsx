import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-abyss px-4">
      <div className="text-center">
        <h1 className="text-8xl font-heading font-bold bg-gradient-to-r from-accent-cyan to-accent-violet bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-2xl font-heading font-bold text-primary mt-4">
          Page Not Found
        </h2>
        <p className="text-secondary mt-3 max-w-sm mx-auto">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-gradient-to-r from-accent-cyan to-accent-blue text-white rounded-lg hover:shadow-glow-cyan transition-all duration-250 font-medium text-sm"
        >
          <i className="pi pi-home" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
