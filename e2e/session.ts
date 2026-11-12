import type { Cookie, Page } from '@playwright/test';
import { E2E_USER } from './fixtures.ts';

export const REMEMBERED_ACCOUNT_KEY = 'homedex.rememberedAccount';
export const LANGUAGE_KEY = 'homedex.language';

export const E2E_GREETING = `Hello ${E2E_USER.username}! What do you need today?`;

interface E2EUser {
  username: string;
  password: string;
}

// One session per user and worker. The login rate limit counts a login until it succeeds, so
// many parallel sign-ins could reach it; no test signs out of these sessions.
const sessions = new Map<string, Cookie[]>();

const logIn = async (page: Page, user: E2EUser): Promise<Cookie[]> => {
  const response = await page.request.post('/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: user,
  });

  if (!response.ok()) {
    throw new Error(`Sign-in for ${user.username} failed with ${String(response.status())}`);
  }

  return page.context().cookies();
};

// Signs in through the API; page.request shares its cookies with the page.
export const signIn = async (page: Page, user: E2EUser = E2E_USER): Promise<void> => {
  const cached = sessions.get(user.username);

  if (cached !== undefined) {
    await page.context().addCookies(cached);
    return;
  }

  sessions.set(user.username, await logIn(page, user));
};
