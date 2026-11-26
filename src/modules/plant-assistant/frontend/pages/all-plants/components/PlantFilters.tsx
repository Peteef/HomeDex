import { IconButton, TextInput } from '#platform/frontend';
import { X } from 'lucide-react';
import { TagChip } from '../../../components/tag-chip/TagChip.tsx';
import { useText } from '../../../locales/index.ts';

export interface PlantFiltersProps {
  query: string;
  tag: string | null;
  onQueryChange: (query: string) => void;
  onClearTag: () => void;
}

export const PlantFilters = ({ query, tag, onQueryChange, onClearTag }: PlantFiltersProps) => {
  const text = useText('allPlants.plantFilters');

  return (
    <div className="flex flex-col gap-2">
      <TextInput
        type="search"
        label={text.search}
        hideLabel
        placeholder={text.search}
        enterKeyHint="search"
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
      />
      {tag !== null && (
        <div className="flex items-center gap-2 px-2">
          <span className="text-dex-ink-muted text-sm font-bold">{text.tag}</span>
          <TagChip tag={tag} />
          <IconButton
            icon={<X size={18} aria-hidden />}
            label={text.clearTag}
            onClick={onClearTag}
          />
        </div>
      )}
    </div>
  );
};
