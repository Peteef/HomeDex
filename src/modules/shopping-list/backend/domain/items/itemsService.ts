import type { Storage } from '#platform/backend';
import { invalidItem, itemNotFound } from './errors.ts';
import { itemRepository } from './internal/itemRepository.ts';
import type { Item, NewItem } from './types.ts';

const MAX_TEXT_LENGTH = 100;
const MAX_AMOUNT_LENGTH = 30;

export interface ItemsService {
  list(): Item[];
  add(addedBy: string, item: NewItem): Item;
  check(id: number): void;
  uncheck(id: number): void;
  remove(id: number): void;
  clearChecked(): void;
}

const requireText = (text: string): string => {
  const trimmed = text.trim();

  if (trimmed === '') {
    throw invalidItem('The item text is empty');
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw invalidItem(`The item text is longer than ${String(MAX_TEXT_LENGTH)} characters`);
  }

  return trimmed;
};

const optionalAmount = (amount = ''): string | null => {
  const trimmed = amount.trim();

  if (trimmed.length > MAX_AMOUNT_LENGTH) {
    throw invalidItem(`The amount is longer than ${String(MAX_AMOUNT_LENGTH)} characters`);
  }

  return trimmed === '' ? null : trimmed;
};

export const itemsService = (db: Storage): ItemsService => {
  const items = itemRepository(db);

  const list = (): Item[] => items.list();

  const add = (addedBy: string, { text, amount }: NewItem): Item => {
    const id = items.insert({
      text: requireText(text),
      amount: optionalAmount(amount),
      addedBy,
    });

    const item = items.find(id);

    if (item === undefined) {
      throw itemNotFound(id);
    }

    return item;
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
