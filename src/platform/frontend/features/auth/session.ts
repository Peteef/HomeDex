import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, login, logout } from './internal/authApi.ts';
import type { CurrentUser } from './types.ts';

const SESSION_QUERY_KEY = ['session'] as const;
const SESSION_STALE_MS = 60_000;

const isSessionQuery = (queryKey: readonly unknown[]): boolean =>
  queryKey[0] === SESSION_QUERY_KEY[0];

// The route guard reacts to the session, so this alone sends a signed-out user to the login page.
export const endSession = (queryClient: QueryClient): void => {
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
};

// Data cached for one user must never be shown to the next, so logging in or out drops every
// other query.
const switchSession = (queryClient: QueryClient, user: CurrentUser | null): void => {
  queryClient.removeQueries({ predicate: (query) => !isSessionQuery(query.queryKey) });
  queryClient.setQueryData(SESSION_QUERY_KEY, user);
};

export const useSession = () =>
  useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: SESSION_STALE_MS,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      switchSession(queryClient, user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      switchSession(queryClient, null);
    },
  });
};
