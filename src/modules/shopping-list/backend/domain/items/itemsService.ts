import type { Storage } from '#platform/backend';
import { ItemError } from './errors.ts';
import { itemRepository } from './internal/itemRepository.ts';
import type { Item, NewItem } from './types.ts';

const MAX_TEXT_LENGTH = 100;
const MAX_AMOUNT_LENGTH = 30;

interface ItemsOptions {
  now?: () => number;
}

export interface ItemsService {
  list(): Item[];
  add(addedBy: string, item: NewItem): Item;
  check(id: number): void;
  uncheck(id: number): void;
  remove(id: number): void;
  clearChecked(): void;
}

const invalid = (message: string) => new ItemError('invalid', message);
const notFound = (id: number) => new ItemError('not_found', `No item with id ${String(id)}`);

const requireText = (text: string): string => {
  const trimmed = text.trim();

  if (trimmed === '') {
    throw invalid('The item text is empty');
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw invalid(`The item text is longer than ${String(MAX_TEXT_LENGTH)} characters`);
  }

  return trimmed;
};

const optionalAmount = (amount = ''): string | null => {
  const trimmed = amount.trim();

  if (trimmed.length > MAX_AMOUNT_LENGTH) {
    throw invalid(`The amount is longer than ${String(MAX_AMOUNT_LENGTH)} characters`);
  }

  return trimmed === '' ? null : trimmed;
};

const requireFound = (found: boolean, id: number): void => {
  if (!found) {
    throw notFound(id);
  }
};

export const itemsService = (db: Storage, { now = Date.now }: ItemsOptions = {}): ItemsService => {
  const items = itemRepository(db);

  const list = (): Item[] => items.list();

  const add = (addedBy: string, { text, amount }: NewItem): Item => {
    const id = items.insert({
      text: requireText(text),
      amount: optionalAmount(amount),
      addedBy,
      createdAt: now(),
    });

    const item = items.find(id);

    if (item === undefined) {
      throw notFound(id);
    }

    return item;
  };

  const check = (id: number): void => {
    requireFound(items.check(id, now()), id);
  };

  const uncheck = (id: number): void => {
    requireFound(items.uncheck(id), id);
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
