import { X } from 'lucide-react';
import { useText } from '../../locales/index.ts';

export interface TagChipProps {
  tag: string;
  onRemove?: (tag: string) => void;
}

const CHIP_CLASSES =
  'bg-dex-surface text-dex-ink-muted border-dex-line rounded-full border font-bold break-words';

const REMOVE_CLASSES =
  'text-dex-ink hover:bg-dex-paper focus-visible:outline-dex-ink inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-3 focus-visible:outline-offset-2';

export const TagChip = ({ tag, onRemove }: TagChipProps) => {
  const text = useText('components.tagChip');

  if (onRemove === undefined) {
    return <span className={`${CHIP_CLASSES} px-2 py-0.5 text-xs`}>{tag}</span>;
  }

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
