import { test } from '@playwright/test';
import type { Cookie, Page, TestInfo } from '@playwright/test';
import { E2E_USER, PROJECTS } from './fixtures.ts';

export const REMEMBERED_ACCOUNT_KEY = 'homedex.rememberedAccount';
export const LANGUAGE_KEY = 'homedex.language';

// The scene, its colours and the home greeting follow the clock, so tests fix the time of day.
export const MORNING = new Date(2026, 5, 1, 10);
export const LATE_EVENING = new Date(2026, 5, 1, 22);

export const fixClock = async (page: Page, at: Date = MORNING): Promise<void> => {
  await page.clock.setFixedTime(at);
};

export const E2E_GREETING = `Good morning, ${E2E_USER.username}! What do you need today?`;

// The server allows 10 failed logins per 15 minutes from one address, shared by every project.
// A test that fails a login on purpose calls this first, so it runs in one project only.
export const skipUnlessFailedLoginProject = (testInfo: TestInfo): void => {
  test.skip(testInfo.project.name !== PROJECTS.iphone13Mini, 'Spares the login rate limit');
};

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
