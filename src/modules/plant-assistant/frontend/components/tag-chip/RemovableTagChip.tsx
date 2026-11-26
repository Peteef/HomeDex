import { X } from 'lucide-react';
import { useText } from '../../locales/index.ts';
import { CHIP_CLASSES, FOCUS_CLASSES } from './tagChipClasses.ts';

export interface RemovableTagChipProps {
  tag: string;
  onRemove: (tag: string) => void;
}

const REMOVE_CLASSES = `text-dex-ink hover:bg-dex-paper inline-flex size-11 shrink-0 items-center justify-center rounded-full ${FOCUS_CLASSES}`;

export const RemovableTagChip = ({ tag, onRemove }: RemovableTagChipProps) => {
  const text = useText('components.tagChip');

  const remove = (): void => {
    onRemove(tag);
  };

  return (
    <span className={`${CHIP_CLASSES} inline-flex max-w-full items-center pl-3 text-sm`}>
      <span className="min-w-0">{tag}</span>
      <button
        type="button"
        aria-label={text.remove({ tag })}
        onClick={remove}
        className={REMOVE_CLASSES}
      >
        <X size={16} aria-hidden />
      </button>
    </span>
  );
};
