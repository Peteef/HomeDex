import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MODULE_TRANSLATIONS } from './features/modules/index.ts';
import { PLATFORM_NAMESPACE, SOURCE_LANGUAGE } from './lib/i18n/index.ts';
import en from './locales/en.ts';

i18next.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18next.use(initReactI18next).init({
  lng: SOURCE_LANGUAGE,
  fallbackLng: SOURCE_LANGUAGE,
  defaultNS: PLATFORM_NAMESPACE,
  resources: { [SOURCE_LANGUAGE]: { [PLATFORM_NAMESPACE]: en } },
  // Every resource is bundled, so init finishes before the first render.
  initAsync: false,
  // React escapes rendered text already.
  interpolation: { escapeValue: false },
});

for (const { language, namespace, messages } of MODULE_TRANSLATIONS) {
  i18next.addResourceBundle(language, namespace, messages);
}
