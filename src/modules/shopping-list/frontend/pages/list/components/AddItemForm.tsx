import { Button, TextInput } from '#platform/frontend';
import { useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useText } from '../../../locales/index.ts';

const TEXT_MAX_LENGTH = 100;
const AMOUNT_MAX_LENGTH = 30;

export interface ItemInput {
  text: string;
  amount?: string;
}

export interface AddItemFormProps {
  adding: boolean;
  failed: boolean;
  // onAdded clears the form, only once the item is saved, so a failed add keeps what was typed.
  onAdd: (item: ItemInput, onAdded: () => void) => void;
}

export const AddItemForm = ({ adding, failed, onAdd }: AddItemFormProps) => {
  const text = useText('list.addItemForm');
  const [itemText, setItemText] = useState('');
  const [amount, setAmount] = useState('');
  const itemRef = useRef<HTMLInputElement>(null);

  const clear = (): void => {
    setItemText('');
    setAmount('');
    itemRef.current?.focus();
  };

  const submit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (itemText.trim() === '') {
      return;
    }

    onAdd({ text: itemText, ...(amount.trim() === '' ? {} : { amount }) }, clear);
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={submit}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextInput
            ref={itemRef}
            label={text.item}
            placeholder={text.itemPlaceholder}
            maxLength={TEXT_MAX_LENGTH}
            enterKeyHint="done"
            value={itemText}
            onChange={(event) => {
              setItemText(event.target.value);
            }}
          />
        </div>
        <div className="sm:w-40">
          <TextInput
            label={text.amount}
            placeholder={text.amountPlaceholder}
            maxLength={AMOUNT_MAX_LENGTH}
            enterKeyHint="done"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
            }}
          />
        </div>
        <Button type="submit" disabled={adding}>
          {text.add}
        </Button>
      </div>
      {failed ? (
        <p role="alert" className="text-dex-red-deep px-5 text-sm font-bold">
          {text.failed}
        </p>
      ) : null}
    </form>
  );
};
