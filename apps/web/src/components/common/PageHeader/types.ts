import type { MenuItem } from 'primereact/menuitem';

// --- Main Props (backward-compatible with existing PageHeader) ---
export interface PageHeaderProps {
  /** Page title (required) */
  title: string;
  /** Subtitle shown below the title */
  subtitle?: string;
  /** PrimeReact BreadCrumb items */
  breadcrumbs?: MenuItem[];
  /** Action buttons rendered right-aligned on desktop */
  actions?: React.ReactNode;

  /** Status/category tabs rendered via PrimeReact TabMenu */
  tabs?: TabsConfig;
  /** Horizontal scrollable category pill/chip buttons */
  pills?: PillsConfig;
  /** Search, filter dropdowns, clear button, and view toggle */
  toolbar?: ToolbarConfig;
}

// --- Section Configs ---

export interface TabsConfig {
  items: { label: string; icon?: string }[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export interface PillsConfig {
  items: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export interface ToolbarConfig {
  /** Debounced search input */
  search?: SearchConfig;
  /** Array of filter dropdown definitions */
  filters?: FilterDefinition[];
  /** Current filter values keyed by FilterDefinition.key */
  filterValues?: Record<string, string>;
  /** Called when any filter dropdown changes */
  onFilterChange?: (key: string, value: string) => void;
  /** Called when user clicks "Clear filters" */
  onClearFilters?: () => void;
  /** Whether any filters are active (controls clear button visibility) */
  hasActiveFilters?: boolean;
  /** Current view mode for grid/list toggle */
  viewMode?: 'grid' | 'list';
  /** Called when user toggles between grid and list */
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  /** Additional toolbar items rendered after filters */
  extra?: React.ReactNode;
}

export interface SearchConfig {
  /** Controlled search value (the "committed" value after debounce) */
  value: string;
  /** Called with the debounced search value */
  onChange: (value: string) => void;
  /** Input placeholder text */
  placeholder?: string;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
}

export interface FilterDefinition {
  /** Unique key matching a key in filterValues */
  key: string;
  /** Dropdown placeholder text */
  placeholder: string;
  /** Dropdown options */
  options: { label: string; value: string }[];
  /** Accessibility label for the dropdown */
  ariaLabel?: string;
  /** Width class override (default: "w-full sm:w-40") */
  className?: string;
}
