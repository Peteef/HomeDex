import { Dialog } from '../../../components/dialog/Dialog.tsx';
import { useText } from '../../../lib/i18n/index.ts';
import { TileForm } from './TileForm.tsx';
import type { TileFormProps } from './TileForm.tsx';

export type TileDialogProps = TileFormProps & {
  open: boolean;
  mode: 'add' | 'edit';
  onClose: () => void;
};

export const TileDialog = ({ open, mode, onClose, ...form }: TileDialogProps) => {
  const text = useText('home.tileDialog');

  return (
    <Dialog open={open} title={mode === 'add' ? text.addTitle : text.editTitle} onClose={onClose}>
      <TileForm {...form} />
    </Dialog>
  );
};
