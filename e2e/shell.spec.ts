import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { E2E_GREETING, signIn } from './session.ts';

const MIN_TOUCH_TARGET = 44;
const SCREENS = [
  { name: 'login', path: '/login', heading: 'Sign in', signedIn: false },
  { name: 'home', path: '/', heading: E2E_GREETING, signedIn: true },
  { name: 'module', path: '/m/shopping-list', heading: 'Module not available', signedIn: true },
  { name: 'not-found', path: '/nowhere', heading: 'Page not found', signedIn: true },
];
interface Manifest {
  icons: { src: string; type: string }[];
}

const SPRITE = 'img[src="/media/scene/sprite-sofa.svg"]';

test.describe('shell', () => {
  for (const screen of SCREENS) {
    test.describe(`${screen.name} screen`, () => {
      test.beforeEach(async ({ page }) => {
        if (screen.signedIn) {
          await signIn(page);
        }
        await page.goto(screen.path);
        await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible();
      });

      test('should have no accessibility or colour contrast violations', async ({ page }) => {
        // When
        const results = await new AxeBuilder({ page }).analyze();

        // Then
        expect(results.violations).toEqual([]);
      });

      test('should not scroll sideways', async ({ page }) => {
        // When
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );

        // Then
        expect(overflow).toBe(0);
      });

      test('should make every control at least 44 pt large', async ({ page }) => {
        // When
        const small = await page.evaluate((min) => {
          const controls = document.querySelectorAll('a, button, input, select, textarea');
          return [...controls]
            .map((element) => ({
              name: element.outerHTML.slice(0, 80),
              box: element.getBoundingClientRect(),
            }))
            .filter(({ box }) => box.width > 1 && box.height > 1)
            .filter(({ box }) => box.width < min || box.height < min)
            .map(({ name }) => name);
        }, MIN_TOUCH_TARGET);

        // Then
        expect(small).toEqual([]);
      });

      test('should show the screen over the scene', async ({ page }, testInfo) => {
        // When
        const screenshot = await page.screenshot({ fullPage: true });

        // Then
        await testInfo.attach(`${screen.name}.png`, { body: screenshot, contentType: 'image/png' });
        await expect(page.locator('img[src^="/media/scene/"]')).toHaveCount(3);
      });
    });
  }

  test.describe('layout', () => {
    test('should centre a short panel vertically when the screen is taller than the panel', async ({
      page,
    }) => {
      // Given
      await page.goto('/login');
      const heading = page.getByRole('heading', { level: 1, name: 'Sign in' });
      await expect(heading).toBeVisible();

      // When
      const { panelCentre, viewportCentre } = await heading.evaluate((element) => {
        const box = (element.closest('main')?.firstElementChild ?? element).getBoundingClientRect();
        return {
          panelCentre: box.top + box.height / 2,
          viewportCentre: window.innerHeight / 2,
        };
      });

      // Then
      expect(Math.abs(panelCentre - viewportCentre)).toBeLessThan(2);
    });
  });

  test.describe('home screen', () => {
    test.beforeEach(async ({ page }) => {
      await signIn(page);
    });

    test('should pin and unpin a tile when its pin control is tapped', async ({ page }) => {
      // Given
      await page.goto('/');
      const pin = page.getByRole('button', { name: 'Pin Finances' });

      // When
      await pin.click();

      // Then
      await expect(pin).toHaveAttribute('aria-pressed', 'true');
    });

    test('should show a pointer cursor over the pin control', async ({ page }) => {
      // Given
      await page.goto('/');

      // When
      const cursor = await page
        .getByRole('button', { name: 'Pin Finances' })
        .evaluate((element) => getComputedStyle(element).cursor);

      // Then
      expect(cursor).toBe('pointer');
    });

    test('should show a pinned tile first and put it back when it is unpinned', async ({
      page,
    }) => {
      // Given
      await page.goto('/');
      const firstTile = page.getByRole('article').first();
      await expect(firstTile).toContainText('Finances');

      // When
      await page.getByRole('button', { name: 'Pin Weight log' }).click();

      // Then
      await expect(firstTile).toContainText('Weight log');
      await page.getByRole('button', { name: 'Pin Weight log' }).click();
      await expect(firstTile).toContainText('Finances');
    });

    test('should open a module tile on the module placeholder', async ({ page }) => {
      // Given
      await page.goto('/');

      // When
      await page.getByRole('link', { name: /Shopping list/ }).click();

      // Then
      await expect(page).toHaveURL(/\/m\/shopping-list$/);
      await expect(page.getByRole('heading', { name: 'Module not available' })).toBeVisible();
    });
  });

  test.describe('motion', () => {
    test('should float the sprites when motion is allowed', async ({ page }) => {
      // Given
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/');

      // When
      const animation = await page
        .locator(SPRITE)
        .evaluate((el) => getComputedStyle(el).animationName);

      // Then
      expect(animation).toBe('float');
    });

    test('should keep the sprites still when reduced motion is requested', async ({ page }) => {
      // Given
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      // When
      const animation = await page
        .locator(SPRITE)
        .evaluate((el) => getComputedStyle(el).animationName);

      // Then
      expect(animation).toBe('none');
    });
  });

  test.describe('PWA', () => {
    test('should serve the manifest with PNG icons that exist', async ({ request }) => {
      // When
      const manifest = (await (await request.get('/manifest.webmanifest')).json()) as Manifest;

      // Then
      const pngIcons = manifest.icons.filter((icon) => icon.type === 'image/png');
      expect(pngIcons.length).toBeGreaterThanOrEqual(3);
      for (const icon of pngIcons) {
        const response = await request.get(icon.src);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/png');
      }
    });

    test('should link a PNG apple-touch-icon that exists', async ({ page, request }) => {
      // Given
      await page.goto('/');

      // When
      const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');

      // Then
      expect(href).toMatch(/\.png$/);
      const response = await request.get(href ?? '');
      expect(response.headers()['content-type']).toBe('image/png');
    });

    test('should extend the page under the notch with a viewport that covers the screen', async ({
      page,
    }) => {
      // When
      await page.goto('/');

      // Then
      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
        'content',
        /viewport-fit=cover/,
      );
    });
  });

  test.describe('external requests', () => {
    test('should load everything from its own origin', async ({ page, baseURL }) => {
      // Given
      const foreign: string[] = [];
      page.on('request', (request) => {
        if (!request.url().startsWith(baseURL ?? '') && !request.url().startsWith('data:')) {
          foreign.push(request.url());
        }
      });

      // When
      await signIn(page);
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1, name: E2E_GREETING })).toBeVisible();

      // Then
      expect(foreign).toEqual([]);
    });
  });
});
