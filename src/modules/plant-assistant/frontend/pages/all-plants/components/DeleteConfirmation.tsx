import { Button } from '#platform/frontend';
import { useText } from '../../../locales/index.ts';

export interface DeleteConfirmationProps {
  deleting: boolean;
  failed: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export const DeleteConfirmation = ({
  deleting,
  failed,
  onDelete,
  onCancel,
}: DeleteConfirmationProps) => {
  const text = useText('allPlants.deleteConfirmation');

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base">{text.warning}</p>
      {failed && (
        <p role="alert" className="text-dex-red-text text-base font-bold">
          {text.failed}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={deleting} onClick={onCancel}>
          {text.cancel}
        </Button>
        <Button className="flex-1" disabled={deleting} onClick={onDelete}>
          {deleting ? text.deleting : text.delete}
        </Button>
      </div>
    </div>
  );
};
