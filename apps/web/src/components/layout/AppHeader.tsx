'use client';

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-6 bg-white/80 backdrop-blur-xl md:hidden">
      <button
        className="p-2 rounded-full hover:bg-surface-container transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-on-surface-variant">menu</span>
      </button>
      <div className="flex-1 text-center">
        <span className="text-lg font-bold tracking-tighter text-primary font-headline">Social Bounty</span>
      </div>
      <div className="w-10" />
    </header>
  );
}
