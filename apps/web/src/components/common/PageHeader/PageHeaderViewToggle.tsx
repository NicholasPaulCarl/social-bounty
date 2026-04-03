import { cn } from '@/lib/utils/cn';

interface PageHeaderViewToggleProps {
  mode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}

export function PageHeaderViewToggle({ mode, onChange }: PageHeaderViewToggleProps) {
  return (
    <div className="flex items-center glass-card !rounded-lg overflow-hidden !p-0 ml-auto">
      <button
        onClick={() => onChange('grid')}
        aria-label="Grid view"
        aria-pressed={mode === 'grid'}
        className={cn(
          'flex items-center justify-center w-10 h-10 transition-all duration-200 cursor-pointer',
          mode === 'grid'
            ? 'bg-accent-cyan/15 text-accent-cyan shadow-glow-cyan'
            : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
        )}
      >
        <i className="pi pi-th-large text-sm" />
      </button>
      <div className="w-px h-5 bg-slate-200" />
      <button
        onClick={() => onChange('list')}
        aria-label="List view"
        aria-pressed={mode === 'list'}
        className={cn(
          'flex items-center justify-center w-10 h-10 transition-all duration-200 cursor-pointer',
          mode === 'list'
            ? 'bg-accent-cyan/15 text-accent-cyan shadow-glow-cyan'
            : 'text-text-muted hover:text-text-primary hover:bg-slate-100'
        )}
      >
        <i className="pi pi-list text-sm" />
      </button>
    </div>
  );
}
