'use client';

import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';

interface LoadingStateProps {
  type: 'table' | 'card' | 'cards-grid' | 'form' | 'detail' | 'page' | 'inline';
  rows?: number;
  columns?: number;
  cards?: number;
}

export function LoadingState({ type, rows = 10, columns = 4, cards = 6 }: LoadingStateProps) {
  if (type === 'inline') {
    return (
      <div className="flex justify-center items-center p-4">
        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="flex gap-4 mb-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="100%" height="2rem" className="rounded-xl" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} width="100%" height="1.5rem" className="rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 space-y-3" aria-busy="true">
        <Skeleton width="60%" height="1.5rem" className="rounded-xl" />
        <Skeleton width="100%" height="1rem" className="rounded-xl" />
        <Skeleton width="100%" height="1rem" className="rounded-xl" />
        <Skeleton width="80%" height="1rem" className="rounded-xl" />
        <div className="flex gap-2 mt-4">
          <Skeleton width="5rem" height="2rem" className="rounded-full" />
          <Skeleton width="5rem" height="2rem" className="rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'cards-grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-6 space-y-3">
            <Skeleton width="60%" height="1.5rem" className="rounded-xl" />
            <Skeleton width="100%" height="1rem" className="rounded-xl" />
            <Skeleton width="100%" height="1rem" className="rounded-xl" />
            <Skeleton width="40%" height="1rem" className="rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="space-y-6 max-w-2xl" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="8rem" height="1rem" className="rounded-xl" />
            <Skeleton width="100%" height="3rem" className="rounded-2xl" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <Skeleton width="6rem" height="2.5rem" className="rounded-full" />
          <Skeleton width="6rem" height="2.5rem" className="rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton width="40%" height="2rem" className="rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-low rounded-xl p-6 space-y-3">
            <Skeleton width="100%" height="1rem" className="rounded-xl" />
            <Skeleton width="100%" height="1rem" className="rounded-xl" />
            <Skeleton width="80%" height="1rem" className="rounded-xl" />
          </div>
          <div className="bg-surface-container-low rounded-xl p-6 space-y-3">
            <Skeleton width="100%" height="1rem" className="rounded-xl" />
            <Skeleton width="100%" height="1rem" className="rounded-xl" />
            <Skeleton width="60%" height="1rem" className="rounded-xl" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton width="8rem" height="2.5rem" className="rounded-full" />
          <Skeleton width="8rem" height="2.5rem" className="rounded-full" />
        </div>
      </div>
    );
  }

  // type === 'page'
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <Skeleton width="30%" height="2rem" className="rounded-xl" />
      <Skeleton width="100%" height="20rem" className="rounded-xl" />
    </div>
  );
}
