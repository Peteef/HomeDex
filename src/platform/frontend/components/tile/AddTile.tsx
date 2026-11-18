import { Plus } from 'lucide-react';
import { useText } from '../../lib/i18n/index.ts';

export interface AddTileProps {
  onAdd: () => void;
}

export const AddTile = ({ onAdd }: AddTileProps) => {
  const text = useText('components.tile');

  return (
    <button
      type="button"
      onClick={onAdd}
      className="border-dex-field-border text-dex-ink-muted hover:text-dex-ink focus-visible:outline-dex-ink active:border-dex-red active:text-dex-red-text bg-dex-surface/50 hover:bg-dex-surface/80 active:bg-dex-surface flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-[color,background-color,border-color,scale] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 motion-safe:active:scale-97"
    >
      <Plus size={40} aria-hidden />
      <span className="text-base font-extrabold">{text.add}</span>
    </button>
  );
};
