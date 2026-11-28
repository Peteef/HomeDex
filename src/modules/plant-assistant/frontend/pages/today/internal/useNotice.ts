import { useEffect, useState } from 'react';

const NOTICE_DURATION_MS = 6_000;

// A notice hides after 6 s, but not while the pointer or the focus is on it, so a keyboard user
// can reach Undo. A new notice replaces the current one.
export const useNotice = <Notice>() => {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (notice === null || paused) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setNotice(null);
    }, NOTICE_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [notice, paused]);

  const show = (next: Notice | null): void => {
    setPaused(false);
    setNotice(next);
  };

  const hide = (): void => {
    show(null);
  };

  const pause = (): void => {
    setPaused(true);
  };

  const resume = (): void => {
    setPaused(false);
  };

  return {
    notice,
    show,
    hide,
    pause,
    resume,
  };
};
