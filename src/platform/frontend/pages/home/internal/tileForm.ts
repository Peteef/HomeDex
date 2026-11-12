import { isIconName } from '../../../../shared/icons/iconNames.ts';
import { isWebUrl } from '../../../../shared/tiles/linkTileRules.ts';
import type { Tile, TileDraft, TileTexts } from '../../../features/tiles/index.ts';
import { LANGUAGES } from '../../../lib/i18n/index.ts';
import type { Language } from '../../../lib/i18n/index.ts';
import type { LanguageText, TileFormErrors, TileFormValues } from '../types.ts';

const DEFAULT_ICON = 'link';
const DEFAULT_SCOPE = 'personal';

const emptyText = (language: Language): LanguageText => ({
  language,
  title: '',
  description: '',
});

const languageOrder = (language: Language): Language[] => [
  language,
  ...LANGUAGES.map(({ code }) => code).filter((code) => code !== language),
];

const isBlank = (text: string): boolean => text.trim() === '';

const isEmpty = ({ title, description }: LanguageText): boolean =>
  isBlank(title) && isBlank(description);

export const newTileValues = (language: Language): TileFormValues => ({
  texts: [emptyText(language)],
  url: '',
  icon: DEFAULT_ICON,
  scope: DEFAULT_SCOPE,
});

const textsOf = (texts: TileTexts, language: Language): LanguageText[] =>
  languageOrder(language).flatMap((code) => {
    const text = texts[code];

    return text === undefined
      ? []
      : [
          {
            language: code,
            title: text.title,
            description: text.description ?? '',
          },
        ];
  });

export const tileValues = (tile: Tile, language: Language): TileFormValues => ({
  texts: textsOf(tile.texts, language),
  url: tile.url ?? '',
  icon: isIconName(tile.icon) ? tile.icon : DEFAULT_ICON,
  scope: tile.scope,
});

export const missingLanguages = ({ texts }: TileFormValues): Language[] =>
  LANGUAGES.map(({ code }) => code).filter((code) => !texts.some((text) => text.language === code));

export const withLanguage = (values: TileFormValues, language: Language): TileFormValues => ({
  ...values,
  texts: [...values.texts, emptyText(language)],
});

export const withoutLanguage = (values: TileFormValues, language: Language): TileFormValues =>
  values.texts.length > 1
    ? { ...values, texts: values.texts.filter((text) => text.language !== language) }
    : values;

export const withText = (values: TileFormValues, changed: LanguageText): TileFormValues => ({
  ...values,
  texts: values.texts.map((text) => (text.language === changed.language ? changed : text)),
});

const titleErrors = (texts: LanguageText[]): TileFormErrors['titles'] => {
  const [first] = texts;

  if (first !== undefined && texts.every(isEmpty)) {
    return { [first.language]: 'titleRequired' };
  }

  return Object.fromEntries(
    texts
      .filter((text) => !isEmpty(text) && isBlank(text.title))
      .map(({ language }) => [language, 'titleRequired']),
  );
};

const urlError = (url: string): TileFormErrors['url'] => {
  if (isBlank(url)) {
    return 'urlRequired';
  }

  return isWebUrl(url.trim()) ? undefined : 'urlInvalid';
};

export const validateTile = ({ texts, url }: TileFormValues): TileFormErrors => {
  const titles = titleErrors(texts);
  const problem = urlError(url);
  return problem === undefined ? { titles } : { titles, url: problem };
};

export const hasErrors = ({ titles, url }: TileFormErrors): boolean =>
  url !== undefined || Object.keys(titles).length > 0;

const toTexts = (texts: LanguageText[]): TileTexts =>
  Object.fromEntries(
    texts
      .filter((text) => !isEmpty(text))
      .map(({ language, title, description }) => [
        language,
        {
          title: title.trim(),
          description: isBlank(description) ? null : description.trim(),
        },
      ]),
  );

export const toDraft = ({ texts, url, icon, scope }: TileFormValues): TileDraft => ({
  texts: toTexts(texts),
  url: url.trim(),
  icon,
  scope,
});
