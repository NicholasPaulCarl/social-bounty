'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BountyStatus, RewardType } from '@social-bounty/shared';
import type { SortKey, ViewMode, RewardFilter, FilterChip, ApiSort } from '@/hooks/useBrowseFilters';

/**
 * useManageFilters — URL ↔ filter-state binding for `/business/bounties`.
 *
 * Sibling of `useBrowseFilters`: same UX contract (search · reward · sort ·
 * view · page round-trip the URL with sensible defaults stripped) but
 * targeted at the brand "Manage bounties" view, so it adds:
 *
 *  - `status` (`?status=DRAFT|LIVE|PAUSED|CLOSED|all`) — the brand always
 *    sees their own bounties, so they need to slice by lifecycle stage.
 *    `status` is intentionally NOT mirrored as an active-filter chip; the
 *    UI surfaces it as a tab row where it's already obvious.
 *  - Push target is `/business/bounties` (not `/bounties`).
 *
 * Kept as a separate file (rather than parameterising `useBrowseFilters`)
 * to keep each hook focused on its surface — the hunter hook stays exactly
 * the size it needs to be.
 */

export type StatusFilter = BountyStatus | 'all';

export interface ManageFilters {
  search: string;
  status: StatusFilter;
  rewardType: RewardFilter;
  sortBy: SortKey;
  view: ViewMode;
  page: number;
}

const DEFAULT_FILTERS: ManageFilters = {
  search: '',
  status: 'all',
  rewardType: 'all',
  sortBy: 'newest',
  view: 'grid',
  page: 1,
};

const VALID_SORT: ReadonlyArray<SortKey> = ['newest', 'reward-high', 'reward-low', 'ending-soon'];
const VALID_VIEW: ReadonlyArray<ViewMode> = ['grid', 'list'];
const VALID_REWARD: ReadonlyArray<RewardFilter> = [
  'all',
  RewardType.CASH,
  RewardType.PRODUCT,
  RewardType.SERVICE,
  RewardType.OTHER,
];
const VALID_STATUS: ReadonlyArray<StatusFilter> = [
  'all',
  BountyStatus.DRAFT,
  BountyStatus.LIVE,
  BountyStatus.PAUSED,
  BountyStatus.CLOSED,
];

const REWARD_LABEL: Record<RewardFilter, string> = {
  all: 'Any reward',
  [RewardType.CASH]: 'Cash',
  [RewardType.PRODUCT]: 'Product',
  [RewardType.SERVICE]: 'Service',
  [RewardType.OTHER]: 'Other',
};

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest',
  'reward-high': 'Reward (high → low)',
  'reward-low': 'Reward (low → high)',
  'ending-soon': 'Ending soon',
};

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'All',
  [BountyStatus.DRAFT]: 'Draft',
  [BountyStatus.LIVE]: 'Live',
  [BountyStatus.PAUSED]: 'Paused',
  [BountyStatus.CLOSED]: 'Closed',
};

/** Map manage `sortBy` → backend `BountyListParams.sortBy` + `sortOrder`. */
export function mapManageSortToApi(sortBy: SortKey): ApiSort {
  switch (sortBy) {
    case 'reward-high':
      return { sortBy: 'rewardValue', sortOrder: 'desc' };
    case 'reward-low':
      return { sortBy: 'rewardValue', sortOrder: 'asc' };
    case 'ending-soon':
      return { sortBy: 'endDate', sortOrder: 'asc' };
    case 'newest':
    default:
      return { sortBy: 'createdAt', sortOrder: 'desc' };
  }
}

const isValidSort = (s: string | null): s is SortKey =>
  !!s && (VALID_SORT as ReadonlyArray<string>).includes(s);
const isValidView = (s: string | null): s is ViewMode =>
  !!s && (VALID_VIEW as ReadonlyArray<string>).includes(s);
const isValidReward = (s: string | null): s is RewardFilter =>
  !!s && (VALID_REWARD as ReadonlyArray<string>).includes(s);
const isValidStatus = (s: string | null): s is StatusFilter =>
  !!s && (VALID_STATUS as ReadonlyArray<string>).includes(s);

