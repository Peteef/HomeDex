import { useQuery } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';

const REFRESH_INTERVAL_MS = 15_000;

interface LiveQueryOptions<Data> {
  queryKey: QueryKey;
  queryFn: () => Promise<Data>;
}

// Keeps up with other users' changes: every 15 s while the page is visible (TanStack Query pauses
// the interval in a hidden tab), and when the browser window gets focus back, which TanStack
// Query's own refetch (on visibilitychange only) does not notice.
export const useLiveQuery = <Data>({ queryKey, queryFn }: LiveQueryOptions<Data>) => {
  const query = useQuery({
    queryKey,
    queryFn,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const { refetch } = query;

  useEffect(() => {
    const refresh = () => {
      void refetch();
    };

    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
    };
  }, [refetch]);

  return query;
};
