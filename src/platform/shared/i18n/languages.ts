// The languages HomeDex supports. The backend stores tile text per language, the frontend shows
// its UI in them. Adding one also needs its locale files (see the locale test).
export const LANGUAGE_CODES = ['en', 'pl'] as const;

export type Language = (typeof LANGUAGE_CODES)[number];

export const SOURCE_LANGUAGE: Language = 'en';

export const isLanguage = (value: string): value is Language =>
  (LANGUAGE_CODES as readonly string[]).includes(value);
