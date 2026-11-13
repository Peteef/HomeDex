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
      className="border-dex-field-border text-dex-ink-muted hover:text-dex-ink focus-visible:outline-dex-ink active:border-dex-red active:text-dex-red-deep flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white/50 p-3 transition-[color,background-color,border-color,scale] duration-150 hover:bg-white/80 focus-visible:outline-3 focus-visible:outline-offset-2 active:bg-white motion-safe:active:scale-97"
    >
      <Plus size={40} aria-hidden />
      <span className="text-base font-extrabold">{text.add}</span>
    </button>
  );
};
