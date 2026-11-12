import { fakeApi, ok, status, withProviders } from '#platform/frontend/testing';
import type { FakeResponse } from '#platform/frontend/testing';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { Item } from '../../../features/items/index.ts';
import { ListPage } from '../ListPage.tsx';

const ITEMS = 'GET /api/m/shopping-list/items';

const item = (id: number, text: string, overrides: Partial<Item> = {}): Item => ({
  id,
  text,
  amount: null,
  addedBy: 'Misty',
  checked: false,
  ...overrides,
});

const MILK = item(1, 'Milk', { amount: '2 l' });
const BREAD = item(2, 'Bread', { addedBy: 'Brock' });
const EGGS = item(3, 'Eggs', { checked: true });

type Routes = Parameters<typeof fakeApi>[0];

const NO_CONTENT = { status: 204 };
const LIST = '/api/m/shopping-list';

// A stateful fake of the list's API: every change shows in the next GET, as after a refetch.
const fakeList = (initial: Item[]): Routes => {
  let items = [...initial];
  let nextId = 100;

  const change = (update: (current: Item[]) => Item[]) => () => {
    items = update(items);
    return NO_CONTENT;
  };

  const setChecked = (id: number, checked: boolean) =>
    change((current) => current.map((entry) => (entry.id === id ? { ...entry, checked } : entry)));

  const add: Routes[string] = ({ body }) => {
    const { text, amount } = body as { text: string; amount?: string };
    const added = item(nextId++, text, { amount: amount ?? null });
    items = [...items, added];
    return ok({ item: added });
  };

  const itemRoutes = initial.flatMap(({ id }): [string, Routes[string]][] => [
    [`PUT ${LIST}/items/${String(id)}/check`, setChecked(id, true)],
    [`DELETE ${LIST}/items/${String(id)}/check`, setChecked(id, false)],
    [
      `DELETE ${LIST}/items/${String(id)}`,
      change((current) => current.filter((entry) => entry.id !== id)),
    ],
  ]);

  return {
    [ITEMS]: () => ok({ items }),
    [`POST ${LIST}/items`]: add,
    [`DELETE ${LIST}/checked-items`]: change((current) =>
      current.filter((entry) => !entry.checked),
    ),
    ...Object.fromEntries(itemRoutes),
  };
};

const openList = (items: Item[] | FakeResponse = [MILK, BREAD, EGGS], overrides: Routes = {}) => {
  const api = fakeApi({
    ...(Array.isArray(items) ? fakeList(items) : { [ITEMS]: items }),
    ...overrides,
  });

  render(withProviders(<ListPage />));
  return api;
};

const section = (name: string) => screen.getByRole('region', { name });

const rowTexts = (name: string) =>
  within(section(name))
    .queryAllByRole('checkbox')
    .map((checkbox) => checkbox.closest('label')?.textContent);

const typeItem = (text: string, amount = '') => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Item' }), { target: { value: text } });

  fireEvent.change(screen.getByRole('textbox', { name: 'Amount (optional)' }), {
    target: { value: amount },
  });
};

