import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createItem,
  deleteCheckedItems,
  deleteItem,
  fetchItems,
  saveCheck,
} from './internal/itemsApi.ts';
import type { CheckChange, Item } from './types.ts';

const ITEMS_QUERY_KEY = ['shopping-list', 'items'] as const;
const CHANGE_MUTATION_KEY = ['shopping-list', 'items', 'change'] as const;

type ItemsChange = (items: Item[]) => Item[];

const withCheck =
  ({ id, checked }: CheckChange): ItemsChange =>
  (items) =>
    items.map((item) => (item.id === id ? { ...item, checked } : item));

const without =
  (id: number): ItemsChange =>
  (items) =>
    items.filter((item) => item.id !== id);

const withoutChecked: ItemsChange = (items) => items.filter((item) => !item.checked);

const useItemsCache = () => {
  const queryClient = useQueryClient();

  const update = (change: ItemsChange): void => {
    queryClient.setQueryData<Item[]>(ITEMS_QUERY_KEY, (items) => items && change(items));
  };

  const showAtOnce = async (change: ItemsChange): Promise<void> => {
    await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY });
    update(change);
  };

  // Every change refetches the list once it is the last one on its way: refetching earlier would
  // briefly show the old state. The refetch also brings the other user's changes and puts back
  // an item whose deletion failed.
  const refreshWhenLast = async (): Promise<void> => {
    if (queryClient.isMutating({ mutationKey: CHANGE_MUTATION_KEY }) === 1) {
      await queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    }
  };

  return {
    update,
    showAtOnce,
    refreshWhenLast,
  };
};

export const useItems = () =>
  useQuery({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: fetchItems,
  });

export const useAddItem = () => {
  const { update, refreshWhenLast } = useItemsCache();

  const append = (item: Item): void => {
    update((items) => [...items, item]);
  };

  return useMutation({
    mutationKey: CHANGE_MUTATION_KEY,
    mutationFn: createItem,
    onSuccess: append,
    onSettled: refreshWhenLast,
  });
};

export const useToggleCheck = () => {
  const { update, showAtOnce, refreshWhenLast } = useItemsCache();

  // Undoes only this item, so a failed change never reverts another one made in the meantime.
  const undo = (_error: unknown, { id, checked }: CheckChange): void => {
    update(withCheck({ id, checked: !checked }));
  };

  return useMutation({
    mutationKey: CHANGE_MUTATION_KEY,
    mutationFn: saveCheck,
    onMutate: (change: CheckChange) => showAtOnce(withCheck(change)),
    onError: undo,
    onSettled: refreshWhenLast,
  });
};

export const useDeleteItem = () => {
  const { showAtOnce, refreshWhenLast } = useItemsCache();

  return useMutation({
    mutationKey: CHANGE_MUTATION_KEY,
    mutationFn: deleteItem,
    onMutate: (id: number) => showAtOnce(without(id)),
    onSettled: refreshWhenLast,
  });
};

export const useClearChecked = () => {
  const { showAtOnce, refreshWhenLast } = useItemsCache();

  return useMutation({
    mutationKey: CHANGE_MUTATION_KEY,
    mutationFn: deleteCheckedItems,
    onMutate: () => showAtOnce(withoutChecked),
    onSettled: refreshWhenLast,
  });
};
