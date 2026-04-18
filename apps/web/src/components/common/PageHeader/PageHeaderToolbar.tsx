import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { FilterX, Search } from 'lucide-react';
import { useToolbarSearch } from './useToolbarSearch';
import { PageHeaderViewToggle } from './PageHeaderViewToggle';
import type { ToolbarConfig } from './types';

interface PageHeaderToolbarProps {
  config: ToolbarConfig;
}

export function PageHeaderToolbar({ config }: PageHeaderToolbarProps) {
  const {
    search,
    filters,
    filterValues,
    onFilterChange,
    onClearFilters,
    hasActiveFilters,
    viewMode,
    onViewModeChange,
    extra,
  } = config;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
      {search && <ToolbarSearch config={search} />}

      {filters && filters.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {filters.map((filter) => (
            <Dropdown
              key={filter.key}
              value={filterValues?.[filter.key] || ''}
              options={filter.options}
              onChange={(e) => onFilterChange?.(filter.key, e.value)}
              placeholder={filter.placeholder}
              aria-label={filter.ariaLabel || filter.placeholder}
              className={filter.className || 'w-full sm:w-40'}
            />
          ))}
        </div>
      )}

      {extra}

      {hasActiveFilters && onClearFilters && (
        <Button
          icon={<FilterX size={18} strokeWidth={2} />}
          outlined
          severity="secondary"
          onClick={onClearFilters}
          tooltip="Clear filters"
          aria-label="Clear all filters"
          className="text-slate-600 w-full sm:w-auto"
        />
      )}

      {viewMode && onViewModeChange && (
        <PageHeaderViewToggle mode={viewMode} onChange={onViewModeChange} />
      )}
    </div>
  );
}

function ToolbarSearch({ config }: { config: NonNullable<ToolbarConfig['search']> }) {
  const { inputValue, setInputValue } = useToolbarSearch({
    value: config.value,
    onChange: config.onChange,
    debounceMs: config.debounceMs,
  });

  return (
    <span className="relative w-full sm:w-auto inline-flex items-center">
      <Search
        size={16}
        strokeWidth={2}
        className="absolute left-3 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
      <InputText
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={config.placeholder || 'Search'}
        aria-label={config.placeholder || 'Search'}
        className="w-full sm:w-64 pl-9"
      />
    </span>
  );
}
