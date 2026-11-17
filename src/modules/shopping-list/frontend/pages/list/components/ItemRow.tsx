import { IconButton } from '#platform/frontend';
import { Check, Trash2 } from 'lucide-react';
import type { Item } from '../../../features/items/index.ts';
import { useText } from '../../../locales/index.ts';

export interface ItemRowProps {
  item: Item;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export const ItemRow = ({ item, onToggle, onDelete }: ItemRowProps) => {
  const messages = useText('list.itemRow');
  const { text, amount, addedBy, checked } = item;

  const toggle = () => {
    onToggle(item);
  };

  const remove = () => {
    onDelete(item);
  };

  // The input is visually hidden and the box drawn next to it, so the whole row is the touch
  // target instead of a small native checkbox.
  return (
    <li className="flex items-center gap-2 rounded-2xl bg-white/80 py-1 pr-1 pl-4">
      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={toggle} />
        <span
          aria-hidden
          className="border-dex-field-border peer-checked:bg-dex-red peer-checked:border-dex-red peer-focus-visible:outline-dex-ink flex size-7 shrink-0 items-center justify-center rounded-lg border-2 bg-white text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2"
        >
          {checked ? <Check size={18} strokeWidth={3} /> : null}
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={
              checked
                ? 'text-dex-ink-muted text-base font-bold break-words line-through'
                : 'text-dex-ink text-base font-bold break-words'
            }
          >
            {text}
            {amount === null ? null : (
              <span className="text-dex-ink-muted font-semibold"> · {amount}</span>
            )}
          </span>
          <span className="text-dex-ink-muted text-xs">
            {messages.addedBy({ username: addedBy })}
          </span>
        </span>
      </label>
      <IconButton
        icon={<Trash2 size={18} />}
        label={messages.delete({ item: text })}
        onClick={remove}
      />
    </li>
  );
};
