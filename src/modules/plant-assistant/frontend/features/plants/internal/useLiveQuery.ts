import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';

const REFRESH_INTERVAL_MS = 15_000;

export interface LiveQueryOptions<Data> {
  queryKey: QueryKey;
  queryFn: (() => Promise<Data>) | typeof skipToken;
  keepPrevious?: boolean;
}

// Plants are shared, so a query keeps up with the other user's changes: every 15 s while the page
// is visible (TanStack Query pauses the interval in a hidden tab), and when the browser window gets
// focus back, which TanStack Query's own refetch (on visibilitychange only) does not notice.
// A query skips while it has nothing to load (usePlant(null) while no plant is open). refetch()
// would run it anyway, so a skipped query doesn't listen for focus.
// keepPrevious shows the previous answer while another key loads, such as the next month.
export const useLiveQuery = <Data>({ queryKey, queryFn, keepPrevious }: LiveQueryOptions<Data>) => {
  const query = useQuery({
    queryKey,
    queryFn,
    refetchInterval: REFRESH_INTERVAL_MS,
    ...(keepPrevious === true ? { placeholderData: keepPreviousData } : {}),
  });

  const { refetch } = query;
  const skipped = queryFn === skipToken;

  useEffect(() => {
    if (skipped) {
      return undefined;
    }

    const refresh = () => {
      void refetch();
    };

    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, [skipped, refetch]);

  return query;
};
