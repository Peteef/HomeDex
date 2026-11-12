import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { E2E_SECOND_USER } from './fixtures.ts';
import { LANGUAGE_KEY, signIn } from './session.ts';
import { SAMPLE_TILES, settled, stubTiles } from './tiles.ts';

const DESKTOP_PROJECT = 'desktop';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

const isDesktop = (testInfo: TestInfo): boolean => testInfo.project.name === DESKTOP_PROJECT;

// Every project writes real tiles as the same user against one server, so each run names its own.
const uniqueName = (name: string, testInfo: TestInfo): string =>
  `${name} ${testInfo.project.name} ${String(Date.now())}`;

const tileCalled = (page: Page, title: string) =>
  page.getByRole('article').filter({ hasText: title });

const addTileDialog = (page: Page) => page.getByRole('dialog', { name: 'Add tile' });
const editTileDialog = (page: Page) => page.getByRole('dialog', { name: 'Edit tile' });

// Waits for the write to be saved, so a reload right after it shows the server's state.
const saving = async (page: Page, change: () => Promise<void>): Promise<void> => {
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes('/api/tiles') &&
      !response.url().endsWith('/pin') &&
      response.request().method() !== 'GET',
  );

  await change();
  await saved;
};

const openEditor = async (page: Page, testInfo: TestInfo, title: string): Promise<void> => {
  const tile = tileCalled(page, title);

  if (isDesktop(testInfo)) {
    await tile.hover();
    await tile.getByRole('button', { name: `Edit ${title}` }).click();
  } else {
    const link = tile.getByRole('link');
    await link.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
    await expect(editTileDialog(page)).toBeVisible();
    await link.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
  }

  await expect(editTileDialog(page)).toBeVisible();
};

const createTile = async (page: Page, title: string, scope: 'personal' | 'shared') => {
  const response = await page.request.post('/api/tiles', {
    headers: JSON_HEADERS,
    data: {
      texts: { en: { title } },
      url: 'https://docs.example.com/private',
      icon: 'notes',
      scope,
    },
  });

  expect(response.ok()).toBe(true);
};

