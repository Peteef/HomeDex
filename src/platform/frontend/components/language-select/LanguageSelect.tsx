import { Globe } from 'lucide-react';
import { useText } from '../../lib/i18n/index.ts';

export interface LanguageOption<Code extends string> {
  code: Code;
  name: string;
}

export interface LanguageSelectProps<Code extends string> {
  languages: readonly LanguageOption<Code>[];
  value: Code;
  onChange: (language: Code) => void;
}

// A native select, so every language fits and phones open their own picker. It is invisible over
// the globe and the language code, which show the choice.
export const LanguageSelect = <Code extends string>({
  languages,
  value,
  onChange,
}: LanguageSelectProps<Code>) => {
  const text = useText('components.languageSelect');

  return (
    <div className="border-dex-line text-dex-ink has-focus-visible:outline-dex-ink relative inline-flex h-11 items-center gap-1.5 rounded-full border bg-white/90 px-3 text-sm font-extrabold uppercase transition-colors hover:bg-white has-focus-visible:outline-3 has-focus-visible:outline-offset-2">
      <Globe size={20} aria-hidden />
      <span aria-hidden>{value}</span>
      <select
        aria-label={text.label}
        value={value}
        onChange={(event) => {
          const picked = languages.find(({ code }) => code === event.target.value);

          if (picked) {
            onChange(picked.code);
          }
        }}
        className="absolute -inset-px cursor-pointer rounded-full opacity-0"
      >
        {languages.map(({ code, name }) => (
          <option key={code} value={code} lang={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};
