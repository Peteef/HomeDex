import { Button, Panel } from '#platform/frontend';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import {
  useAddItem,
  useClearChecked,
  useDeleteItem,
  useItems,
  useToggleCheck,
} from '../../features/items/index.ts';
import type { Item } from '../../features/items/index.ts';
import { useText } from '../../locales/index.ts';
import { AddItemForm } from './components/AddItemForm.tsx';
import type { ItemInput } from './components/AddItemForm.tsx';
import { ItemRow } from './components/ItemRow.tsx';

const HOME_PATH = '/';
const HEADING_CLASSES = 'text-dex-ink-muted text-xs font-extrabold tracking-[0.2em] uppercase';
const MESSAGE_CLASSES = 'text-dex-ink-muted py-4 text-center text-base font-bold';

export const ListPage = () => {
  const text = useText('list');
  const items = useItems();
  const addItem = useAddItem();
  const toggleCheck = useToggleCheck();
  const deleteItem = useDeleteItem();
  const clearChecked = useClearChecked();

  const add = (item: ItemInput, onAdded: () => void): void => {
    addItem.mutate(item, { onSuccess: onAdded });
  };

  const renderRows = (rows: Item[]) => (
    <ul className="flex flex-col gap-2">
      {rows.map((item) => (
        <ItemRow
          key={item.id}
          text={item.text}
          amount={item.amount}
          addedBy={item.addedBy}
          checked={item.checked}
          onToggle={() => {
            toggleCheck.mutate({ id: item.id, checked: !item.checked });
          }}
          onDelete={() => {
            deleteItem.mutate(item.id);
          }}
        />
      ))}
    </ul>
  );

  const renderList = (list: Item[]) => {
    const toBuy = list.filter((item) => !item.checked);
    const inCart = list.filter((item) => item.checked);

    return (
      <>
        <section className="flex flex-col gap-2" aria-labelledby="to-buy">
          <h2 id="to-buy" className={HEADING_CLASSES}>
            {text.toBuy}
          </h2>
          {toBuy.length === 0 ? (
            <p role="status" className={MESSAGE_CLASSES}>
              {text.empty}
            </p>
          ) : (
            renderRows(toBuy)
          )}
        </section>
        {inCart.length === 0 ? null : (
          <section className="flex flex-col gap-2" aria-labelledby="in-cart">
            <div className="flex items-center justify-between gap-3">
              <h2 id="in-cart" className={HEADING_CLASSES}>
                {text.inCart}
              </h2>
              <Button
                variant="quiet"
                onClick={() => {
                  clearChecked.mutate();
                }}
              >
                {text.clear}
              </Button>
            </div>
            {renderRows(inCart)}
          </section>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (items.data !== undefined) {
      return renderList(items.data);
    }

    if (items.isError) {
      return (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-dex-red-deep text-base font-bold">
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
