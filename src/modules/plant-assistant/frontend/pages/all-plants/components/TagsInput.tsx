import { Button, TextInput } from '#platform/frontend';
import { useId } from 'react';
import type { KeyboardEvent } from 'react';
import { TagChip } from '../../../components/tag-chip/TagChip.tsx';
import { useText } from '../../../locales/index.ts';
import { TAG_MAX_LENGTH } from '../internal/plantForm.ts';
import type { TagNote } from '../types.ts';

export interface TagsInputProps {
  tags: string[];
  draft: string;
  note: TagNote | null;
  suggestions: string[];
  onDraftChange: (draft: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
}

const ENTER = 'Enter';

export const TagsInput = ({
  tags,
  draft,
  note,
  suggestions,
  onDraftChange,
  onAdd,
  onRemove,
}: TagsInputProps) => {
  const text = useText('allPlants.tagsInput');
  const suggestionsId = useId();

  // Enter adds the tag instead of submitting the whole form.
  const addOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === ENTER) {
      event.preventDefault();
      onAdd();
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-dex-ink-muted mb-1 px-5 text-sm font-bold">{text.label}</legend>
      {tags.length === 0 ? null : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag} className="max-w-full">
              <TagChip tag={tag} onRemove={onRemove} />
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextInput
            label={text.newTag}
            hideLabel
            placeholder={text.newTag}
            list={suggestionsId}
            maxLength={TAG_MAX_LENGTH}
            enterKeyHint="enter"
            value={draft}
            onChange={(event) => {
              onDraftChange(event.target.value);
            }}
            onKeyDown={addOnEnter}
          />
        </div>
        <Button variant="secondary" onClick={onAdd}>
          {text.add}
        </Button>
      </div>
      <datalist id={suggestionsId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      <p role="status" className="text-dex-ink-muted px-5 text-sm font-bold">
        {note === null ? null : text.notes[note]}
      </p>
    </fieldset>
  );
};
