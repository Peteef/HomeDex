import { LANGUAGE_CODES } from '../../../shared/i18n/languages.ts';
import type { Language } from '../../../shared/i18n/languages.ts';

export { isLanguage, SOURCE_LANGUAGE } from '../../../shared/i18n/languages.ts';
export type { Language } from '../../../shared/i18n/languages.ts';

// The switcher shows a flag and the code ("🇵🇱 PL"), the same in every language.
const FLAGS: Record<Language, string> = {
  en: '🇬🇧',
  pl: '🇵🇱',
};

export const LANGUAGES = LANGUAGE_CODES.map((code) => ({
  code,
  flag: FLAGS[code],
}));

// The language this device picked, read by the language detector in i18n.ts.
export const LANGUAGE_STORAGE_KEY = 'homedex.language';
