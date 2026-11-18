import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { E2E_USER } from './fixtures.ts';
import { signIn } from './session.ts';
import { stubTiles } from './tiles.ts';

const DAY_SCENE = '/media/scene/day/background.webp';
const NIGHT_SCENE = '/media/scene/night/background.webp';

const scene = (page: Page) => page.locator('img[src^="/media/scene/"]');

const greeting = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

const panelBackground = (page: Page) =>
  page
    .getByRole('heading', { level: 1 })
    .evaluate(
      (element) =>
        getComputedStyle(element.closest('main')?.firstElementChild ?? element).backgroundColor,
    );

test.describe('time of day', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await stubTiles(page, []);
  });

  test('should show the day scene and a morning greeting in the morning', async ({ page }) => {
    // Given
    await page.clock.setFixedTime(new Date(2026, 5, 1, 7, 0));

    // When
    await page.goto('/');

    // Then
    await expect(
      greeting(page, `Good morning, ${E2E_USER.username}! What do you need today?`),
    ).toBeVisible();

    await expect(scene(page)).toHaveAttribute('src', DAY_SCENE);
    await expect(page.locator('html')).toHaveAttribute('data-time-of-day', 'day');
  });

  test('should show the night scene and a late greeting after eleven at night', async ({
    page,
  }) => {
    // Given
    await page.clock.setFixedTime(new Date(2026, 5, 1, 23, 30));

    // When
    await page.goto('/');

    // Then
    await expect(greeting(page, `Still up, ${E2E_USER.username}? What do you need?`)).toBeVisible();
    await expect(scene(page)).toHaveAttribute('src', NIGHT_SCENE);
    await expect(page.locator('html')).toHaveAttribute('data-time-of-day', 'night');
  });

  test('should ignore the dev hour in the production build', async ({ page }) => {
    // Given
    await page.clock.setFixedTime(new Date(2026, 5, 1, 10, 0));

    // When
    await page.goto('/?dev-hour=22');

    // Then
    await expect(
      greeting(page, `Good morning, ${E2E_USER.username}! What do you need today?`),
    ).toBeVisible();

    await expect(scene(page)).toHaveAttribute('src', DAY_SCENE);
  });

  test('should switch to the night scene and colours when nine in the evening comes', async ({
    page,
  }) => {
    // Given
    await page.clock.install({ time: new Date(2026, 5, 1, 20, 59, 0) });
    await page.goto('/');
    await expect(scene(page)).toHaveAttribute('src', DAY_SCENE);
    const dayPanel = await panelBackground(page);

    // When
    await page.clock.fastForward('01:30');

    // Then
    await expect(scene(page)).toHaveAttribute('src', NIGHT_SCENE);
    await expect(page.locator('html')).toHaveAttribute('data-time-of-day', 'night');
    expect(await panelBackground(page)).not.toBe(dayPanel);
  });
});
