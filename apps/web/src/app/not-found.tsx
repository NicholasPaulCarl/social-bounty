import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-outline-variant">404</h1>
        <h2 className="text-2xl font-bold text-on-surface mt-4">Page Not Found</h2>
        <p className="text-on-surface-variant mt-2">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <i className="pi pi-home" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
