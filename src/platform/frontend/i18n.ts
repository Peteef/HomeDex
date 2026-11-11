import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MODULE_TRANSLATIONS } from './features/modules/index.ts';
import common from './locales/en/common.json';
import errors from './locales/en/errors.json';
import home from './locales/en/home.json';
import login from './locales/en/login.json';

export const DEFAULT_NAMESPACE = 'common';
const DEFAULT_LANGUAGE = 'en';

const PLATFORM_RESOURCES = {
  en: {
    common,
    errors,
    home,
    login,
  },
};

i18next.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18next.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: DEFAULT_NAMESPACE,
  resources: PLATFORM_RESOURCES,
  // Every resource is bundled, so init finishes before the first render.
  initAsync: false,
  // React escapes rendered text already.
  interpolation: { escapeValue: false },
});

for (const { language, namespace, messages } of MODULE_TRANSLATIONS) {
  i18next.addResourceBundle(language, namespace, messages);
}
