'use client';

import { useState, useCallback } from 'react';
import { PAGINATION_DEFAULTS } from '@social-bounty/shared';

interface PaginationState {
  page: number;
  limit: number;
}

export function usePagination(defaultLimit = PAGINATION_DEFAULTS.LIMIT) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: defaultLimit,
  });

  const onPageChange = useCallback((event: { page: number; rows: number }) => {
    setPagination({
      page: event.page + 1,
      limit: event.rows,
    });
  }, []);

  const resetPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  return {
    ...pagination,
    first: (pagination.page - 1) * pagination.limit,
    onPageChange,
    resetPage,
  };
}
