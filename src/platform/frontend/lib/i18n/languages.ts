// The switcher shows a flag and the code ("🇵🇱 PL"), the same in every language.
export const LANGUAGES = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'pl', flag: '🇵🇱' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const SOURCE_LANGUAGE: Language = 'en';

// The language this device picked, read by the language detector in i18n.ts.
export const LANGUAGE_STORAGE_KEY = 'homedex.language';
