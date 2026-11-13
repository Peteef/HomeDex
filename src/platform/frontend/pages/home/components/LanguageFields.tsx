import { X } from 'lucide-react';
import {
  MAX_TILE_DESCRIPTION_LENGTH,
  MAX_TILE_TITLE_LENGTH,
} from '../../../../shared/tiles/linkTileRules.ts';
import { IconButton } from '../../../components/icon-button/IconButton.tsx';
import { TextInput } from '../../../components/text-input/TextInput.tsx';
import { useText } from '../../../lib/i18n/index.ts';
import type { LanguageText, TitleError } from '../types.ts';

export interface LanguageFieldsProps {
  text: LanguageText;
  flag: string;
  error?: TitleError;
  removable: boolean;
  onChange: (text: LanguageText) => void;
  onRemove: () => void;
}

export const LanguageFields = ({
  text,
  flag,
  error,
  removable,
  onChange,
  onRemove,
}: LanguageFieldsProps) => {
  const messages = useText('home.tileForm');
  const code = text.language.toUpperCase();

  return (
    <fieldset className="border-dex-line relative flex flex-col gap-3 rounded-2xl border bg-white/60 p-3">
      <legend className="sr-only">{`${flag} ${code}`}</legend>
      <p aria-hidden className="flex min-h-11 items-center px-2 text-sm font-extrabold">
        {`${flag} ${code}`}
      </p>
      {removable ? (
        <IconButton
          className="absolute top-3 right-3"
          icon={<X size={20} />}
          label={messages.removeLanguage({ language: code })}
          onClick={onRemove}
        />
      ) : null}
      <TextInput
        label={messages.title}
        lang={text.language}
        maxLength={MAX_TILE_TITLE_LENGTH}
        value={text.title}
        {...(error ? { error: messages.errors[error] } : {})}
        onChange={(event) => {
          onChange({ ...text, title: event.target.value });
        }}
      />
      <TextInput
        label={messages.description}
        lang={text.language}
        maxLength={MAX_TILE_DESCRIPTION_LENGTH}
        value={text.description}
        onChange={(event) => {
          onChange({ ...text, description: event.target.value });
        }}
      />
    </fieldset>
  );
};
