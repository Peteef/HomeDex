import { Plus } from 'lucide-react';
import { useText } from '../../../lib/i18n/index.ts';

export interface AddTileButtonProps {
  onAdd: () => void;
}

export const AddTileButton = ({ onAdd }: AddTileButtonProps) => {
  const text = useText('home.tileList');

  return (
    <button
      type="button"
      onClick={onAdd}
      className="border-dex-field-border text-dex-ink-muted hover:text-dex-ink focus-visible:outline-dex-ink flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white/50 p-3 transition-colors hover:bg-white/80 focus-visible:outline-3 focus-visible:outline-offset-2"
    >
      <Plus size={40} aria-hidden />
      <span className="text-base font-extrabold">{text.addTile}</span>
    </button>
  );
};
