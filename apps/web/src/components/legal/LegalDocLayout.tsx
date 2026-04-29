import Link from 'next/link';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import {
  LegalTableOfContentsDesktop,
  LegalTableOfContentsMobile,
  type TocItem,
} from './LegalTableOfContents';

export type LegalCategory = 'POPIA & Data' | 'Commercial' | 'Consumer' | 'Platform Rules';

interface LegalDocLayoutProps {
  title: string;
  category: LegalCategory;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  summary?: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export function LegalDocLayout({
  title,
  category,
  effectiveDate,
  lastUpdated,
  version,
  summary,
  toc,
  children,
}: LegalDocLayoutProps) {
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex items-center gap-1.5 text-slate-500 flex-wrap">
            <li>
              <Link href="/" className="hover:text-pink-600 transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
            <li>
              <Link href="/legal" className="hover:text-pink-600 transition-colors">
                Legal
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
            <li className="text-text-primary font-medium" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10 lg:gap-12">
          <main className="min-w-0 max-w-3xl">
            <header className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-pink-600 mb-3">
                {category}
              </p>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary mb-3">
                {title}
              </h1>
              <p className="text-sm text-slate-500">
                Version {version} · Effective {effectiveDate} · Last updated {lastUpdated}
              </p>
              {summary && (
                <p className="mt-4 text-slate-600 leading-relaxed">{summary}</p>
              )}
            </header>

            <div
              role="note"
              className="mb-10 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-500 mt-0.5" aria-hidden />
              <div>
                <strong className="font-semibold">Working draft.</strong> This document is a
                first draft intended for internal review. It must be reviewed by an admitted South
                African attorney before it governs a live user relationship.
              </div>
            </div>

            <div className="lg:hidden">
              <LegalTableOfContentsMobile items={toc} />
            </div>

            <article className="space-y-8 text-slate-700 leading-relaxed">
              {children}
            </article>

            <div className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500 flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/legal" className="hover:text-pink-600 transition-colors">
                ← Back to Legal
              </Link>
              <Link href="/contact" className="hover:text-pink-600 transition-colors">
                Contact us
              </Link>
            </div>
          </main>

          <aside className="hidden lg:block">
            <LegalTableOfContentsDesktop items={toc} />
          </aside>
        </div>
      </div>
    </section>
  );
}
