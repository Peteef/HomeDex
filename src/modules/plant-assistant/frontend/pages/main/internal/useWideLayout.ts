import { useSyncExternalStore } from 'react';

const WIDE_SCREEN = '(min-width: 64rem)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE_SCREEN);
  query.addEventListener('change', onChange);

  return () => {
    query.removeEventListener('change', onChange);
  };
};

const isWide = (): boolean => window.matchMedia(WIDE_SCREEN).matches;

export const useWideLayout = (): boolean => useSyncExternalStore(subscribe, isWide);
