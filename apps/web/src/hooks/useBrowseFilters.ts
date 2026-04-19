'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BOUNTY_CATEGORIES, RewardType } from '@social-bounty/shared';

/**
 * useBrowseFilters — URL ↔ filter-state binding for `/bounties`.
 *
 * Per the Claude Design handoff (`live-prototype.jsx:38-46`). Round-trips
 * `category`, `search`, `rewardType`, `sortBy`, `view`, `page` through the
 * Next.js `useSearchParams` + `router.replace({ scroll: false })` pair so a
 * shared / refreshed / bookmarked URL reloads in the exact same state.
 *
 * Defaults are omitted from the URL (`category=all`, `sortBy=newest`,
 * `view=grid`, `page=1`) — clean URLs, no zombie params after Clear.
 *
 * Search uses local-state + 300ms debounce → URL push so typing stays
 * responsive without thrashing the route on every keystroke. The hook never
 * reads search **back** from URL after first mount, so HMR + dev-server
 * reloads can't desync the input mid-edit.
 */

export type SortKey = 'newest' | 'reward-high' | 'reward-low' | 'ending-soon';
export type ViewMode = 'grid' | 'list';

export type RewardFilter = RewardType | 'all';

export interface BrowseFilters {
  category: string; // 'all' or a BOUNTY_CATEGORIES slug
  search: string;
  rewardType: RewardFilter;
  sortBy: SortKey;
  view: ViewMode;
  page: number;
}

export interface FilterChip {
  key: 'category' | 'rewardType' | 'sortBy' | 'search';
  label: string;
}

export interface ApiSort {
  sortBy: 'createdAt' | 'rewardValue' | 'endDate';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: BrowseFilters = {
  category: 'all',
  search: '',
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

/** Map browse `sortBy` → backend `BountyListParams.sortBy` + `sortOrder`. */
export function mapSortToApi(sortBy: SortKey): ApiSort {
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

const isValidCategory = (s: string | null) => {
  if (!s || s === 'all') return s === 'all';
  return BOUNTY_CATEGORIES.some((c) => c.slug === s || c.id === s);
};
const isValidSort = (s: string | null): s is SortKey =>
  !!s && (VALID_SORT as ReadonlyArray<string>).includes(s);
const isValidView = (s: string | null): s is ViewMode =>
  !!s && (VALID_VIEW as ReadonlyArray<string>).includes(s);
const isValidReward = (s: string | null): s is RewardFilter =>
  !!s && (VALID_REWARD as ReadonlyArray<string>).includes(s);

function readFromUrl(params: URLSearchParams): BrowseFilters {
  const rawPage = parseInt(params.get('page') ?? '1', 10);
  const category = params.get('category');
  const reward = params.get('rewardType');
  const sort = params.get('sortBy');
  const view = params.get('view');
  return {
    category: isValidCategory(category) ? (category as string) : 'all',
    search: params.get('search') ?? '',
    rewardType: isValidReward(reward) ? reward : 'all',
    sortBy: isValidSort(sort) ? sort : 'newest',
    view: isValidView(view) ? view : 'grid',
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function useBrowseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters mirror the URL on every navigation (replace OR back/forward).
  const filters = useMemo(() => readFromUrl(searchParams), [searchParams]);

  // Local search state — initialised once, then user-controlled until debounce push.
  const initialSearch = useRef(filters.search);
  const [searchInput, setSearchInput] = useState(initialSearch.current);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Push a partial filter update to the URL via `router.replace`.
   * Defaults are stripped so the URL stays clean. `page` is reset to 1 on
   * any filter change (search / category / reward / sort) — only `setPage`
   * and `setView` keep the current page.
   */
  const pushUrl = useCallback(
    (next: Partial<BrowseFilters>, opts: { resetPage?: boolean } = { resetPage: true }) => {
      const merged: BrowseFilters = {
        ...filters,
        ...next,
        page: opts.resetPage ? 1 : (next.page ?? filters.page),
      };
      const out = new URLSearchParams();
      if (merged.category !== DEFAULT_FILTERS.category) out.set('category', merged.category);
      if (merged.search) out.set('search', merged.search);
      if (merged.rewardType !== DEFAULT_FILTERS.rewardType) out.set('rewardType', merged.rewardType);
      if (merged.sortBy !== DEFAULT_FILTERS.sortBy) out.set('sortBy', merged.sortBy);
      if (merged.view !== DEFAULT_FILTERS.view) out.set('view', merged.view);
      if (merged.page !== DEFAULT_FILTERS.page) out.set('page', String(merged.page));
      const qs = out.toString();
      router.replace(`/bounties${qs ? `?${qs}` : ''}`, { scroll: false });
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

  const setCategory = useCallback((category: string) => pushUrl({ category }), [pushUrl]);
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

  const removeChip = useCallback(
    (key: FilterChip['key']) => {
      switch (key) {
        case 'category':
          pushUrl({ category: 'all' });
          break;
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
      }
    },
    [pushUrl],
  );

  const clearAll = useCallback(() => {
    setSearchInput('');
    pushUrl(
      { category: 'all', rewardType: 'all', sortBy: 'newest', search: '' },
      { resetPage: true },
    );
  }, [pushUrl]);

  // Active filter chips — the row above the results.
  const activeChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (filters.category !== 'all') {
      const cat = BOUNTY_CATEGORIES.find((c) => c.slug === filters.category || c.id === filters.category);
      chips.push({ key: 'category', label: cat?.name ?? filters.category });
    }
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
    setCategory,
    setRewardType,
    setSortBy,
    setView,
    setPage,
    clearAll,
    removeChip,
    activeChips,
    rewardLabel: REWARD_LABEL,
    sortLabel: SORT_LABEL,
  } as const;
}
