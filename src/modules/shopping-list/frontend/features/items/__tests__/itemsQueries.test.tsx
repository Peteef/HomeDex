import { fakeApi, ok, status, withProviders } from '#platform/frontend/testing';
import type { FakeResponse } from '#platform/frontend/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  useAddItem,
  useClearCheckedItems,
  useDeleteItem,
  useItems,
  useToggleCheck,
} from '../index.ts';
import type { Item } from '../index.ts';

const ITEMS = 'GET /api/m/shopping-list/items';

const item = (id: number, text: string, checked = false): Item => ({
  id,
  text,
  amount: null,
  addedBy: 'Misty',
  checked,
});

const MILK = item(1, 'Milk');
const BREAD = item(2, 'Bread');

const renderHooks = () => {
  const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

  return renderHook(
    () => ({
      items: useItems(),
      add: useAddItem(),
      toggle: useToggleCheck(),
      remove: useDeleteItem(),
      clear: useClearCheckedItems(),
    }),
    { wrapper },
  );
};

const loaded = async () => {
  const hooks = renderHooks();

  await waitFor(() => {
    expect(hooks.result.current.items.data).toBeDefined();
  });

  return hooks;
};

const checkedOf = (items: Item[] | undefined) => items?.map(({ id, checked }) => [id, checked]);

const deferred = () => {
  let resolve: (response: FakeResponse) => void = () => undefined;

  const promise = new Promise<FakeResponse>((done) => {
    resolve = done;
  });

  return {
    promise,
    resolve,
  };
};

describe('items queries', () => {
  describe('useItems', () => {
    it('should load the items', async () => {
      // Given
      fakeApi({ [ITEMS]: ok({ items: [MILK, BREAD] }) });

      // When
      const { result } = await loaded();

      // Then
      expect(result.current.items.data).toEqual([MILK, BREAD]);
    });
  });

  describe('useAddItem', () => {
    it('should append the saved item before the list reloads', async () => {
      // Given
      const butter = item(3, 'Butter');
      const reloaded = deferred();
      let loads = 0;

      const loadItems = () => {
        loads += 1;
        return loads === 1 ? ok({ items: [MILK] }) : reloaded.promise;
      };

      fakeApi({
        [ITEMS]: loadItems,
        'POST /api/m/shopping-list/items': ok({ item: butter }),
      });

      const { result } = await loaded();

      // When
      act(() => {
        result.current.add.mutate({ text: 'Butter' });
      });

      // Then
      await waitFor(() => {
        expect(result.current.items.data).toEqual([MILK, butter]);
      });

      await waitFor(() => {
        expect(loads).toBe(2);
      });

      reloaded.resolve(ok({ items: [MILK, butter] }));
    });
  });

  describe('useToggleCheck', () => {
    it('should show the check at once and save it', async () => {
      // Given
      const saved = deferred();

      const api = fakeApi({
        [ITEMS]: ok({ items: [MILK, BREAD] }),
        'PUT /api/m/shopping-list/items/1/check': () => saved.promise,
      });

      const { result } = await loaded();

      // When
      act(() => {
        result.current.toggle.mutate({ id: 1, checked: true });
      });

      // Then
      await waitFor(() => {
        expect(checkedOf(result.current.items.data)).toEqual([
          [1, true],
          [2, false],
        ]);
      });

      expect(api.callsTo('PUT /api/m/shopping-list/items/1/check')).toHaveLength(1);
      saved.resolve({ status: 204 });
    });

    it('should undo only the failed check when another one is still on its way', async () => {
      // Given
      const failed = deferred();
      const saved = deferred();

      fakeApi({
        [ITEMS]: ok({ items: [MILK, BREAD] }),
        'PUT /api/m/shopping-list/items/1/check': () => failed.promise,
        'PUT /api/m/shopping-list/items/2/check': () => saved.promise,
      });

      const { result } = await loaded();

      act(() => {
        result.current.toggle.mutate({ id: 1, checked: true });
      });

      act(() => {
        result.current.toggle.mutate({ id: 2, checked: true });
      });

      await waitFor(() => {
        expect(checkedOf(result.current.items.data)).toContainEqual([2, true]);
      });

      // When
      failed.resolve(status(500));

      // Then
      await waitFor(() => {
        expect(checkedOf(result.current.items.data)).toEqual([
          [1, false],
          [2, true],
        ]);
      });

      saved.resolve({ status: 204 });
    });

    it('should reload the list only after the last change is saved', async () => {
      // Given
      const first = deferred();
      const second = deferred();

      const api = fakeApi({
        [ITEMS]: ok({ items: [MILK, BREAD] }),
        'PUT /api/m/shopping-list/items/1/check': () => first.promise,
        'PUT /api/m/shopping-list/items/2/check': () => second.promise,
      });

      const { result } = await loaded();

      act(() => {
        result.current.toggle.mutate({ id: 1, checked: true });
        result.current.toggle.mutate({ id: 2, checked: true });
      });

      // When
      await act(async () => {
        first.resolve({ status: 204 });
        await first.promise;
      });

      // Then
      expect(api.callsTo(ITEMS)).toHaveLength(1);

      // When
      second.resolve({ status: 204 });

      // Then
      await waitFor(() => {
        expect(api.callsTo(ITEMS)).toHaveLength(2);
      });
    });
  });

  describe('useDeleteItem', () => {
    it('should remove the item at once and save it', async () => {
      // Given
      const saved = deferred();

      const api = fakeApi({
        [ITEMS]: ok({ items: [MILK, BREAD] }),
        'DELETE /api/m/shopping-list/items/1': () => saved.promise,
      });

      const { result } = await loaded();

      // When
      act(() => {
        result.current.remove.mutate(1);
      });

      // Then
      await waitFor(() => {
        expect(result.current.items.data).toEqual([BREAD]);
      });

      expect(api.callsTo('DELETE /api/m/shopping-list/items/1')).toHaveLength(1);
      saved.resolve({ status: 204 });
    });

    it('should bring the item back when deleting fails', async () => {
      // Given
      fakeApi({
        [ITEMS]: ok({ items: [MILK, BREAD] }),
        'DELETE /api/m/shopping-list/items/1': status(500),
      });

      const { result } = await loaded();

      // When
      act(() => {
        result.current.remove.mutate(1);
      });

      // Then
      await waitFor(() => {
        expect(result.current.remove.isError).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.items.data).toEqual([MILK, BREAD]);
      });
    });
  });

  describe('useClearCheckedItems', () => {
    it('should remove the checked items at once and save it', async () => {
      // Given
      const saved = deferred();

      const api = fakeApi({
        [ITEMS]: ok({ items: [item(1, 'Milk', true), BREAD] }),
        'DELETE /api/m/shopping-list/checked-items': () => saved.promise,
      });

      const { result } = await loaded();

      // When
      act(() => {
        result.current.clear.mutate();
      });

      // Then
      await waitFor(() => {
        expect(result.current.items.data).toEqual([BREAD]);
      });

      expect(api.callsTo('DELETE /api/m/shopping-list/checked-items')).toHaveLength(1);
      saved.resolve({ status: 204 });
    });
  });
});
