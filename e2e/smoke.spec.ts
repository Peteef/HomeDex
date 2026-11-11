import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signIn } from './session.ts';

test.describe('smoke', () => {
  test.describe('home page', () => {
    test('should render the login page over the scene when a visitor opens the app', async ({
      page,
    }) => {
      // When
      await page.goto('/');

      // Then
      await expect(page.getByRole('heading', { name: "Who's there, Trainer?" })).toBeVisible();
      await expect(page.locator('img[src="/media/scene/background.svg"]')).toHaveCount(1);
    });

    test('should not scroll sideways when the home page opens', async ({ page }) => {
      // When
      await page.goto('/');

      // Then
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      expect(overflow).toBe(0);
    });

    test('should have no accessibility or colour contrast violations when the home page opens', async ({
      page,
    }) => {
      // Given
      await page.goto('/');
      await expect(page.getByRole('heading', { name: "Who's there, Trainer?" })).toBeVisible();

      // When
      const results = await new AxeBuilder({ page }).analyze();

      // Then
      expect(results.violations).toEqual([]);
    });

    test('should serve the app when the route is unknown', async ({ page }) => {
      // Given
      await signIn(page);

      // When
      await page.goto('/some/deep/link');

      // Then
      await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    });
  });

  test.describe('health endpoint', () => {
    test('should report ok when the health endpoint is called', async ({ request }) => {
      // When
      const response = await request.get('/api/health');

      // Then
      expect(await response.json()).toEqual({ status: 'ok' });
    });
  });
});