describe('ListPage', () => {
  it('should show the items to buy and those in the cart', async () => {
    // When
    openList();

    // Then
    await screen.findByText('Milk');
    expect(rowTexts('To buy')).toEqual(['Milk · 2 lAdded by Misty', 'BreadAdded by Brock']);
    expect(rowTexts('In the cart')).toEqual(['EggsAdded by Misty']);
    expect(screen.getByRole('checkbox', { name: /Eggs/ })).toBeChecked();
  });

  it('should hide the cart and say so when there is nothing to buy', async () => {
    // When
    openList([]);

    // Then
    expect(
      await screen.findByText('Nothing to buy. Add the first item above.'),
    ).toBeInTheDocument();

    expect(screen.queryByRole('region', { name: 'In the cart' })).not.toBeInTheDocument();
  });

  it('should add an item with its amount and clear the form', async () => {
    // Given
    const api = openList([]);

    await screen.findByText('Nothing to buy. Add the first item above.');
    typeItem('Butter', '1');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Then
    expect(await screen.findByText('Butter')).toBeInTheDocument();

    expect(api.callsTo('POST /api/m/shopping-list/items')[0]?.body).toEqual({
      text: 'Butter',
      amount: '1',
    });

    expect(screen.getByRole('textbox', { name: 'Item' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Amount (optional)' })).toHaveValue('');
  });

  it('should send no amount when it is left empty', async () => {
    // Given
    const api = openList([]);

    await screen.findByText('Nothing to buy. Add the first item above.');
    typeItem('Butter');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Then
    await screen.findByText('Butter');
    expect(api.callsTo('POST /api/m/shopping-list/items')[0]?.body).toEqual({ text: 'Butter' });
  });

  it('should add nothing when the item is blank', async () => {
    // Given
    const api = openList([]);
    await screen.findByText('Nothing to buy. Add the first item above.');
    typeItem('   ');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Then
    expect(api.callsTo('POST /api/m/shopping-list/items')).toHaveLength(0);
  });

  it('should keep what was typed and say so when adding fails', async () => {
    // Given
    openList([], { 'POST /api/m/shopping-list/items': status(500) });
    await screen.findByText('Nothing to buy. Add the first item above.');
    typeItem('Butter');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't add the item. Try again.");
    expect(screen.getByRole('textbox', { name: 'Item' })).toHaveValue('Butter');
  });

  it('should move an item to the cart when it is checked', async () => {
    // Given
    const api = openList([MILK, BREAD]);
    await screen.findByText('Milk');

    // When
    fireEvent.click(screen.getByRole('checkbox', { name: /Milk/ }));

    // Then
    await waitFor(() => {
      expect(rowTexts('In the cart')).toEqual(['Milk · 2 lAdded by Misty']);
    });

    expect(api.callsTo('PUT /api/m/shopping-list/items/1/check')).toHaveLength(1);
  });

  it('should put an item back when unchecking it fails', async () => {
    // Given
    openList([EGGS], { 'DELETE /api/m/shopping-list/items/3/check': status(500) });
    await screen.findByText('Eggs');

    // When
    fireEvent.click(screen.getByRole('checkbox', { name: /Eggs/ }));

    // Then
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /Eggs/ })).toBeChecked();
    });
  });

  it('should delete an item', async () => {
    // Given
    const api = openList([MILK, BREAD]);
    await screen.findByText('Milk');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete Milk' }));

    // Then
    await waitFor(() => {
      expect(screen.queryByText('Milk')).not.toBeInTheDocument();
    });

    expect(api.callsTo('DELETE /api/m/shopping-list/items/1')).toHaveLength(1);
  });

  it('should clear the cart', async () => {
    // Given
    const api = openList([MILK, EGGS]);

    await screen.findByText('Eggs');

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    // Then
    await waitFor(() => {
      expect(screen.queryByText('Eggs')).not.toBeInTheDocument();
    });

    expect(rowTexts('To buy')).toEqual(['Milk · 2 lAdded by Misty']);
    expect(api.callsTo('DELETE /api/m/shopping-list/checked-items')).toHaveLength(1);
  });

  it('should offer to try again when the list cannot be loaded', async () => {
    // Given
    const api = openList(status(400));
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't load the list.");

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => {
      expect(api.callsTo(ITEMS)).toHaveLength(2);
    });
  });

  it('should refresh the list when the window gets focus', async () => {
    // Given
    const api = openList();
    await screen.findByText('Milk');

    // When
    fireEvent.focus(window);

    // Then
    await waitFor(() => {
      expect(api.callsTo(ITEMS)).toHaveLength(2);
    });
  });

  it('should refresh the list every 15 seconds', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = openList();
    await screen.findByText('Milk');

    // When
    await act(() => vi.advanceTimersByTimeAsync(15_000));
    vi.useRealTimers();

    // Then
    expect(api.callsTo(ITEMS)).toHaveLength(2);
  });

  it('should show its text in Polish', async () => {
    // Given
    openList();
    await screen.findByText('Milk');

    // When
    await act(() => i18next.changeLanguage('pl'));

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'Lista zakupów' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń: Bread' })).toBeInTheDocument();
  });
});
