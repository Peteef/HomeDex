import { Plus } from 'lucide-react';
import type { SubmitEvent } from 'react';
import { TILE_URL_MAX_LENGTH } from '../../../../shared/tiles/linkTileRules.ts';
import type { IconName } from '../../../../shared/icons/iconNames.ts';
import { Button } from '../../../components/button/Button.tsx';
import { TextInput } from '../../../components/text-input/TextInput.tsx';
import type { TileScope } from '../../../features/tiles/index.ts';
import { useText } from '../../../lib/i18n/index.ts';
import type { Language } from '../../../lib/i18n/index.ts';
import type { LanguageText, SaveFailure, TileFormErrors, TileFormValues } from '../types.ts';
import { DeleteTile } from './DeleteTile.tsx';
import { IconPicker } from './IconPicker.tsx';
import { LanguageFields } from './LanguageFields.tsx';
import { ScopeChoice } from './ScopeChoice.tsx';

export interface TileFormProps {
  values: TileFormValues;
  errors: TileFormErrors;
  flags: Record<Language, string>;
  missingLanguages: Language[];
  scopeLocked: boolean;
  saving: boolean;
  failure?: SaveFailure;
  onTextChange: (text: LanguageText) => void;
  onAddLanguage: (language: Language) => void;
  onRemoveLanguage: (language: Language) => void;
  onUrlChange: (url: string) => void;
  onIconChange: (icon: IconName) => void;
  onScopeChange: (scope: TileScope) => void;
  onSubmit: () => void;
  deletion?: {
    title: string;
    deleting: boolean;
    onDelete: () => void;
  };
}

export const TileForm = ({
  values,
  errors,
  flags,
  missingLanguages,
  scopeLocked,
  saving,
  failure,
  onTextChange,
  onAddLanguage,
  onRemoveLanguage,
  onUrlChange,
  onIconChange,
  onScopeChange,
  onSubmit,
  deletion,
}: TileFormProps) => {
  const messages = useText('home.tileForm');

  const submit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={submit}>
      {values.texts.map((text) => (
        <LanguageFields
          key={text.language}
          text={text}
          flag={flags[text.language]}
          removable={values.texts.length > 1}
          {...(errors.titles[text.language] ? { error: errors.titles[text.language] } : {})}
          onChange={onTextChange}
          onRemove={() => {
            onRemoveLanguage(text.language);
          }}
        />
      ))}
      {missingLanguages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {missingLanguages.map((language) => (
            <Button
              key={language}
              variant="secondary"
              onClick={() => {
                onAddLanguage(language);
              }}
            >
              <Plus size={18} aria-hidden />
              <span aria-hidden>{flags[language]}</span>
              {messages.addLanguage({ language: language.toUpperCase() })}
            </Button>
          ))}
        </div>
      ) : null}
      <TextInput
        label={messages.url}
        type="url"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={messages.urlPlaceholder}
        maxLength={TILE_URL_MAX_LENGTH}
        value={values.url}
        {...(errors.url ? { error: messages.errors[errors.url] } : {})}
        onChange={(event) => {
          onUrlChange(event.target.value);
        }}
      />
      <IconPicker value={values.icon} onChange={onIconChange} />
      <ScopeChoice value={values.scope} locked={scopeLocked} onChange={onScopeChange} />
      {failure ? (
        <p role="alert" className="text-dex-red-deep px-5 text-base font-bold">
          {messages.errors[failure]}
        </p>
      ) : null}
      <Button type="submit" disabled={saving}>
        {saving ? messages.saving : messages.save}
      </Button>
      {deletion ? <DeleteTile {...deletion} /> : null}
    </form>
  );
};
