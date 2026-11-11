import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { E2E_USER } from './fixtures.ts';
import { LANGUAGE_KEY } from './session.ts';

const ENGLISH_HEADING = "Who's there, Trainer?";
const POLISH_HEADING = 'Który Trener tym razem?';

const loginHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

const storeLanguage = async (page: Page, language: string) => {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: LANGUAGE_KEY, value: language },
  );
};

test.describe('language', () => {
  test.describe('when the browser prefers Polish', () => {
    test.use({ locale: 'pl-PL' });

    test('should show the app in Polish', async ({ page }) => {
      // When
      await page.goto('/login');

      // Then
      await expect(loginHeading(page, POLISH_HEADING)).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    });

    test('should show the language the device picked over the browser language', async ({
      page,
    }) => {
      // Given
      await storeLanguage(page, 'en');

      // When
      await page.goto('/login');

      // Then
      await expect(loginHeading(page, ENGLISH_HEADING)).toBeVisible();
    });
  });

  test.describe('when the browser prefers a language the app does not have', () => {
    test.use({ locale: 'de-DE' });

    test('should show the app in English', async ({ page }) => {
      // When
      await page.goto('/login');

      // Then
      await expect(loginHeading(page, ENGLISH_HEADING)).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });

  test('should switch the language and keep it after a reload and a sign-in', async ({ page }) => {
    // Given
    await page.goto('/login');
    await expect(loginHeading(page, ENGLISH_HEADING)).toBeVisible();

    // When
    await page.getByRole('combobox', { name: 'Language' }).selectOption('pl');

    // Then
    await expect(loginHeading(page, POLISH_HEADING)).toBeVisible();
    await page.reload();
    await expect(loginHeading(page, POLISH_HEADING)).toBeVisible();
    await page.getByRole('button', { name: E2E_USER.username }).click();
    await page.getByLabel('Hasło').fill(E2E_USER.password);
    await page.getByRole('button', { name: 'Wybieram cię!' }).click();

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `Cześć, ${E2E_USER.username}! Czego dziś potrzebujesz?`,
      }),
    ).toBeVisible();
  });
});
