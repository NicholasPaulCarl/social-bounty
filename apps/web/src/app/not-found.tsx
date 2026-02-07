import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-300">404</h1>
        <h2 className="text-2xl font-bold text-neutral-900 mt-4">Page Not Found</h2>
        <p className="text-neutral-600 mt-2">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <i className="pi pi-home" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
