import { useSyncExternalStore } from 'react';

const DESKTOP_SCREEN = '(min-width: 64rem)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP_SCREEN);
  query.addEventListener('change', onChange);

  return () => {
    query.removeEventListener('change', onChange);
  };
};

const isMobile = (): boolean => !window.matchMedia(DESKTOP_SCREEN).matches;

export const useIsMobile = (): boolean => useSyncExternalStore(subscribe, isMobile);
