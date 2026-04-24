'use client';

import { useEffect, useState } from 'react';

export interface TocItem {
  id: string;
  label: string;
}

interface TocProps {
  items: TocItem[];
}

function useActiveHeading(items: TocItem[]): string {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return activeId;
}

export function LegalTableOfContentsDesktop({ items }: TocProps) {
  const activeId = useActiveHeading(items);
  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="sticky top-24 self-start">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        On this page
      </p>
      <ul className="space-y-1 text-sm">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={[
                  'block py-1.5 pl-3 border-l-2 transition-colors',
                  isActive
                    ? 'border-pink-600 text-pink-600 font-medium'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300',
                ].join(' ')}
                aria-current={isActive ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function LegalTableOfContentsMobile({ items }: TocProps) {
  if (items.length === 0) return null;

  return (
    <details className="mb-8 rounded-xl border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 flex items-center justify-between">
        <span>On this page</span>
        <span className="text-slate-400 text-xs">{items.length} sections</span>
      </summary>
      <ul className="border-t border-slate-200 px-4 py-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block py-1 text-slate-600 hover:text-pink-600 transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
