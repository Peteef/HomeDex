import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page renders the placeholder over the scene', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'HomeDex' })).toBeVisible();
  await expect(page.locator('img[src="/media/scene/background.svg"]')).toHaveCount(1);
});

test('page does not scroll sideways', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test('has no accessibility violations, including colour contrast', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'HomeDex' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('unknown routes fall back to the app', async ({ page }) => {
  await page.goto('/some/deep/link');
  await expect(page.getByRole('heading', { name: 'HomeDex' })).toBeVisible();
});

test('health endpoint answers', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(await response.json()).toEqual({ status: 'ok' });
});
