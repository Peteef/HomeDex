import { Button, Panel } from '#platform/frontend';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import {
  useAddItem,
  useClearCheckedItems,
  useDeleteItem,
  useItems,
  useToggleCheck,
} from '../../features/items/index.ts';
import type { Item } from '../../features/items/index.ts';
import { useText } from '../../locales/index.ts';
import { AddItemForm } from './components/AddItemForm.tsx';
import type { ItemInput } from './components/AddItemForm.tsx';
import { ItemList } from './components/ItemList.tsx';

const HOME_PATH = '/';
const MESSAGE_CLASSES = 'text-dex-ink-muted py-4 text-center text-base font-bold';

export const ListPage = () => {
  const text = useText('list');
  const items = useItems();
  const addItem = useAddItem();
  const toggleCheck = useToggleCheck();
  const deleteItem = useDeleteItem();
  const clearCheckedItems = useClearCheckedItems();

  const add = (item: ItemInput, onAdded: () => void): void => {
    addItem.mutate(item, { onSuccess: onAdded });
  };

  const toggle = (item: Item): void => {
    toggleCheck.mutate({ id: item.id, checked: !item.checked });
  };

  const remove = (item: Item): void => {
    deleteItem.mutate(item.id);
  };

  const clearChecked = (): void => {
    clearCheckedItems.mutate();
  };

  const renderContent = () => {
    if (items.data !== undefined) {
      return (
        <ItemList
          items={items.data}
          onToggle={toggle}
          onDelete={remove}
          onClearChecked={clearChecked}
        />
      );
    }

    if (items.isError) {
      return (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-dex-red-text text-base font-bold">
            {text.loadFailed}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              void items.refetch();
            }}
          >
            {text.tryAgain}
          </Button>
        </div>
      );
    }

    return (
      <p role="status" className={MESSAGE_CLASSES}>
        {text.loading}
      </p>
    );
  };

  return (
    <Panel className="flex flex-col gap-4">
      <Link
        to={HOME_PATH}
        className="text-dex-ink-muted hover:text-dex-ink focus-visible:outline-dex-ink inline-flex min-h-11 items-center gap-2 self-start rounded-full text-sm font-bold focus-visible:outline-3 focus-visible:outline-offset-2"
      >
        <ArrowLeft size={18} aria-hidden />
        {text.back}
      </Link>
      <h1 className="text-3xl font-extrabold">{text.title}</h1>
      <AddItemForm adding={addItem.isPending} failed={addItem.isError} onAdd={add} />
      {renderContent()}
    </Panel>
  );
};
