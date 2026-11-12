import type { Storage } from '#platform/backend';
import type { Item } from '../types.ts';

export interface ItemRecord {
  text: string;
  amount: string | null;
  addedBy: string;
  createdAt: number;
}

export interface ItemRepository {
  list(): Item[];
  find(id: number): Item | undefined;
  insert(item: ItemRecord): number;
  check(id: number, now: number): boolean;
  uncheck(id: number): boolean;
  remove(id: number): void;
  removeChecked(): void;
}

interface ItemRow {
  id: number;
  text: string;
  amount: string | null;
  added_by: string;
  checked_at: number | null;
}

const COLUMNS = 'id, text, amount, added_by, checked_at';

const toItem = (row: ItemRow): Item => ({
  id: row.id,
  text: row.text,
  amount: row.amount,
  addedBy: row.added_by,
  checked: row.checked_at !== null,
});

export const itemRepository = (db: Storage): ItemRepository => {
  const selectAll = db.prepare<[], ItemRow>(
    `SELECT ${COLUMNS} FROM shopping_list_items ORDER BY created_at, id`,
  );

  const selectOne = db.prepare<[number], ItemRow>(
    `SELECT ${COLUMNS} FROM shopping_list_items WHERE id = ?`,
  );

  const insertItem = db.prepare(
    'INSERT INTO shopping_list_items (text, amount, added_by, created_at) VALUES (?, ?, ?, ?)',
  );

  // Checking a checked item keeps the time it was first checked.
  const checkItem = db.prepare(
    'UPDATE shopping_list_items SET checked_at = COALESCE(checked_at, ?) WHERE id = ?',
  );

  const uncheckItem = db.prepare('UPDATE shopping_list_items SET checked_at = NULL WHERE id = ?');
  const deleteItem = db.prepare('DELETE FROM shopping_list_items WHERE id = ?');
  const deleteChecked = db.prepare('DELETE FROM shopping_list_items WHERE checked_at IS NOT NULL');

  const list = (): Item[] => selectAll.all().map(toItem);

  const find = (id: number): Item | undefined => {
    const row = selectOne.get(id);
    return row === undefined ? undefined : toItem(row);
  };

  const insert = ({ text, amount, addedBy, createdAt }: ItemRecord): number =>
    Number(insertItem.run(text, amount, addedBy, createdAt).lastInsertRowid);

  const check = (id: number, now: number): boolean => checkItem.run(now, id).changes > 0;
  const uncheck = (id: number): boolean => uncheckItem.run(id).changes > 0;

  const remove = (id: number): void => {
    deleteItem.run(id);
  };

  const removeChecked = (): void => {
    deleteChecked.run();
  };

  return {
    list,
    find,
    insert,
    check,
    uncheck,
    remove,
    removeChecked,
  };
};
