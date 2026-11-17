import { Button } from '#platform/frontend';
import type { Item } from '../../../features/items/index.ts';
import { useText } from '../../../locales/index.ts';
import { ItemRow } from './ItemRow.tsx';

export interface ItemListProps {
  items: Item[];
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
  onClearChecked: () => void;
}

const HEADING_CLASSES = 'text-dex-ink-muted text-xs font-extrabold tracking-[0.2em] uppercase';
const MESSAGE_CLASSES = 'text-dex-ink-muted py-4 text-center text-base font-bold';

export const ItemList = ({ items, onToggle, onDelete, onClearChecked }: ItemListProps) => {
  const text = useText('list');
  const toBuy = items.filter((item) => !item.checked);
  const inCart = items.filter((item) => item.checked);

  const row = (item: Item) => (
    <ItemRow
      key={item.id}
      text={item.text}
      amount={item.amount}
      addedBy={item.addedBy}
      checked={item.checked}
      onToggle={() => {
        onToggle(item);
      }}
      onDelete={() => {
        onDelete(item);
      }}
    />
  );

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
          <ul className="flex flex-col gap-2">{toBuy.map(row)}</ul>
        )}
      </section>
      {inCart.length === 0 ? null : (
        <section className="flex flex-col gap-2" aria-labelledby="in-cart">
          <div className="flex items-center justify-between gap-3">
            <h2 id="in-cart" className={HEADING_CLASSES}>
              {text.inCart}
            </h2>
            <Button variant="quiet" onClick={onClearChecked}>
              {text.clear}
            </Button>
          </div>
          <ul className="flex flex-col gap-2">{inCart.map(row)}</ul>
        </section>
      )}
    </>
  );
};
