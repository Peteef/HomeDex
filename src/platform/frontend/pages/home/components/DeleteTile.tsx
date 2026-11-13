import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/button/Button.tsx';
import { useText } from '../../../lib/i18n/index.ts';

export interface DeleteTileProps {
  title: string;
  deleting: boolean;
  onDelete: () => void;
}

export const DeleteTile = ({ title, deleting, onDelete }: DeleteTileProps) => {
  const messages = useText('home.tileForm.delete');
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          setConfirming(true);
        }}
      >
        <Trash2 size={18} aria-hidden />
        {messages.start}
      </Button>
    );
  }

  return (
    <div className="border-dex-line flex flex-col gap-3 rounded-2xl border bg-white/60 p-3">
      <p className="text-base font-bold">{messages.question({ title })}</p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={deleting}
          onClick={() => {
            setConfirming(false);
          }}
        >
          {messages.cancel}
        </Button>
        <Button className="flex-1" disabled={deleting} onClick={onDelete}>
          {deleting ? messages.deleting : messages.confirm}
        </Button>
      </div>
    </div>
  );
};
