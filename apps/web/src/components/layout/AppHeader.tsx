'use client';

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-4 bg-bg-surface/80 backdrop-blur-xl border-b border-glass-border md:hidden">
      <button
        className="p-3 min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <i className="pi pi-bars text-lg" />
      </button>
      <div className="flex-1" />
    </header>
  );
}
