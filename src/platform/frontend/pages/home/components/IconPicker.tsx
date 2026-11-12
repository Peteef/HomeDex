import { useId } from 'react';
import { ICON_NAMES } from '../../../../shared/icons/iconNames.ts';
import type { IconName } from '../../../../shared/icons/iconNames.ts';
import { Icon } from '../../../components/icon/Icon.tsx';
import { useText } from '../../../lib/i18n/index.ts';

export interface IconPickerProps {
  value: IconName;
  onChange: (icon: IconName) => void;
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const messages = useText('home.tileForm');
  const name = useId();

  // The label's content comes in as expressions: jsx-a11y's label rule crashes on an element
  // written directly inside <label> with the minimatch version package.json overrides.
  const option = (icon: IconName) => {
    const radio = (
      <input
        type="radio"
        name={name}
        className="peer sr-only"
        checked={icon === value}
        onChange={() => {
          onChange(icon);
        }}
      />
    );

    const picture = (
      <span className="border-dex-line text-dex-ink peer-checked:bg-dex-red peer-checked:border-dex-red peer-focus-visible:outline-dex-ink flex size-11 items-center justify-center rounded-full border bg-white peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2">
        <Icon name={icon} size={20} aria-hidden />
      </span>
    );

    const caption = <span className="sr-only">{messages.icons[icon]}</span>;

    return (
      <label key={icon} title={messages.icons[icon]} className="cursor-pointer">
        {radio}
        {picture}
        {caption}
      </label>
    );
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-dex-ink-muted mb-2 px-5 text-sm font-bold">{messages.icon}</legend>
      <div className="grid grid-cols-5 justify-items-center gap-2">{ICON_NAMES.map(option)}</div>
    </fieldset>
  );
};
