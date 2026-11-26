import { Button } from '#platform/frontend';
import { Pencil, Trash2 } from 'lucide-react';
import { useText } from '../../../locales/index.ts';

export interface PlantActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const PlantActions = ({ onEdit, onDelete }: PlantActionsProps) => {
  const text = useText('allPlants.plantActions');

  return (
    <div className="flex gap-2">
      <Button variant="secondary" className="flex-1" onClick={onEdit}>
        <Pencil size={18} aria-hidden />
        {text.edit}
      </Button>
      <Button variant="secondary" className="flex-1" onClick={onDelete}>
        <Trash2 size={18} aria-hidden />
        {text.delete}
      </Button>
    </div>
  );
};
