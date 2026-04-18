import { cn } from '@/lib/utils/cn';
import type { PillsConfig } from './types';

interface PageHeaderPillsProps {
  config: PillsConfig;
}

export function PageHeaderPills({ config }: PageHeaderPillsProps) {
  return (
    <div className="flex flex-wrap gap-3 pb-2" role="tablist" aria-label="Category filter">
      {config.items.map((item) => {
        const isActive = config.activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => config.onChange(item.id)}
            role="tab"
            aria-selected={isActive}
            aria-label={`Filter by ${item.label}`}
            className={cn(
              'whitespace-nowrap px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border cursor-pointer',
              isActive
                ? 'bg-pink-600/15 text-pink-600 border-pink-600/40 shadow-glow-brand'
                : 'bg-glass-bg border-glass-border text-text-secondary hover:bg-slate-100 hover:text-text-primary hover:border-slate-300'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
