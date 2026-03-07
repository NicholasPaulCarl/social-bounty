'use client';

interface AppHeaderProps {
  onMenuToggle: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-4 bg-white border-b border-neutral-200 md:hidden">
      <button
        className="p-2 rounded hover:bg-neutral-100"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <i className="pi pi-bars text-lg" />
      </button>
      <div className="flex-1" />
    </header>
  );
}
