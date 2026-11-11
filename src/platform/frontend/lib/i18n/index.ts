import { textHook } from './textHook.ts';

export { LANGUAGE_STORAGE_KEY, LANGUAGES, SOURCE_LANGUAGE } from './languages.ts';
export type { Language } from './languages.ts';
export { textHook } from './textHook.ts';
export { useLanguage } from './useLanguage.ts';
export type { Text, Translation, Values } from './types.ts';

// Module ids may not be 'platform', so the platform's text never clashes with a module's.
export const PLATFORM_NAMESPACE = 'platform';

export const useText = textHook(PLATFORM_NAMESPACE);
