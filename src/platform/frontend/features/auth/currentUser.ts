import { createContext, use } from 'react';
import type { CurrentUser } from './types.ts';

// Provided by the route guard, so screens behind the login always see a user, even while a
// sign-out is on its way to the login page.
export const CurrentUserContext = createContext<CurrentUser | null>(null);

export const useCurrentUser = (): CurrentUser => {
  const user = use(CurrentUserContext);

  if (!user) {
    throw new Error('useCurrentUser works only on screens behind the login');
  }

  return user;
};
