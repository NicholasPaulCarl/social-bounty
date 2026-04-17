'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import type { BountyListParams, BountyStatus, RewardType } from '@social-bounty/shared';

interface BountyFiltersProps {
  filters: BountyListParams;
  onChange: (filters: BountyListParams) => void;
  showStatusFilter?: boolean;
}

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Live', value: 'LIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Closed', value: 'CLOSED' },
];

const rewardTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Product', value: 'PRODUCT' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Other', value: 'OTHER' },
];

const sortOptions = [
  { label: 'Newest', value: 'createdAt' },
  { label: 'Reward (High)', value: 'rewardValue' },
  { label: 'Ending Soon', value: 'ending_soon' },
  { label: 'Title', value: 'title' },
];

export function BountyFilters({ filters, onChange, showStatusFilter = false }: BountyFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFilter = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...filters, [key]: value || undefined, page: 1 });
    },
    [filters, onChange],
  );

  // Debounced search (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        updateFilter('search', searchInput);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, filters.search, updateFilter]);

  const clearFilters = () => {
    setSearchInput('');
    onChange({ page: 1, limit: filters.limit });
  };

  const hasActiveFilters =
    !!filters.search || !!filters.status || !!filters.rewardType || (filters.sortBy && filters.sortBy !== 'createdAt');

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
      <span className="p-input-icon-left w-full sm:w-auto">
        <i className="pi pi-search" />
        <InputText
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search bounties..."
          aria-label="Search bounties by title"
          className="w-full sm:w-64"
        />
      </span>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {showStatusFilter && (
          <Dropdown
            value={filters.status || ''}
            options={statusOptions}
            onChange={(e) => updateFilter('status', e.value as BountyStatus)}
            placeholder="Status"
            aria-label="Filter by status"
            className="w-full sm:w-40"
          />
        )}

        <Dropdown
          value={filters.rewardType || ''}
          options={rewardTypeOptions}
          onChange={(e) => updateFilter('rewardType', e.value as RewardType)}
          placeholder="Reward Type"
          aria-label="Filter by reward type"
          className="w-full sm:w-40"
        />

        <Dropdown
          value={filters.sortBy || 'createdAt'}
          options={sortOptions}
          onChange={(e) => updateFilter('sortBy', e.value)}
          placeholder="Sort By"
          aria-label="Sort bounties"
          className="w-full sm:w-40"
        />
      </div>

      {hasActiveFilters && (
        <Button
          icon="pi pi-filter-slash"
          outlined
          severity="secondary"
          onClick={clearFilters}
          tooltip="Clear filters"
          aria-label="Clear all filters"
          className="text-text-muted w-full sm:w-auto"
        />
      )}
    </div>
  );
}
