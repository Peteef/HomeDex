import type { Storage } from '#platform/backend';
import { z } from 'zod';
import { invalidItem, itemNotFound } from './errors.ts';
import { itemRepository } from './internal/itemRepository.ts';
import type { Item, NewItem } from './types.ts';

const TEXT_MAX_LENGTH = 100;
const AMOUNT_MAX_LENGTH = 30;

export interface ItemsService {
  list(): Item[];
  add(addedBy: string, item: NewItem): Item;
  check(id: number): void;
  uncheck(id: number): void;
  remove(id: number): void;
  clearChecked(): void;
}

const newItemSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'The item text is empty')
    .max(TEXT_MAX_LENGTH, `The item text is longer than ${String(TEXT_MAX_LENGTH)} characters`),
  amount: z
    .string()
    .trim()
    .max(AMOUNT_MAX_LENGTH, `The amount is longer than ${String(AMOUNT_MAX_LENGTH)} characters`)
    .transform((amount) => (amount === '' ? null : amount))
    .default(null),
});

const validate = (item: NewItem): z.infer<typeof newItemSchema> => {
  const result = newItemSchema.safeParse(item);

  if (!result.success) {
    throw invalidItem(result.error.issues[0]?.message ?? 'Invalid item');
  }

  return result.data;
};

export const itemsService = (db: Storage): ItemsService => {
  const items = itemRepository(db);

  const list = (): Item[] => items.list();

  const add = (addedBy: string, item: NewItem): Item => {
    const id = items.insert({ ...validate(item), addedBy });
    const created = items.find(id);

    if (created === undefined) {
      throw itemNotFound(id);
    }

    return created;
  };

  const setChecked = (id: number, checked: boolean): void => {
    if (!items.setChecked(id, checked)) {
      throw itemNotFound(id);
    }
  };

  const check = (id: number): void => {
    setChecked(id, true);
  };

  const uncheck = (id: number): void => {
    setChecked(id, false);
  };

  const remove = (id: number): void => {
    items.remove(id);
  };

  const clearChecked = (): void => {
    items.removeChecked();
  };

  return {
    list,
    add,
    check,
    uncheck,
    remove,
    clearChecked,
  };
};
