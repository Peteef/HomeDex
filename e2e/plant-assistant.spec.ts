import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { PLANT_ASSISTANT_PATH, SAMPLE_PLANTS, stubPlants } from './plantAssistant.ts';
import { E2E_GREETING, fixClock, LATE_EVENING, MORNING, signIn } from './session.ts';

const isPhone = (testInfo: TestInfo): boolean => testInfo.project.use.isMobile === true;

const title = (page: Page) => page.getByRole('heading', { level: 1, name: 'Plant Assistant' });
const viewHeadings = (page: Page) => page.getByRole('heading', { level: 2 });
const tabBar = (page: Page) => page.getByRole('navigation', { name: 'Views' });

const plantRows = (page: Page) =>
  page.getByRole('region', { name: 'All plants' }).getByRole('listitem');

const details = (page: Page, name: string) => page.getByRole('dialog', { name });

// The dialog fades in, and axe would measure the contrast of half-transparent text.
const finishAnimations = (element: Element) =>
  Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));

const openSamplePlants = async (page: Page): Promise<void> => {
  await stubPlants(page, SAMPLE_PLANTS);
  await page.goto(PLANT_ASSISTANT_PATH);
  await expect(plantRows(page)).toHaveCount(SAMPLE_PLANTS.length);
};

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
    test.skip(!isPhone(testInfo), 'Desktops switch views with the tabs at the top');

    // Given
    await page.goto(PLANT_ASSISTANT_PATH);
    await expect(viewHeadings(page)).toHaveText(['All plants']);

    // When
    await tabBar(page).getByRole('link', { name: 'Today' }).click();

    // Then
    await expect(page).toHaveURL(`${PLANT_ASSISTANT_PATH}/today`);
    await expect(viewHeadings(page)).toHaveText(['To water today']);

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

  test('should switch views with the tabs on desktop', async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), 'Phones switch views with the tab bar');

    // Given
    await page.goto(PLANT_ASSISTANT_PATH);

    await expect(page.getByRole('link', { name: 'All plants' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    // When
    await page.getByRole('link', { name: 'To water today' }).click();

    // Then
    await expect(page).toHaveURL(`${PLANT_ASSISTANT_PATH}/today`);
    await expect(viewHeadings(page)).toHaveText(['To water today']);

    // When
    await page.getByRole('link', { name: 'Calendar' }).click();

    // Then
    await expect(page).toHaveURL(`${PLANT_ASSISTANT_PATH}/calendar`);
    await expect(viewHeadings(page)).toHaveText(['Upcoming waterings']);
  });

  test('should list the plants by name with their urgency', async ({ page }) => {
    // When
    await openSamplePlants(page);

    // Then
    const names = await plantRows(page)
      .getByRole('button')
      .evaluateAll((rows) => rows.map((row) => row.textContent));

    expect(names).toEqual([
      "Bellsprout's trailing pothos on the top shelf of the tall bookcase" +
        'BookcaseLiving roomTrailingLow lightEasy careGift from MistyIn 2 days',
      "Bulbasaur's fernLiving roomShade3 days overdue",
      "Cacnea's cactusTomorrow",
      "Oddish's aloeToday",
      "Tangela's ivyIn 9 days",
    ]);

    await expect(plantRows(page).getByRole('button').nth(1)).toHaveAccessibleName(
      "Bulbasaur's fern Living room Shade 3 days overdue",
    );
  });

  test('should open the details as a bottom sheet on a phone', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'Desktops show a centred dialog');

    // Given
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSamplePlants(page);

    // When
    await page.getByRole('button', { name: /Bulbasaur's fern/ }).click();

    // Then
    const sheet = details(page, "Bulbasaur's fern");
    await expect(sheet.getByText('Every 14 days')).toBeVisible();
    const box = await sheet.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.x).toBe(0);
    expect(box?.width).toBe(viewport?.width);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(viewport?.height);
  });

  test('should open the details as a centred dialog on desktop', async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), 'Phones show a bottom sheet');

    // Given
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSamplePlants(page);

    // When
    await page.getByRole('button', { name: /Bulbasaur's fern/ }).click();

    // Then
    const dialog = details(page, "Bulbasaur's fern");
    await expect(dialog.getByText('Every 14 days')).toBeVisible();
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    const middle = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    expect(Math.abs(middle - (viewport?.width ?? 0) / 2)).toBeLessThanOrEqual(1);
    expect(box?.width).toBeLessThan(viewport?.width ?? 0);
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
      await openSamplePlants(page);

      // When
      const results = await new AxeBuilder({ page }).analyze();

      // Then
      expect(results.violations).toEqual([]);

      await testInfo.attach(`plant assistant by ${time}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });

    test(`should have no accessibility or colour contrast violations in the details by ${time}`, async ({
      page,
    }, testInfo) => {
      // Given
      await fixClock(page, at);
      await openSamplePlants(page);
      await page.getByRole('button', { name: /Bulbasaur's fern/ }).click();
      const dialog = details(page, "Bulbasaur's fern");
      await expect(dialog.getByText('Every 14 days')).toBeVisible();
      await dialog.evaluate(finishAnimations);

      // When
      const results = await new AxeBuilder({ page }).analyze();

      // Then
      expect(results.violations).toEqual([]);

      await testInfo.attach(`plant details by ${time}.png`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    });
  }
});
