// The device remembers who signed in last, so the login page can skip the account picker. Only
// the username is stored: it is not a secret, and the session itself stays in the HttpOnly cookie.
const STORAGE_KEY = 'homedex.rememberedAccount';

// Storage can be blocked (for example in a private window). The login page then shows the picker.
export const rememberedAccount = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const rememberAccount = (username: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, username);
  } catch {
    // Nothing to do: the picker is shown next time.
  }
};

export const forgetAccount = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: nothing could have been stored.
  }
};
