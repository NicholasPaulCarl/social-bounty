import { useState, useEffect } from 'react';
import { ColorsSection } from './sections/ColorsSection';
import { TypographySection } from './sections/TypographySection';
import { SpacingSection } from './sections/SpacingSection';
import { ComponentsSection } from './sections/ComponentsSection';
import { AppSection } from './sections/AppSection';
import { PatternsSection } from './sections/PatternsSection';
import { IconsSection } from './sections/IconsSection';
import { Sun, Moon } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing & Radii' },
  { id: 'components', label: 'Components' },
  { id: 'app-components', label: 'App Components' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'icons', label: 'Icons' },
];

export function App() {
  const [dark, setDark] = useState(false);
  const [activeSection, setActiveSection] = useState('colors');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.style.background = dark ? 'var(--bg-abyss)' : 'var(--bg-abyss)';
    document.body.style.color = dark ? 'var(--text-primary)' : 'var(--text-primary)';
  }, [dark]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    for (const { id } of NAV_ITEMS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-200 p-6 sticky top-0 h-screen overflow-y-auto"
        style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
        <div className="mb-8">
          <h2 className="font-heading font-bold text-lg gradient-text">Social Bounty</h2>
          <p className="text-xs text-text-muted mt-1">Design System</p>
        </div>

        <nav className="space-y-1 mb-8">
          {NAV_ITEMS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === id
                  ? 'bg-pink-50 text-pink-700'
                  : 'hover:bg-slate-100'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="border-t pt-4" style={{ borderColor: 'var(--glass-border)' }}>
          <button
            onClick={() => setDark(!dark)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-slate-100 hover:text-text-primary transition-colors w-full"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto px-8 py-12 space-y-16">
        <ColorsSection />
        <TypographySection />
        <SpacingSection />
        <ComponentsSection />
        <AppSection />
        <PatternsSection />
        <IconsSection />
      </main>
    </div>
  );
}
