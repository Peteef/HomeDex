import { Sprout } from 'lucide-react';

export type ThumbnailSize = 'small' | 'large';

export interface PlantThumbnailProps {
  photoUrl: string | null;
  size: ThumbnailSize;
}

const PHOTO_CLASSES: Record<ThumbnailSize, string> = {
  small: 'size-12 rounded-xl',
  large: 'aspect-[4/3] w-full rounded-2xl',
};

// A large placeholder stays a low banner, so the plant's details stay in view without a photo.
const PLACEHOLDER_CLASSES: Record<ThumbnailSize, string> = {
  small: 'size-12 rounded-xl',
  large: 'h-28 w-full rounded-2xl',
};

const ICON_SIZES: Record<ThumbnailSize, number> = {
  small: 24,
  large: 56,
};

// The plant's name always sits next to it, so the picture has no text of its own.
export const PlantThumbnail = ({ photoUrl, size }: PlantThumbnailProps) =>
  photoUrl === null ? (
    <span
      className={`bg-dex-surface text-dex-ink-muted flex shrink-0 items-center justify-center ${PLACEHOLDER_CLASSES[size]}`}
    >
      <Sprout size={ICON_SIZES[size]} aria-hidden />
    </span>
  ) : (
    <img src={photoUrl} alt="" className={`shrink-0 object-cover ${PHOTO_CLASSES[size]}`} />
  );
