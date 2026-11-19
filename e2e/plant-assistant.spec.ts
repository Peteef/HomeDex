import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { PLANT_ASSISTANT_PATH } from './plantAssistant.ts';
import { E2E_GREETING, fixClock, LATE_EVENING, MORNING, signIn } from './session.ts';

const isPhone = (testInfo: TestInfo): boolean => testInfo.project.use.isMobile === true;

const title = (page: Page) => page.getByRole('heading', { level: 1, name: 'Plant Assistant' });
const viewHeadings = (page: Page) => page.getByRole('heading', { level: 2 });
const tabBar = (page: Page) => page.getByRole('navigation', { name: 'Views' });

test.describe('plant assistant', () => {
  test.beforeEach(async ({ page }) => {
    await fixClock(page);
    await signIn(page);
  });

  test('should open the module from its tile', async ({ page }) => {
    // Given
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: E2E_GREETING })).toBeVisible();

    // When
    await page.getByRole('link', { name: /Plant Assistant/ }).click();

    // Then
    await expect(page).toHaveURL(PLANT_ASSISTANT_PATH);
    await expect(title(page)).toBeVisible();
  });

  test('should switch views with the tab bar on a phone', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'Desktops show the views side by side');

    // Given
    await page.goto(PLANT_ASSISTANT_PATH);
    await expect(viewHeadings(page)).toHaveText(['To water today']);

    // When
    await tabBar(page).getByRole('link', { name: 'Plants' }).click();

    // Then
    await expect(page).toHaveURL(`${PLANT_ASSISTANT_PATH}/plants`);
    await expect(viewHeadings(page)).toHaveText(['All plants']);

    // When
    await tabBar(page).getByRole('link', { name: 'Calendar' }).click();

    // Then
    await expect(page).toHaveURL(`${PLANT_ASSISTANT_PATH}/calendar`);
    await expect(viewHeadings(page)).toHaveText(['Upcoming waterings']);

    await expect(tabBar(page).getByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('should keep the footer above the tab bar at the end of the page on a phone', async ({
    page,
  }, testInfo) => {
    test.skip(!isPhone(testInfo), 'Desktops have no tab bar');

    // Given
    await page.goto(PLANT_ASSISTANT_PATH);
    await expect(title(page)).toBeVisible();

    // When
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    // Then
    const footer = await page.getByRole('contentinfo').boundingBox();
    const bar = await tabBar(page).boundingBox();
    expect(footer).not.toBeNull();
    expect(bar).not.toBeNull();
    expect((footer?.y ?? 0) + (footer?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
  });

  test('should show Today beside the plants on desktop', async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), 'Phones show one view at a time');

    // Given
    await page.goto(PLANT_ASSISTANT_PATH);
    await expect(viewHeadings(page)).toHaveText(['To water today', 'All plants']);
    await expect(tabBar(page)).toHaveCount(0);

    // When
    await page.getByRole('link', { name: 'Calendar' }).click();

    // Then
    await expect(page).toHaveURL(`${PLANT_ASSISTANT_PATH}/calendar`);
    await expect(viewHeadings(page)).toHaveText(['To water today', 'Upcoming waterings']);
  });

  for (const [time, at] of [
    ['day', MORNING],
    ['night', LATE_EVENING],
  ] as const) {
    test(`should have no accessibility or colour contrast violations by ${time}`, async ({
      page,
    }, testInfo) => {
      // Given
      await fixClock(page, at);
      await page.goto(PLANT_ASSISTANT_PATH);
      await expect(title(page)).toBeVisible();

      // When
      const results = await new AxeBuilder({ page }).analyze();

      // Then
      expect(results.violations).toEqual([]);

      await testInfo.attach(`plant assistant by ${time}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  }
});
