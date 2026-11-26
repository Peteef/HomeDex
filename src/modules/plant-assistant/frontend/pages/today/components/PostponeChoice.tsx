import { Button, TextInput } from '#platform/frontend';
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useText } from '../../../locales/index.ts';
import {
  MAX_POSTPONE_DAYS,
  isPostponeDays,
  MIN_POSTPONE_DAYS,
  QUICK_POSTPONE_DAYS,
} from '../internal/postponeDays.ts';

export interface PostponeChoiceProps {
  postponing: boolean;
  failed: boolean;
  onPostpone: (days: number) => void;
}

export const PostponeChoice = ({ postponing, failed, onPostpone }: PostponeChoiceProps) => {
  const text = useText('today.postponeChoice');
  const [otherDays, setOtherDays] = useState('');
  const [invalid, setInvalid] = useState(false);

  const postponeByOther = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const days = Number(otherDays);
    const valid = isPostponeDays(days);
    setInvalid(!valid);

    if (valid) {
      onPostpone(days);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={text.quick} className="grid grid-cols-3 gap-2">
        {QUICK_POSTPONE_DAYS.map((days) => (
          <Button
            key={days}
            variant="secondary"
            disabled={postponing}
            onClick={() => {
              onPostpone(days);
            }}
          >
            {text.days({ count: days })}
          </Button>
        ))}
      </div>
      <form noValidate className="flex items-start gap-2" onSubmit={postponeByOther}>
        <div className="min-w-0 flex-1">
          <TextInput
            label={text.other}
            type="number"
            inputMode="numeric"
            min={MIN_POSTPONE_DAYS}
            max={MAX_POSTPONE_DAYS}
            step={1}
            value={otherDays}
            {...(invalid ? { error: text.invalid } : {})}
            onChange={(event) => {
              setOtherDays(event.target.value);
            }}
          />
        </div>
        <Button type="submit" className="mt-6" disabled={postponing}>
          {text.postpone}
        </Button>
      </form>
      {failed && (
        <p role="alert" className="text-dex-red-text px-5 text-base font-bold">
          {text.failed}
        </p>
      )}
    </div>
  );
};
