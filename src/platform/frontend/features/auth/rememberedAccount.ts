const STORAGE_KEY = 'homedex.rememberedAccount';

// Storage can be blocked (for example in a private window). The login page then shows the picker.
const withStorage = <T>(access: (storage: Storage) => T, fallback: T): T => {
  try {
    return access(localStorage);
  } catch {
    return fallback;
  }
};

export const rememberedAccount = (): string | null =>
  withStorage((storage) => storage.getItem(STORAGE_KEY), null);

export const rememberAccount = (username: string): void => {
  withStorage((storage) => {
    storage.setItem(STORAGE_KEY, username);
  }, undefined);
};

export const forgetAccount = (): void => {
  withStorage((storage) => {
    storage.removeItem(STORAGE_KEY);
  }, undefined);
};