test.describe('link tile management', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should add a tile in two languages, edit it and delete it', async ({ page }, testInfo) => {
    // Given
    const title = uniqueName('Budget', testInfo);
    const polishTitle = uniqueName('Budżet', testInfo);
    const renamed = uniqueName('Savings', testInfo);
    await page.goto('/');

    // When: add
    await page.getByRole('button', { name: 'Add tile' }).click();
    const add = addTileDialog(page);
    await add.getByRole('textbox', { name: 'Title' }).fill(title);
    await add.getByRole('button', { name: 'Add PL' }).click();

    await add
      .getByRole('group', { name: '🇵🇱 PL' })
      .getByRole('textbox', { name: 'Title' })
      .fill(polishTitle);

    await add.getByRole('textbox', { name: 'Address' }).fill('http://192.168.1.10:8123');
    await add.getByTitle('Wallet').click();
    await add.getByText('Shared', { exact: true }).click();

    await saving(page, () => add.getByRole('button', { name: 'Save' }).click());

    // Then
    await expect(add).toBeHidden();
    await expect(tileCalled(page, title)).toBeVisible();

    await expect(tileCalled(page, title).getByRole('link')).toHaveAttribute(
      'href',
      'http://192.168.1.10:8123',
    );

    await page.getByRole('combobox', { name: 'Language' }).selectOption('pl');
    await expect(tileCalled(page, polishTitle)).toBeVisible();
    await page.getByRole('combobox', { name: 'Język' }).selectOption('en');

    // When: edit
    await openEditor(page, testInfo, title);
    const edit = editTileDialog(page);
    await expect(edit.getByRole('radio', { name: 'Wallet' })).toBeChecked();
    await expect(edit.getByText('Shared: everyone can see it.')).toBeVisible();

    await edit
      .getByRole('group', { name: '🇬🇧 EN' })
      .getByRole('textbox', { name: 'Title' })
      .fill(renamed);

    await edit.getByRole('button', { name: 'Remove PL' }).click();
    await saving(page, () => edit.getByRole('button', { name: 'Save' }).click());

    // Then
    await expect(edit).toBeHidden();
    await page.reload();
    await expect(tileCalled(page, renamed)).toBeVisible();
    await expect(tileCalled(page, title)).toHaveCount(0);

    // When: delete
    await openEditor(page, testInfo, renamed);
    await editTileDialog(page).getByRole('button', { name: 'Delete tile' }).click();
    await expect(editTileDialog(page).getByText(`Delete “${renamed}”?`)).toBeVisible();

    await saving(page, () =>
      editTileDialog(page).getByRole('button', { name: 'Delete', exact: true }).click(),
    );

    // Then
    await expect(editTileDialog(page)).toBeHidden();
    await page.reload();
    await expect(page.getByRole('article').first()).toBeVisible();
    await expect(tileCalled(page, renamed)).toHaveCount(0);
  });

  test('should never show a personal tile to another user', async ({ page }, testInfo) => {
    // Given
    const personal = uniqueName('Diary', testInfo);
    const shared = uniqueName('Recipes', testInfo);
    await createTile(page, personal, 'personal');
    await createTile(page, shared, 'shared');

    // When
    await page.context().clearCookies();
    await signIn(page, E2E_SECOND_USER);
    await page.goto('/');

    // Then
    await expect(tileCalled(page, shared)).toBeVisible();
    await expect(tileCalled(page, personal)).toHaveCount(0);
    await expect(page.getByRole('button', { name: `Edit ${shared}` })).toHaveCount(0);
    const listed = await (await page.request.get('/api/tiles')).text();
    expect(listed).not.toContain(personal);
  });

  test.describe('with stubbed tiles', () => {
    test.beforeEach(async ({ page }) => {
      await stubTiles(page, SAMPLE_TILES);
    });

    test('should show what is missing and send nothing until it is fixed', async ({ page }) => {
      // Given
      const writes: string[] = [];

      page.on('request', (request) => {
        if (request.method() === 'POST') {
          writes.push(request.url());
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Add tile' }).click();
      const add = addTileDialog(page);

      // When
      await add.getByRole('button', { name: 'Save' }).click();

      // Then
      await expect(add.getByText('Enter a title.')).toBeVisible();
      await expect(add.getByText('Enter the address.')).toBeVisible();
      await add.getByRole('textbox', { name: 'Address' }).fill('docs.example.com');

      await expect(
        add.getByText('Enter a web address starting with http:// or https://.'),
      ).toBeVisible();

      expect(writes).toEqual([]);
    });

    test('should show the validation messages in Polish', async ({ page }) => {
      // Given
      await page.addInitScript(
        ({ key }) => {
          localStorage.setItem(key, 'pl');
        },
        { key: LANGUAGE_KEY },
      );

      await page.goto('/');
      await page.getByRole('button', { name: 'Dodaj kafelek' }).click();
      const add = page.getByRole('dialog', { name: 'Dodaj kafelek' });

      // When
      await add.getByRole('button', { name: 'Zapisz' }).click();

      // Then
      await expect(add.getByText('Wpisz tytuł.')).toBeVisible();
      await expect(add.getByText('Wpisz adres.')).toBeVisible();
    });

    test('should add and remove language blocks, keeping the last one', async ({ page }) => {
      // Given
      await page.goto('/');
      await page.getByRole('button', { name: 'Add tile' }).click();
      const add = addTileDialog(page);
      await expect(add.getByRole('button', { name: /^Remove/ })).toHaveCount(0);

      // When
      await add.getByRole('button', { name: 'Add PL' }).click();
      await add.getByRole('button', { name: 'Remove EN' }).click();

      // Then
      await expect(add.getByRole('group', { name: '🇵🇱 PL' })).toBeVisible();
      await expect(add.getByRole('group', { name: '🇬🇧 EN' })).toHaveCount(0);
      await expect(add.getByRole('button', { name: 'Add EN' })).toBeVisible();
      await expect(add.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
    });

    test('should open as a bottom sheet on phones and a centred dialog on desktop', async ({
      page,
    }, testInfo) => {
      // Given
      await page.goto('/');

      // When
      await page.getByRole('button', { name: 'Add tile' }).click();
      await settled(addTileDialog(page));

      // Then
      const box = await addTileDialog(page).boundingBox();
      const viewport = page.viewportSize();
      expect(box).not.toBeNull();
      expect(viewport).not.toBeNull();

      if (box === null || viewport === null) {
        return;
      }

      if (isDesktop(testInfo)) {
        expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2);
        expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(2);
      } else {
        expect(box.width).toBe(viewport.width);
        expect(Math.abs(box.y + box.height - viewport.height)).toBeLessThan(2);
      }
    });

    // Opened from the keyboard: Safari does not focus a button that is tapped or clicked, so
    // there the focus has nothing to go back to.
    test('should close on Escape and give the focus back to the add tile', async ({ page }) => {
      // Given
      await page.goto('/');
      const addTile = page.getByRole('button', { name: 'Add tile' });
      await addTile.focus();
      await page.keyboard.press('Enter');
      await expect(addTileDialog(page)).toBeVisible();

      // When
      await page.keyboard.press('Escape');

      // Then
      await expect(addTileDialog(page)).toBeHidden();
      await expect(addTile).toBeFocused();
    });

    test('should keep the focus inside the open dialog', async ({ page }) => {
      // Given
      await page.goto('/');
      await page.getByRole('button', { name: 'Add tile' }).click();
      const add = addTileDialog(page);

      // When
      for (let step = 0; step < 40; step += 1) {
        await page.keyboard.press('Tab');
      }

      // Then
      const insideDialog = await add.evaluate(
        (dialog) =>
          dialog.contains(document.activeElement) || document.activeElement === document.body,
      );

      expect(insideDialog).toBe(true);
    });

    test('should show the edit button on hover with a mouse', async ({ page }, testInfo) => {
      test.skip(!isDesktop(testInfo), 'Phones edit with a long press');

      // Given
      await page.goto('/');
      const finances = tileCalled(page, 'Finances');
      const editButton = finances.getByRole('button', { name: 'Edit Finances' });
      await expect(editButton).toHaveCSS('opacity', '0');

      // When
      await finances.hover();

      // Then
      await expect(editButton).toHaveCSS('opacity', '1');
    });

    test('should explain the long press on touch screens', async ({ page }, testInfo) => {
      // Given
      await page.goto('/');
      const hint = page.getByText('Hold a tile to edit it.');

      // When / Then
      await (isDesktop(testInfo) ? expect(hint).toBeHidden() : expect(hint).toBeVisible());
    });

    test('should edit a tile with a long press without opening its link', async ({
      page,
    }, testInfo) => {
      test.skip(isDesktop(testInfo), 'A mouse uses the edit button');

      // Given
      await page.goto('/');
      const link = tileCalled(page, 'Finances').getByRole('link');
      let opened = false;

      page.context().on('page', () => {
        opened = true;
      });

      // When
      await link.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
      await expect(editTileDialog(page)).toBeVisible();
      await link.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
      await link.dispatchEvent('click');

      // Then
      await expect(
        editTileDialog(page).getByRole('textbox', { name: 'Title' }).first(),
      ).toHaveValue('Finances');

      expect(opened).toBe(false);
    });
  });
});
