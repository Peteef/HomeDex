import { expect, test } from '@playwright/test';
import { E2E_GREETING, signIn } from './session.ts';
import { SHOPPING_LIST_PATH } from './shoppingList.ts';

// Runs against the real API. The projects share one server and user, so each test works only
// with items named after its own project and run, and removes them at the end.
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

  test('should add, check, uncheck and delete an item', async ({ page }, testInfo) => {
    // Given
    const name = `Potion ${testInfo.project.name} ${String(Date.now())}`;
    const toBuy = page.getByRole('region', { name: 'To buy' });
    const inCart = page.getByRole('region', { name: 'In the cart' });
    await page.goto(SHOPPING_LIST_PATH);

    // When
    await page.getByRole('textbox', { name: 'Item' }).fill(name);
    await page.getByRole('textbox', { name: 'Amount (optional)' }).fill('3');
    await page.getByRole('button', { name: 'Add' }).click();

    // Then
    await expect(toBuy.getByText(name)).toBeVisible();
    await expect(toBuy.getByText('Added by Ash').first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Item' })).toHaveValue('');

    // When
    await toBuy.getByText(name).click();

    // Then
    await expect(inCart.getByText(name)).toBeVisible();

    // When
    await page.reload();
    await inCart.getByText(name).click();

    // Then
    await expect(toBuy.getByText(name)).toBeVisible();

    // When
    await page.getByRole('button', { name: `Delete ${name}` }).click();

    // Then
    await expect(page.getByText(name)).toHaveCount(0);
    await page.reload();
    await expect(toBuy).toBeVisible();
    await expect(page.getByText(name)).toHaveCount(0);
  });
});
