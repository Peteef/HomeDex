import type { Page } from '@playwright/test';
import { E2E_USER } from './fixtures.ts';

export const REMEMBERED_ACCOUNT_KEY = 'homedex.rememberedAccount';
export const LANGUAGE_KEY = 'homedex.language';

export const E2E_GREETING = `Hello ${E2E_USER.username}! What do you need today?`;

// Signs in through the API; page.request shares its cookies with the page.
export const signIn = async (page: Page): Promise<void> => {
  const response = await page.request.post('/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: E2E_USER,
  });

  if (!response.ok()) {
    throw new Error(`Sign-in for the e2e user failed with ${String(response.status())}`);
  }
};
