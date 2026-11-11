import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { endSession } from './features/auth/index.ts';
import { isClientError, isUnauthorized } from './lib/http/index.ts';

const MAX_RETRIES = 3;

const shouldRetry = (failureCount: number, error: unknown): boolean =>
  !isClientError(error) && failureCount < MAX_RETRIES;

// Any 401 means the session is gone (expired, revoked or archived). Ending it lets the route guard
// send the user to the login page, so no request code has to navigate. Cached data is dropped at
// the next login, not here: removing a query while its screen is still mounted refetches it.
export const appQueryClient = (): QueryClient => {
  const signOutOnUnauthorized = (error: unknown) => {
    if (isUnauthorized(error)) {
      endSession(queryClient);
    }
  };
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: signOutOnUnauthorized }),
    mutationCache: new MutationCache({ onError: signOutOnUnauthorized }),
    defaultOptions: { queries: { retry: shouldRetry } },
  });
  return queryClient;
};
