import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
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
          icon="pi pi-filter-slash"
          outlined
          severity="secondary"
          onClick={onClearFilters}
          tooltip="Clear filters"
          aria-label="Clear all filters"
          className="text-text-muted w-full sm:w-auto"
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
    <span className="p-input-icon-left w-full sm:w-auto">
      <i className="pi pi-search" />
      <InputText
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={config.placeholder || 'Search...'}
        aria-label={config.placeholder || 'Search'}
        className="w-full sm:w-64"
      />
    </span>
  );
}
