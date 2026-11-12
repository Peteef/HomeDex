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

  // The label's content comes in as expressions: jsx-a11y's label rule crashes on an element
  // written directly inside <label> with the minimatch version package.json overrides.
  const option = (scope: TileScope) => {
    const radio = (
      <input
        type="radio"
        name={name}
        className="peer sr-only"
        checked={scope === value}
        onChange={() => {
          onChange(scope);
        }}
      />
    );

    const caption = (
      <span className="border-dex-field-border text-dex-ink peer-checked:bg-dex-red peer-checked:border-dex-red peer-focus-visible:outline-dex-ink flex min-h-11 items-center justify-center rounded-full border bg-white px-4 text-base font-bold peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2">
        {messages[scope]}
      </span>
    );

    return (
      <label key={scope} className="flex-1 cursor-pointer">
        {radio}
        {caption}
      </label>
    );
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-dex-ink-muted mb-2 px-5 text-sm font-bold">{messages.label}</legend>
      <div className="flex gap-2">{SCOPES.map(option)}</div>
    </fieldset>
  );
};
