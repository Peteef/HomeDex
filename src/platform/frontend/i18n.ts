import i18next from 'i18next';
import type { ResourceKey } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { MODULE_TRANSLATIONS } from './features/modules/index.ts';
import {
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  PLATFORM_NAMESPACE,
  SOURCE_LANGUAGE,
} from './lib/i18n/index.ts';
import type { Language } from './lib/i18n/index.ts';
import en from './locales/en.ts';
import pl from './locales/pl.ts';

const PLATFORM_TEXT: Record<Language, ResourceKey> = { en, pl };

i18next.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: LANGUAGES.map(({ code }) => code),
    fallbackLng: SOURCE_LANGUAGE,
    defaultNS: PLATFORM_NAMESPACE,
    resources: Object.fromEntries(
      Object.entries(PLATFORM_TEXT).map(([language, text]) => [
        language,
        { [PLATFORM_NAMESPACE]: text },
      ]),
    ),
    // The device's own choice wins, then the browser's language. Only a choice is stored, so a
    // device that never picks one keeps following the browser.
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: [],
      // "pl-PL" from the browser is "pl" here.
      convertDetectedLanguage: (language) => language.split('-')[0] ?? language,
    },
    // Every resource is bundled, so init finishes before the first render.
    initAsync: false,
    // React escapes rendered text already.
    interpolation: { escapeValue: false },
  });

for (const { language, namespace, messages } of MODULE_TRANSLATIONS) {
  i18next.addResourceBundle(language, namespace, messages);
}
