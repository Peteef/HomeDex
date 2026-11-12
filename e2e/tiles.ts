import type { Page, Route } from '@playwright/test';

export const LINK_HOST = 'https://docs.example.com';

export interface E2ETile {
  id: number;
  dexNo: number;
  kind: 'link' | 'module';
  texts: Partial<Record<'en' | 'pl', { title: string; description: string | null }>>;
  icon: string;
  url: string | null;
  moduleId: string | null;
  scope: 'shared' | 'personal';
  pinned: boolean;
  editable: boolean;
}

const link = (id: number, icon: string, texts: E2ETile['texts']): E2ETile => ({
  id,
  dexNo: id,
  kind: 'link',
  texts,
  icon,
  url: `${LINK_HOST}/${String(id)}`,
  moduleId: null,
  scope: 'shared',
  pinned: false,
  editable: true,
});

export const FINANCES = link(1, 'wallet', {
  en: { title: 'Finances', description: 'Monthly budget' },
  pl: { title: 'Finanse', description: 'Budżet miesięczny' },
});

export const WEIGHT = link(2, 'scale', {
  en: { title: 'Weight log', description: null },
  pl: { title: 'Dziennik wagi', description: null },
});

export const SHOPPING = link(3, 'cart', {
  en: { title: 'Shopping', description: 'Groceries for the week' },
  pl: { title: 'Zakupy', description: 'Lista zakupów na tydzień' },
});

export const CLOCK: E2ETile = {
  ...link(4, 'calendar', {}),
  kind: 'module',
  url: null,
  moduleId: 'clock',
  editable: false,
};

export const SAMPLE_TILES = [FINANCES, WEIGHT, SHOPPING, CLOCK];

const PIN_PATH = /\/api\/tiles\/(\d+)\/pin$/;

// Every Playwright project signs in as the same user against one server, so real pins would leak
// between parallel tests. The tiles API is stubbed instead, keeping pins per page.
export const stubTiles = async (page: Page, tiles: E2ETile[]): Promise<void> => {
  const pinned = new Set(tiles.filter((tile) => tile.pinned).map((tile) => tile.id));

  const withPin = (tile: E2ETile): E2ETile => ({
    ...tile,
    pinned: pinned.has(tile.id),
  });

  const listTiles = (route: Route) => route.fulfill({ json: { tiles: tiles.map(withPin) } });

  const savePin = (route: Route) => {
    const id = Number(PIN_PATH.exec(route.request().url())?.[1]);

    if (route.request().method() === 'PUT') {
      pinned.add(id);
    } else {
      pinned.delete(id);
    }

    return route.fulfill({ status: 204 });
  };

  await page.route('**/api/tiles', listTiles);
  await page.route(PIN_PATH, savePin);
};
