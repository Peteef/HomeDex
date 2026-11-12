import { expect, test } from '@playwright/test';
import { E2E_GREETING, signIn } from './session.ts';
import { SHOPPING_LIST_PATH } from './shoppingList.ts';

const REAL_API_PROJECT = 'desktop';

test.describe('shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should open the list from its tile on the home screen', async ({ page }) => {
    // Given
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: E2E_GREETING })).toBeVisible();

    // When
    await page.getByRole('link', { name: /Shopping list/ }).click();

    // Then
    await expect(page).toHaveURL(SHOPPING_LIST_PATH);
    await expect(page.getByRole('heading', { level: 1, name: 'Shopping list' })).toBeVisible();
  });

  // Checks the frontend and backend agree, against the real API and one shared list. "Clear"
  // removes every checked item, so this runs in one project only: parallel projects would clear
  // each other's items. The screen checks cover the phone widths with a stubbed list.
  test('should add, check, uncheck, clear and delete items', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== REAL_API_PROJECT, 'Runs against the real API once');

    // Given
    const run = String(Date.now());
    const potion = `Potion ${run}`;
    const berry = `Berry ${run}`;
    const toBuy = page.getByRole('region', { name: 'To buy' });
    const inCart = page.getByRole('region', { name: 'In the cart' });

    const add = async (text: string, amount = '') => {
      await page.getByRole('textbox', { name: 'Item' }).fill(text);
      await page.getByRole('textbox', { name: 'Amount (optional)' }).fill(amount);
      await page.getByRole('button', { name: 'Add' }).click();
      await expect(toBuy.getByText(text)).toBeVisible();
    };

    // Waits for the change to be saved, so a reload right after it shows the server's state.
    const saving = async (change: () => Promise<void>) => {
      const saved = page.waitForResponse(
        (response) =>
          response.url().includes('/api/m/shopping-list/') && response.request().method() !== 'GET',
      );

      await change();
      await saved;
    };

    await page.goto(SHOPPING_LIST_PATH);

    // When
    await add(potion, '3');
    await add(berry);

    // Then
    await expect(toBuy.getByText('· 3')).toBeVisible();
    await expect(toBuy.getByText('Added by Ash').first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Item' })).toHaveValue('');

    // When
    await saving(() => toBuy.getByText(potion).click());
    await page.reload();

    // Then
    await expect(inCart.getByText(potion)).toBeVisible();

    // When
    await saving(() => inCart.getByText(potion).click());
    await page.reload();

    // Then
    await expect(toBuy.getByText(potion)).toBeVisible();

    // When
    await saving(() => toBuy.getByText(potion).click());
    await saving(() => inCart.getByRole('button', { name: 'Clear' }).click());
    await page.reload();

    // Then
    await expect(toBuy.getByText(berry)).toBeVisible();
    await expect(page.getByText(potion)).toHaveCount(0);

    // When
    await saving(() => page.getByRole('button', { name: `Delete ${berry}` }).click());
    await page.reload();

    // Then
    await expect(toBuy).toBeVisible();
    await expect(page.getByText(berry)).toHaveCount(0);
  });
});
