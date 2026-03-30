'use client';

interface LibrarySidebarProps {
  activeSection: string;
}

const SECTIONS = [
  { label: 'Brand', id: 'brand', icon: 'pi pi-star' },
  { label: 'Design Tokens', id: 'design-tokens', icon: 'pi pi-palette' },
  { label: 'Atoms', id: 'atoms', icon: 'pi pi-circle' },
  { label: 'Molecules', id: 'molecules', icon: 'pi pi-th-large' },
  { label: 'Organisms', id: 'organisms', icon: 'pi pi-sitemap' },
  { label: 'Form Sections', id: 'form-sections', icon: 'pi pi-list' },
  { label: 'PrimeReact', id: 'primereact', icon: 'pi pi-prime' },
];

export function LibrarySidebar({ activeSection }: LibrarySidebarProps) {
  return (
    <aside className="sticky top-24 w-56 shrink-0 hidden lg:block">
      <div className="glass-card p-4 space-y-1">
        <p className="text-xs text-text-muted uppercase tracking-wider font-medium px-3 mb-2">Sections</p>
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-accent-cyan bg-accent-cyan/10'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <i className={`${section.icon} text-xs`} />
              {section.label}
            </a>
          );
        })}
      </div>
    </aside>
  );
}
