import type { Page, Route } from '@playwright/test';

export const SHOPPING_LIST_PATH = '/m/shopping-list';

export interface E2EItem {
  id: number;
  text: string;
  amount: string | null;
  addedBy: string;
  checked: boolean;
}

export const SAMPLE_ITEMS: E2EItem[] = [
  { id: 1, text: 'Milk', amount: '2 l', addedBy: 'Ash', checked: false },
  {
    id: 2,
    text: 'Oran berries for the whole team',
    amount: null,
    addedBy: 'Misty',
    checked: false,
  },
  { id: 3, text: 'Bread', amount: '1', addedBy: 'Ash', checked: true },
];

// A fixed list for the screen checks: every project shares one server and one user, so the real
// list would change under parallel tests.
export const stubItems = async (page: Page, items: E2EItem[]): Promise<void> => {
  const listItems = (route: Route) => route.fulfill({ json: { items } });
  await page.route('**/api/m/shopping-list/items', listItems);
};
