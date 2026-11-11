import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MODULE_TRANSLATIONS } from './features/modules/index.ts';
import en from './locales/en.json';

// Module ids may not be 'platform', so the platform's text never clashes with a module's.
export const PLATFORM_NAMESPACE = 'platform';
const DEFAULT_LANGUAGE = 'en';

i18next.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18next.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: PLATFORM_NAMESPACE,
  resources: { en: { [PLATFORM_NAMESPACE]: en } },
  // Every resource is bundled, so init finishes before the first render.
  initAsync: false,
  // React escapes rendered text already.
  interpolation: { escapeValue: false },
});

for (const { language, namespace, messages } of MODULE_TRANSLATIONS) {
  i18next.addResourceBundle(language, namespace, messages);
}
