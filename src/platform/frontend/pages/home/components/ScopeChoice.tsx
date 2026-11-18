import { useId } from 'react';
import type { TileScope } from '../../../features/tiles/index.ts';
import { useText } from '../../../lib/i18n/index.ts';

export interface ScopeChoiceProps {
  value: TileScope;
  locked: boolean;
  onChange: (scope: TileScope) => void;
}

const SCOPES: TileScope[] = ['personal', 'shared'];

export const ScopeChoice = ({ value, locked, onChange }: ScopeChoiceProps) => {
  const messages = useText('home.tileForm.scope');
  const name = useId();

  if (locked) {
    return <p className="text-dex-ink-muted px-5 text-sm font-bold">{messages.sharedForGood}</p>;
  }

  const option = (scope: TileScope) => (
    <label key={scope} className="flex-1 cursor-pointer">
      <input
        type="radio"
        name={name}
        className="peer sr-only"
        checked={scope === value}
        onChange={() => {
          onChange(scope);
        }}
      />
      <span className="border-dex-field-border text-dex-ink peer-checked:bg-dex-red peer-checked:border-dex-red peer-focus-visible:outline-dex-ink bg-dex-surface flex min-h-11 items-center justify-center rounded-full border px-4 text-base font-bold peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2">
        {messages[scope]}
      </span>
    </label>
  );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-dex-ink-muted mb-2 px-5 text-sm font-bold">{messages.label}</legend>
      <div className="flex gap-2">{SCOPES.map(option)}</div>
    </fieldset>
  );
};
