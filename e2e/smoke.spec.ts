import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('should render the placeholder over the scene when the home page opens', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'HomeDex' })).toBeVisible();
  await expect(page.locator('img[src="/media/scene/background.svg"]')).toHaveCount(1);
});

test('should not scroll sideways when the home page opens', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test('should have no accessibility or colour contrast violations when the home page opens', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'HomeDex' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('should serve the app when the route is unknown', async ({ page }) => {
  await page.goto('/some/deep/link');
  await expect(page.getByRole('heading', { name: 'HomeDex' })).toBeVisible();
});

test('should report ok when the health endpoint is called', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(await response.json()).toEqual({ status: 'ok' });
});
