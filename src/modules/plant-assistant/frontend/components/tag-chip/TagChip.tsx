export interface TagChipProps {
  tag: string;
}

export const TagChip = ({ tag }: TagChipProps) => (
  <span className="bg-dex-surface text-dex-ink-muted border-dex-line rounded-full border px-2 py-0.5 text-xs font-bold break-words">
    {tag}
  </span>
);
