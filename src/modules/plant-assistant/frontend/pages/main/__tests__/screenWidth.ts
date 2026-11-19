import { vi } from 'vitest';

// jsdom has no matchMedia: a fake screen that answers the min-width query and can be resized.
export const stubScreenWidth = (widthRem: number) => {
  const listeners = new Set<() => void>();
  let width = widthRem;

  const matchMedia = (query: string) => ({
    get matches() {
      const minWidth = /min-width: ([\d.]+)rem/.exec(query)?.[1];
      return minWidth !== undefined && width >= Number(minWidth);
    },
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  });

  vi.stubGlobal('matchMedia', matchMedia);

  const resize = (newWidthRem: number) => {
    width = newWidthRem;

    listeners.forEach((listener) => {
      listener();
    });
  };

  return { resize };
};
