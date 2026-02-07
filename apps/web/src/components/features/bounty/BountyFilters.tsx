'use client';

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
  { label: 'Title', value: 'title' },
];

export function BountyFilters({ filters, onChange, showStatusFilter = false }: BountyFiltersProps) {
  const updateFilter = (key: string, value: unknown) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  const clearFilters = () => {
    onChange({ page: 1, limit: filters.limit });
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search bounties..."
          aria-label="Search bounties by title"
          className="w-64"
        />
      </span>

      {showStatusFilter && (
        <Dropdown
          value={filters.status || ''}
          options={statusOptions}
          onChange={(e) => updateFilter('status', e.value as BountyStatus)}
          placeholder="Status"
          aria-label="Filter by status"
          className="w-40"
        />
      )}

      <Dropdown
        value={filters.rewardType || ''}
        options={rewardTypeOptions}
        onChange={(e) => updateFilter('rewardType', e.value as RewardType)}
        placeholder="Reward Type"
        aria-label="Filter by reward type"
        className="w-40"
      />

      <Dropdown
        value={filters.sortBy || 'createdAt'}
        options={sortOptions}
        onChange={(e) => updateFilter('sortBy', e.value)}
        placeholder="Sort By"
        aria-label="Sort bounties"
        className="w-40"
      />

      <Button
        icon="pi pi-filter-slash"
        outlined
        severity="secondary"
        onClick={clearFilters}
        tooltip="Clear filters"
        aria-label="Clear all filters"
      />
    </div>
  );
}
