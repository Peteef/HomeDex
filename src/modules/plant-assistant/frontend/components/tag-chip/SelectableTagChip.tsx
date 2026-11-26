import { useText } from '../../locales/index.ts';
import { CHIP_CLASSES, FOCUS_CLASSES } from './tagChipClasses.ts';

export interface SelectableTagChipProps {
  tag: string;
  onSelect: (tag: string) => void;
}

// The touch target is 44 pt tall; the chip inside it keeps the size of a plain one.
const SELECT_CLASSES = `group ${FOCUS_CLASSES} inline-flex min-h-11 max-w-full min-w-11 items-center justify-center rounded-full text-left`;

const CHIP_IN_BUTTON_CLASSES = `${CHIP_CLASSES} group-hover:text-dex-ink group-hover:border-dex-field-border px-2 py-0.5 text-xs transition-colors`;

export const SelectableTagChip = ({ tag, onSelect }: SelectableTagChipProps) => {
  const text = useText('components.tagChip');

  const select = (): void => {
    onSelect(tag);
  };

  return (
    <button
      type="button"
      aria-label={text.select({ tag })}
      onClick={select}
      className={SELECT_CLASSES}
    >
      <span className={CHIP_IN_BUTTON_CLASSES}>{tag}</span>
    </button>
  );
};
