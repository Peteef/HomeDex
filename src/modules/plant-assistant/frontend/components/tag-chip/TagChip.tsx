import { CHIP_CLASSES } from './tagChipClasses.ts';

export interface TagChipProps {
  tag: string;
}

export const TagChip = ({ tag }: TagChipProps) => (
  <span className={`${CHIP_CLASSES} px-2 py-0.5 text-xs`}>{tag}</span>
);
