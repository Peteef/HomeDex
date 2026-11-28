import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';
import { includeIf } from '../../../shared/objects/includeIf.ts';

const REFRESH_INTERVAL_MS = 15_000;

interface LiveQueryOptions<Data> {
  queryKey: QueryKey;
  queryFn: (() => Promise<Data>) | typeof skipToken;
  refreshIntervalMs?: number;
  keepPrevious?: boolean;
}

// Keeps up with other users' changes: at every interval while the page is visible (TanStack Query
// pauses the interval in a hidden tab), and when the browser window gets focus back, which
// TanStack Query's own refetch (on visibilitychange only) does not notice.
// A skipped query doesn't listen for focus, because refetch() would run it anyway.
// keepPrevious shows the previous answer while another key loads.
export const useLiveQuery = <Data>({
  queryKey,
  queryFn,
  refreshIntervalMs = REFRESH_INTERVAL_MS,
  keepPrevious = false,
}: LiveQueryOptions<Data>) => {
  const query = useQuery({
    queryKey,
    queryFn,
    refetchInterval: refreshIntervalMs,
    ...includeIf(keepPrevious, { placeholderData: keepPreviousData }),
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
