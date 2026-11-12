import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { E2E_USER } from './fixtures.ts';
import { E2E_GREETING, LANGUAGE_KEY, REMEMBERED_ACCOUNT_KEY, signIn } from './session.ts';
import { LINK_HOST, SAMPLE_TILES, SHOPPING, settled, stubTiles } from './tiles.ts';
import type { E2ETile } from './tiles.ts';
import { SAMPLE_ITEMS, SHOPPING_LIST_PATH, stubItems } from './shoppingList.ts';
import type { E2EItem } from './shoppingList.ts';

const MIN_TOUCH_TARGET = 44;

interface Screen {
  name: string;
  path: string;
  heading: string;
  signedIn: boolean;
  remembered?: string;
  language?: string;
  tiles?: E2ETile[];
  items?: E2EItem[];
  open?: (page: Page) => Promise<void>;
}

const openAddTile = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'Add tile' }).click();
  await settled(page.getByRole('dialog', { name: 'Add tile' }));
};

// Focus and Enter, as a keyboard or screen reader does: on touch screens the edit button is
// visually hidden and a long press opens the dialog instead.
const openEditTile = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'Edit Finances' }).focus();
  await page.keyboard.press('Enter');
  await settled(page.getByRole('dialog', { name: 'Edit tile' }));
};

const SCREENS: Screen[] = [
  { name: 'login', path: '/login', heading: "Who's there, Trainer?", signedIn: false },
  {
    name: 'password',
    path: '/login',
    heading: `Welcome back, ${E2E_USER.username}!`,
    signedIn: false,
    remembered: E2E_USER.username,
  },
  { name: 'home', path: '/', heading: E2E_GREETING, signedIn: true, tiles: SAMPLE_TILES },
  { name: 'empty home', path: '/', heading: E2E_GREETING, signedIn: true, tiles: [] },
  {
    name: 'add tile dialog',
    path: '/',
    heading: E2E_GREETING,
    signedIn: true,
    tiles: SAMPLE_TILES,
    open: openAddTile,
  },
  {
    name: 'edit tile dialog',
    path: '/',
    heading: E2E_GREETING,
    signedIn: true,
    tiles: SAMPLE_TILES,
    open: openEditTile,
  },
  { name: 'not-found', path: '/nowhere', heading: 'Page not found', signedIn: true },
  {
    name: 'login in Polish',
    path: '/login',
    heading: 'Który Trener tym razem?',
    signedIn: false,
    language: 'pl',
  },
  {
    name: 'home in Polish',
    path: '/',
    heading: `Cześć, ${E2E_USER.username}! Czego dziś potrzebujesz?`,
    signedIn: true,
    language: 'pl',
    tiles: SAMPLE_TILES,
  },
  {
    name: 'shopping list',
    path: SHOPPING_LIST_PATH,
    heading: 'Shopping list',
    signedIn: true,
    items: SAMPLE_ITEMS,
  },
  {
    name: 'empty shopping list',
    path: SHOPPING_LIST_PATH,
    heading: 'Shopping list',
    signedIn: true,
    items: [],
  },
  {
    name: 'shopping list in Polish',
    path: SHOPPING_LIST_PATH,
    heading: 'Lista zakupów',
    signedIn: true,
    language: 'pl',
    items: SAMPLE_ITEMS,
  },
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

        if (screen.tiles) {
          await stubTiles(page, screen.tiles);
        }

        if (screen.items) {
          await stubItems(page, screen.items);
        }

        if (screen.remembered) {
          await page.addInitScript(
            ({ key, username }) => {
              localStorage.setItem(key, username);
            },
            { key: REMEMBERED_ACCOUNT_KEY, username: screen.remembered },
          );
        }

        if (screen.language) {
          await page.addInitScript(
            ({ key, language }) => {
              localStorage.setItem(key, language);
            },
            { key: LANGUAGE_KEY, language: screen.language },
          );
        }

        await page.goto(screen.path);
        await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible();
        await screen.open?.(page);
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
      const heading = page.getByRole('heading', { level: 1, name: "Who's there, Trainer?" });
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
    const search = (page: Page) => page.getByRole('searchbox');
    const tiles = (page: Page) => page.getByRole('article');

    test.beforeEach(async ({ page }) => {
      await signIn(page);
      await stubTiles(page, SAMPLE_TILES);

      await page
        .context()
        .route(`${LINK_HOST}/**`, (route) => route.fulfill({ body: 'linked file' }));
    });

    test('should show a pinned tile first and put it back when it is unpinned', async ({
      page,
    }) => {
      // Given
      await page.goto('/');
      await expect(tiles(page)).toHaveText([/clock/, /Finances/, /Shopping/, /Weight log/]);

      // When
      await page.getByRole('button', { name: 'Pin Weight log' }).click();

      // Then
      await expect(tiles(page)).toHaveText([/Weight log/, /clock/, /Finances/, /Shopping/]);
      await page.getByRole('button', { name: 'Pin Weight log' }).click();
      await expect(tiles(page)).toHaveText([/clock/, /Finances/, /Shopping/, /Weight log/]);
    });

    test('should keep a pin after a reload', async ({ page }) => {
      // Given
      await page.goto('/');
      const pin = page.getByRole('button', { name: 'Pin Shopping' });

      // When
      await pin.click();
      await expect(pin).toHaveAttribute('aria-pressed', 'true');
      await page.reload();

      // Then
      await expect(tiles(page).first()).toContainText('Shopping');
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

    test('should open a link tile in a new tab', async ({ page }) => {
      // Given
      await page.goto('/');

      // When
      const [tab] = await Promise.all([
        page.context().waitForEvent('page'),
        page.getByRole('link', { name: /Finances/ }).click(),
      ]);

      // Then
      await expect(tab).toHaveURL(`${LINK_HOST}/1`);
      await expect(page).toHaveURL('/');
    });

    test('should open a module tile at its route inside the app', async ({ page }) => {
      // Given
      await page.goto('/');

      // When
      await page.getByRole('link', { name: /clock/ }).click();

      // Then
      await expect(page).toHaveURL(/\/m\/clock$/);
      await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    });

    test('should find tiles by title and description and open the best match with Enter', async ({
      page,
    }) => {
      // Given
      await page.goto('/');
      await search(page).fill('groceries');
      await expect(tiles(page)).toHaveText([/Shopping/]);

      // When
      const [tab] = await Promise.all([
        page.context().waitForEvent('page'),
        search(page).press('Enter'),
      ]);

      // Then
      await expect(tab).toHaveURL(`${LINK_HOST}/${String(SHOPPING.id)}`);
    });

    test('should find tiles in Polish ignoring diacritics', async ({ page }) => {
      // Given
      await page.addInitScript(
        ({ key }) => {
          localStorage.setItem(key, 'pl');
        },
        { key: LANGUAGE_KEY },
      );

      await page.goto('/');

      // When
      await search(page).fill('zakupow');

      // Then
      await expect(page.getByRole('heading', { level: 2, name: 'Wyniki' })).toBeVisible();
      await expect(tiles(page)).toHaveText([/Zakupy/]);
    });

    test('should clear the search with Escape and say when nothing matches', async ({ page }) => {
      // Given
      await page.goto('/');
      await search(page).fill('pokeball');
      await expect(page.getByText('No tiles match “pokeball”.')).toBeVisible();

      // When
      await search(page).press('Escape');

      // Then
      await expect(search(page)).toHaveValue('');
      await expect(tiles(page)).toHaveCount(SAMPLE_TILES.length);
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
