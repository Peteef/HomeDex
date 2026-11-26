import { Button } from '#platform/frontend';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import type { ChangeEvent } from 'react';
import { PlantThumbnail } from '../../../components/plant-thumbnail/PlantThumbnail.tsx';
import { useText } from '../../../locales/index.ts';

export interface PhotoFieldProps {
  photoUrl: string | null;
  unreadable: boolean;
  onChoose: (file: File) => void;
  onRemove: () => void;
}

const CHOOSE_CLASSES =
  'border-dex-field-border text-dex-ink bg-dex-surface/90 hover:bg-dex-surface focus-within:outline-dex-ink inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 text-base font-bold transition-colors focus-within:outline-3 focus-within:outline-offset-2';

// accept="image/*" lets iPhones offer the camera as well as the photo library.
export const PhotoField = ({ photoUrl, unreadable, onChoose, onRemove }: PhotoFieldProps) => {
  const text = useText('allPlants.photoField');
  const errorId = useId();

  const choose = (event: ChangeEvent<HTMLInputElement>): void => {
    const [file] = event.target.files ?? [];
    event.target.value = '';

    if (file !== undefined) {
      onChoose(file);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-dex-ink-muted mb-1 px-5 text-sm font-bold">{text.label}</legend>
      <PlantThumbnail photoUrl={photoUrl} size="large" />
      <div className="flex gap-2">
        <label className={CHOOSE_CLASSES}>
          <ImagePlus size={18} aria-hidden />
          {text.choose}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-describedby={unreadable ? errorId : undefined}
            onChange={choose}
          />
        </label>
        {photoUrl !== null && (
          <Button variant="secondary" className="flex-1" onClick={onRemove}>
            <Trash2 size={18} aria-hidden />
            {text.remove}
          </Button>
        )}
      </div>
      {unreadable && (
        <p id={errorId} role="alert" className="text-dex-red-text px-5 text-sm font-bold">
          {text.unreadable}
        </p>
      )}
    </fieldset>
  );
};
