import type { Location } from 'react-router';
import { HOME_PATH, LOGIN_PATH } from '../../routes.ts';

interface RedirectState {
  from: string;
}

export const redirectState = ({ pathname, search, hash }: Location): RedirectState => ({
  from: `${pathname}${search}${hash}`,
});

const isRedirectState = (state: unknown): state is RedirectState =>
  typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string';

// Only a path inside the app is followed: "//host" would leave the site.
const isAppPath = (path: string): boolean =>
  path.startsWith('/') && !path.startsWith('//') && !path.startsWith(LOGIN_PATH);

export const redirectTarget = (state: unknown): string =>
  isRedirectState(state) && isAppPath(state.from) ? state.from : HOME_PATH;