function readFromUrl(params: URLSearchParams): ManageFilters {
  const rawPage = parseInt(params.get('page') ?? '1', 10);
  const status = params.get('status');
  const reward = params.get('rewardType');
  const sort = params.get('sortBy');
  const view = params.get('view');
  return {
    search: params.get('search') ?? '',
    status: isValidStatus(status) ? status : 'all',
    rewardType: isValidReward(reward) ? reward : 'all',
    sortBy: isValidSort(sort) ? sort : 'newest',
    view: isValidView(view) ? view : 'grid',
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function useManageFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(() => readFromUrl(searchParams), [searchParams]);

  // Local search state — initialised once, then user-controlled until debounce push.
  const initialSearch = useRef(filters.search);
  const [searchInput, setSearchInput] = useState(initialSearch.current);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Push a partial filter update to the URL via `router.replace`.
   * Defaults are stripped so the URL stays clean. `page` is reset to 1 on
   * any filter change (search / status / reward / sort) — only `setPage`
   * and `setView` keep the current page.
   */
  const pushUrl = useCallback(
    (next: Partial<ManageFilters>, opts: { resetPage?: boolean } = { resetPage: true }) => {
      const merged: ManageFilters = {
        ...filters,
        ...next,
        page: opts.resetPage ? 1 : (next.page ?? filters.page),
      };
      const out = new URLSearchParams();
      if (merged.search) out.set('search', merged.search);
      if (merged.status !== DEFAULT_FILTERS.status) out.set('status', merged.status);
      if (merged.rewardType !== DEFAULT_FILTERS.rewardType) out.set('rewardType', merged.rewardType);
      if (merged.sortBy !== DEFAULT_FILTERS.sortBy) out.set('sortBy', merged.sortBy);
      if (merged.view !== DEFAULT_FILTERS.view) out.set('view', merged.view);
      if (merged.page !== DEFAULT_FILTERS.page) out.set('page', String(merged.page));
      const qs = out.toString();
      router.replace(`/business/bounties${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [filters, router],
  );

  // 300ms debounce — push search to URL only after the user pauses typing.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchInput === filters.search) return;
    debounceRef.current = setTimeout(() => {
      pushUrl({ search: searchInput });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const setStatus = useCallback((status: StatusFilter) => pushUrl({ status }), [pushUrl]);
  const setRewardType = useCallback(
    (rewardType: RewardFilter) => pushUrl({ rewardType }),
    [pushUrl],
  );
  const setSortBy = useCallback((sortBy: SortKey) => pushUrl({ sortBy }), [pushUrl]);
  const setView = useCallback(
    (view: ViewMode) => pushUrl({ view }, { resetPage: false }),
    [pushUrl],
  );
  const setPage = useCallback(
    (page: number) => pushUrl({ page }, { resetPage: false }),
    [pushUrl],
  );

  const setSearch = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  // Active filter chips — status is intentionally omitted (tabs make it obvious).
  const removeChip = useCallback(
    (key: FilterChip['key']) => {
      switch (key) {
        case 'rewardType':
          pushUrl({ rewardType: 'all' });
          break;
        case 'sortBy':
          pushUrl({ sortBy: 'newest' });
          break;
        case 'search':
          setSearchInput('');
          pushUrl({ search: '' });
          break;
        case 'category':
          // Manage view has no category dimension — no-op.
          break;
      }
    },
    [pushUrl],
  );

  const clearAll = useCallback(() => {
    setSearchInput('');
    pushUrl(
      { rewardType: 'all', sortBy: 'newest', search: '' },
      { resetPage: true },
    );
  }, [pushUrl]);

  const activeChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (filters.rewardType !== 'all') {
      chips.push({ key: 'rewardType', label: REWARD_LABEL[filters.rewardType] });
    }
    if (filters.sortBy !== 'newest') {
      chips.push({ key: 'sortBy', label: `Sort: ${SORT_LABEL[filters.sortBy]}` });
    }
    if (filters.search) {
      chips.push({ key: 'search', label: `“${filters.search}”` });
    }
    return chips;
  }, [filters]);

  return {
    filters,
    searchInput,
    setSearch,
    setStatus,
    setRewardType,
    setSortBy,
    setView,
    setPage,
    clearAll,
    removeChip,
    activeChips,
    rewardLabel: REWARD_LABEL,
    sortLabel: SORT_LABEL,
    statusLabel: STATUS_LABEL,
  } as const;
}
