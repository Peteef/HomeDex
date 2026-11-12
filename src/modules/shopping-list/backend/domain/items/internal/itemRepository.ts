import type { Storage } from '#platform/backend';
import type { Item } from '../types.ts';

export interface ItemRecord {
  text: string;
  amount: string | null;
  addedBy: string;
}

export interface ItemRepository {
  list(): Item[];
  find(id: number): Item | undefined;
  insert(item: ItemRecord): number;
  setChecked(id: number, checked: boolean): boolean;
  remove(id: number): void;
  removeChecked(): void;
}

interface ItemRow {
  id: number;
  text: string;
  amount: string | null;
  added_by: string;
  checked: number;
}

const COLUMNS = 'id, text, amount, added_by, checked';

const toItem = (row: ItemRow): Item => ({
  id: row.id,
  text: row.text,
  amount: row.amount,
  addedBy: row.added_by,
  checked: row.checked === 1,
});

export const itemRepository = (db: Storage): ItemRepository => {
  // The id is the rowid, so it grows with every item: ordering by it lists the oldest first.
  const selectAll = db.prepare<[], ItemRow>(
    `SELECT ${COLUMNS} FROM shopping_list_items ORDER BY id`,
  );

  const selectOne = db.prepare<[number], ItemRow>(
    `SELECT ${COLUMNS} FROM shopping_list_items WHERE id = ?`,
  );

  const insertItem = db.prepare(
    'INSERT INTO shopping_list_items (text, amount, added_by) VALUES (?, ?, ?)',
  );

  const updateChecked = db.prepare('UPDATE shopping_list_items SET checked = ? WHERE id = ?');
  const deleteItem = db.prepare('DELETE FROM shopping_list_items WHERE id = ?');
  const deleteChecked = db.prepare('DELETE FROM shopping_list_items WHERE checked = 1');

  const list = (): Item[] => selectAll.all().map(toItem);

  const find = (id: number): Item | undefined => {
    const row = selectOne.get(id);
    return row === undefined ? undefined : toItem(row);
  };

  const insert = ({ text, amount, addedBy }: ItemRecord): number =>
    Number(insertItem.run(text, amount, addedBy).lastInsertRowid);

  // SQLite counts a matched row as changed even when the value stays the same, so this answers
  // whether the item exists.
  const setChecked = (id: number, checked: boolean): boolean =>
    updateChecked.run(checked ? 1 : 0, id).changes > 0;

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
    setChecked,
    remove,
    removeChecked,
  };
};
