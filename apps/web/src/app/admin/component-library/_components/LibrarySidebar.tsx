'use client';

import { Star, Palette, Circle, LayoutGrid, Network, List, Crown } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

interface LibrarySidebarProps {
  activeSection: string;
}

const SECTIONS: { label: string; id: string; Icon: LucideIcon }[] = [
  { label: 'Brand', id: 'brand', Icon: Star },
  { label: 'Design tokens', id: 'design-tokens', Icon: Palette },
  { label: 'Atoms', id: 'atoms', Icon: Circle },
  { label: 'Molecules', id: 'molecules', Icon: LayoutGrid },
  { label: 'Organisms', id: 'organisms', Icon: Network },
  { label: 'Form sections', id: 'form-sections', Icon: List },
  { label: 'PrimeReact', id: 'primereact', Icon: Crown },
];

export function LibrarySidebar({ activeSection }: LibrarySidebarProps) {
  return (
    <aside className="sticky top-24 w-56 shrink-0 hidden lg:block">
      <div className="glass-card p-4 space-y-1 rounded-xl">
        <p className="eyebrow px-3 mb-2">Sections</p>
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-pink-600 bg-pink-100'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
              }`}
            >
              <section.Icon size={16} strokeWidth={2} />
              {section.label}
            </a>
          );
        })}
      </div>
    </aside>
  );
}
