import { del, getJson, postForJson, put } from '#platform/frontend';
import type { CheckChange, Item, NewItem } from '../types.ts';

const ITEMS_PATH = '/m/shopping-list/items';
const CHECKED_ITEMS_PATH = '/m/shopping-list/checked-items';

const itemPath = (id: number) => `${ITEMS_PATH}/${String(id)}`;

export const fetchItems = async (): Promise<Item[]> =>
  (await getJson<{ items: Item[] }>(ITEMS_PATH)).items;

export const createItem = async (item: NewItem): Promise<Item> =>
  (await postForJson<{ item: Item }>(ITEMS_PATH, item)).item;

export const saveCheck = ({ id, checked }: CheckChange): Promise<void> =>
  checked ? put(`${itemPath(id)}/check`) : del(`${itemPath(id)}/check`);

export const deleteItem = (id: number): Promise<void> => del(itemPath(id));

export const deleteCheckedItems = (): Promise<void> => del(CHECKED_ITEMS_PATH);
