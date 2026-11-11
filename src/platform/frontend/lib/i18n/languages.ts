// Each language is named in itself, so anyone can find their own.
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const SOURCE_LANGUAGE: Language = 'en';

// The language this device picked, read by the language detector in i18n.ts.
export const LANGUAGE_STORAGE_KEY = 'homedex.language';
