const PARAM_PREFIX = 'dev-';
const STORAGE_PREFIX = 'homedex.dev.';

type DevParamParser<T> = (raw: string) => T | null;

const paramName = (name: string): string => `${PARAM_PREFIX}${name}`;

const storageKey = (name: string): string => `${STORAGE_PREFIX}${name}`;

// Storage can be blocked (for example in a private window). A parameter then lasts one page load.
const withStorage = <T>(access: (storage: Storage) => T, fallback: T): T => {
  try {
    return access(sessionStorage);
  } catch {
    return fallback;
  }
};

const recalled = (name: string): string | null =>
  withStorage((storage) => storage.getItem(storageKey(name)), null);

const remember = (name: string, raw: string): void => {
  withStorage((storage) => {
    storage.setItem(storageKey(name), raw);
  }, undefined);
};

const forget = (name: string): void => {
  withStorage((storage) => {
    storage.removeItem(storageKey(name));
  }, undefined);
};

const fromUrl = (name: string): string | null =>
  new URLSearchParams(window.location.search).get(paramName(name));

const resolve = <T>(name: string, parse: DevParamParser<T>): T | null => {
  const urlValue = fromUrl(name);

  if (urlValue === '') {
    forget(name);
    return null;
  }

  const raw = urlValue ?? recalled(name);

  if (raw === null) {
    return null;
  }

  const value = parse(raw);

  if (value === null) {
    console.warn(`Ignoring ${paramName(name)}=${raw}: not a valid value`);
    return null;
  }

  remember(name, raw);
  console.info(`Dev parameter ${paramName(name)}=${raw} is on`);
  return value;
};

// Production builds compile import.meta.env.DEV to false, so every parameter is null there and
// the rest drops out of the bundle. A value is read once per page load: an in-app navigation
// drops it from the URL, and the tab's session storage carries it to the next page load.
export const devParam = <T>(name: string, parse: DevParamParser<T>): (() => T | null) => {
  if (!import.meta.env.DEV) {
    return () => null;
  }

  let value: T | null | undefined;

  return () => {
    if (value === undefined) {
      value = resolve(name, parse);
    }

    return value;
  };
};
