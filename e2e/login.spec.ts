import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { E2E_ARCHIVED_USER, E2E_USER } from './fixtures.ts';
import { E2E_GREETING, REMEMBERED_ACCOUNT_KEY } from './session.ts';

// The server allows 10 failed logins per 15 minutes from one address, shared by every project
// and by auth.spec.ts. Tests that fail a login on purpose run in one project only.
const FAILED_LOGIN_PROJECT = 'iphone-13-mini';

const enterPassword = async (page: Page, password = E2E_USER.password) => {
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'I choose you!' }).click();
};

const signInWithForm = async (page: Page, password = E2E_USER.password) => {
  await page.getByRole('button', { name: E2E_USER.username }).click();
  await enterPassword(page, password);
};

const greeting = (page: Page) => page.getByRole('heading', { level: 1, name: E2E_GREETING });

const loginHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: "Who's there, Trainer?" });

const welcomeBack = (page: Page) =>
  page.getByRole('heading', { level: 1, name: `Welcome back, ${E2E_USER.username}!` });

test.describe('login', () => {
  test('should send a visitor to the login page when nobody is signed in', async ({ page }) => {
    // When
    await page.goto('/');

    // Then
    await expect(page).toHaveURL(/\/login$/);
    await expect(loginHeading(page)).toBeVisible();
    await expect(page.getByRole('button', { name: E2E_USER.username })).toBeVisible();
    await expect(page.getByRole('button', { name: E2E_ARCHIVED_USER.username })).toHaveCount(0);
  });

  test('should greet the user on the home screen when the login is right', async ({ page }) => {
    // Given
    await page.goto('/login');

    // When
    await signInWithForm(page);

    // Then
    await expect(page).toHaveURL(/\/$/);
    await expect(greeting(page)).toBeVisible();
  });

  test('should stay signed in when the page is reloaded', async ({ page }) => {
    // Given
    await page.goto('/login');
    await signInWithForm(page);
    await expect(greeting(page)).toBeVisible();

    // When
    await page.reload();

    // Then
    await expect(greeting(page)).toBeVisible();
  });

  test('should sign out and keep the home screen behind the login', async ({ page }) => {
    // Given
    await page.goto('/login');
    await signInWithForm(page);
    await expect(greeting(page)).toBeVisible();

    // When
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Then
    await expect(welcomeBack(page)).toBeVisible();
    await page.goto('/');
    await expect(welcomeBack(page)).toBeVisible();
    expect((await page.request.get('/api/auth/me')).status()).toBe(401);
  });

  test('should welcome the user back and ask only for the password on the next sign-in', async ({
    page,
  }) => {
    // Given
    await page.goto('/login');
    await signInWithForm(page);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(welcomeBack(page)).toBeVisible();

    // When
    await enterPassword(page);

    // Then
    await expect(greeting(page)).toBeVisible();
  });

  test('should show the picker again when the user switches Trainer', async ({ page }) => {
    // Given
    await page.goto('/login');
    await signInWithForm(page);
    await page.getByRole('button', { name: 'Sign out' }).click();

    // When
    await page.getByRole('button', { name: `Not ${E2E_USER.username}? Switch Trainer` }).click();

    // Then
    await expect(loginHeading(page)).toBeVisible();
    await page.reload();
    await expect(loginHeading(page)).toBeVisible();
  });

  test('should open the requested screen after the login', async ({ page }) => {
    // Given
    await page.goto('/m/shopping-list');
    await expect(loginHeading(page)).toBeVisible();

    // When
    await signInWithForm(page);

    // Then
    await expect(page).toHaveURL(/\/m\/shopping-list$/);
  });

  test('should keep the session in an HttpOnly cookie and only the username in browser storage', async ({
    page,
    context,
  }) => {
    // Given
    await page.goto('/login');

    // When
    await signInWithForm(page);
    await expect(greeting(page)).toBeVisible();

    // Then
    const cookies = await context.cookies();
    expect(cookies).toEqual([expect.objectContaining({ name: 'hd_session', httpOnly: true })]);

    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: sessionStorage.length,
    }));

    expect(stored).toEqual({ local: [REMEMBERED_ACCOUNT_KEY], session: 0 });

    expect(await page.evaluate((key) => localStorage.getItem(key), REMEMBERED_ACCOUNT_KEY)).toBe(
      E2E_USER.username,
    );
  });

  test('should say the password is wrong when it is wrong', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== FAILED_LOGIN_PROJECT, 'Spares the login rate limit');

    // Given
    await page.goto('/login');

    // When
    await signInWithForm(page, 'not-the-password');

    // Then
    await expect(page.getByRole('alert')).toHaveText("That's not the right password. Try again.");
    await expect(page.getByLabel('Password')).toBeFocused();
    await expect(page.getByLabel('Password')).toHaveValue('');
  });
});
