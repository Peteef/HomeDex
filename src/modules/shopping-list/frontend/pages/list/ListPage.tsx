import { LoadFailed, LoadingStatus, ModulePage } from '#platform/frontend';
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

  const retry = (): void => {
    void items.refetch();
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
      return <LoadFailed message={text.loadFailed} onRetry={retry} />;
    }

    return <LoadingStatus />;
  };

  return (
    <ModulePage title={text.title}>
      <AddItemForm adding={addItem.isPending} failed={addItem.isError} onAdd={add} />
      {renderContent()}
    </ModulePage>
  );
};
